import cron from 'node-cron';
import { bookingService, courtService } from '../services';
import { Court, TimeSlot } from '../models';
import { SlotStatus, CourtStatus } from '@shuttle-sync/shared';
import { logger } from '../utils/logger';

export const initCronJobs = () => {
    // Clean up expired pending bookings every 5 minutes
    cron.schedule('*/5 * * * *', async () => {
        try {
            const count = await bookingService.cleanupExpiredBookings();
            if (count > 0) {
                logger.info(`[CRON] Cleaned up ${count} expired bookings`);
            }
        } catch (error) {
            logger.error('[CRON] Cleanup expired bookings failed:', error);
        }
    });

    // Release stale slot locks every 2 minutes
    cron.schedule('*/2 * * * *', async () => {
        try {
            const fiveMinutesAgo = new Date(Date.now() - 5 * 60 * 1000);
            const result = await TimeSlot.updateMany(
                {
                    status: SlotStatus.SELECTED,
                    lockedAt: { $lt: fiveMinutesAgo },
                },
                {
                    status: SlotStatus.AVAILABLE,
                    lockedBy: null,
                    lockedAt: null,
                }
            );

            if (result.modifiedCount > 0) {
                logger.info(`[CRON] Released ${result.modifiedCount} stale slot locks`);
            }
        } catch (error) {
            logger.error('[CRON] Release stale locks failed:', error);
        }
    });

    // Pre-generate slots for the next 7 days, daily at 2 AM
    cron.schedule('0 2 * * *', async () => {
        try {
            const activeCourts = await Court.find({ status: CourtStatus.ACTIVE }).select('_id');
            let totalSlots = 0;

            for (const court of activeCourts) {
                for (let i = 0; i < 7; i++) {
                    const date = new Date();
                    date.setDate(date.getDate() + i);
                    date.setHours(0, 0, 0, 0);

                    try {
                        await courtService.generateSlotsForDate(court._id.toString(), date);
                        totalSlots++;
                    } catch (err) {
                        // Skip courts with errors
                    }
                }
            }

            logger.info(`[CRON] Pre-generated slots for ${activeCourts.length} courts, ${totalSlots} date combos`);
        } catch (error) {
            logger.error('[CRON] Slot generation failed:', error);
        }
    });

    // Clean old expired slots (older than 30 days) weekly on Sunday at 3 AM
    cron.schedule('0 3 * * 0', async () => {
        try {
            const thirtyDaysAgo = new Date();
            thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

            const result = await TimeSlot.deleteMany({
                date: { $lt: thirtyDaysAgo },
                status: { $in: [SlotStatus.AVAILABLE, SlotStatus.EXPIRED] },
            });

            logger.info(`[CRON] Cleaned ${result.deletedCount} old time slots`);
        } catch (error) {
            logger.error('[CRON] Old slot cleanup failed:', error);
        }
    });

    logger.info('Cron jobs initialized');
};