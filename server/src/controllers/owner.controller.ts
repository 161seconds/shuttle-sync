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
}

export const ownerController = new OwnerController();
