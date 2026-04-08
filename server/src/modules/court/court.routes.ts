import { Router } from 'express';
import { getAllCourts, createCourt } from './court.controller.js';
import { protect, adminOnly } from '../../middlewares/auth.middleware.js';

const router = Router();

router.get('/', getAllCourts);

router.post('/', protect, adminOnly, createCourt);

export default router;