import { Request, Response, NextFunction } from 'express';
import { groupPlayService } from '../services';
import { AuthRequest } from '../middlewares';
import { sendSuccess, sendCreated, sendPaginated } from '../utils/response';
import { GroupPlay, User } from '../models';

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

    async addMatchRecord(req: Request, res: Response, next: NextFunction) {
        try {
            const { groupId } = req.params;
            const { teamA, teamB, scoreA, scoreB, betAmount } = req.body;

            // 1. Lưu lịch sử trận đấu vào Group
            const group = await GroupPlay.findById(groupId);
            if (!group) return res.status(404).json({ message: 'Không tìm thấy nhóm!' });

            group.matchRecords.push({
                teamA, teamB, scoreA, scoreB, betAmount, recordedAt: new Date()
            });
            await group.save();

            // 2. Lấy thông tin Users để tính Elo
            const usersA = await User.find({ _id: { $in: teamA } });
            const usersB = await User.find({ _id: { $in: teamB } });

            if (usersA.length === 0 || usersB.length === 0) {
                return res.json({ message: 'Lưu trận thành công (Không tính Elo vì khách vãng lai)' });
            }

            // Tính trung bình Elo của mỗi đội
            const avgEloA = usersA.reduce((sum, u) => sum + u.stats.eloScore, 0) / usersA.length;
            const avgEloB = usersB.reduce((sum, u) => sum + u.stats.eloScore, 0) / usersB.length;

            // 3. THUẬT TOÁN ELO CHUẨN (K-factor = 32)
            const K = 32;
            const expectedA = 1 / (1 + Math.pow(10, (avgEloB - avgEloA) / 400));
            const expectedB = 1 / (1 + Math.pow(10, (avgEloA - avgEloB) / 400));

            const actualA = scoreA > scoreB ? 1 : 0;
            const actualB = scoreB > scoreA ? 1 : 0;

            const eloChangeA = Math.round(K * (actualA - expectedA));
            const eloChangeB = Math.round(K * (actualB - expectedB));

            // 4. Cập nhật điểm mới vào Database
            await User.updateMany({ _id: { $in: teamA } }, { $inc: { 'stats.eloScore': eloChangeA } });
            await User.updateMany({ _id: { $in: teamB } }, { $inc: { 'stats.eloScore': eloChangeB } });

            res.status(200).json({
                message: 'Đã lưu trận và cập nhật Phong Thần Bảng!',
                eloChanges: { teamA: eloChangeA, teamB: eloChangeB }
            });
        } catch (error) {
            next(error);
        }
    }
}

export const groupPlayController = new GroupPlayController();