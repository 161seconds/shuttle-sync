import { Request, Response, NextFunction } from 'express';
import { groupPlayService } from '../services';
import { AuthRequest } from '../middlewares';
import { sendSuccess, sendCreated, sendPaginated } from '../utils/response';

class GroupPlayController {
    async createGroupPlay(req: AuthRequest, res: Response, next: NextFunction) {
        try {
            const groupPlay = await groupPlayService.createGroupPlay(req.userId!, req.body);
            sendCreated(res, groupPlay, 'Tạo nhóm chơi thành công');
        } catch (error) {
            next(error);
        }
    }

    async joinGroupPlay(req: AuthRequest, res: Response, next: NextFunction) {
        try {
            const groupPlay = await groupPlayService.joinGroupPlay(
                req.params.groupPlayId as string,
                req.userId!
            );
            sendSuccess(res, groupPlay, 'Tham gia nhóm chơi thành công');
        } catch (error) {
            next(error);
        }
    }

    async leaveGroupPlay(req: AuthRequest, res: Response, next: NextFunction) {
        try {
            const groupPlay = await groupPlayService.leaveGroupPlay(
                req.params.groupPlayId as string,
                req.userId!
            );
            sendSuccess(res, groupPlay, 'Rời nhóm chơi thành công');
        } catch (error) {
            next(error);
        }
    }

    async cancelGroupPlay(req: AuthRequest, res: Response, next: NextFunction) {
        try {
            const groupPlay = await groupPlayService.cancelGroupPlay(
                req.params.groupPlayId as string,
                req.userId!
            );
            sendSuccess(res, groupPlay, 'Hủy nhóm chơi thành công');
        } catch (error) {
            next(error);
        }
    }

    async searchGroupPlays(req: Request, res: Response, next: NextFunction) {
        try {
            const { groupPlays, pagination } = await groupPlayService.searchGroupPlays({
                sportType: req.query.sportType as any,
                skillLevel: req.query.skillLevel as any,
                date: req.query.date as string,
                district: req.query.district as string,
                status: req.query.status as any,
                page: req.query.page ? Number(req.query.page) : undefined,
                limit: req.query.limit ? Number(req.query.limit) : undefined,
            });
            sendPaginated(res, groupPlays, pagination);
        } catch (error) {
            next(error);
        }
    }

    async getGroupPlayById(req: Request, res: Response, next: NextFunction) {
        try {
            const groupPlay = await groupPlayService.getGroupPlayById(req.params.id as string);
            sendSuccess(res, groupPlay);
        } catch (error) {
            next(error);
        }
    }

    async getMyGroupPlays(req: AuthRequest, res: Response, next: NextFunction) {
        try {
            const { groupPlays, pagination } = await groupPlayService.getUserGroupPlays(
                req.userId!,
                {
                    page: req.query.page ? Number(req.query.page) : undefined,
                    limit: req.query.limit ? Number(req.query.limit) : undefined,
                }
            );
            sendPaginated(res, groupPlays, pagination);
        } catch (error) {
            next(error);
        }
    }
}

export const groupPlayController = new GroupPlayController();