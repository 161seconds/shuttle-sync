import { Request, Response } from 'express';
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
