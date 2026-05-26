import mongoose from 'mongoose';
import { connectDB } from '../config/database';
import { Booking, Court, User } from '../models';
import { BookingStatus, BookingType, PaymentMethod, PaymentStatus } from '@shuttle-sync/shared';
import { logger } from '../utils/logger';

async function seedDashboard() {
    await connectDB();
    
    const courts = await Court.find().limit(20);
    const users = await User.find({ role: 'USER' }).limit(5);
    
    if (courts.length === 0) {
        logger.error('No courts found. Please run seed.ts first.');
        process.exit(1);
    }
    
    const userId = users.length > 0 ? users[0]._id : new mongoose.Types.ObjectId();
    
    logger.info('Wiping old bookings...');
    await Booking.deleteMany({});
    
    const bookingsToInsert = [];
    const now = new Date();
    
    for (let i = 0; i < 100; i++) {
        const court = courts[Math.floor(Math.random() * courts.length)];
        const isPast = Math.random() > 0.2; // 80% bookings in the past 30 days
        const daysOffset = Math.floor(Math.random() * 30);
        
        const bookingDate = new Date();
        if (isPast) {
            bookingDate.setDate(now.getDate() - daysOffset);
        } else {
            bookingDate.setDate(now.getDate() + Math.floor(Math.random() * 5));
        }
        
        const price = court.pricePerHour || 100000;
        const duration = Math.floor(Math.random() * 3) + 1; // 1 to 3 hours
        const totalAmount = price * duration;
        
        bookingsToInsert.push({
            bookingCode: `BK${Math.floor(100000 + Math.random() * 900000)}`,
            userId,
            courtId: court._id,
            subCourtId: new mongoose.Types.ObjectId(), // Fake subcourt
            slotIds: [],
            date: bookingDate,
            startTime: '18:00',
            endTime: `${18 + duration}:00`,
            type: BookingType.CASUAL,
            status: isPast ? BookingStatus.CONFIRMED : (Math.random() > 0.5 ? BookingStatus.CONFIRMED : BookingStatus.PENDING_PAYMENT),
            totalAmount,
            discount: 0,
            finalAmount: totalAmount,
            payment: {
                method: PaymentMethod.QR_CODE,
                status: PaymentStatus.PAID,
                expiresAt: new Date(now.getTime() + 15 * 60000),
            },
            createdAt: bookingDate, // For accurate dashboard charts (last 30 days of growth)
        });
    }
    
    await Booking.insertMany(bookingsToInsert);
    logger.info(`Inserted ${bookingsToInsert.length} mock bookings for Dashboard`);
    
    await mongoose.disconnect();
    process.exit(0);
}

seedDashboard().catch(e => {
    logger.error('Seed failed:', e);
    process.exit(1);
});
