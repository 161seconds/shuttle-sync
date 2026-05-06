import mongoose from 'mongoose';
import { Booking } from '../models/Booking';
import {
    BookingStatus,
    PaymentStatus,
    BookingType,
    PaymentMethod
} from '@shuttle-sync/shared';

class BookingService {
    async createBooking(userId: string, data: any) {
        const bookingCode = 'BK' + Math.floor(100000 + Math.random() * 900000);

        const sortedSlots = [...data.slotIds].sort();
        const startTime = sortedSlots[0];
        const endTime = `${parseInt(sortedSlots[sortedSlots.length - 1].split(':')[0]) + 1}:00`;

        const finalAmount = sortedSlots.length * 150000;
        const mockSlotObjectIds = sortedSlots.map(() => new mongoose.Types.ObjectId());

        const expiresAt = new Date();
        expiresAt.setMinutes(expiresAt.getMinutes() + 15);

        const booking = await Booking.create({
            bookingCode,
            userId,
            courtId: data.courtId,
            subCourtId: data.subCourtId,
            slotIds: mockSlotObjectIds,
            date: new Date(data.date),
            startTime,
            endTime,
            type: data.type || BookingType.CASUAL,
            status: BookingStatus.PENDING_PAYMENT,
            totalAmount: finalAmount,
            discount: 0,
            finalAmount: finalAmount,
            payment: {
                method: PaymentMethod.QR_CODE,
                status: PaymentStatus.PENDING,
                expiresAt: expiresAt
            }
        });

        return booking;
    }

    async getMyBookings(userId: string, status?: any) {
        const filter: any = { userId };
        if (status) filter.status = status;

        const bookings = await Booking.find(filter)
            .sort({ createdAt: -1 })
            .populate({ path: 'courtId', model: 'Venue', select: 'name address photos' })
            .lean();

        return bookings;
    }

    async confirmPayment(bookingCode: string, userId: string) {
        const booking = await Booking.findOne({ bookingCode, userId });
        if (!booking) throw new Error('Không tìm thấy đơn đặt sân');

        booking.status = BookingStatus.CONFIRMED;
        booking.payment.status = 'SUCCESS' as any;
        booking.payment.paidAt = new Date();
        booking.confirmedAt = new Date();

        await booking.save();
        return booking;
    }

    async getBookingByCode(code: string) {
        return null;
    }

    async getBookingById(id: string) {
        return null;
    }

    async cancelBooking(id: string, data?: any) {
        return null;
    }

    async getCourtBookings(courtId: string) {
        return [];
    }
}

export const bookingService = new BookingService();