import { Request, Response, NextFunction } from 'express';
import { courtService } from '../services';
import { AuthRequest } from '../middlewares';
import { sendSuccess, sendCreated, sendPaginated } from '../utils/response';

class CourtController {
    async createCourt(req: AuthRequest, res: Response, next: NextFunction) {
        try {
            const court = await courtService.createCourt(req.userId!, req.body);
            sendCreated(res, court, 'Tạo sân thành công, đang chờ duyệt');
        } catch (error) {
            next(error);
        }
    }

    async getCourt(req: Request, res: Response, next: NextFunction) {
        try {
            const court = await courtService.getCourtByIdOrSlug(req.params.idOrSlug as string);
            sendSuccess(res, court);
        } catch (error) {
            next(error);
        }
    }

    async searchCourts(req: Request, res: Response, next: NextFunction) {
        try {
            const { courts, pagination } = await courtService.searchCourts({
                q: req.query.q as string,
                sportType: req.query.sportType as any,
                district: req.query.district as string,
                minPrice: req.query.minPrice ? Number(req.query.minPrice) : undefined,
                maxPrice: req.query.maxPrice ? Number(req.query.maxPrice) : undefined,
                date: req.query.date as string,
                isIndoor: req.query.isIndoor !== undefined ? req.query.isIndoor === 'true' : undefined,
                lat: req.query.lat ? Number(req.query.lat) : undefined,
                lng: req.query.lng ? Number(req.query.lng) : undefined,
                radius: req.query.radius ? Number(req.query.radius) : undefined,
                sortBy: req.query.sortBy as string,
                sortOrder: req.query.sortOrder as string,
                page: req.query.page ? Number(req.query.page) : undefined,
                limit: req.query.limit ? Number(req.query.limit) : undefined,
            });
            sendPaginated(res, courts, pagination);
        } catch (error) {
            next(error);
        }
    }

    async getAvailableSlots(req: Request, res: Response, next: NextFunction) {
        try {
            const { courtId, subCourtId } = req.params;
            const { date } = req.query;
            const slots = await courtService.getAvailableSlots(courtId as string, subCourtId as string, date as string);
            sendSuccess(res, slots);
        } catch (error) {
            next(error);
        }
    }

    async getMyCourts(req: AuthRequest, res: Response, next: NextFunction) {
        try {
            const courts = await courtService.getCourtsByOwner(req.userId!);
            sendSuccess(res, courts);
        } catch (error) {
            next(error);
        }
    }

    async updateCourt(req: AuthRequest, res: Response, next: NextFunction) {
        try {
            const isAdmin = req.userRole === 'admin';
            const court = await courtService.updateCourt(
                req.params.courtId as string,
                req.userId!,
                req.body,
                isAdmin
            );
            sendSuccess(res, court, 'Cập nhật sân thành công');
        } catch (error) {
            next(error);
        }
    }

    async getActiveCourts(req: Request, res: Response, next: NextFunction) {
        try {
            const { courts, pagination } = await courtService.getActiveCourts({
                sportType: req.query.sportType as any,
                district: req.query.district as string,
                page: req.query.page ? Number(req.query.page) : undefined,
                limit: req.query.limit ? Number(req.query.limit) : undefined,
            });
            sendPaginated(res, courts, pagination);
        } catch (error) {
            next(error);
        }
    }

    async getDistricts(_req: Request, res: Response, next: NextFunction) {
        try {
            const districts = await courtService.getDistricts();
            sendSuccess(res, districts);
        } catch (error) {
            next(error);
        }
    }
}

export const courtController = new CourtController();