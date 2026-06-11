import { Router } from 'express';
import { getChatHistory, deleteGroupChat, getConversations, getMessages, createConversation } from '../controllers/chat.controller';
import { authenticate } from '../middlewares/auth';

const router = Router();

// ============================
// GROUP PLAY CHAT
// ============================
router.get('/group/:groupPlayId', authenticate, getChatHistory);
router.delete('/group/:groupPlayId', authenticate, deleteGroupChat);

// ============================
// P2P CHAT
// ============================
router.get('/conversations', authenticate, getConversations);
router.post('/conversations', authenticate, createConversation);
router.get('/conversations/:conversationId/messages', authenticate, getMessages);

export default router;
