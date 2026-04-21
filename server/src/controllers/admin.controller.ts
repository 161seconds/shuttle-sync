import { Request, Response, NextFunction } from 'express';
import { CourtStatus } from '@shuttle-sync/shared';
import { adminService, courtService } from '../services';
import { AuthRequest } from '../middlewares';
import { sendSuccess, sendPaginated } from '../utils/response';

class AdminController {
    async getDashboard(_req: AuthRequest, res: Response, next: NextFunction) {
        try {
            const stats = await adminService.getDashboardStats();
            sendSuccess(res, stats);
        } catch (error) {
            next(error);
        }
    }

    async getUsers(req: AuthRequest, res: Response, next: NextFunction) {
        try {
            const { users, pagination } = await adminService.getUsers({
                role: req.query.role as any,
                status: req.query.status as any,
                search: req.query.search as string,
                page: req.query.page ? Number(req.query.page) : undefined,
                limit: req.query.limit ? Number(req.query.limit) : undefined,
            });
            sendPaginated(res, users, pagination);
        } catch (error) {
            next(error);
        }
    }

    async banUser(req: AuthRequest, res: Response, next: NextFunction) {
        try {
            const user = await adminService.banUser(
                req.params.userId as string,
                req.userId!,
                req.body.reason,
                req.body.expiresAt
            );
            sendSuccess(res, user, 'Cấm người dùng thành công');
        } catch (error) {
            next(error);
        }
    }

    async unbanUser(req: AuthRequest, res: Response, next: NextFunction) {
        try {
            const user = await adminService.unbanUser(req.params.userId as string, req.userId!);
            sendSuccess(res, user, 'Mở cấm người dùng thành công');
        } catch (error) {
            next(error);
        }
    }

    async getOwnerApplications(req: AuthRequest, res: Response, next: NextFunction) {
        try {
            const { applications, pagination } = await adminService.getOwnerApplications({
                status: req.query.status as any,
                page: req.query.page ? Number(req.query.page) : undefined,
                limit: req.query.limit ? Number(req.query.limit) : undefined,
            });
            sendPaginated(res, applications, pagination);
        } catch (error) {
            next(error);
        }
    }

    async reviewApplication(req: AuthRequest, res: Response, next: NextFunction) {
        try {
            const application = await adminService.reviewOwnerApplication(
                req.params.applicationId as string,
                req.userId!,
                req.body.status,
                req.body.reviewNotes
            );
            sendSuccess(res, application, 'Xử lý đơn đăng ký thành công');
        } catch (error) {
            next(error);
        }
    }

    async getReports(req: AuthRequest, res: Response, next: NextFunction) {
        try {
            const { reports, pagination } = await adminService.getReports({
                status: req.query.status as any,
                page: req.query.page ? Number(req.query.page) : undefined,
                limit: req.query.limit ? Number(req.query.limit) : undefined,
            });
            sendPaginated(res, reports, pagination);
        } catch (error) {
            next(error);
        }
    }

    async resolveReport(req: AuthRequest, res: Response, next: NextFunction) {
        try {
            const report = await adminService.resolveReport(
                req.params.reportId as string,
                req.userId!,
                req.body.resolution,
                req.body.status
            );
            sendSuccess(res, report, 'Xử lý báo cáo thành công');
        } catch (error) {
            next(error);
        }
    }

    async getAllCourts(req: AuthRequest, res: Response, next: NextFunction) {
        try {
            const { courts, pagination } = await adminService.getAllCourts({
                status: req.query.status as any,
                page: req.query.page ? Number(req.query.page) : undefined,
                limit: req.query.limit ? Number(req.query.limit) : undefined,
            });
            sendPaginated(res, courts, pagination);
        } catch (error) {
            next(error);
        }
    }

    async updateCourtStatus(req: AuthRequest, res: Response, next: NextFunction) {
        try {
            const court = await courtService.updateCourtStatus(
                req.params.courtId as string,
                req.body.status as CourtStatus,
                req.userId!
            );
            sendSuccess(res, court, 'Cập nhật trạng thái sân thành công');
        } catch (error) {
            next(error);
        }
    }
}

export const adminController = new AdminController();