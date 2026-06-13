import mongoose from 'mongoose';
import { connectDB } from '../config/database';
import { Booking } from '../models/Booking';
import { Court } from '../models/Court';
import { User } from '../models/User';
import { BookingStatus, BookingType, PaymentMethod, PaymentStatus, UserRole, UserStatus } from '@shuttle-sync/shared';
import { logger } from '../utils/logger';

const VIETNAMESE_NAMES = [
    'Nguyễn Hải Đăng', 'Trần Mai Anh', 'Lê Minh Tuấn', 'Phạm Quỳnh Chi', 'Vũ Đức Phát',
    'Hoàng Ngọc Linh', 'Đặng Tuấn Anh', 'Bùi Thị Hà', 'Đỗ Xuân Bách', 'Hồ Quang Hiếu',
    'Ngô Thị Ngân', 'Dương Khắc Tiệp', 'Lý Hải', 'Phan Khắc Khánh', 'Võ Hoàng Yến',
    'Trương Ngọc Ánh', 'Nguyễn Thái Sơn', 'Lê Hữu Đạt', 'Trần Bảo Ngọc', 'Phạm Quang Dũng'
];

async function seedRealisticBookings() {
    await connectDB();
    logger.info('Starting realistic bookings seed...');

    const courts = await Court.find().limit(20);
    if (courts.length === 0) {
        logger.error('No courts found. Please create courts first.');
        process.exit(1);
    }

    // Create realistic users if they don't exist
    logger.info('Generating realistic users...');
    const userDocs = [];
    for (const name of VIETNAMESE_NAMES) {
        // Just create them without password for mock purpose, or with a dummy one
        // We'll just generate the object ID and insert them
        const email = name.toLowerCase().replace(/ /g, '') + Math.floor(Math.random() * 1000) + '@gmail.com';
        const phone = '09' + Math.floor(10000000 + Math.random() * 90000000).toString();
        
        let user = await User.findOne({ email });
        if (!user) {
            user = await User.create({
                email,
                password: 'hashed_dummy_password',
                displayName: name,
                phone,
                role: UserRole.USER,
                status: UserStatus.ACTIVE,
                isEmailVerified: true
            });
        }
        userDocs.push(user);
    }

    logger.info('Wiping old bookings just in case...');
    await Booking.deleteMany({});

    const bookingsToInsert = [];
    const now = new Date();

    for (let i = 0; i < 100; i++) {
        const court = courts[Math.floor(Math.random() * courts.length)];
        const user = userDocs[Math.floor(Math.random() * userDocs.length)];
        
        // Distribution: 70% past, 30% future
        const isPast = Math.random() > 0.3;
        const daysOffset = Math.floor(Math.random() * 30);
        
        const bookingDate = new Date();
        if (isPast) {
            bookingDate.setDate(now.getDate() - daysOffset);
        } else {
            bookingDate.setDate(now.getDate() + Math.floor(Math.random() * 7) + 1); // up to 7 days ahead
        }

        const price = court.pricePerHour?.[0]?.price || 120000;
        const duration = Math.floor(Math.random() * 3) + 1; // 1 to 3 hours
        const totalAmount = price * duration;
        
        // Random hour between 16 and 22
        const startHour = 16 + Math.floor(Math.random() * 5);

        // Status logic: if past -> likely confirmed. If future -> maybe pending.
        let status = BookingStatus.CONFIRMED;
        if (!isPast) {
            const rand = Math.random();
            if (rand < 0.3) status = BookingStatus.PENDING_PAYMENT;
            else if (rand < 0.4) status = BookingStatus.CANCELLED;
        } else {
            // Some past bookings were cancelled
            if (Math.random() < 0.1) status = BookingStatus.CANCELLED;
        }

        bookingsToInsert.push({
            bookingCode: `BK${Math.floor(100000 + Math.random() * 900000)}`,
            userId: user._id,
            courtId: court._id,
            subCourtId: new mongoose.Types.ObjectId(), // Fake subcourt
            slotIds: [],
            date: bookingDate,
            startTime: `${startHour}:00`,
            endTime: `${startHour + duration}:00`,
            type: BookingType.CASUAL,
            status,
            totalAmount,
            discount: 0,
            finalAmount: totalAmount,
            payment: {
                method: Math.random() > 0.2 ? PaymentMethod.QR_CODE : PaymentMethod.CASH,
                status: status === BookingStatus.CONFIRMED ? PaymentStatus.PAID : (status === BookingStatus.CANCELLED ? PaymentStatus.REFUNDED : PaymentStatus.PENDING),
                expiresAt: new Date(now.getTime() + 15 * 60000),
                paidAt: status === BookingStatus.CONFIRMED ? bookingDate : undefined
            },
            createdAt: bookingDate, // For accurate dashboard charts
        });
    }

    await Booking.insertMany(bookingsToInsert);
    logger.info(`Inserted ${bookingsToInsert.length} realistic bookings!`);
    
    process.exit(0);
}

seedRealisticBookings().catch(e => {
    logger.error('Realistic seed failed:', e);
    process.exit(1);
});
