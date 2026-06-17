import { Response, NextFunction } from 'express';
import { AuthRequest } from '../middlewares/auth';
import { Friendship, User } from '../models';
import { FriendshipStatus, IApiResponse } from '@shuttle-sync/shared';
import { notificationService } from '../services';

const notifyRecipient = async (req: AuthRequest, requesterId: string, recipientId: string) => {
    try {
        const requester = await User.findById(requesterId).select('displayName');
        if (requester) {
            const io = req.app.get('io');
            if (io) {
                io.to(`user:${recipientId}`).emit('friend:request', {
                    requesterId: requesterId,
                    requesterName: requester.displayName
                });
            }
            await notificationService.createNotification({
                userId: recipientId,
                title: '👥 Lời mời kết bạn mới',
                message: `${requester.displayName} đã gửi cho bạn một lời mời kết bạn.`,
                type: 'system'
            });
        }
    } catch (err) {
        console.error('Lỗi tạo thông báo kết bạn:', err);
    }
};

export const sendFriendRequest = async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
        const requesterId = req.userId;
        const { recipientId } = req.body;

        if (!recipientId) {
            return res.status(400).json({ success: false, message: 'Recipient ID is required' });
        }

        if (requesterId === recipientId) {
            return res.status(400).json({ success: false, message: 'Cannot send request to yourself' });
        }

        const existing = await Friendship.findOne({
            $or: [
                { requesterId, recipientId },
                { requesterId: recipientId, recipientId: requesterId }
            ]
        });

        if (existing) {
            if (existing.status === FriendshipStatus.ACCEPTED) {
                return res.status(400).json({ success: false, message: 'Already friends' });
            }
            if (existing.status === FriendshipStatus.PENDING) {
                return res.status(400).json({ success: false, message: 'Request already pending' });
            }
            if (existing.status === FriendshipStatus.REJECTED) {
                if (existing.rejectionCount >= 3) {
                    return res.status(400).json({ success: false, message: 'Cannot send request anymore. Rejection limit reached.' });
                }
                existing.status = FriendshipStatus.PENDING;
                existing.requesterId = requesterId as any;
                existing.recipientId = recipientId;
                await existing.save();
                
                await notifyRecipient(req, requesterId!, recipientId);

                return res.status(200).json({
                    success: true,
                    message: 'Friend request sent',
                    data: existing,
                } as IApiResponse);
            }
        }

        const friendship = await Friendship.create({
            requesterId,
            recipientId,
            status: FriendshipStatus.PENDING,
        });

        await notifyRecipient(req, requesterId!, recipientId);

        return res.status(201).json({
            success: true,
            message: 'Friend request sent',
            data: friendship,
        } as IApiResponse);
    } catch (error) {
        next(error);
    }
};

export const acceptFriendRequest = async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
        const userId = req.userId;
        const { id } = req.params; // friendship id

        const friendship = await Friendship.findOneAndUpdate(
            { _id: id, recipientId: userId, status: FriendshipStatus.PENDING },
            { status: FriendshipStatus.ACCEPTED },
            { new: true }
        );

        if (!friendship) {
            return res.status(404).json({ success: false, message: 'Request not found or already processed' });
        }

        try {
            const { Conversation } = await import('../models/Conversation');
            let conversation = await Conversation.findOne({
                participants: { $all: [friendship.requesterId, friendship.recipientId] },
            });
            if (!conversation) {
                await Conversation.create({
                    participants: [friendship.requesterId, friendship.recipientId],
                    unreadCount: new Map(),
                });
            }
        } catch (err) {
            console.error('Error auto-creating conversation:', err);
        }

        return res.status(200).json({
            success: true,
            message: 'Friend request accepted',
            data: friendship,
        } as IApiResponse);
    } catch (error) {
        next(error);
    }
};

export const getFriendsList = async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
        const userId = req.userId;

        const friendships = await Friendship.find({
            $or: [{ requesterId: userId }, { recipientId: userId }],
            status: FriendshipStatus.ACCEPTED,
        }).populate('requesterId recipientId', 'displayName avatar skillLevel stats');

        const friends = friendships.map(f => {
            const isRequester = f.requesterId._id.toString() === userId;
            return isRequester ? f.recipientId : f.requesterId;
        });

        return res.status(200).json({
            success: true,
            message: 'Friends fetched',
            data: friends,
        } as IApiResponse);
    } catch (error) {
        next(error);
    }
};

export const getPendingRequests = async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
        const userId = req.userId;

        const requests = await Friendship.find({
            recipientId: userId,
            status: FriendshipStatus.PENDING,
        }).populate('requesterId', 'displayName avatar');

        return res.status(200).json({
            success: true,
            message: 'Pending requests fetched',
            data: requests,
        } as IApiResponse);
    } catch (error) {
        next(error);
    }
};

export const searchUsers = async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
        const { query } = req.query;
        if (!query || typeof query !== 'string') {
            return res.status(400).json({ success: false, message: 'Query is required' });
        }

        const users = await User.find({
            $or: [
                { email: { $regex: query, $options: 'i' } },
                { displayName: { $regex: query, $options: 'i' } }
            ],
            _id: { $ne: req.userId } // Exclude self
        }).select('displayName avatar skillLevel stats').limit(10).lean();

        const userIds = users.map(u => u._id);
        const friendships = await Friendship.find({
            $or: [
                { requesterId: req.userId, recipientId: { $in: userIds } },
                { requesterId: { $in: userIds }, recipientId: req.userId }
            ]
        }).lean();

        const result = users.map(user => {
            const f = friendships.find(fr => String(fr.requesterId) === String(user._id) || String(fr.recipientId) === String(user._id));
            return {
                ...user,
                friendship: f ? {
                    status: f.status,
                    rejectionCount: f.rejectionCount || 0,
                    isRequester: String(f.requesterId) === String(req.userId)
                } : null
            };
        });

        return res.status(200).json({
            success: true,
            message: 'Users fetched',
            data: result,
        } as IApiResponse);
    } catch (error) {
        next(error);
    }
};

export const declineFriendRequest = async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
        const userId = req.userId;
        const { id } = req.params;

        const request = await Friendship.findOneAndUpdate(
            {
                _id: id,
                recipientId: userId,
                status: FriendshipStatus.PENDING
            },
            {
                $set: { status: FriendshipStatus.REJECTED },
                $inc: { rejectionCount: 1 }
            },
            { new: true }
        );

        if (!request) {
            return res.status(404).json({ success: false, message: 'Request not found or already processed' });
        }

        return res.status(200).json({
            success: true,
            message: 'Friend request declined',
        } as IApiResponse);
    } catch (error) {
        next(error);
    }
};
