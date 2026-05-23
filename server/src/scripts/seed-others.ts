import mongoose from 'mongoose';
import dotenv from 'dotenv';
import { User, Venue, Court, Booking } from '../models';
import { Notification, Review, Report } from '../models/Others';
import { UserRole, ReportReason, ReportStatus, BookingStatus, BookingType, PaymentStatus, PaymentMethod } from '@shuttle-sync/shared';
import { logger } from '../utils/logger';
import { connectDB, disconnectDB } from '../config/database';

dotenv.config();

async function seedOthers() {
    try {
        await connectDB();

        // 1. Get an existing user
        let user = await User.findOne({ email: 'host@shuttlesync.vn' });
        if (!user) user = await User.findOne({ role: UserRole.USER });
        if (!user) {
            logger.error('No users found. Run main seed first.');
            process.exit(1);
        }

        const admin = await User.findOne({ role: UserRole.ADMIN });

        // 2. Get some courts/venues
        const courts = await Court.find().limit(3);
        const venues = await Venue.find().limit(3);

        if (courts.length === 0 || venues.length === 0) {
            logger.error('No courts or venues found.');
            process.exit(1);
        }

        // ==========================================
        // A. Thêm Favorite Courts (Sân yêu thích)
        // ==========================================
        // Lưu ý: User.favoriteCourtIds thường dùng để lưu ID của Venue hoặc Court. 
        // Theo chuẩn hệ thống mình thường lưu VenueID hoặc CourtID, ở đây ta lưu cả 2 kiểu.
        const favIds = venues.map(v => v._id);
        user.favoriteCourtIds = favIds;
        await user.save();
        logger.info(`✅ Thêm ${favIds.length} sân yêu thích cho user ${user.email}`);

        // ==========================================
        // B. Thêm Notifications
        // ==========================================
        const notifications = [
            {
                userId: user._id,
                title: 'Đặt sân thành công',
                message: 'Bạn đã đặt sân Bình Thạnh thành công vào lúc 18:00 ngày 25/05/2026.',
                type: 'booking',
                isRead: false
            },
            {
                userId: user._id,
                title: 'Có người muốn tham gia nhóm',
                message: 'Người dùng Tiến Đạt đã yêu cầu tham gia nhóm Pickleball dưỡng sinh của bạn.',
                type: 'group_play',
                isRead: true
            },
            {
                userId: user._id,
                title: 'Khuyến mãi đặc biệt',
                message: 'Nhập mã CHAOHE20 để được giảm 20% cho lần đặt sân tiếp theo nhé!',
                type: 'promotion',
                isRead: false
            }
        ];
        await Notification.insertMany(notifications);
        logger.info(`✅ Đã thêm ${notifications.length} notifications.`);

        // ==========================================
        // C. Thêm Bookings giả để làm Review
        // ==========================================
        const booking = await Booking.create({
            bookingCode: 'BK' + Math.floor(100000 + Math.random() * 900000),
            userId: user._id,
            courtId: venues[0]._id, // Venue ID
            subCourtId: courts[0]._id,
            date: new Date(),
            startTime: '18:00',
            endTime: '19:00',
            type: BookingType.CASUAL,
            status: BookingStatus.COMPLETED, // Completed so we can review
            totalAmount: 150000,
            discount: 0,
            finalAmount: 150000,
            payment: {
                method: PaymentMethod.QR_CODE,
                status: PaymentStatus.PAID,
                paidAt: new Date(),
                expiresAt: new Date(Date.now() + 15 * 60 * 1000)
            }
        });

        // ==========================================
        // D. Thêm Review
        // ==========================================
        const review = await Review.create({
            userId: user._id,
            courtId: venues[0]._id, // Review typically attaches to Venue ID
            bookingId: booking._id,
            rating: 5,
            comment: 'Sân rất đẹp, thảm mới, chủ sân siêu nhiệt tình luôn nha mọi người!',
            photos: ['https://images.unsplash.com/photo-1626224583764-f87db24ac4ea?auto=format&fit=crop&q=80'],
            reply: admin ? {
                userId: admin._id,
                comment: 'Cảm ơn bạn đã ủng hộ sân nhé!',
                repliedAt: new Date()
            } : undefined
        });
        logger.info(`✅ Đã thêm 1 Review đánh giá 5 sao cho sân.`);

        // ==========================================
        // E. Thêm Report
        // ==========================================
        const report = await Report.create({
            reporterId: user._id,
            targetCourtId: venues[1]._id,
            reason: ReportReason.FAKE_COURT,
            description: 'Mình tới địa chỉ này nhưng không thấy sân cầu lông nào cả, người dân xung quanh bảo khu này không có sân.',
            status: ReportStatus.PENDING,
        });
        logger.info(`✅ Đã thêm 1 Report (Báo cáo sân giả).`);

    } catch (err) {
        logger.error('❌ Lỗi khi thêm dữ liệu: ', err);
    } finally {
        await disconnectDB();
        process.exit(0);
    }
}

seedOthers();
