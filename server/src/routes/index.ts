import { Router } from 'express';
import authRoutes from './auth.routes';
import courtRoutes from './court.routes';
import bookingRoutes from './booking.routes';
import groupPlayRoutes from './groupPlay.routes';
import adminRoutes from './admin.routes';
import { aiCoachController } from '../controllers/aiCoach.controller';

import {
    userRoutes, reviewRoutes, notificationRoutes,
    eventRoutes, ownerApplicationRoutes, reportRoutes,
} from './other.routes';
import ownerRoutes from './owner.routes';
import tournamentRoutes from './tournament.routes';
import chatRoutes from './chat.routes';
import friendshipRoutes from './friendship.routes';
import paymentRoutes from './payment.routes';
import voucherRoutes from './voucher.routes';

const router = Router();

// Health check
router.get('/health', (_req, res) => {
    res.json({
        success: true,
        message: 'ShuttleSync API is running',
        timestamp: new Date().toISOString(),
        uptime: process.uptime(),
    });
});

// Mount routes
router.use('/auth', authRoutes);
router.use('/users', userRoutes);
router.use('/courts', courtRoutes);
router.use('/bookings', bookingRoutes);
router.use('/group-plays', groupPlayRoutes);
router.use('/events', eventRoutes);
router.use('/reviews', reviewRoutes);
router.use('/notifications', notificationRoutes);
router.use('/owner-applications', ownerApplicationRoutes);
router.use('/reports', reportRoutes);
router.use('/admin', adminRoutes);
router.use('/owner', ownerRoutes);
router.use('/tournaments', tournamentRoutes);
router.use('/chat', chatRoutes);
router.use('/friends', friendshipRoutes);
router.use('/payment', paymentRoutes);
router.use('/vouchers', voucherRoutes);
router.post('/ask-coach', aiCoachController.askCoach);

export default router;
