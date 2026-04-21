import { Request, Response, NextFunction } from 'express';
import { bookingService } from '../services';
import { AuthRequest } from '../middlewares';
import { sendSuccess, sendCreated, sendPaginated } from '../utils/response';

class BookingController {
    async createBooking(req: AuthRequest, res: Response, next: NextFunction) {
        try {
            const booking = await bookingService.createBooking({
                userId: req.userId,
                ...req.body,
            });
            sendCreated(res, booking, 'Đặt sân thành công');
        } catch (error) {
            next(error);
        }
    }

    async confirmPayment(req: AuthRequest, res: Response, next: NextFunction) {
        try {
            const booking = await bookingService.confirmPayment(
                req.params.bookingId as string,
                req.body.transactionId,
                req.userId
            );
            sendSuccess(res, booking, 'Xác nhận thanh toán thành công');
        } catch (error) {
            next(error);
        }
    }

    async cancelBooking(req: AuthRequest, res: Response, next: NextFunction) {
        try {
            const booking = await bookingService.cancelBooking(
                req.params.bookingId as string,
                req.body.reason,
                req.userId
            );
            sendSuccess(res, booking, 'Hủy đặt sân thành công');
        } catch (error) {
            next(error);
        }
    }

    async getMyBookings(req: AuthRequest, res: Response, next: NextFunction) {
        try {
            const { bookings, pagination } = await bookingService.getUserBookings(
                req.userId!,
                {
                    status: req.query.status as any,
                    page: req.query.page ? Number(req.query.page) : undefined,
                    limit: req.query.limit ? Number(req.query.limit) : undefined,
                }
            );
            sendPaginated(res, bookings, pagination);
        } catch (error) {
            next(error);
        }
    }

    async getBookingById(req: AuthRequest, res: Response, next: NextFunction) {
        try {
            const booking = await bookingService.getBookingById(
                req.params.bookingId as string,
                req.userId
            );
            sendSuccess(res, booking);
        } catch (error) {
            next(error);
        }
    }

    async getBookingByCode(req: Request, res: Response, next: NextFunction) {
        try {
            const booking = await bookingService.getBookingByCode(req.params.code as string);
            sendSuccess(res, booking);
        } catch (error) {
            next(error);
        }
    }

    async getCourtBookings(req: AuthRequest, res: Response, next: NextFunction) {
        try {
            const { bookings, pagination } = await bookingService.getCourtBookings(
                req.params.courtId as string,
                {
                    date: req.query.date as string,
                    status: req.query.status as any,
                    page: req.query.page ? Number(req.query.page) : undefined,
                    limit: req.query.limit ? Number(req.query.limit) : undefined,
                }
            );
            sendPaginated(res, bookings, pagination);
        } catch (error) {
            next(error);
        }
    }
}

export const bookingController = new BookingController();