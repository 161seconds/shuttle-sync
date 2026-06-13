import { connectDB } from '../config/database';
import { Booking } from '../models/Booking';
import { logger } from '../utils/logger';

async function clearBookings() {
    await connectDB();
    logger.info('Wiping all bookings...');
    const result = await Booking.deleteMany({});
    logger.info(`Deleted ${result.deletedCount} bookings.`);
    process.exit(0);
}

clearBookings().catch(e => {
    logger.error('Failed:', e);
    process.exit(1);
});
