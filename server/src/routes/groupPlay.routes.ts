import { Router } from 'express';
import { groupPlayController } from '../controllers';
import { authenticate, validate } from '../middlewares';
import { createGroupPlaySchema, searchGroupPlaySchema } from '../validators';

const router = Router();

// Public routes
router.get('/search', validate(searchGroupPlaySchema), groupPlayController.searchGroupPlays);
router.get('/:id', groupPlayController.getGroupPlayById);

// Protected routes
router.post('/', authenticate, validate(createGroupPlaySchema), groupPlayController.createGroupPlay);
router.get('/user/my', authenticate, groupPlayController.getMyGroupPlays);
router.post('/:groupPlayId/join', authenticate, groupPlayController.joinGroupPlay);
router.post('/:groupPlayId/leave', authenticate, groupPlayController.leaveGroupPlay);
router.post('/:groupPlayId/cancel', authenticate, groupPlayController.cancelGroupPlay);

export default router;