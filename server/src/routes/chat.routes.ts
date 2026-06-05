import { Router } from 'express';
import { getChatHistory, deleteGroupChat } from '../controllers/chat.controller';
import { authenticate } from '../middlewares/auth';

const router = Router();

// Lấy lịch sử tin nhắn của một phòng group play
router.get('/:groupPlayId', authenticate, getChatHistory);

// Xóa nhóm chat
router.delete('/:groupPlayId', authenticate, deleteGroupChat);

export default router;
