import { Request, Response } from 'express';
import { AuthRequest } from '../middlewares/auth';
import { ChatMessage } from '../models';
import { logger } from '../utils/logger';

export const getChatHistory = async (req: Request, res: Response): Promise<void> => {
    try {
        const { groupPlayId } = req.params;
        const page = parseInt(req.query.page as string) || 1;
        const limit = parseInt(req.query.limit as string) || 50;

        const messages = await ChatMessage.find({ groupPlayId })
            .sort({ createdAt: -1 })
            .skip((page - 1) * limit)
            .limit(limit)
            .lean();

        // Reverse to get chronological order for frontend
        res.status(200).json({
            success: true,
            data: messages.reverse(),
        });
    } catch (error) {
        logger.error('Error fetching chat history:', error);
        res.status(500).json({
            success: false,
            message: 'Không thể lấy lịch sử trò chuyện',
        });
    }
};

export const deleteGroupChat = async (req: AuthRequest, res: Response): Promise<void> => {
    try {
        const { groupPlayId } = req.params;
        const userId = req.userId; // Provided by authenticate middleware

        // 1. Find group play
        const { GroupPlay } = await import('../models/GroupPlay');
        const group = await GroupPlay.findById(groupPlayId);
        
        if (!group) {
            res.status(404).json({ success: false, message: 'Không tìm thấy nhóm' });
            return;
        }

        // 2. Check if user is organizer
        if (group.organizerId.toString() !== userId) {
            res.status(403).json({ success: false, message: 'Chỉ chủ nhóm mới có quyền xóa nhóm chat' });
            return;
        }

        // 3. Mark chat as deleted
        group.isChatDeleted = true;
        await group.save();

        // 4. Delete chat messages
        await ChatMessage.deleteMany({ groupPlayId });

        res.status(200).json({
            success: true,
            message: 'Đã xóa nhóm chat thành công',
        });
    } catch (error) {
        logger.error('Error deleting group chat:', error);
        res.status(500).json({
            success: false,
            message: 'Không thể xóa nhóm chat',
        });
    }
};

// ============================
// P2P CHAT / DIRECT MESSAGES
// ============================

export const getConversations = async (req: AuthRequest, res: Response): Promise<void> => {
    try {
        const userId = req.userId;

        const { Conversation } = await import('../models/Conversation');
        const conversations = await Conversation.find({ participants: userId })
            .populate('participants', 'displayName avatar')
            .populate('lastMessage')
            .sort({ updatedAt: -1 });

        res.status(200).json({
            success: true,
            message: 'Conversations fetched',
            data: conversations,
        });
    } catch (error) {
        logger.error('Error fetching conversations:', error);
        res.status(500).json({ success: false, message: 'Internal server error' });
    }
};

export const getMessages = async (req: AuthRequest, res: Response): Promise<void> => {
    try {
        const userId = req.userId;
        const { conversationId } = req.params;

        const { Conversation } = await import('../models/Conversation');
        const { Message } = await import('../models/Message');

        const conversation = await Conversation.findOne({
            _id: conversationId,
            participants: userId,
        });

        if (!conversation) {
            res.status(404).json({ success: false, message: 'Conversation not found' });
            return;
        }

        const messages = await Message.find({ conversationId }).sort({ createdAt: 1 });

        // Reset unread count
        if (conversation.unreadCount.get(userId as string) && conversation.unreadCount.get(userId as string)! > 0) {
            conversation.unreadCount.set(userId as string, 0);
            await conversation.save();
        }

        res.status(200).json({
            success: true,
            message: 'Messages fetched',
            data: messages,
        });
    } catch (error) {
        logger.error('Error fetching messages:', error);
        res.status(500).json({ success: false, message: 'Internal server error' });
    }
};

export const createConversation = async (req: AuthRequest, res: Response): Promise<void> => {
    try {
        const userId = req.userId;
        const { recipientId } = req.body;

        if (userId === recipientId) {
            res.status(400).json({ success: false, message: 'Cannot create conversation with yourself' });
            return;
        }

        const { Conversation } = await import('../models/Conversation');

        let conversation = await Conversation.findOne({
            participants: { $all: [userId, recipientId], $size: 2 }
        });

        if (!conversation) {
            conversation = await Conversation.create({
                participants: [userId, recipientId],
                unreadCount: new Map([[userId as string, 0], [recipientId, 0]]),
            });
        }

        const populated = await conversation.populate('participants', 'displayName avatar');

        res.status(200).json({
            success: true,
            message: 'Conversation fetched or created',
            data: populated,
        });
    } catch (error) {
        logger.error('Error creating conversation:', error);
        res.status(500).json({ success: false, message: 'Internal server error' });
    }
};
