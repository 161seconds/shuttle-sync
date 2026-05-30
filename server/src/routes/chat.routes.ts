import { Router } from 'express';
import { getChatHistory } from '../controllers/chat.controller';
import { authenticate } from '../middlewares/auth';

const router = Router();

// Lấy lịch sử tin nhắn của một phòng group play
router.get('/:groupPlayId', authenticate, getChatHistory);

export default router;
