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

        setTimeout(async () => {
            try {
                // Tìm lại đơn hàng xem có đúng là đang chờ thanh toán không
                const b = await Booking.findById(booking._id);
                if (b && b.status === BookingStatus.PENDING_PAYMENT) {
                    b.status = BookingStatus.CONFIRMED;
                    b.payment.status = PaymentStatus.PAID;
                    b.payment.paidAt = new Date();
                    b.confirmedAt = new Date();
                    await b.save();
                    console.log(`✅ [Auto-Bot] Đã tự động xác nhận đơn ${bookingCode} sau 10s`);
                }
            } catch (error) {
                console.error("❌ Lỗi tự động xác nhận:", error);
            }
        }, 10000);

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
        booking.payment.status = PaymentStatus.PAID;
        booking.payment.paidAt = new Date();
        booking.confirmedAt = new Date();

        await booking.save();
        return booking;
    }

    async getCourtBookings(courtId: string, date: string) {
        const query: any = {
            courtId,
            status: { $ne: BookingStatus.CANCELLED }
        };

        if (date) {
            const startOfDay = new Date(date);
            startOfDay.setHours(0, 0, 0, 0);

            const endOfDay = new Date(date);
            endOfDay.setHours(23, 59, 59, 999);

            query.date = { $gte: startOfDay, $lte: endOfDay };
        }

        const bookings = await Booking.find(query)
            .select('subCourtId startTime endTime date status')
            .lean();

        return bookings;
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
}

export const bookingService = new BookingService();