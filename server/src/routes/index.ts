import { Router } from 'express';
import authRoutes from './auth.routes';
import courtRoutes from './court.routes';
import bookingRoutes from './booking.routes';
import groupPlayRoutes from './groupPlay.routes';
import adminRoutes from './admin.routes';
import {
    userRoutes, reviewRoutes, notificationRoutes,
    eventRoutes, ownerApplicationRoutes, reportRoutes,
} from './other.routes';

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

export default router;