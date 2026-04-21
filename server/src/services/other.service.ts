import mongoose from 'mongoose';
import {
    UserStatus, OwnerApplicationStatus, ReportReason,
} from '@shuttle-sync/shared';
import {
    User, IUserDocument, Court, Review, Report,
    Notification, OwnerApplication, Booking, IReviewDocument,
} from '../models';
import { ApiError } from '../utils/ApiError';
import { calculatePagination } from '../utils/helpers';

// ========================
// USER SERVICE
// ========================
class UserService {
    async getProfile(userId: string): Promise<IUserDocument> {
        const user = await User.findById(userId);
        if (!user) throw ApiError.notFound('Không tìm thấy người dùng');
        return user;
    }

    async updateProfile(userId: string, updates: Partial<IUserDocument>): Promise<IUserDocument> {
        const user = await User.findById(userId);
        if (!user) throw ApiError.notFound('Không tìm thấy người dùng');

        // Only allow specific fields
        const allowedFields = [
            'displayName', 'phone', 'avatar', 'skillLevel',
            'sportPreferences', 'settings',
        ];

        for (const key of allowedFields) {
            if ((updates as any)[key] !== undefined) {
                (user as any)[key] = (updates as any)[key];
            }
        }

        await user.save();
        return user;
    }

    async toggleFavoriteCourt(userId: string, courtId: string): Promise<boolean> {
        const user = await User.findById(userId);
        if (!user) throw ApiError.notFound('Không tìm thấy người dùng');

        const courtObjId = new mongoose.Types.ObjectId(courtId);
        const index = user.favoriteCourtIds.findIndex(
            id => id.toString() === courtId
        );

        if (index > -1) {
            user.favoriteCourtIds.splice(index, 1);
            await user.save();
            return false; // removed
        } else {
            user.favoriteCourtIds.push(courtObjId);
            await user.save();
            return true; // added
        }
    }

    async getFavoriteCourts(userId: string) {
        const user = await User.findById(userId)
            .populate({
                path: 'favoriteCourtIds',
                select: 'name slug address photos averageRating sportTypes pricePerHour',
            });

        if (!user) throw ApiError.notFound('Không tìm thấy người dùng');
        return user.favoriteCourtIds;
    }

    async getPublicProfile(userId: string) {
        const user = await User.findById(userId);
        if (!user) throw ApiError.notFound('Không tìm thấy người dùng');
        return user.toPublicProfile();
    }
}

export const userService = new UserService();

// ========================
// REVIEW SERVICE
// ========================
class ReviewService {
    async createReview(userId: string, data: {
        courtId: string;
        bookingId: string;
        rating: number;
        comment?: string;
        photos?: string[];
    }): Promise<IReviewDocument> {
        // Verify booking exists and belongs to user
        const booking = await Booking.findOne({
            _id: data.bookingId,
            userId,
            courtId: data.courtId,
            status: 'completed',
        });

        if (!booking) {
            throw ApiError.badRequest('Bạn chỉ có thể đánh giá sau khi hoàn thành sử dụng sân');
        }

        // Check existing review
        const existing = await Review.findOne({ bookingId: data.bookingId });
        if (existing) throw ApiError.conflict('Bạn đã đánh giá booking này');

        const review = await Review.create({
            userId,
            ...data,
        });

        // Update court average rating
        const stats = await Review.aggregate([
            { $match: { courtId: new mongoose.Types.ObjectId(data.courtId) } },
            {
                $group: {
                    _id: null,
                    avgRating: { $avg: '$rating' },
                    count: { $sum: 1 },
                },
            },
        ]);

        if (stats.length > 0) {
            await Court.findByIdAndUpdate(data.courtId, {
                averageRating: Math.round(stats[0].avgRating * 10) / 10,
                reviewCount: stats[0].count,
            });
        }

        return review;
    }

    async getCourtReviews(courtId: string, params: {
        page?: number;
        limit?: number;
    }) {
        const total = await Review.countDocuments({ courtId });
        const { page, limit, totalPages, skip } = calculatePagination(
            params.page || 1,
            params.limit || 20,
            total
        );

        const reviews = await Review.find({ courtId })
            .sort({ createdAt: -1 })
            .skip(skip)
            .limit(limit)
            .populate('userId', 'displayName avatar')
            .lean();

        return { reviews, pagination: { page, limit, total, totalPages } };
    }

    async replyToReview(reviewId: string, ownerId: string, comment: string) {
        const review = await Review.findById(reviewId).populate('courtId', 'ownerId');
        if (!review) throw ApiError.notFound('Không tìm thấy đánh giá');

        const court = await Court.findById(review.courtId);
        if (!court || court.ownerId.toString() !== ownerId) {
            throw ApiError.forbidden('Bạn không phải chủ sân này');
        }

        review.reply = {
            userId: new mongoose.Types.ObjectId(ownerId),
            comment,
            repliedAt: new Date(),
        };
        await review.save();
        return review;
    }
}

export const reviewService = new ReviewService();

// ========================
// NOTIFICATION SERVICE
// ========================
class NotificationService {
    async getUserNotifications(userId: string, params: {
        unreadOnly?: boolean;
        page?: number;
        limit?: number;
    }) {
        const filter: any = { userId };
        if (params.unreadOnly) filter.isRead = false;

        const total = await Notification.countDocuments(filter);
        const { page, limit, totalPages, skip } = calculatePagination(
            params.page || 1,
            params.limit || 20,
            total
        );

        const notifications = await Notification.find(filter)
            .sort({ createdAt: -1 })
            .skip(skip)
            .limit(limit)
            .lean();

        const unreadCount = await Notification.countDocuments({
            userId,
            isRead: false,
        });

        return {
            notifications,
            unreadCount,
            pagination: { page, limit, total, totalPages },
        };
    }

    async markAsRead(notificationId: string, userId: string) {
        const notification = await Notification.findOneAndUpdate(
            { _id: notificationId, userId },
            { isRead: true, readAt: new Date() },
            { new: true }
        );
        if (!notification) throw ApiError.notFound('Không tìm thấy thông báo');
        return notification;
    }

    async markAllAsRead(userId: string) {
        await Notification.updateMany(
            { userId, isRead: false },
            { isRead: true, readAt: new Date() }
        );
    }

    async createNotification(data: {
        userId: string;
        title: string;
        message: string;
        type: 'booking' | 'group_play' | 'tournament' | 'system' | 'promotion';
        data?: Record<string, unknown>;
    }) {
        return Notification.create(data);
    }
}

export const notificationService = new NotificationService();

// ========================
// OWNER APPLICATION SERVICE
// ========================
class OwnerApplicationService {
    async createApplication(userId: string, data: any) {
        // Check if user already has a pending application
        const existing = await OwnerApplication.findOne({
            userId,
            status: { $in: [OwnerApplicationStatus.PENDING, OwnerApplicationStatus.UNDER_REVIEW] },
        });

        if (existing) {
            throw ApiError.conflict('Bạn đã có đơn đăng ký đang chờ xử lý');
        }

        const application = await OwnerApplication.create({
            userId,
            ...data,
            status: OwnerApplicationStatus.PENDING,
        });

        return application;
    }

    async getMyApplications(userId: string) {
        return OwnerApplication.find({ userId }).sort({ createdAt: -1 });
    }
}

export const ownerApplicationService = new OwnerApplicationService();

// ========================
// REPORT SERVICE
// ========================
class ReportService {
    async createReport(reporterId: string, data: {
        targetUserId?: string;
        targetCourtId?: string;
        reason: ReportReason;
        description: string;
        evidence?: string[];
    }) {
        return Report.create({ reporterId, ...data });
    }
}

export const reportService = new ReportService();