import mongoose from 'mongoose';
import fs from 'fs';
import path from 'path';
import { connectDB } from '../config/database';
import { UserRole, UserStatus, AuthProvider, SportType } from '@shuttle-sync/shared';
import { User, Venue, Court, Booking, GroupPlay, Tournament, TimeSlot, Event } from '../models';
import { OwnerApplication, Review, Report, Notification } from '../models/Others';
//import { createSlug } from '../utils/helpers';
import { logger } from '../utils/logger';

// ── Raw data shape ──
interface RawCourt {
    title: string;
    totalScore: number | null;
    reviewsCount: number | null;
    street: string;
    city: string;
    state: string;
    countryCode: string;
    website?: string;
    phone?: string;
    categories: string[];
    url: string;
    categoryName: string;
    location?: { lat: number; lng: number }; // Có thể null trong JSON
}

// ── Sport detection ──
const BAD_KW = ['cầu lông', 'badminton', 'câu lạc bộ cầu lông', 'khu phức hợp cầu lông', 'sân cầu lông'];
const PB_KW = ['pickleball', 'sân pickleball'];
const SKIP_KW = [
    'cửa hàng', 'shop', 'sân bóng đá', 'sân bóng rổ', 'quán cà phê',
    'nhà hàng', 'dự án nhà', 'văn phòng', 'sơn epoxy', 'trường đại học',
    'phòng khám', 'cửa hàng giày', 'cửa hàng quần áo', 'sân quần vợt',
    'tennis', 'cửa hàng đồ thể thao', 'cửa hàng bán dụng cụ', 'cửa hàng sơn',
];

function detectSport(raw: RawCourt): string[] | null {
    const combo = `${raw.title} ${(raw.categories || []).join(' ')} ${raw.categoryName}`.toLowerCase();
    if (SKIP_KW.some(k => combo.includes(k))) return null;
    const b = BAD_KW.some(k => combo.includes(k));
    const p = PB_KW.some(k => combo.includes(k));

    // Ép kiểu String thay vì Enum để khớp với Schema mới
    if (b && p) return ['BADMINTON', 'PICKLEBALL'];
    if (b) return ['BADMINTON'];
    if (p) return ['PICKLEBALL'];
    if (combo.includes('câu lạc bộ thể thao') || combo.includes('tổ hợp thể thao'))
        return ['BADMINTON', 'PICKLEBALL'];
    return null;
}

// ── Extract Google Place ID ──
function placeId(url: string) {
    return url?.match(/query_place_id=([^&]+)/)?.[1] ?? null;
}

// ── Ward → District mapping (TPHCM) ──
const W2D: Record<string, string> = {
    'an khánh': 'Thủ Đức', 'bình trưng': 'Thủ Đức', 'bình trưng đông': 'Thủ Đức',
    'bình trưng tây': 'Thủ Đức', 'hiệp bình': 'Thủ Đức', 'hiệp bình chánh': 'Thủ Đức',
    'phước long': 'Thủ Đức', 'phước long a': 'Thủ Đức', 'phước long b': 'Thủ Đức',
    'thủ đức': 'Thủ Đức', 'long bình': 'Thủ Đức', 'long trường': 'Thủ Đức',
    'linh xuân': 'Thủ Đức', 'linh trung': 'Thủ Đức', 'linh đông': 'Thủ Đức',
    'linh tây': 'Thủ Đức', 'linh chiểu': 'Thủ Đức',
    'tăng nhơn phú': 'Thủ Đức', 'tăng nhơn phú a': 'Thủ Đức', 'tăng nhơn phú b': 'Thủ Đức',
    'long thạnh mỹ': 'Thủ Đức', 'phú hữu': 'Thủ Đức', 'tam bình': 'Thủ Đức',
    'tam phú': 'Thủ Đức', 'trường thọ': 'Thủ Đức', 'bình thọ': 'Thủ Đức',
    'cát lái': 'Thủ Đức', 'thảo điền': 'Thủ Đức', 'an phú': 'Thủ Đức',
    'bình trị đông': 'Bình Tân', 'bình trị đông a': 'Bình Tân', 'bình trị đông b': 'Bình Tân',
    'an lạc': 'Bình Tân', 'an lạc a': 'Bình Tân', 'tân tạo': 'Bình Tân',
    'tân tạo a': 'Bình Tân', 'bình hưng hòa': 'Bình Tân', 'bình hưng hòa a': 'Bình Tân',
    'bình hưng hòa b': 'Bình Tân',
    'đông hưng thuận': 'Quận 12', 'tân chánh hiệp': 'Quận 12', 'tân thới hiệp': 'Quận 12',
    'an phú đông': 'Quận 12', 'thạnh lộc': 'Quận 12', 'thạnh xuân': 'Quận 12',
    'hiệp thành': 'Quận 12', 'tân thới nhất': 'Quận 12', 'trung mỹ tây': 'Quận 12',
    'an hội tây': 'Quận 8', 'bình đông': 'Quận 8', 'hưng phú': 'Quận 8',
    'phú thuận': 'Quận 7', 'phú mỹ': 'Quận 7', 'tân phú': 'Quận 7',
    'tân phong': 'Quận 7', 'tân kiểng': 'Quận 7', 'tân hưng': 'Quận 7',
    'nhà bè': 'Nhà Bè', 'phú xuân': 'Nhà Bè', 'phước kiển': 'Nhà Bè',
    'đông hòa': 'Dĩ An', 'bình an': 'Dĩ An',
    'đức nhuận': 'Tân Phú', 'sơn kỳ': 'Tân Phú', 'tân sơn nhì': 'Tân Phú',
    'tây thạnh': 'Tân Phú', 'phú thạnh': 'Tân Phú', 'phú trung': 'Tân Phú',
    'tân quý': 'Tân Phú', 'hiệp tân': 'Tân Phú', 'hòa thạnh': 'Tân Phú',
    'phú thọ hòa': 'Tân Phú', 'tân thành': 'Tân Phú',
};

function parseAddr(state: string): { ward: string; district: string } {
    if (!state) return { ward: "", district: "" };
    const ward = state.split(',')[0]?.trim() || '';
    return { ward, district: W2D[ward.toLowerCase()] || ward };
}

// ═══════════════════════════════════════
// MAIN SEED FUNCTION
// ═══════════════════════════════════════
async function seed() {
    await connectDB(); // Gọi hàm kết nối 

    logger.info('🗑️  Wiping ALL collections...');
    // Cập nhật xóa thêm Venue
    await Promise.all([
        User.deleteMany({}),
        Venue.deleteMany({}), // Collection Cơ sở
        Court.deleteMany({}), // Collection Sân lẻ
        Booking.deleteMany({}),
        GroupPlay.deleteMany({}),
        Tournament.deleteMany({}),
        TimeSlot.deleteMany({}),
        Event.deleteMany({}),
        OwnerApplication.deleteMany({}),
        Review.deleteMany({}),
        Report.deleteMany({}),
        Notification.deleteMany({}),
    ]);
    logger.info('✅ Database cleared');

    // Tạo Admin
    const admin = await User.create({
        email: 'admin@shuttlesync.vn',
        password: 'Admin@123',
        displayName: 'ShuttleSync Admin',
        role: UserRole.ADMIN,
        status: UserStatus.ACTIVE,
        authProvider: AuthProvider.LOCAL,
        sportPreferences: [SportType.BADMINTON, SportType.PICKLEBALL],
    });

    const jsonPath = path.resolve(__dirname, '../data/courts-raw.json');
    const raw: RawCourt[] = JSON.parse(fs.readFileSync(jsonPath, 'utf-8'));
    logger.info(`📦 Loaded ${raw.length} raw records`);

    const seen = new Set<string>();
    const uniq: RawCourt[] = [];
    for (const r of raw) {
        const pid = placeId(r.url);
        if (!pid || seen.has(pid)) continue;
        seen.add(pid);
        uniq.push(r);
    }
    logger.info(`🔄 ${uniq.length} unique places`);

    let ok = 0, skip = 0;

    const venuesToInsert = [];

    for (const r of uniq) {
        const sports = detectSport(r);
        if (!sports) { skip++; continue; }

        const pid = placeId(r.url);
        const { ward, district } = parseAddr(r.state);
        const phone = (r.phone || '').replace(/\s+/g, '').trim();

        venuesToInsert.push({
            name: r.title.trim(),
            ownerId: admin._id,
            googlePlaceId: pid || null,
            location: {
                type: 'Point',
                coordinates: r.location ? [r.location.lng, r.location.lat] : [106.6297, 10.8231]
            },
            address: {
                street: r.street || '',
                state: ward, // Phường/Xã
                city: district, // Quận/Huyện lấy từ map 
                countryCode: r.countryCode || 'VN'
            },
            contact: {
                phone: phone || '',
                website: r.website || ''
            },
            sports: sports,
            rating: {
                totalScore: r.totalScore || 0,
                reviewsCount: r.reviewsCount || 0
            },
            isActive: true
        });
        ok++;
    }

    // Insert tất cả Venues vào DB
    const insertedVenues = await Venue.insertMany(venuesToInsert);
    logger.info(`🏛️ Đã tạo thành công ${insertedVenues.length} Cơ sở (Venues)`);

    logger.info(`Đang tự động xây dựng các sân lẻ bên trong Cơ sở...`);
    const courtsToInsert = [];

    for (const venue of insertedVenues) {
        // Mỗi cơ sở cho đại 2 sân để test
        const sportType = venue.sports[0]; // Lấy môn thể thao đầu tiên của cơ sở đó

        courtsToInsert.push({
            venueId: venue._id,
            name: "Sân 1",
            sportType: sportType,
            surfaceType: sportType === 'PICKLEBALL' ? 'SYNTHETIC' : 'WOOD',
            pricePerHour: sportType === 'PICKLEBALL' ? 120000 : 80000,
            status: 'AVAILABLE'
        });

        courtsToInsert.push({
            venueId: venue._id,
            name: "Sân 2 (VIP)",
            sportType: sportType,
            surfaceType: 'SYNTHETIC',
            pricePerHour: sportType === 'PICKLEBALL' ? 150000 : 100000,
            status: 'AVAILABLE'
        });
    }

    await Court.insertMany(courtsToInsert);
    logger.info(`🏸 Đã tạo thành công ${courtsToInsert.length} Sân lẻ (Courts)`);

    // Stats
    const bCount = await Venue.countDocuments({ sports: 'BADMINTON' });
    const pCount = await Venue.countDocuments({ sports: 'PICKLEBALL' });

    const districts = await Venue.aggregate([
        { $group: { _id: '$address.city', count: { $sum: 1 } } },
        { $sort: { count: -1 } },
        { $limit: 15 },
    ]);

    console.log(`
══════════════════════════════════════
  🚀 SHUTTLE-SYNC MARKETPLACE SEED 
══════════════════════════════════════

  📊 Raw records:    ${raw.length}
  🏛️  Venues:         ${ok} (Cơ sở kinh doanh)
  ⏭️  Skipped:        ${skip}
  🏸  Total courts:  ${courtsToInsert.length} (Sân thực tế)

  🏸 Venues Badminton:    ${bCount}
  🏓 Venues Pickleball:   ${pCount}

  📍 Top districts:
${districts.map((d: any) => `     ${(d._id || 'Unknown').padEnd(20)} ${d.count} cơ sở`).join('\n')}

  👤 Admin: admin@shuttlesync.vn / Admin@123
  🏪 Owner (Test): owner@shuttlesync.vn / Owner@123

══════════════════════════════════════
`);

    await mongoose.disconnect();
    process.exit(0);
}

seed().catch(e => { logger.error('Seed failed:', e); process.exit(1); });