import { Request, Response, NextFunction } from 'express';
import { ownerService } from '../services/owner.service';
import { AuthRequest } from '../middlewares';
import { sendSuccess, sendCreated } from '../utils/response';

class OwnerController {
    async getVenue(req: AuthRequest, res: Response, next: NextFunction) {
        try {
            const venue = await ownerService.getVenueByOwnerId(req.userId!);
            sendSuccess(res, venue);
        } catch (error) {
            next(error);
        }
    }

    async createVenue(req: AuthRequest, res: Response, next: NextFunction) {
        try {
            const venue = await ownerService.createVenue(req.userId!, req.body);
            sendSuccess(res, venue, 'Tạo cơ sở thành công');
        } catch (error) {
            next(error);
        }
    }

    async updateVenue(req: AuthRequest, res: Response, next: NextFunction) {
        try {
            const venue = await ownerService.updateVenue(req.userId!, req.body);
            sendSuccess(res, venue, 'Cập nhật cơ sở thành công');
        } catch (error) {
            next(error);
        }
    }

    async getDashboardStats(req: AuthRequest, res: Response, next: NextFunction) {
        try {
            const stats = await ownerService.getDashboardStats(req.userId!);
            sendSuccess(res, stats);
        } catch (error) {
            next(error);
        }
    }

    async getCourts(req: AuthRequest, res: Response, next: NextFunction) {
        try {
            const courts = await ownerService.getCourts(req.userId!);
            sendSuccess(res, courts);
        } catch (error) {
            next(error);
        }
    }

    async addCourt(req: AuthRequest, res: Response, next: NextFunction) {
        try {
            const court = await ownerService.addCourt(req.userId!, req.body);
            sendSuccess(res, court, 'Thêm sân thành công');
        } catch (error) {
            next(error);
        }
    }
    async updateCourt(req: AuthRequest, res: Response, next: NextFunction) {
        try {
            const court = await ownerService.updateCourt(req.userId!, req.params.courtId, req.body);
            sendSuccess(res, court, 'Cập nhật sân thành công');
        } catch (error) {
            next(error);
        }
    }

    async getBookings(req: AuthRequest, res: Response, next: NextFunction) {
        try {
            const bookings = await ownerService.getBookings(req.userId!);
            sendSuccess(res, bookings);
        } catch (error) {
            next(error);
        }
    }

    async getSchedule(req: AuthRequest, res: Response, next: NextFunction) {
        try {
            const date = req.query.date as string || new Date().toISOString().split('T')[0];
            const schedule = await ownerService.getSchedule(req.userId!, date);
            sendSuccess(res, schedule);
        } catch (error) {
            next(error);
        }
    }

    async blockSlot(req: AuthRequest, res: Response, next: NextFunction) {
        try {
            const booking = await ownerService.blockSlot(req.userId!, req.body);
            sendCreated(res, booking, 'Đã khóa lịch thành công');
        } catch (error) {
            next(error);
        }
    }

    async updateBooking(req: AuthRequest, res: Response, next: NextFunction) {
        try {
            const { id } = req.params;
            const updated = await ownerService.updateBooking(req.userId!, id, req.body);
            sendSuccess(res, updated, 'Cập nhật đơn đặt sân thành công');
        } catch (error) {
            next(error);
        }
    }

    async sendBookingNotification(req: AuthRequest, res: Response, next: NextFunction) {
        try {
            const { id } = req.params;
            const { message } = req.body;
            await ownerService.sendBookingNotification(req.userId!, id, message);
            sendSuccess(res, null, 'Gửi thông báo thành công');
        } catch (error) {
            next(error);
        }
    }

    // EXPENSES
    async getExpenses(req: AuthRequest, res: Response, next: NextFunction) {
        try {
            const expenses = await ownerService.getExpenses(req.userId!, req.query);
            sendSuccess(res, expenses);
        } catch (error) {
            next(error);
        }
    }

    async createExpense(req: AuthRequest, res: Response, next: NextFunction) {
        try {
            const expense = await ownerService.createExpense(req.userId!, req.body);
            sendCreated(res, expense, 'Thêm chi phí thành công');
        } catch (error) {
            next(error);
        }
    }

    async updateExpense(req: AuthRequest, res: Response, next: NextFunction) {
        try {
            const { id } = req.params;
            const expense = await ownerService.updateExpense(req.userId!, id, req.body);
            sendSuccess(res, expense, 'Cập nhật chi phí thành công');
        } catch (error) {
            next(error);
        }
    }

    async deleteExpense(req: AuthRequest, res: Response, next: NextFunction) {
        try {
            const { id } = req.params;
            await ownerService.deleteExpense(req.userId!, id);
            sendSuccess(res, null, 'Xóa chi phí thành công');
        } catch (error) {
            next(error);
        }
    }
}

export const ownerController = new OwnerController();
