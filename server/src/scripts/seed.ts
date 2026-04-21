import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';
import { connectDB } from './database.js';
import { config } from './index.js';
import {
    UserRole, UserStatus, AuthProvider, SportType, CourtStatus,
    SkillLevel, EventType, VoucherType,
} from '@shuttle-sync/shared';
import { User, Court, Event } from '../models';
import { createSlug, generateVoucherCode } from '../utils/helpers';
import { logger } from '../utils/logger';

const HCMC_COURTS = [
    {
        name: 'Cầu lông Phú Thọ',
        district: 'Quận 11',
        ward: 'Phường 7',
        street: '1 Lữ Gia',
        lat: 10.7645,
        lng: 106.6537,
        sportTypes: [SportType.BADMINTON],
        amenities: ['Bãi xe', 'Căn tin', 'Phòng thay đồ', 'Nước uống', 'Wifi'],
        courts: [
            { name: 'Sân 1', sportType: SportType.BADMINTON, isIndoor: true, surface: 'PVC' },
            { name: 'Sân 2', sportType: SportType.BADMINTON, isIndoor: true, surface: 'PVC' },
            { name: 'Sân 3', sportType: SportType.BADMINTON, isIndoor: true, surface: 'PVC' },
            { name: 'Sân 4', sportType: SportType.BADMINTON, isIndoor: true, surface: 'PVC' },
        ],
        phone: '0901234567',
    },
    {
        name: 'Nhà thi đấu Rạch Miễu',
        district: 'Quận Phú Nhuận',
        ward: 'Phường 5',
        street: '1 Nguyễn Văn Trỗi',
        lat: 10.7986,
        lng: 106.6823,
        sportTypes: [SportType.BADMINTON],
        amenities: ['Bãi xe', 'Phòng thay đồ', 'Nước uống'],
        courts: [
            { name: 'Sân A1', sportType: SportType.BADMINTON, isIndoor: true, surface: 'Gỗ' },
            { name: 'Sân A2', sportType: SportType.BADMINTON, isIndoor: true, surface: 'Gỗ' },
            { name: 'Sân B1', sportType: SportType.BADMINTON, isIndoor: true, surface: 'Gỗ' },
        ],
        phone: '0907654321',
    },
    {
        name: 'Sân cầu lông Tân Bình Sport',
        district: 'Quận Tân Bình',
        ward: 'Phường 12',
        street: '123 Trường Chinh',
        lat: 10.8021,
        lng: 106.6374,
        sportTypes: [SportType.BADMINTON, SportType.PICKLEBALL],
        amenities: ['Bãi xe', 'Căn tin', 'Phòng thay đồ', 'Máy lạnh', 'Pro shop'],
        courts: [
            { name: 'Sân CL-1', sportType: SportType.BADMINTON, isIndoor: true, surface: 'PVC' },
            { name: 'Sân CL-2', sportType: SportType.BADMINTON, isIndoor: true, surface: 'PVC' },
            { name: 'Sân CL-3', sportType: SportType.BADMINTON, isIndoor: true, surface: 'PVC' },
            { name: 'Sân PB-1', sportType: SportType.PICKLEBALL, isIndoor: false, surface: 'Xi măng' },
            { name: 'Sân PB-2', sportType: SportType.PICKLEBALL, isIndoor: false, surface: 'Xi măng' },
        ],
        phone: '0912345678',
    },
    {
        name: 'CLB Cầu lông Quận 7',
        district: 'Quận 7',
        ward: 'Phường Tân Phong',
        street: '456 Nguyễn Thị Thập',
        lat: 10.7380,
        lng: 106.7218,
        sportTypes: [SportType.BADMINTON],
        amenities: ['Bãi xe miễn phí', 'Phòng thay đồ', 'Nước uống', 'Wifi'],
        courts: [
            { name: 'Sân 1', sportType: SportType.BADMINTON, isIndoor: true, surface: 'PVC' },
            { name: 'Sân 2', sportType: SportType.BADMINTON, isIndoor: true, surface: 'PVC' },
            { name: 'Sân 3', sportType: SportType.BADMINTON, isIndoor: false, surface: 'Xi măng' },
        ],
        phone: '0923456789',
    },
    {
        name: 'Pickleball Saigon Center',
        district: 'Quận 2 (Thủ Đức)',
        ward: 'Phường An Phú',
        street: '12 Thảo Điền',
        lat: 10.8054,
        lng: 106.7378,
        sportTypes: [SportType.PICKLEBALL],
        amenities: ['Bãi xe', 'Căn tin', 'Pro shop', 'Huấn luyện viên', 'Máy lạnh'],
        courts: [
            { name: 'Court A', sportType: SportType.PICKLEBALL, isIndoor: true, surface: 'PVC' },
            { name: 'Court B', sportType: SportType.PICKLEBALL, isIndoor: true, surface: 'PVC' },
            { name: 'Court C', sportType: SportType.PICKLEBALL, isIndoor: true, surface: 'PVC' },
            { name: 'Court D', sportType: SportType.PICKLEBALL, isIndoor: false, surface: 'Xi măng' },
        ],
        phone: '0934567890',
    },
    {
        name: 'Nhà thi đấu Lãnh Binh Thăng',
        district: 'Quận 11',
        ward: 'Phường 13',
        street: '1 Lãnh Binh Thăng',
        lat: 10.7580,
        lng: 106.6445,
        sportTypes: [SportType.BADMINTON],
        amenities: ['Bãi xe', 'Phòng thay đồ', 'Khán đài'],
        courts: [
            { name: 'Sân chính 1', sportType: SportType.BADMINTON, isIndoor: true, surface: 'Gỗ' },
            { name: 'Sân chính 2', sportType: SportType.BADMINTON, isIndoor: true, surface: 'Gỗ' },
            { name: 'Sân phụ 1', sportType: SportType.BADMINTON, isIndoor: true, surface: 'PVC' },
            { name: 'Sân phụ 2', sportType: SportType.BADMINTON, isIndoor: true, surface: 'PVC' },
            { name: 'Sân phụ 3', sportType: SportType.BADMINTON, isIndoor: true, surface: 'PVC' },
        ],
        phone: '0945678901',
    },
    {
        name: 'Cầu lông & Pickleball Bình Thạnh',
        district: 'Quận Bình Thạnh',
        ward: 'Phường 25',
        street: '789 Xô Viết Nghệ Tĩnh',
        lat: 10.8059,
        lng: 106.7115,
        sportTypes: [SportType.BADMINTON, SportType.PICKLEBALL],
        amenities: ['Bãi xe', 'Căn tin', 'Phòng thay đồ', 'Cho thuê vợt'],
        courts: [
            { name: 'Sân CL 1', sportType: SportType.BADMINTON, isIndoor: true, surface: 'PVC' },
            { name: 'Sân CL 2', sportType: SportType.BADMINTON, isIndoor: true, surface: 'PVC' },
            { name: 'Sân PB 1', sportType: SportType.PICKLEBALL, isIndoor: true, surface: 'PVC' },
        ],
        phone: '0956789012',
    },
    {
        name: 'Sân cầu lông Gò Vấp',
        district: 'Quận Gò Vấp',
        ward: 'Phường 10',
        street: '321 Phan Văn Trị',
        lat: 10.8375,
        lng: 106.6721,
        sportTypes: [SportType.BADMINTON],
        amenities: ['Bãi xe', 'Nước uống', 'Wifi'],
        courts: [
            { name: 'Sân 1', sportType: SportType.BADMINTON, isIndoor: false, surface: 'Xi măng' },
            { name: 'Sân 2', sportType: SportType.BADMINTON, isIndoor: false, surface: 'Xi măng' },
            { name: 'Sân 3', sportType: SportType.BADMINTON, isIndoor: true, surface: 'PVC' },
            { name: 'Sân 4', sportType: SportType.BADMINTON, isIndoor: true, surface: 'PVC' },
        ],
        phone: '0967890123',
    },
];

const DEFAULT_OPERATING_HOURS = [0, 1, 2, 3, 4, 5, 6].map(day => ({
    dayOfWeek: day,
    open: '06:00',
    close: '22:00',
    isOpen: day !== 0, // Closed on Sunday (optional)
}));
// Actually let's open Sunday too
DEFAULT_OPERATING_HOURS[0].isOpen = true;

const DEFAULT_PRICING = (sportType: SportType) => ({
    sportType,
    timeSlots: [
        { label: 'Sáng sớm', startTime: '06:00', endTime: '08:00', pricePerHour: 80000, daysOfWeek: [1, 2, 3, 4, 5] },
        { label: 'Sáng', startTime: '08:00', endTime: '11:00', pricePerHour: 100000, daysOfWeek: [1, 2, 3, 4, 5] },
        { label: 'Trưa', startTime: '11:00', endTime: '14:00', pricePerHour: 80000, daysOfWeek: [1, 2, 3, 4, 5] },
        { label: 'Chiều', startTime: '14:00', endTime: '17:00', pricePerHour: 120000, daysOfWeek: [1, 2, 3, 4, 5] },
        { label: 'Tối', startTime: '17:00', endTime: '22:00', pricePerHour: 150000, daysOfWeek: [1, 2, 3, 4, 5] },
        { label: 'Cuối tuần', startTime: '06:00', endTime: '22:00', pricePerHour: 150000, daysOfWeek: [0, 6] },
    ],
});

async function seed() {
    await connectDB();
    logger.info('Starting seed...');

    // Clear existing data
    await Promise.all([
        User.deleteMany({}),
        Court.deleteMany({}),
        Event.deleteMany({}),
    ]);

    // Create admin user
    const admin = await User.create({
        email: 'admin@shuttlesync.vn',
        password: 'Admin@123',
        displayName: 'ShuttleSync Admin',
        role: UserRole.ADMIN,
        status: UserStatus.ACTIVE,
        authProvider: AuthProvider.LOCAL,
        sportPreferences: [SportType.BADMINTON, SportType.PICKLEBALL],
    });

    // Create court owner users
    const owners = await User.create([
        {
            email: 'owner1@shuttlesync.vn',
            password: 'Owner@123',
            displayName: 'Nguyễn Văn Sân',
            role: UserRole.COURT_OWNER,
            status: UserStatus.ACTIVE,
            authProvider: AuthProvider.LOCAL,
            phone: '0901234567',
        },
        {
            email: 'owner2@shuttlesync.vn',
            password: 'Owner@123',
            displayName: 'Trần Thị Court',
            role: UserRole.COURT_OWNER,
            status: UserStatus.ACTIVE,
            authProvider: AuthProvider.LOCAL,
            phone: '0912345678',
        },
    ]);

    // Create regular users
    const users = await User.create([
        {
            email: 'user1@shuttlesync.vn',
            password: 'User@123',
            displayName: 'Lê Minh Player',
            role: UserRole.USER,
            status: UserStatus.ACTIVE,
            authProvider: AuthProvider.LOCAL,
            skillLevel: SkillLevel.INTERMEDIATE,
            sportPreferences: [SportType.BADMINTON],
        },
        {
            email: 'user2@shuttlesync.vn',
            password: 'User@123',
            displayName: 'Phạm Hữu Smash',
            role: UserRole.USER,
            status: UserStatus.ACTIVE,
            authProvider: AuthProvider.LOCAL,
            skillLevel: SkillLevel.ADVANCED,
            sportPreferences: [SportType.BADMINTON, SportType.PICKLEBALL],
        },
    ]);

    // Create courts
    const courts = [];
    for (let i = 0; i < HCMC_COURTS.length; i++) {
        const c = HCMC_COURTS[i];
        const ownerId = owners[i % owners.length]._id;
        const slug = createSlug(c.name) + '-' + Date.now().toString(36);

        const uniqueSportTypes = [...new Set(c.sportTypes)];
        const pricing = uniqueSportTypes.map(st => DEFAULT_PRICING(st));

        const court = await Court.create({
            name: c.name,
            slug,
            description: `${c.name} - Địa chỉ: ${c.street}, ${c.ward}, ${c.district}, TP.HCM. Hệ thống sân hiện đại, phục vụ người chơi mọi trình độ.`,
            ownerId,
            sportTypes: c.sportTypes,
            status: CourtStatus.ACTIVE,
            address: {
                street: c.street,
                ward: c.ward,
                district: c.district,
                city: 'Hồ Chí Minh',
                fullAddress: `${c.street}, ${c.ward}, ${c.district}, TP.HCM`,
            },
            location: {
                type: 'Point',
                coordinates: [c.lng, c.lat],
            },
            contact: {
                phone: c.phone,
            },
            amenities: c.amenities,
            operatingHours: DEFAULT_OPERATING_HOURS,
            pricePerHour: pricing,
            courts: c.courts.map(sc => ({
                ...sc,
                isActive: true,
            })),
            photos: [],
            isVerified: true,
            averageRating: 3.5 + Math.random() * 1.5,
            reviewCount: Math.floor(Math.random() * 50) + 5,
            totalBookings: Math.floor(Math.random() * 200) + 20,
        });

        courts.push(court);
    }

    // Create a sample event with voucher
    await Event.create({
        title: 'Khai trương ShuttleSync - Giảm 20%',
        description: 'Nhân dịp ra mắt ứng dụng ShuttleSync, tất cả đơn đặt sân được giảm 20% (tối đa 50.000đ). Áp dụng cho đơn từ 100.000đ.',
        type: EventType.VOUCHER,
        startDate: new Date(),
        endDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days
        isActive: true,
        createdBy: admin._id,
        voucher: {
            code: 'SHUTTLE20',
            type: VoucherType.PERCENTAGE,
            value: 20,
            minBookingAmount: 100000,
            maxDiscount: 50000,
            usageLimit: 1000,
            usedCount: 0,
            expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
        },
    });

    await Event.create({
        title: 'Giải đấu Cầu lông Mở rộng TPHCM 2026',
        description: 'Giải đấu cầu lông lớn nhất TPHCM năm 2026. Quy tụ các tay vợt hàng đầu khu vực. Đăng ký ngay!',
        type: EventType.TOURNAMENT,
        startDate: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000),
        endDate: new Date(Date.now() + 16 * 24 * 60 * 60 * 1000),
        courtId: courts[0]._id,
        isActive: true,
        createdBy: admin._id,
    });

    logger.info('=== SEED COMPLETED ===');
    logger.info(`Admin: admin@shuttlesync.vn / Admin@123`);
    logger.info(`Owner 1: owner1@shuttlesync.vn / Owner@123`);
    logger.info(`Owner 2: owner2@shuttlesync.vn / Owner@123`);
    logger.info(`User 1: user1@shuttlesync.vn / User@123`);
    logger.info(`User 2: user2@shuttlesync.vn / User@123`);
    logger.info(`Courts: ${courts.length} courts created`);
    logger.info(`Events: 2 events created`);
    logger.info('======================');

    await mongoose.disconnect();
    process.exit(0);
}

seed().catch((error) => {
    logger.error('Seed failed:', error);
    process.exit(1);
});