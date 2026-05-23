import mongoose from 'mongoose';
import fs from 'fs';
import path from 'path';
import { connectDB } from '../config/database';
import { UserRole, UserStatus, AuthProvider, SportType, GroupPlayStatus, SkillLevel } from '@shuttle-sync/shared';
import { User, Venue, Court, Booking, GroupPlay, Tournament, TimeSlot, Event } from '../models';
import { OwnerApplication, Review, Report, Notification } from '../models/Others';
//import { createSlug } from '../utils/helpers';
import { logger } from '../utils/logger';

// ΓöÇΓöÇ Raw data shape ΓöÇΓöÇ
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
    location?: { lat: number; lng: number }; // C├│ thß╗â null trong JSON
}

// ΓöÇΓöÇ Sport detection ΓöÇΓöÇ
const BAD_KW = ['cß║ºu l├┤ng', 'badminton', 'c├óu lß║íc bß╗Ö cß║ºu l├┤ng', 'khu phß╗⌐c hß╗úp cß║ºu l├┤ng', 's├ón cß║ºu l├┤ng'];
const PB_KW = ['pickleball', 's├ón pickleball'];
const SKIP_KW = [
    'cß╗¡a h├áng', 'shop', 's├ón b├│ng ─æ├í', 's├ón b├│ng rß╗ò', 'qu├ín c├á ph├¬',
    'nh├á h├áng', 'dß╗▒ ├ín nh├á', 'v─ân ph├▓ng', 's╞ín epoxy', 'tr╞░ß╗¥ng ─æß║íi hß╗ìc',
    'ph├▓ng kh├ím', 'cß╗¡a h├áng gi├áy', 'cß╗¡a h├áng quß║ºn ├ío', 's├ón quß║ºn vß╗út',
    'tennis', 'cß╗¡a h├áng ─æß╗ô thß╗â thao', 'cß╗¡a h├áng b├ín dß╗Ñng cß╗Ñ', 'cß╗¡a h├áng s╞ín',
];

function detectSport(raw: RawCourt): string[] | null {
    const combo = `${raw.title} ${(raw.categories || []).join(' ')} ${raw.categoryName}`.toLowerCase();
    if (SKIP_KW.some(k => combo.includes(k))) return null;
    const b = BAD_KW.some(k => combo.includes(k));
    const p = PB_KW.some(k => combo.includes(k));

    // ├ëp kiß╗âu String thay v├¼ Enum ─æß╗â khß╗¢p vß╗¢i Schema mß╗¢i
    if (b && p) return ['BADMINTON', 'PICKLEBALL'];
    if (b) return ['BADMINTON'];
    if (p) return ['PICKLEBALL'];
    if (combo.includes('c├óu lß║íc bß╗Ö thß╗â thao') || combo.includes('tß╗ò hß╗úp thß╗â thao'))
        return ['BADMINTON', 'PICKLEBALL'];
    return null;
}

// ΓöÇΓöÇ Extract Google Place ID ΓöÇΓöÇ
function placeId(url: string) {
    return url?.match(/query_place_id=([^&]+)/)?.[1] ?? null;
}

// ΓöÇΓöÇ Ward ΓåÆ District mapping (TPHCM) ΓöÇΓöÇ
const W2D: Record<string, string> = {
    'an kh├ính': 'Thß╗º ─Éß╗⌐c', 'b├¼nh tr╞░ng': 'Thß╗º ─Éß╗⌐c', 'b├¼nh tr╞░ng ─æ├┤ng': 'Thß╗º ─Éß╗⌐c',
    'b├¼nh tr╞░ng t├óy': 'Thß╗º ─Éß╗⌐c', 'hiß╗çp b├¼nh': 'Thß╗º ─Éß╗⌐c', 'hiß╗çp b├¼nh ch├ính': 'Thß╗º ─Éß╗⌐c',
    'ph╞░ß╗¢c long': 'Thß╗º ─Éß╗⌐c', 'ph╞░ß╗¢c long a': 'Thß╗º ─Éß╗⌐c', 'ph╞░ß╗¢c long b': 'Thß╗º ─Éß╗⌐c',
    'thß╗º ─æß╗⌐c': 'Thß╗º ─Éß╗⌐c', 'long b├¼nh': 'Thß╗º ─Éß╗⌐c', 'long tr╞░ß╗¥ng': 'Thß╗º ─Éß╗⌐c',
    'linh xu├ón': 'Thß╗º ─Éß╗⌐c', 'linh trung': 'Thß╗º ─Éß╗⌐c', 'linh ─æ├┤ng': 'Thß╗º ─Éß╗⌐c',
    'linh t├óy': 'Thß╗º ─Éß╗⌐c', 'linh chiß╗âu': 'Thß╗º ─Éß╗⌐c',
    't─âng nh╞ín ph├║': 'Thß╗º ─Éß╗⌐c', 't─âng nh╞ín ph├║ a': 'Thß╗º ─Éß╗⌐c', 't─âng nh╞ín ph├║ b': 'Thß╗º ─Éß╗⌐c',
    'long thß║ính mß╗╣': 'Thß╗º ─Éß╗⌐c', 'ph├║ hß╗»u': 'Thß╗º ─Éß╗⌐c', 'tam b├¼nh': 'Thß╗º ─Éß╗⌐c',
    'tam ph├║': 'Thß╗º ─Éß╗⌐c', 'tr╞░ß╗¥ng thß╗ì': 'Thß╗º ─Éß╗⌐c', 'b├¼nh thß╗ì': 'Thß╗º ─Éß╗⌐c',
    'c├ít l├íi': 'Thß╗º ─Éß╗⌐c', 'thß║úo ─æiß╗ün': 'Thß╗º ─Éß╗⌐c', 'an ph├║': 'Thß╗º ─Éß╗⌐c',
    'b├¼nh trß╗ï ─æ├┤ng': 'B├¼nh T├ón', 'b├¼nh trß╗ï ─æ├┤ng a': 'B├¼nh T├ón', 'b├¼nh trß╗ï ─æ├┤ng b': 'B├¼nh T├ón',
    'an lß║íc': 'B├¼nh T├ón', 'an lß║íc a': 'B├¼nh T├ón', 't├ón tß║ío': 'B├¼nh T├ón',
    't├ón tß║ío a': 'B├¼nh T├ón', 'b├¼nh h╞░ng h├▓a': 'B├¼nh T├ón', 'b├¼nh h╞░ng h├▓a a': 'B├¼nh T├ón',
    'b├¼nh h╞░ng h├▓a b': 'B├¼nh T├ón',
    '─æ├┤ng h╞░ng thuß║¡n': 'Quß║¡n 12', 't├ón ch├ính hiß╗çp': 'Quß║¡n 12', 't├ón thß╗¢i hiß╗çp': 'Quß║¡n 12',
    'an ph├║ ─æ├┤ng': 'Quß║¡n 12', 'thß║ính lß╗Öc': 'Quß║¡n 12', 'thß║ính xu├ón': 'Quß║¡n 12',
    'hiß╗çp th├ánh': 'Quß║¡n 12', 't├ón thß╗¢i nhß║Ñt': 'Quß║¡n 12', 'trung mß╗╣ t├óy': 'Quß║¡n 12',
    'an hß╗Öi t├óy': 'Quß║¡n 8', 'b├¼nh ─æ├┤ng': 'Quß║¡n 8', 'h╞░ng ph├║': 'Quß║¡n 8',
    'ph├║ thuß║¡n': 'Quß║¡n 7', 'ph├║ mß╗╣': 'Quß║¡n 7', 't├ón ph├║': 'Quß║¡n 7',
    't├ón phong': 'Quß║¡n 7', 't├ón kiß╗âng': 'Quß║¡n 7', 't├ón h╞░ng': 'Quß║¡n 7',
    'nh├á b├¿': 'Nh├á B├¿', 'ph├║ xu├ón': 'Nh├á B├¿', 'ph╞░ß╗¢c kiß╗ân': 'Nh├á B├¿',
    '─æ├┤ng h├▓a': 'D─⌐ An', 'b├¼nh an': 'D─⌐ An',
    '─æß╗⌐c nhuß║¡n': 'T├ón Ph├║', 's╞ín kß╗│': 'T├ón Ph├║', 't├ón s╞ín nh├¼': 'T├ón Ph├║',
    't├óy thß║ính': 'T├ón Ph├║', 'ph├║ thß║ính': 'T├ón Ph├║', 'ph├║ trung': 'T├ón Ph├║',
    't├ón qu├╜': 'T├ón Ph├║', 'hiß╗çp t├ón': 'T├ón Ph├║', 'h├▓a thß║ính': 'T├ón Ph├║',
    'ph├║ thß╗ì h├▓a': 'T├ón Ph├║', 't├ón th├ánh': 'T├ón Ph├║',
};

function parseAddr(state: string): { ward: string; district: string } {
    if (!state) return { ward: "", district: "" };
    const ward = state.split(',')[0]?.trim() || '';
    return { ward, district: W2D[ward.toLowerCase()] || ward };
}

// ΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉ
// MAIN SEED FUNCTION
// ΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉ
async function seed() {
    await connectDB(); // Gß╗ìi h├ám kß║┐t nß╗æi 

    logger.info('≡ƒùæ∩╕Å  Wiping ALL collections...');
    // Cß║¡p nhß║¡t x├│a th├¬m Venue
    await Promise.all([
        User.deleteMany({}),
        Venue.deleteMany({}), // Collection C╞í sß╗ƒ
        Court.collection.drop().catch(() => { }),
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
    logger.info('Γ£à Database cleared');

    // Tß║ío Admin
    const admin = await User.create({
        email: 'admin@shuttlesync.vn',
        password: 'Admin@123',
        displayName: 'ShuttleSync Admin',
        role: UserRole.ADMIN,
        status: UserStatus.ACTIVE,
        authProvider: AuthProvider.LOCAL,
        sportPreferences: [SportType.BADMINTON, SportType.PICKLEBALL],
    });

    const pbPath = path.resolve(__dirname, '../data/pickleball-courts.json');
    const bmPath = path.resolve(__dirname, '../data/badminton-courts.json');

    const pbData = JSON.parse(fs.readFileSync(pbPath, 'utf-8'));
    const bmData = JSON.parse(fs.readFileSync(bmPath, 'utf-8'));

    const raw: RawCourt[] = [...pbData, ...bmData];
    logger.info(`≡ƒôª Loaded ${raw.length} raw records from both files`);

    const seen = new Set<string>();
    const uniq: RawCourt[] = [];
    for (const r of raw) {
        const pid = placeId(r.url);
        if (!pid || seen.has(pid)) continue;
        seen.add(pid);
        uniq.push(r);
    }
    logger.info(`≡ƒöä ${uniq.length} unique places`);

    let ok = 0, skip = 0;

    const venuesToInsert = [];

    for (const r of uniq) {
        const sports = detectSport(r);
        if (!sports) { skip++; continue; }

        const pid = placeId(r.url);
        const { ward, district } = parseAddr(r.state);
        const phone = (r.phone || '').replace(/\s+/g, '').trim();

        // 1. T├ìNH TO├üN Tß╗îA ─Éß╗ÿ ß╗₧ NGO├ÇI OBJECT
        let coords = null;
        const data = r as any;
        if (r.location && r.location.lng && r.location.lat) {
            coords = [r.location.lng, r.location.lat];
        } else if (data.lng && data.lat) {
            coords = [data.lng, data.lat];
        } else if (data.longitude && data.latitude) {
            coords = [data.longitude, data.latitude];
        }

        // 2. Lß║«P V├ÇO OBJECT V├Ç PUSH
        venuesToInsert.push({
            name: r.title.trim(),
            ownerId: admin._id,
            googlePlaceId: pid || null,
            location: {
                type: 'Point',
                coordinates: coords ? coords : [
                    // Fallback ngß║½u nhi├¬n nß║┐u thß╗▒c sß╗▒ c├│ s├ón bß╗ï thiß║┐u tß╗ìa ─æß╗Ö
                    106.6297 + (Math.random() - 0.5) * 0.2,
                    10.8231 + (Math.random() - 0.5) * 0.2
                ]
            },
            address: {
                street: r.street || '',
                state: ward, // Ph╞░ß╗¥ng/X├ú
                city: district, // Quß║¡n/Huyß╗çn
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

    // Insert tß║Ñt cß║ú Venues v├áo DB
    const insertedVenues = await Venue.insertMany(venuesToInsert);
    logger.info(`≡ƒÅ¢∩╕Å ─É├ú tß║ío th├ánh c├┤ng ${insertedVenues.length} C╞í sß╗ƒ (Venues)`);

    logger.info(`─Éang tß╗▒ ─æß╗Öng x├óy dß╗▒ng c├íc s├ón lß║╗ b├¬n trong C╞í sß╗ƒ...`);
    const courtsToInsert = [];

    for (const venue of insertedVenues) {
        // Mß╗ùi c╞í sß╗ƒ cho ─æß║íi 2 s├ón ─æß╗â test
        const sportType = venue.sports[0]; // Lß║Ñy m├┤n thß╗â thao ─æß║ºu ti├¬n cß╗ºa c╞í sß╗ƒ ─æ├│

        courtsToInsert.push({
            venueId: venue._id,
            name: "S├ón 1",
            sportType: sportType,
            surfaceType: sportType === 'PICKLEBALL' ? 'SYNTHETIC' : 'WOOD',
            pricePerHour: sportType === 'PICKLEBALL' ? 120000 : 80000,
            status: 'AVAILABLE'
        });

        courtsToInsert.push({
            venueId: venue._id,
            name: "S├ón 2 (VIP)",
            sportType: sportType,
            surfaceType: 'SYNTHETIC',
            pricePerHour: sportType === 'PICKLEBALL' ? 150000 : 100000,
            status: 'AVAILABLE'
        });
    }

    await Court.insertMany(courtsToInsert);
    logger.info(`≡ƒÅ╕ ─É├ú tß║ío th├ánh c├┤ng ${courtsToInsert.length} S├ón lß║╗ (Courts)`);

    logger.info(`─Éang tß║ío dß╗» liß╗çu T├¼m nh├│m (GroupPlay)...`);
    const allCourts = await Court.find({}).limit(10);

    // Tß║ío th├¬m 1 User th╞░ß╗¥ng ─æß╗â l├ám Host
    const hostUser = await User.create({
        email: 'host@shuttlesync.vn',
        password: 'Password@123',
        displayName: 'Chß╗º Xß╗¢i Tr├╣m Khu',
        role: UserRole.USER,
        status: UserStatus.ACTIVE,
        authProvider: AuthProvider.LOCAL,
    });

    const groupPlaysToInsert = [];

    for (let i = 0; i < allCourts.length; i++) {
        const court = allCourts[i];
        const isBadminton = court.sportType.toUpperCase() === 'BADMINTON';

        groupPlaysToInsert.push({
            title: isBadminton ? 'Kèo giao lưu mồ hôi là chính' : 'Pickleball dưỡng sinh cuối tuần',
            description: 'Nhóm vui vẻ, thiện lành, không quạu. Cần tuyển thêm người gánh tạ. Yêu cầu biết đếm điểm.',
            organizerId: hostUser._id,
            courtId: court._id,
            subCourtId: new mongoose.Types.ObjectId(),
            bookingId: new mongoose.Types.ObjectId(),
            sportType: isBadminton ? SportType.BADMINTON : SportType.PICKLEBALL,
            skillLevel: SkillLevel.TB,
            date: new Date(Date.now() + 86400000 * (Math.floor(Math.random() * 7) + 1)),
            startTime: '18:00',
            endTime: '20:00',
            maxPlayers: isBadminton ? 6 : 4,
            currentPlayers: 2,
            pricePerPlayer: isBadminton ? 50000 : 70000,
            status: GroupPlayStatus.OPEN,
            isPublic: true
        });
    }

    await GroupPlay.insertMany(groupPlaysToInsert);
    logger.info(`≡ƒöÑ ─É├ú tß║ío th├ánh c├┤ng ${groupPlaysToInsert.length} nh├│m giao l╞░u!`);

    // Stats
    const bCount = await Venue.countDocuments({ sports: 'BADMINTON' });
    const pCount = await Venue.countDocuments({ sports: 'PICKLEBALL' });

    const districts = await Venue.aggregate([
        { $group: { _id: '$address.city', count: { $sum: 1 } } },
        { $sort: { count: -1 } },
        { $limit: 15 },
    ]);

    console.log(`
ΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉ
  ≡ƒÜÇ SHUTTLE-SYNC MARKETPLACE SEED 
ΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉ

  ≡ƒôè Raw records:    ${raw.length}
  ≡ƒÅ¢∩╕Å  Venues:         ${ok} (C╞í sß╗ƒ kinh doanh)
  ΓÅ¡∩╕Å  Skipped:        ${skip}
  ≡ƒÅ╕  Total courts:  ${courtsToInsert.length} (S├ón thß╗▒c tß║┐)

  ≡ƒÅ╕ Venues Badminton:    ${bCount}
  ≡ƒÅô Venues Pickleball:   ${pCount}

  ≡ƒôì Top districts:
${districts.map((d: any) => `     ${(d._id || 'Unknown').padEnd(20)} ${d.count} c╞í sß╗ƒ`).join('\n')}

  ≡ƒæñ Admin: admin@shuttlesync.vn / Admin@123
  ≡ƒÅ¬ Owner (Test): owner@shuttlesync.vn / Owner@123

ΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉ
`);

    await mongoose.disconnect();

    process.exit(0);
}

seed().catch(e => { logger.error('Seed failed:', e); process.exit(1); });