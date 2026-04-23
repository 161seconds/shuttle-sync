/**
 * ShuttleSync Seed — REAL DATA from Google Places
 *
 * Usage:
 *   1. Place crawled JSON at: server/data/courts-raw.json
 *   2. Run: cd server && npx tsx src/scripts/seed.ts
 *
 * What it does:
 *   - WIPES all collections (users, courts, bookings, etc.)
 *   - Imports ~800 real courts from TPHCM
 *   - Auto-detects sport type from title + categories
 *   - Filters out non-court records (shops, soccer fields, etc.)
 */

import mongoose from 'mongoose';
import fs from 'fs';
import path from 'path';
import { connectDB } from '../config/database';
import {
    UserRole, UserStatus, AuthProvider, SportType, CourtStatus,
} from '@shuttle-sync/shared';
import { User, Court, Booking, GroupPlay, Tournament, TimeSlot, Event } from '../models';
import {
    OwnerApplication, Review, Report, Notification,
} from '../models/Others';
import { createSlug } from '../utils/helpers';
import { logger } from '../utils/logger';
import { any } from 'zod';

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
    location: { lat: number; lng: number };
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

function detectSport(raw: RawCourt): SportType[] | null {
    const combo = `${raw.title} ${raw.categories.join(' ')} ${raw.categoryName}`.toLowerCase();
    if (SKIP_KW.some(k => combo.includes(k))) return null;
    const b = BAD_KW.some(k => combo.includes(k));
    const p = PB_KW.some(k => combo.includes(k));
    if (b && p) return [SportType.BADMINTON, SportType.PICKLEBALL];
    if (b) return [SportType.BADMINTON];
    if (p) return [SportType.PICKLEBALL];
    if (combo.includes('câu lạc bộ thể thao') || combo.includes('tổ hợp thể thao'))
        return [SportType.BADMINTON, SportType.PICKLEBALL];
    return null;
}

// ── Extract Google Place ID ──
function placeId(url: string) {
    return url.match(/query_place_id=([^&]+)/)?.[1] ?? null;
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
    'vũng tàu': 'Vũng Tàu', 'tam thắng': 'Vũng Tàu', 'phước thắng': 'Vũng Tàu',
    'rạch dừa': 'Vũng Tàu', 'long hải': 'Long Điền', 'phước hải': 'Đất Đỏ',
};

function parseAddr(state: string): { ward: string; district: string } {
    const ward = state.split(',')[0]?.trim() || '';
    return { ward, district: W2D[ward.toLowerCase()] || ward };
}

// ── Default operating hours ──
const HOURS = Array.from({ length: 7 }, (_, i) => ({
    dayOfWeek: i, open: '06:00', close: '22:00', isOpen: true,
}));

// ── Default pricing ──
function pricing(st: SportType) {
    return {
        sportType: st,
        timeSlots: [
            { label: 'Sáng sớm', startTime: '06:00', endTime: '08:00', pricePerHour: 80000, daysOfWeek: [1, 2, 3, 4, 5] },
            { label: 'Sáng', startTime: '08:00', endTime: '11:00', pricePerHour: 100000, daysOfWeek: [1, 2, 3, 4, 5] },
            { label: 'Trưa', startTime: '11:00', endTime: '14:00', pricePerHour: 80000, daysOfWeek: [1, 2, 3, 4, 5] },
            { label: 'Chiều', startTime: '14:00', endTime: '17:00', pricePerHour: 120000, daysOfWeek: [1, 2, 3, 4, 5] },
            { label: 'Tối', startTime: '17:00', endTime: '22:00', pricePerHour: 150000, daysOfWeek: [1, 2, 3, 4, 5] },
            { label: 'Cuối tuần', startTime: '06:00', endTime: '22:00', pricePerHour: 150000, daysOfWeek: [0, 6] },
        ],
    };
}

// ═══════════════════════════════════════
// MAIN
// ═══════════════════════════════════════
async function seed() {
    await connectDB();

    logger.info('🗑️  Wiping ALL collections...');
    await Promise.all([
        User.deleteMany({}),
        Court.deleteMany({}),
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

    // Admin only
    const admin = await User.create({
        email: 'admin@shuttlesync.vn',
        password: 'Admin@123',
        displayName: 'ShuttleSync Admin',
        role: UserRole.ADMIN,
        status: UserStatus.ACTIVE,
        authProvider: AuthProvider.LOCAL,
        sportPreferences: [SportType.BADMINTON, SportType.PICKLEBALL],
    });

    // Load JSON
    const jsonPath = path.resolve(__dirname, '../data/courts-raw.json');
    if (!fs.existsSync(jsonPath)) {
        logger.error(`❌ File not found: ${jsonPath}`);
        logger.error('   Copy your crawled JSON to: server/data/courts-raw.json');
        process.exit(1);
    }

    const raw: RawCourt[] = JSON.parse(fs.readFileSync(jsonPath, 'utf-8'));
    logger.info(`📦 Loaded ${raw.length} raw records`);

    // Dedup
    const seen = new Set<string>();
    const uniq: RawCourt[] = [];
    for (const r of raw) {
        const pid = placeId(r.url);
        if (!pid || seen.has(pid)) continue;
        seen.add(pid);
        uniq.push(r);
    }
    logger.info(`🔄 ${uniq.length} unique places`);

    // Import
    let ok = 0, skip = 0;
    for (const r of uniq) {
        const sports = detectSport(r);
        if (!sports) { skip++; continue; }

        const pid = placeId(r.url);
        const { ward, district } = parseAddr(r.state);
        const slug = createSlug(r.title) + '-' + Date.now().toString(36) + Math.random().toString(36).slice(2, 4);
        const phone = (r.phone || '').replace(/\s+/g, '').trim();

        try {
            await Court.create({
                name: r.title.trim(),
                slug,
                ownerId: admin._id,
                sportTypes: sports,
                status: 'active',
                address: {
                    street: r.street || '',
                    ward,
                    district,
                    city: 'Hồ Chí Minh',
                    fullAddress: [r.street, ward, district, 'TP.HCM'].filter(Boolean).join(', '),
                },
                location: {
                    type: 'Point',
                    coordinates: r.location ? [r.location.lng, r.location.lat] : [106.6297, 10.8231]
                },
                contact: {
                    phone: phone || 'Chưa cập nhật',
                    website: r.website || undefined,
                },
                amenities: [],
                operatingHours: HOURS,
                pricePerHour: sports.map(pricing),
                courts: [],
                photos: [],
                googlePlaceId: pid || '',
                googleRating: r.totalScore || undefined,
                googleReviewCount: r.reviewsCount || undefined,
                averageRating: r.totalScore || 0,
                reviewCount: r.reviewsCount || 0,
                totalBookings: 0,
                isVerified: true,
            });
            ok++;
        } catch (e: any) {
            skip++;
        }
    }

    // Stats
    const total = await Court.countDocuments();
    const bCount = await Court.countDocuments({ sportTypes: SportType.BADMINTON });
    const pCount = await Court.countDocuments({ sportTypes: SportType.PICKLEBALL });
    const districts = await Court.aggregate([
        { $group: { _id: '$address.district', count: { $sum: 1 } } },
        { $sort: { count: -1 } },
        { $limit: 15 },
    ]);

    console.log(`
══════════════════════════════════════
  🏸 SHUTTLE-SYNC SEED COMPLETE
══════════════════════════════════════

  📊 Raw records:    ${raw.length}
  ✅ Imported:       ${ok}
  ⏭️  Skipped:       ${skip}
  🏟️  Total courts:  ${total}

  🏸 Badminton:      ${bCount}
  🏓 Pickleball:     ${pCount}

  📍 Top districts:
${districts.map((d: any) => `     ${(d._id || 'Unknown').padEnd(20)} ${d.count} sân`).join('\n')}

  👤 Admin: admin@shuttlesync.vn / Admin@123
  ⚠️  No default users — register via app

══════════════════════════════════════
`);

    await mongoose.disconnect();
    process.exit(0);
}

seed().catch(e => { logger.error('Seed failed:', e); process.exit(1); });