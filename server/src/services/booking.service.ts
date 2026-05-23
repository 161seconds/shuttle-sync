import mongoose from 'mongoose';
import { Booking } from '../models/Booking';
import { notificationService } from './other.service';
import {
    BookingStatus,
    PaymentStatus,
    BookingType,
    PaymentMethod
} from '@shuttle-sync/shared';

class BookingService {
    async createBooking(userId: string, data: any) {
        if (!data.startTime || !data.endTime) {
            throw new Error('Vui lòng chọn thời gian đặt sân');
        }

        const bookingCode = 'BK' + Math.floor(100000 + Math.random() * 900000);

        const startTime = data.startTime;
        const endTime = data.endTime;

        const start = new Date(`2000-01-01T${startTime}:00`);
        const end = new Date(`2000-01-01T${endTime}:00`);

        if (isNaN(start.getTime()) || isNaN(end.getTime())) {
            throw new Error('Định dạng thời gian không hợp lệ');
        }

        if (end <= start) {
            throw new Error('Giờ kết thúc phải lớn hơn giờ bắt đầu');
        }

        const durationHours = (end.getTime() - start.getTime()) / (1000 * 60 * 60);
        const finalAmount = durationHours * 150000;

        const expiresAt = new Date();
        expiresAt.setMinutes(expiresAt.getMinutes() + 15);

        const booking = await Booking.create({
            bookingCode,
            userId,
            courtId: data.courtId,
            subCourtId: data.subCourtId,

            slotIds: data.slotIds?.length
                ? data.slotIds.map((id: string) => new mongoose.Types.ObjectId(id))
                : [],

            date: new Date(data.date),
            startTime,
            endTime,
            type: data.type || BookingType.CASUAL,
            status: BookingStatus.PENDING_PAYMENT,
            totalAmount: finalAmount,
            discount: 0,
            finalAmount,
            payment: {
                method: PaymentMethod.QR_CODE,
                status: PaymentStatus.PENDING,
                expiresAt
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
        const booking = await Booking.findOne({ bookingCode, userId }).populate({ path: 'courtId', model: 'Venue', select: 'name' });
        if (!booking) throw new Error('Không tìm thấy đơn đặt sân');

        booking.status = BookingStatus.CONFIRMED;
        booking.payment.status = PaymentStatus.PAID;
        booking.payment.paidAt = new Date();
        booking.confirmedAt = new Date();

        await booking.save();

        // Gửi thông báo
        const courtName = (booking.courtId as any)?.name || 'Sân cầu lông';
        await notificationService.createNotification({
            userId,
            title: '🎉 Thanh toán thành công!',
            message: `Bạn đã thanh toán thành công đơn đặt ${courtName} lúc ${booking.startTime} ngày ${booking.date.toLocaleDateString('vi-VN')}.`,
            type: 'booking'
        }).catch(err => console.error("Lỗi tạo thông báo:", err));

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

    async cleanupExpiredBookings(): Promise<number> {
        // Implement logic to clean up expired bookings here.
        // For example:
        // const now = new Date();
        // const result = await Booking.updateMany(
        //    { status: BookingStatus.PENDING, expiresAt: { $lt: now } },
        //    { status: BookingStatus.CANCELLED }
        // );
        // return result.modifiedCount;
        return 0; // Tạm thời trả về 0 để hết lỗi
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