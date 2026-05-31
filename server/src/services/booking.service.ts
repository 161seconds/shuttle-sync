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
        const sessionAmount = durationHours * 150000;

        let generatedDates: Date[] = [];
        let totalSessions = 1;

        if (data.type === BookingType.FIXED) {
            const months = parseInt(data.months) || 1;
            totalSessions = months * 4; // 4 weeks per month
            let currentDate = new Date(data.date);
            for (let i = 0; i < totalSessions; i++) {
                generatedDates.push(new Date(currentDate));
                currentDate.setDate(currentDate.getDate() + 7);
            }
        } else {
            generatedDates = [new Date(data.date)];
        }

        const timeToMins = (t: string) => {
            const [h, m] = t.split(':').map(Number);
            return h * 60 + m;
        };
        const requestedStartMins = timeToMins(startTime);
        const requestedEndMins = timeToMins(endTime);

        const dateQueries = generatedDates.map(d => {
            const s = new Date(d);
            s.setHours(0,0,0,0);
            const e = new Date(d);
            e.setHours(23,59,59,999);
            return { date: { $gte: s, $lte: e } };
        });

        const conflictingBookings = await Booking.find({
            courtId: data.courtId,
            subCourtId: data.subCourtId,
            $or: dateQueries,
            status: { $ne: BookingStatus.CANCELLED }
        });

        for (const b of conflictingBookings) {
            const bStartMins = timeToMins(b.startTime);
            const bEndMins = timeToMins(b.endTime);
            if (requestedStartMins < bEndMins && requestedEndMins > bStartMins) {
                throw new Error(`Ngày ${b.date.toLocaleDateString('vi-VN')} đã bị đặt từ ${b.startTime} đến ${b.endTime}. Không thể đặt lịch cố định!`);
            }
        }

        const expiresAt = new Date();
        expiresAt.setMinutes(expiresAt.getMinutes() + 15);

        const groupId = totalSessions > 1 ? 'GRP' + Math.floor(100000 + Math.random() * 900000) : undefined;
        const bookingsToInsert = [];

        for (let i = 0; i < totalSessions; i++) {
            const bookingCode = 'BK' + Math.floor(1000000 + Math.random() * 9000000);
            bookingsToInsert.push({
                bookingCode,
                groupId,
                userId,
                courtId: data.courtId,
                subCourtId: data.subCourtId,
                slotIds: data.slotIds?.length ? data.slotIds.map((id: string) => new mongoose.Types.ObjectId(id)) : [],
                date: generatedDates[i],
                startTime,
                endTime,
                type: data.type || BookingType.CASUAL,
                status: BookingStatus.PENDING_PAYMENT,
                totalAmount: sessionAmount,
                discount: 0,
                finalAmount: sessionAmount,
                payment: {
                    method: PaymentMethod.QR_CODE,
                    status: PaymentStatus.PENDING,
                    expiresAt
                }
            });
        }

        const createdBookings = await Booking.insertMany(bookingsToInsert);
        const paymentCode = groupId || createdBookings[0].bookingCode;

        setTimeout(async () => {
            try {
                await this.confirmPayment(paymentCode, userId);
                console.log(`[Auto-Confirm] Đã tự động xác nhận thanh toán đơn ${paymentCode} sau 5 giây`);
            } catch (error) {
                console.error(`[Auto-Confirm] Lỗi khi xác nhận đơn ${paymentCode}:`, error);
            }
        }, 5000);

        return {
            bookingCode: paymentCode,
            finalAmount: sessionAmount * totalSessions,
            bookings: createdBookings
        };
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
        if (bookingCode.startsWith('GRP')) {
            const bookings = await Booking.find({ groupId: bookingCode, userId }).populate({ path: 'courtId', model: 'Venue', select: 'name' });
            if (!bookings.length) throw new Error('Không tìm thấy nhóm đơn đặt sân');

            await Booking.updateMany(
                { groupId: bookingCode, userId },
                {
                    $set: {
                        status: BookingStatus.CONFIRMED,
                        'payment.status': PaymentStatus.PAID,
                        'payment.paidAt': new Date(),
                        confirmedAt: new Date()
                    }
                }
            );

            const courtName = (bookings[0].courtId as any)?.name || 'Sân cầu lông';
            await notificationService.createNotification({
                userId,
                title: '🎉 Thanh toán gói cố định thành công!',
                message: `Bạn đã thanh toán thành công ${bookings.length} buổi tại ${courtName} từ ngày ${bookings[0].date.toLocaleDateString('vi-VN')}.`,
                type: 'booking'
            }).catch(err => console.error("Lỗi tạo thông báo:", err));

            return bookings[0];
        } else {
            const booking = await Booking.findOne({ bookingCode, userId }).populate({ path: 'courtId', model: 'Venue', select: 'name' });
            if (!booking) throw new Error('Không tìm thấy đơn đặt sân');

            booking.status = BookingStatus.CONFIRMED;
            booking.payment.status = PaymentStatus.PAID;
            booking.payment.paidAt = new Date();
            booking.confirmedAt = new Date();

            await booking.save();

            const courtName = (booking.courtId as any)?.name || 'Sân cầu lông';
            await notificationService.createNotification({
                userId,
                title: '🎉 Thanh toán thành công!',
                message: `Bạn đã thanh toán thành công đơn đặt ${courtName} lúc ${booking.startTime} ngày ${booking.date.toLocaleDateString('vi-VN')}.`,
                type: 'booking'
            }).catch(err => console.error("Lỗi tạo thông báo:", err));

            return booking;
        }
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
        const booking = await Booking.findById(id);
        if (!booking) {
            throw new Error('Không tìm thấy đơn đặt sân');
        }
        
        booking.status = BookingStatus.CANCELLED;
        await booking.save();
        
        return booking;
    }
}

export const bookingService = new BookingService();