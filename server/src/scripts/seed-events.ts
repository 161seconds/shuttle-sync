import mongoose from 'mongoose';
import dotenv from 'dotenv';
import { Event, User } from '../models';
import { EventType, VoucherType, SportType, UserRole } from '@shuttle-sync/shared';
import { logger } from '../utils/logger';
import { connectDB, disconnectDB } from '../config/database';

dotenv.config();

async function seedEvents() {
    try {
        await connectDB();

        // Don't wipe data. Just append.

        // Find an admin or owner user
        let creator = await User.findOne({ role: UserRole.ADMIN });
        if (!creator) {
            creator = await User.findOne({ role: UserRole.COURT_OWNER });
        }
        if (!creator) {
            creator = await User.findOne(); // Fallback to any user
        }

        if (!creator) {
            logger.error('No users found. Please run the main seed first.');
            process.exit(1);
        }

        const eventsToInsert = [
            {
                title: 'Giải Cầu Lông Tranh Cúp ShuttleSync 2026',
                description: 'Giải đấu quy mô lớn nhất năm dành cho các tay vợt phong trào. Tổng giải thưởng lên tới 50 triệu đồng.',
                type: EventType.TOURNAMENT,
                bannerImage: 'https://images.unsplash.com/photo-1626224583764-f87db24ac4ea?auto=format&fit=crop&q=80',
                startDate: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000), // 5 days from now
                endDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
                isActive: true,
                createdBy: creator._id
            },
            {
                title: 'Chào Hè Rực Rỡ - Giảm 20% Đặt Sân',
                description: 'Nhập mã CHAOHE20 để được giảm 20% (tối đa 50k) cho mọi giao dịch đặt sân trên nền tảng ShuttleSync.',
                type: EventType.VOUCHER,
                bannerImage: 'https://images.unsplash.com/photo-1612872087720-bb876e2e67d1?auto=format&fit=crop&q=80',
                startDate: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000), // 1 day ago
                endDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // valid for 1 month
                voucher: {
                    code: 'CHAOHE20',
                    type: VoucherType.PERCENTAGE,
                    value: 20,
                    minBookingAmount: 100000,
                    maxDiscount: 50000,
                    usageLimit: 500,
                    usedCount: 0,
                    expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
                },
                isActive: true,
                createdBy: creator._id
            },
            {
                title: 'Giảm giá khủng giờ vàng - Giảm 50K Pickleball',
                description: 'Trải nghiệm sân Pickleball chuẩn thi đấu với ưu đãi siêu hấp dẫn. Nhanh tay kẻo lỡ!',
                type: EventType.VOUCHER,
                bannerImage: 'https://images.unsplash.com/photo-1630129205561-ebcf1e6107ed?auto=format&fit=crop&q=80',
                startDate: new Date(Date.now()),
                endDate: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000),
                voucher: {
                    code: 'PICKLE50K',
                    type: VoucherType.FIXED_AMOUNT,
                    value: 50000,
                    minBookingAmount: 150000,
                    usageLimit: 200,
                    usedCount: 0,
                    expiresAt: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000),
                    applicableSportTypes: [SportType.PICKLEBALL]
                },
                isActive: true,
                createdBy: creator._id
            },
            {
                title: 'Thông báo: Cập nhật tính năng Đánh giá & Elo',
                description: 'ShuttleSync vừa tung ra phiên bản mới với tính năng ghi nhận kết quả và tính điểm Elo siêu chuẩn cho các trận đấu Pickleball & Cầu lông!',
                type: EventType.ANNOUNCEMENT,
                bannerImage: 'https://images.unsplash.com/photo-1554068865-24cecd4e34e8?auto=format&fit=crop&q=80',
                startDate: new Date(),
                endDate: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000),
                isActive: true,
                createdBy: creator._id
            }
        ];

        const inserted = await Event.insertMany(eventsToInsert);
        logger.info(`✅ Successfully seeded ${inserted.length} Events.`);

    } catch (err) {
        logger.error('❌ Error seeding events: ', err);
    } finally {
        await disconnectDB();
        process.exit(0);
    }
}

seedEvents();
