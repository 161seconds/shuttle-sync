import { Request, Response, NextFunction } from 'express';
import {
    userService, reviewService, notificationService,
    ownerApplicationService, reportService, eventService,
} from '../services';
import { AuthRequest } from '../middlewares';
import { sendSuccess, sendCreated, sendPaginated } from '../utils/response';

// ========================
// USER CONTROLLER
// ========================
class UserController {
    async getProfile(req: AuthRequest, res: Response, next: NextFunction) {
        try {
            const user = await userService.getProfile(req.userId!);
            sendSuccess(res, user);
        } catch (error) {
            next(error);
        }
    }

    async updateProfile(req: AuthRequest, res: Response, next: NextFunction) {
        try {
            const user = await userService.updateProfile(req.userId!, req.body);
            sendSuccess(res, user, 'Cập nhật hồ sơ thành công');
        } catch (error) {
            next(error);
        }
    }

    async toggleFavorite(req: AuthRequest, res: Response, next: NextFunction) {
        try {
            const added = await userService.toggleFavoriteCourt(req.userId!, req.params.courtId as string);
            sendSuccess(res, { isFavorite: added }, added ? 'Đã thêm vào yêu thích' : 'Đã bỏ yêu thích');
        } catch (error) {
            next(error);
        }
    }

    async getFavorites(req: AuthRequest, res: Response, next: NextFunction) {
        try {
            const courts = await userService.getFavoriteCourts(req.userId!);
            sendSuccess(res, courts);
        } catch (error) {
            next(error);
        }
    }

    async getPublicProfile(req: Request, res: Response, next: NextFunction) {
        try {
            const profile = await userService.getPublicProfile(req.params.userId as string);
            sendSuccess(res, profile);
        } catch (error) {
            next(error);
        }
    }
}

export const userController = new UserController();

// ========================
// REVIEW CONTROLLER
// ========================
class ReviewController {
    async createReview(req: AuthRequest, res: Response, next: NextFunction) {
        try {
            const review = await reviewService.createReview(req.userId!, req.body);
            sendCreated(res, review, 'Đánh giá thành công');
        } catch (error) {
            next(error);
        }
    }

    async getCourtReviews(req: Request, res: Response, next: NextFunction) {
        try {
            const { reviews, pagination } = await reviewService.getCourtReviews(
                req.params.courtId as string,
                {
                    page: req.query.page ? Number(req.query.page) : undefined,
                    limit: req.query.limit ? Number(req.query.limit) : undefined,
                }
            );
            sendPaginated(res, reviews, pagination);
        } catch (error) {
            next(error);
        }
    }

    async replyToReview(req: AuthRequest, res: Response, next: NextFunction) {
        try {
            const review = await reviewService.replyToReview(
                req.params.reviewId as string,
                req.userId!,
                req.body.comment
            );
            sendSuccess(res, review, 'Phản hồi đánh giá thành công');
        } catch (error) {
            next(error);
        }
    }
}

export const reviewController = new ReviewController();

// ========================
// NOTIFICATION CONTROLLER
// ========================
class NotificationController {
    async getNotifications(req: AuthRequest, res: Response, next: NextFunction) {
        try {
            const result = await notificationService.getUserNotifications(req.userId!, {
                unreadOnly: req.query.unreadOnly === 'true',
                page: req.query.page ? Number(req.query.page) : undefined,
                limit: req.query.limit ? Number(req.query.limit) : undefined,
            });
            sendPaginated(res, {
                notifications: result.notifications,
                unreadCount: result.unreadCount,
            }, result.pagination);
        } catch (error) {
            next(error);
        }
    }

    async markAsRead(req: AuthRequest, res: Response, next: NextFunction) {
        try {
            await notificationService.markAsRead(req.params.notificationId as string, req.userId!);
            sendSuccess(res, null, 'Đã đánh dấu đã đọc');
        } catch (error) {
            next(error);
        }
    }

    async markAllAsRead(req: AuthRequest, res: Response, next: NextFunction) {
        try {
            await notificationService.markAllAsRead(req.userId!);
            sendSuccess(res, null, 'Đã đánh dấu tất cả đã đọc');
        } catch (error) {
            next(error);
        }
    }
}

export const notificationController = new NotificationController();

// ========================
// EVENT CONTROLLER
// ========================
class EventController {
    async createEvent(req: AuthRequest, res: Response, next: NextFunction) {
        try {
            const event = await eventService.createEvent(req.userId!, req.body);
            sendCreated(res, event, 'Tạo sự kiện thành công');
        } catch (error) {
            next(error);
        }
    }

    async getActiveEvents(req: Request, res: Response, next: NextFunction) {
        try {
            const { events, pagination } = await eventService.getActiveEvents({
                type: req.query.type as any,
                page: req.query.page ? Number(req.query.page) : undefined,
                limit: req.query.limit ? Number(req.query.limit) : undefined,
            });
            sendPaginated(res, events, pagination);
        } catch (error) {
            next(error);
        }
    }

    async getEventById(req: Request, res: Response, next: NextFunction) {
        try {
            const event = await eventService.getEventById(req.params.id as string);
            sendSuccess(res, event);
        } catch (error) {
            next(error);
        }
    }

    async validateVoucher(req: Request, res: Response, next: NextFunction) {
        try {
            const result = await eventService.validateVoucher(
                req.body.code,
                req.body.bookingAmount,
                req.body.courtId
            );
            sendSuccess(res, result, 'Mã giảm giá hợp lệ');
        } catch (error) {
            next(error);
        }
    }
}

export const eventController = new EventController();

// ========================
// OWNER APPLICATION CONTROLLER
// ========================
class OwnerApplicationController {
    async createApplication(req: AuthRequest, res: Response, next: NextFunction) {
        try {
            const application = await ownerApplicationService.createApplication(req.userId!, req.body);
            sendCreated(res, application, 'Gửi đơn đăng ký chủ sân thành công');
        } catch (error) {
            next(error);
        }
    }

    async getMyApplications(req: AuthRequest, res: Response, next: NextFunction) {
        try {
            const applications = await ownerApplicationService.getMyApplications(req.userId!);
            sendSuccess(res, applications);
        } catch (error) {
            next(error);
        }
    }
}

export const ownerApplicationController = new OwnerApplicationController();

// ========================
// REPORT CONTROLLER
// ========================
class ReportController {
    async createReport(req: AuthRequest, res: Response, next: NextFunction) {
        try {
            const report = await reportService.createReport(req.userId!, req.body);
            sendCreated(res, report, 'Gửi báo cáo thành công');
        } catch (error) {
            next(error);
        }
    }
}

export const reportController = new ReportController();