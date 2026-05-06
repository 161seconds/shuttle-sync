import { Response, NextFunction } from 'express';
import { bookingService } from '../services/booking.service';

class BookingController {
    // 1. Tạo đơn đặt sân
    async createBooking(req: any, res: Response, next: NextFunction) {
        try {
            const userId = req.user?._id || req.user?.id || req.userId;
            const booking = await bookingService.createBooking(userId, req.body);
            res.status(201).json({ success: true, data: booking, message: 'Tạo đơn đặt sân thành công' });
        } catch (error) {
            console.log("❌ Lỗi Create Booking:", error);
            res.status(500).json({ success: false, message: 'Lỗi server khi đặt sân' });
        }
    }

    // 2. Lấy danh sách đặt sân của User
    async getMyBookings(req: any, res: Response, next: NextFunction) {
        try {
            const userId = req.user?._id || req.user?.id || req.userId;
            const status = req.query.status as string;
            const bookings = await bookingService.getMyBookings(userId, status);
            res.status(200).json({ success: true, data: bookings, message: 'Lấy lịch sử thành công' });
        } catch (error) {
            console.log("❌ Lỗi Get My Bookings:", error);
            res.status(500).json({ success: false, message: 'Lỗi server khi lấy lịch sử' });
        }
    }

    // 3. Xác nhận thanh toán
    async confirmPayment(req: any, res: Response, next: NextFunction) {
        try {
            const userId = req.user?._id || req.user?.id || req.userId;
            const bookingCode = req.params.bookingId;

            const booking = await bookingService.confirmPayment(bookingCode, userId);
            res.status(200).json({ success: true, data: booking, message: 'Thanh toán thành công' });
        } catch (error) {
            console.log("❌ Lỗi Confirm Payment:", error);
            res.status(500).json({ success: false, message: 'Lỗi server khi thanh toán' });
        }
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

export const bookingController = new BookingController();