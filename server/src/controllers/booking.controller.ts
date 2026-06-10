import { Response, NextFunction } from 'express';
import { AuthRequest } from '../middlewares/auth';
import { bookingService } from '../services/booking.service';

class BookingController {
    // 1. Tạo đơn đặt sân
    async createBooking(req: AuthRequest, res: Response, next: NextFunction) {
        try {
            const userId = req.userId!;
            const booking = await bookingService.createBooking(userId, req.body);
            res.status(201).json({
                success: true,
                data: booking,
                message: 'Tạo đơn đặt sân thành công'
            });
        } catch (error) {
            next(error);
        }
    }

    // 2. Lấy danh sách đặt sân của User
    async getMyBookings(req: AuthRequest, res: Response, next: NextFunction) {
        try {
            const userId = req.userId!;
            const status = req.query.status as string;
            const bookings = await bookingService.getMyBookings(userId, status);
            res.status(200).json({ success: true, data: bookings, message: 'Lấy lịch sử thành công' });
        } catch (error) {
            next(error);
        }
    }

    // 3. Xác nhận thanh toán
    async confirmPayment(req: AuthRequest, res: Response, next: NextFunction) {
        try {
            const userId = req.userId!;
            const bookingCode = req.params.bookingId;

            const booking = await bookingService.confirmPayment(bookingCode, userId);
            res.status(200).json({ success: true, data: booking, message: 'Thanh toán thành công' });
        } catch (error) {
            next(error);
        }
    }

    // 4. Lấy danh sách giờ đã đặt của một Sân (Dùng để Frontend làm mờ nút)
    async getCourtBookings(req: AuthRequest, res: Response, next: NextFunction) {
        try {
            const { courtId } = req.params;
            const { date } = req.query; 

            const bookings = await bookingService.getCourtBookings(courtId, date as string);
            res.status(200).json({ success: true, data: bookings, message: 'Lấy danh sách giờ đã đặt thành công' });
        } catch (error) {
            next(error);
        }
    }

    async getBookingByCode(req: AuthRequest, res: Response, next: NextFunction) {
        res.status(200).json({ success: true, message: 'Chưa có logic' });
    }

    async getBookingById(req: AuthRequest, res: Response, next: NextFunction) {
        res.status(200).json({ success: true, message: 'Chưa có logic' });
    }

    async cancelBooking(req: AuthRequest, res: Response, next: NextFunction) {
        res.status(200).json({ success: true, message: 'Chưa có logic' });
    }
}

export const bookingController = new BookingController();