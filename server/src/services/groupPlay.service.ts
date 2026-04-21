import {
    GroupPlayStatus, GroupPlayRole, SportType, SkillLevel,
} from '@shuttle-sync/shared';
import { GroupPlay, IGroupPlayDocument, User } from '../models';
import { ApiError } from '../utils/ApiError';
import { calculatePagination } from '../utils/helpers';
import { logger } from '../utils/logger';

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

        groupPlay.participants.push({
            userId: user._id,
            displayName: user.displayName,
            avatar: user.avatar,
            role: GroupPlayRole.PARTICIPANT,
            joinedAt: new Date(),
            hasPaid: false,
        });

        groupPlay.currentPlayers += 1;

        if (groupPlay.currentPlayers >= groupPlay.maxPlayers) {
            groupPlay.status = GroupPlayStatus.FULL;
        }

        await groupPlay.save();

        await User.findByIdAndUpdate(userId, {
            $inc: { 'stats.totalGroupPlays': 1 },
        });

        logger.info(`User ${user.displayName} joined group play: ${groupPlay.title}`);
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
            filter.date = { $gte: new Date() };
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
            .populate('courtId', 'name slug address photos')
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
        const filter = { 'participants.userId': userId };
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
            .populate('courtId', 'name slug address photos')
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
            .populate('courtId', 'name slug address photos contact')
            .populate('organizerId', 'displayName avatar phone stats');

        if (!groupPlay) throw ApiError.notFound('Không tìm thấy nhóm chơi');
        return groupPlay;
    }
}

export const groupPlayService = new GroupPlayService();