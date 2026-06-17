import {
    GroupPlayStatus, GroupPlayRole, SportType, SkillLevel,
} from '@shuttle-sync/shared';
import { GroupPlay, IGroupPlayDocument, User } from '../models';
import { ApiError } from '../utils/ApiError';
import { calculatePagination } from '../utils/helpers';
import { logger } from '../utils/logger';
import { notificationService } from './other.service';

class GroupPlayService {
    /**
     * Create a new group play session
     */
    async createGroupPlay(
        organizerId: string,
        data: any
    ): Promise<IGroupPlayDocument> {
        const organizer = await User.findById(organizerId);
        if (!organizer) throw ApiError.notFound('Người dùng không tồn tại');

        const groupPlay = await GroupPlay.create({
            ...data,
            organizerId,
            date: new Date(data.date),
            currentPlayers: 1,
            status: GroupPlayStatus.OPEN,
            participants: [{
                userId: organizerId,
                displayName: organizer.displayName,
                avatar: organizer.avatar,
                role: GroupPlayRole.ORGANIZER,
                joinedAt: new Date(),
                hasPaid: true, // Organizer already paid via booking
            }],
        });

        await User.findByIdAndUpdate(organizerId, {
            $inc: { 'stats.totalGroupPlays': 1 },
        });

        // Add Notification
        await notificationService.createNotification({
            userId: organizerId,
            title: '🏸 Tạo nhóm thành công',
            message: `Bạn đã tạo thành công nhóm "${groupPlay.title}". Chúc bạn có một buổi giao lưu vui vẻ!`,
            type: 'group_play'
        }).catch(err => logger.error('Lỗi tạo thông báo (GroupPlay):', err));

        logger.info(`GroupPlay created: ${groupPlay.title} by ${organizer.displayName}`);
        return groupPlay;
    }

    /**
     * Join a group play session
     */
    async joinGroupPlay(
        groupPlayId: string,
        userId: string
    ): Promise<IGroupPlayDocument> {
        const groupPlay = await GroupPlay.findById(groupPlayId);
        if (!groupPlay) throw ApiError.notFound('Không tìm thấy nhóm chơi');

        if (groupPlay.status !== GroupPlayStatus.OPEN) {
            throw ApiError.badRequest('Nhóm chơi không còn mở đăng ký');
        }

        if (groupPlay.currentPlayers >= groupPlay.maxPlayers) {
            throw ApiError.badRequest('Nhóm chơi đã đủ người');
        }

        // Check if already joined
        const alreadyJoined = groupPlay.participants.some(
            p => p.userId.toString() === userId
        );
        if (alreadyJoined) {
            throw ApiError.conflict('Bạn đã tham gia nhóm chơi này');
        }

        const user = await User.findById(userId);
        if (!user) throw ApiError.notFound('Người dùng không tồn tại');

        // Thêm vào danh sách chờ duyệt (joinRequests) thay vì vào thẳng participants
        const existingRequestIndex = groupPlay.joinRequests.findIndex(r => r.userId.toString() === userId);
        
        if (existingRequestIndex !== -1) {
            const req = groupPlay.joinRequests[existingRequestIndex];
            if (req.status === 'pending') {
                throw ApiError.conflict('Bạn đã gửi yêu cầu tham gia và đang chờ duyệt');
            } else if (req.status === 'rejected') {
                throw ApiError.forbidden('Bạn đã bị từ chối tham gia nhóm này trước đó và không thể yêu cầu lại');
            }
        } else {
            groupPlay.joinRequests.push({
                userId: user._id as any,
                displayName: user.displayName,
                avatar: user.avatar,
                requestedAt: new Date(),
                status: 'pending'
            });
        }

        await groupPlay.save();

        // Add Notification for organizer
        await notificationService.createNotification({
            userId: groupPlay.organizerId.toString(),
            title: '👋 Yêu cầu tham gia mới!',
            message: `${user.displayName} muốn tham gia nhóm "${groupPlay.title}" của bạn. Hãy vào duyệt ngay!`,
            type: 'group_play'
        }).catch(err => logger.error('Lỗi tạo thông báo (GroupPlay):', err));

        // Note: socket event should be emitted by controller to owner
        
        logger.info(`User ${user.displayName} requested to join group play: ${groupPlay.title}`);
        return groupPlay;
    }

    /**
     * Accept a join request
     */
    async acceptJoinRequest(
        groupPlayId: string,
        requesterId: string,
        ownerId: string
    ): Promise<IGroupPlayDocument> {
        const groupPlay = await GroupPlay.findById(groupPlayId);
        if (!groupPlay) throw ApiError.notFound('Không tìm thấy nhóm chơi');

        if (groupPlay.organizerId.toString() !== ownerId) {
            throw ApiError.forbidden('Chỉ chủ sân mới có thể duyệt người chơi');
        }

        if (groupPlay.currentPlayers >= groupPlay.maxPlayers) {
            throw ApiError.badRequest('Nhóm chơi đã đủ người');
        }

        const requestIndex = groupPlay.joinRequests.findIndex(r => r.userId.toString() === requesterId && r.status === 'pending');
        if (requestIndex === -1) {
            throw ApiError.notFound('Không tìm thấy yêu cầu tham gia đang chờ duyệt');
        }

        const user = await User.findById(requesterId);
        if (!user) throw ApiError.notFound('Người dùng không tồn tại');

        // Chuyển từ joinRequests sang participants
        groupPlay.joinRequests.splice(requestIndex, 1);
        
        groupPlay.participants.push({
            userId: user._id as any,
            displayName: user.displayName,
            avatar: user.avatar,
            role: GroupPlayRole.PARTICIPANT,
            joinedAt: new Date(),
            hasPaid: false,
            isGuest: false,
            gender: (user as any).gender || 'male',
            beveragesConsumed: [],
            totalOwed: 0
        });

        groupPlay.currentPlayers += 1;

        if (groupPlay.currentPlayers >= groupPlay.maxPlayers) {
            groupPlay.status = GroupPlayStatus.FULL;
        }

        await groupPlay.save();

        await User.findByIdAndUpdate(requesterId, {
            $inc: { 'stats.totalGroupPlays': 1 },
        });

        // Add Notification for requester
        await notificationService.createNotification({
            userId: requesterId,
            title: '✅ Đã được duyệt!',
            message: `Chủ sân đã duyệt bạn vào nhóm "${groupPlay.title}". Vào chat ngay nào!`,
            type: 'group_play'
        }).catch(err => logger.error('Lỗi tạo thông báo (GroupPlay):', err));

        return groupPlay;
    }

    /**
     * Reject a join request
     */
    async rejectJoinRequest(
        groupPlayId: string,
        requesterId: string,
        ownerId: string,
        reason: string
    ): Promise<IGroupPlayDocument> {
        const groupPlay = await GroupPlay.findById(groupPlayId);
        if (!groupPlay) throw ApiError.notFound('Không tìm thấy nhóm chơi');

        if (groupPlay.organizerId.toString() !== ownerId) {
            throw ApiError.forbidden('Chỉ chủ sân mới có thể từ chối người chơi');
        }

        const request = groupPlay.joinRequests.find(r => r.userId.toString() === requesterId && r.status === 'pending');
        if (!request) {
            throw ApiError.notFound('Không tìm thấy yêu cầu tham gia đang chờ duyệt');
        }

        request.status = 'rejected';
        request.rejectReason = reason || 'Từ chối bởi chủ sân';

        await groupPlay.save();

        // Add Notification for requester
        await notificationService.createNotification({
            userId: requesterId,
            title: '❌ Yêu cầu bị từ chối',
            message: `Chủ sân đã từ chối yêu cầu tham gia nhóm "${groupPlay.title}" của bạn. Lý do: ${request.rejectReason}`,
            type: 'group_play'
        }).catch(err => logger.error('Lỗi tạo thông báo (GroupPlay):', err));

        return groupPlay;
    }

    /**
     * Leave a group play session
     */
    async leaveGroupPlay(
        groupPlayId: string,
        userId: string
    ): Promise<IGroupPlayDocument> {
        const groupPlay = await GroupPlay.findById(groupPlayId);
        if (!groupPlay) throw ApiError.notFound('Không tìm thấy nhóm chơi');

        // Organizer can't leave, only cancel
        if (groupPlay.organizerId.toString() === userId) {
            throw ApiError.badRequest('Người tổ chức không thể rời nhóm, hãy hủy nhóm thay vì rời');
        }

        const participantIndex = groupPlay.participants.findIndex(
            p => p.userId.toString() === userId
        );

        if (participantIndex === -1) {
            throw ApiError.badRequest('Bạn chưa tham gia nhóm chơi này');
        }

        groupPlay.participants.splice(participantIndex, 1);
        groupPlay.currentPlayers -= 1;

        if (groupPlay.status === GroupPlayStatus.FULL) {
            groupPlay.status = GroupPlayStatus.OPEN;
        }

        await groupPlay.save();

        const user = await User.findById(userId);
        if (user) {
            // Add Notification for organizer
            await notificationService.createNotification({
                userId: groupPlay.organizerId.toString(),
                title: '😢 Thành viên rời nhóm',
                message: `${user.displayName} đã rời khỏi nhóm "${groupPlay.title}".`,
                type: 'group_play'
            }).catch(err => logger.error('Lỗi tạo thông báo (GroupPlay):', err));
        }

        return groupPlay;
    }

    /**
     * Cancel a group play (organizer only)
     */
    async cancelGroupPlay(
        groupPlayId: string,
        userId: string
    ): Promise<IGroupPlayDocument> {
        const groupPlay = await GroupPlay.findById(groupPlayId);
        if (!groupPlay) throw ApiError.notFound('Không tìm thấy nhóm chơi');

        if (groupPlay.organizerId.toString() !== userId) {
            throw ApiError.forbidden('Chỉ người tổ chức mới có thể hủy');
        }

        groupPlay.status = GroupPlayStatus.CANCELLED;
        await groupPlay.save();

        logger.info(`GroupPlay cancelled: ${groupPlay.title}`);
        return groupPlay;
    }

    /**
     * Search/list group play sessions
     */
    async searchGroupPlays(params: {
        sportType?: SportType;
        skillLevel?: SkillLevel;
        date?: string;
        district?: string;
        status?: GroupPlayStatus;
        page?: number;
        limit?: number;
    }) {
        const filter: any = {
            isPublic: true,
            status: params.status || GroupPlayStatus.OPEN,
        };

        if (params.sportType) filter.sportType = params.sportType;
        if (params.skillLevel) filter.skillLevel = params.skillLevel;

        if (params.date) {
            const date = new Date(params.date);
            date.setHours(0, 0, 0, 0);
            const nextDay = new Date(date);
            nextDay.setDate(nextDay.getDate() + 1);
            filter.date = { $gte: date, $lt: nextDay };
        } else {
            // Default: only show future group plays
            const today = new Date();
            today.setHours(0, 0, 0, 0);
            filter.date = { $gte: today };
        }

        const total = await GroupPlay.countDocuments(filter);
        const { page, limit, totalPages, skip } = calculatePagination(
            params.page || 1,
            params.limit || 20,
            total
        );

        const groupPlays = await GroupPlay.find(filter)
            .sort({ date: 1, startTime: 1 })
            .skip(skip)
            .limit(limit)
            .populate({ path: 'courtId', model: 'Venue', select: 'name slug address photos' })
            .populate('organizerId', 'displayName avatar stats.rating')
            .lean();

        return {
            groupPlays,
            pagination: { page, limit, total, totalPages },
        };
    }

    /**
     * Get group plays the user is participating in
     */
    async getUserGroupPlays(userId: string, params: {
        page?: number;
        limit?: number;
    }) {
        const filter = {
            $or: [
                { 'participants.userId': userId },
                { 'joinRequests': { $elemMatch: { userId: userId, status: 'pending' } } }
            ]
        };
        const total = await GroupPlay.countDocuments(filter);
        const { page, limit, totalPages, skip } = calculatePagination(
            params.page || 1,
            params.limit || 20,
            total
        );

        const groupPlays = await GroupPlay.find(filter)
            .sort({ date: -1 })
            .skip(skip)
            .limit(limit)
            .populate({ path: 'courtId', model: 'Venue', select: 'name slug address photos' })
            .populate('organizerId', 'displayName avatar')
            .lean();

        return {
            groupPlays,
            pagination: { page, limit, total, totalPages },
        };
    }

    /**
     * Get a single group play by ID
     */
    async getGroupPlayById(id: string): Promise<IGroupPlayDocument> {
        const groupPlay = await GroupPlay.findById(id)
            .populate({ path: 'courtId', model: 'Venue', select: 'name slug address photos contact' })
            .populate('organizerId', 'displayName avatar phone stats');

        if (!groupPlay) throw ApiError.notFound('Không tìm thấy nhóm chơi');
        return groupPlay;
    }
}

export const groupPlayService = new GroupPlayService();