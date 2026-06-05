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
