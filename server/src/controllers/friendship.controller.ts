import { Response } from 'express';
import { AuthRequest } from '../middlewares/auth';
import { Friendship, User } from '../models';
import { FriendshipStatus, IApiResponse } from '@shuttle-sync/shared';

export const sendFriendRequest = async (req: AuthRequest, res: Response) => {
    try {
        const requesterId = req.userId;
        const { recipientId } = req.body;

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
            return res.status(400).json({ success: false, message: 'Friendship or request already exists' });
        }

        const friendship = await Friendship.create({
            requesterId,
            recipientId,
            status: FriendshipStatus.PENDING,
        });

        return res.status(201).json({
            success: true,
            message: 'Friend request sent',
            data: friendship,
        } as IApiResponse);
    } catch (error) {
        return res.status(500).json({ success: false, message: 'Internal server error' });
    }
};

export const acceptFriendRequest = async (req: AuthRequest, res: Response) => {
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

        return res.status(200).json({
            success: true,
            message: 'Friend request accepted',
            data: friendship,
        } as IApiResponse);
    } catch (error) {
        return res.status(500).json({ success: false, message: 'Internal server error' });
    }
};

export const getFriendsList = async (req: AuthRequest, res: Response) => {
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
        return res.status(500).json({ success: false, message: 'Internal server error' });
    }
};

export const getPendingRequests = async (req: AuthRequest, res: Response) => {
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
        return res.status(500).json({ success: false, message: 'Internal server error' });
    }
};

export const searchUsers = async (req: AuthRequest, res: Response) => {
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
        }).select('displayName avatar skillLevel stats').limit(10);

        return res.status(200).json({
            success: true,
            message: 'Users fetched',
            data: users,
        } as IApiResponse);
    } catch (error) {
        return res.status(500).json({ success: false, message: 'Internal server error' });
    }
};
