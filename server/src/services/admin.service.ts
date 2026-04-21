import mongoose from 'mongoose';
import {
    UserRole, UserStatus, CourtStatus, BookingStatus,
    OwnerApplicationStatus, ReportStatus, GroupPlayStatus,
} from '@shuttle-sync/shared';
import {
    User, Court, Booking, GroupPlay, OwnerApplication,
    Report, Notification, Event,
} from '../models';
import { ApiError } from '../utils/ApiError';
import { calculatePagination, createSlug } from '../utils/helpers';
import { logger } from '../utils/logger';

class AdminService {
    /**
     * Get dashboard statistics
     */
    async getDashboardStats() {
        const [
            totalUsers, totalCourts, totalBookings,
            activeGroupPlays, pendingApplications, pendingReports,
        ] = await Promise.all([
            User.countDocuments({ status: UserStatus.ACTIVE }),
            Court.countDocuments({ status: CourtStatus.ACTIVE }),
            Booking.countDocuments({ status: BookingStatus.CONFIRMED }),
            GroupPlay.countDocuments({ status: GroupPlayStatus.OPEN }),
            OwnerApplication.countDocuments({ status: OwnerApplicationStatus.PENDING }),
            Report.countDocuments({ status: ReportStatus.PENDING }),
        ]);

        // Revenue calculation
        const revenueResult = await Booking.aggregate([
            { $match: { status: BookingStatus.CONFIRMED } },
            { $group: { _id: null, total: { $sum: '$finalAmount' } } },
        ]);
        const totalRevenue = revenueResult[0]?.total || 0;

        // User growth (last 30 days)
        const thirtyDaysAgo = new Date();
        thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

        const userGrowth = await User.aggregate([
            { $match: { createdAt: { $gte: thirtyDaysAgo } } },
            {
                $group: {
                    _id: { $dateToString: { format: '%Y-%m-%d', date: '$createdAt' } },
                    count: { $sum: 1 },
                },
            },
            { $sort: { _id: 1 } },
            { $project: { date: '$_id', count: 1, _id: 0 } },
        ]);

        // Booking trend (last 30 days)
        const bookingTrend = await Booking.aggregate([
            {
                $match: {
                    createdAt: { $gte: thirtyDaysAgo },
                    status: BookingStatus.CONFIRMED,
                },
            },
            {
                $group: {
                    _id: { $dateToString: { format: '%Y-%m-%d', date: '$createdAt' } },
                    count: { $sum: 1 },
                    revenue: { $sum: '$finalAmount' },
                },
            },
            { $sort: { _id: 1 } },
            { $project: { date: '$_id', count: 1, revenue: 1, _id: 0 } },
        ]);

        // Top courts
        const topCourts = await Booking.aggregate([
            { $match: { status: BookingStatus.CONFIRMED } },
            {
                $group: {
                    _id: '$courtId',
                    bookings: { $sum: 1 },
                    revenue: { $sum: '$finalAmount' },
                },
            },
            { $sort: { bookings: -1 } },
            { $limit: 10 },
            {
                $lookup: {
                    from: 'courts',
                    localField: '_id',
                    foreignField: '_id',
                    as: 'court',
                },
            },
            { $unwind: '$court' },
            {
                $project: {
                    courtId: '$_id',
                    name: '$court.name',
                    bookings: 1,
                    revenue: 1,
                    _id: 0,
                },
            },
        ]);

        return {
            totalUsers,
            totalCourts,
            totalBookings,
            totalRevenue,
            activeGroupPlays,
            pendingApplications,
            pendingReports,
            userGrowth,
            bookingTrend,
            topCourts,
        };
    }

    /**
     * Get all users with filtering
     */
    async getUsers(params: {
        role?: UserRole;
        status?: UserStatus;
        search?: string;
        page?: number;
        limit?: number;
    }) {
        const filter: any = {};
        if (params.role) filter.role = params.role;
        if (params.status) filter.status = params.status;
        if (params.search) {
            filter.$or = [
                { displayName: { $regex: params.search, $options: 'i' } },
                { email: { $regex: params.search, $options: 'i' } },
            ];
        }

        const total = await User.countDocuments(filter);
        const { page, limit, totalPages, skip } = calculatePagination(
            params.page || 1,
            params.limit || 20,
            total
        );

        const users = await User.find(filter)
            .sort({ createdAt: -1 })
            .skip(skip)
            .limit(limit)
            .lean();

        return { users, pagination: { page, limit, total, totalPages } };
    }

    /**
     * Ban a user
     */
    async banUser(userId: string, adminId: string, reason: string, expiresAt?: string) {
        const user = await User.findById(userId);
        if (!user) throw ApiError.notFound('Không tìm thấy người dùng');

        if (user.role === UserRole.ADMIN) {
            throw ApiError.forbidden('Không thể cấm tài khoản admin');
        }

        user.status = UserStatus.BANNED;
        user.banInfo = {
            reason,
            bannedAt: new Date(),
            bannedBy: new mongoose.Types.ObjectId(adminId),
            expiresAt: expiresAt ? new Date(expiresAt) : undefined,
        };
        user.refreshTokens = []; // Force logout
        await user.save();

        // Create notification
        await Notification.create({
            userId,
            title: 'Tài khoản bị cấm',
            message: `Tài khoản của bạn đã bị cấm. Lý do: ${reason}`,
            type: 'system',
        });

        logger.info(`User ${userId} banned by admin ${adminId}: ${reason}`);
        return user;
    }

    /**
     * Unban a user
     */
    async unbanUser(userId: string, adminId: string) {
        const user = await User.findById(userId);
        if (!user) throw ApiError.notFound('Không tìm thấy người dùng');

        user.status = UserStatus.ACTIVE;
        user.banInfo = undefined;
        await user.save();

        await Notification.create({
            userId,
            title: 'Tài khoản đã được mở cấm',
            message: 'Tài khoản của bạn đã được mở cấm. Chào mừng bạn quay lại!',
            type: 'system',
        });

        logger.info(`User ${userId} unbanned by admin ${adminId}`);
        return user;
    }

    /**
     * Review court owner application
     */
    async reviewOwnerApplication(
        applicationId: string,
        adminId: string,
        status: 'approved' | 'rejected' | 'requires_more_info',
        reviewNotes?: string
    ) {
        const application = await OwnerApplication.findById(applicationId);
        if (!application) throw ApiError.notFound('Không tìm thấy đơn đăng ký');

        application.status = status as OwnerApplicationStatus;
        application.reviewedBy = new mongoose.Types.ObjectId(adminId);
        application.reviewNotes = reviewNotes;
        application.reviewedAt = new Date();
        await application.save();

        if (status === 'approved') {
            // Upgrade user role to court_owner
            await User.findByIdAndUpdate(application.userId, {
                role: UserRole.COURT_OWNER,
            });

            // Auto-create the court
            const slug = createSlug(application.courtName) + '-' + Date.now().toString(36);
            await Court.create({
                name: application.courtName,
                slug,
                ownerId: application.userId,
                sportTypes: application.sportTypes,
                status: CourtStatus.ACTIVE,
                address: application.courtAddress,
                location: {
                    type: 'Point',
                    coordinates: [application.courtLocation.lng, application.courtLocation.lat],
                },
                contact: { phone: '' }, // Owner will fill in later
                operatingHours: [],
                pricePerHour: [],
                courts: [],
                photos: application.courtPhotos.map((url, i) => ({
                    url,
                    isMain: i === 0,
                    source: 'upload' as const,
                })),
                googlePlaceId: application.googlePlaceId,
                isVerified: true,
            });

            await Notification.create({
                userId: application.userId,
                title: 'Đơn đăng ký chủ sân đã được duyệt',
                message: `Chúc mừng! Đơn đăng ký cho "${application.courtName}" đã được duyệt. Bạn giờ là chủ sân và có thể quản lý sân của mình.`,
                type: 'system',
            });
        } else {
            const statusMsg = status === 'rejected' ? 'bị từ chối' : 'cần bổ sung thông tin';
            await Notification.create({
                userId: application.userId,
                title: `Đơn đăng ký chủ sân đã ${statusMsg}`,
                message: `Đơn đăng ký cho "${application.courtName}" đã ${statusMsg}.${reviewNotes ? ` Ghi chú: ${reviewNotes}` : ''}`,
                type: 'system',
            });
        }

        logger.info(`Owner application ${applicationId} ${status} by admin ${adminId}`);
        return application;
    }

    /**
     * Get pending owner applications
     */
    async getOwnerApplications(params: {
        status?: OwnerApplicationStatus;
        page?: number;
        limit?: number;
    }) {
        const filter: any = {};
        if (params.status) filter.status = params.status;

        const total = await OwnerApplication.countDocuments(filter);
        const { page, limit, totalPages, skip } = calculatePagination(
            params.page || 1,
            params.limit || 20,
            total
        );

        const applications = await OwnerApplication.find(filter)
            .sort({ createdAt: -1 })
            .skip(skip)
            .limit(limit)
            .populate('userId', 'displayName email phone')
            .lean();

        return { applications, pagination: { page, limit, total, totalPages } };
    }

    /**
     * Get and manage reports
     */
    async getReports(params: {
        status?: ReportStatus;
        page?: number;
        limit?: number;
    }) {
        const filter: any = {};
        if (params.status) filter.status = params.status;

        const total = await Report.countDocuments(filter);
        const { page, limit, totalPages, skip } = calculatePagination(
            params.page || 1,
            params.limit || 20,
            total
        );

        const reports = await Report.find(filter)
            .sort({ createdAt: -1 })
            .skip(skip)
            .limit(limit)
            .populate('reporterId', 'displayName email')
            .populate('targetUserId', 'displayName email')
            .populate('targetCourtId', 'name')
            .lean();

        return { reports, pagination: { page, limit, total, totalPages } };
    }

    /**
     * Resolve a report
     */
    async resolveReport(
        reportId: string,
        adminId: string,
        resolution: string,
        status: ReportStatus = ReportStatus.RESOLVED
    ) {
        const report = await Report.findById(reportId);
        if (!report) throw ApiError.notFound('Không tìm thấy báo cáo');

        report.status = status;
        report.resolution = resolution;
        report.resolvedBy = new mongoose.Types.ObjectId(adminId);
        report.resolvedAt = new Date();
        await report.save();

        logger.info(`Report ${reportId} resolved by admin ${adminId}`);
        return report;
    }

    /**
     * Get all courts for admin (including pending)
     */
    async getAllCourts(params: {
        status?: CourtStatus;
        page?: number;
        limit?: number;
    }) {
        const filter: any = {};
        if (params.status) filter.status = params.status;

        const total = await Court.countDocuments(filter);
        const { page, limit, totalPages, skip } = calculatePagination(
            params.page || 1,
            params.limit || 20,
            total
        );

        const courts = await Court.find(filter)
            .sort({ createdAt: -1 })
            .skip(skip)
            .limit(limit)
            .populate('ownerId', 'displayName email phone')
            .lean();

        return { courts, pagination: { page, limit, total, totalPages } };
    }
}

export const adminService = new AdminService();