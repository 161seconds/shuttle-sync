import { Router } from 'express';
import { confirmPayment } from './payment.controller.js';
import { protect } from '../../middlewares/auth.middleware.js';

const router = Router();

// PATCH /api/payments/confirm/:bookingId
router.patch('/confirm/:bookingId', protect, confirmPayment);

export default router;