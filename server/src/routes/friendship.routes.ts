import { Router } from 'express';
import { sendFriendRequest, acceptFriendRequest, getFriendsList, getPendingRequests, searchUsers } from '../controllers/friendship.controller';
import { authenticate } from '../middlewares/auth';

const router = Router();

router.use(authenticate);

router.post('/request', sendFriendRequest);
router.post('/accept/:id', acceptFriendRequest);
router.get('/', getFriendsList);
router.get('/pending', getPendingRequests);
router.get('/search', searchUsers);

export default router;
