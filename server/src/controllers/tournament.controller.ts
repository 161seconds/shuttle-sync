import { Response, NextFunction } from 'express';
import { AuthRequest } from '../middlewares/auth';
import { tournamentService } from '../services/tournament.service';

class TournamentController {
    async getMyTournaments(req: AuthRequest, res: Response, next: NextFunction) {
        try {
            const userId = req.userId!;
            const tours = await tournamentService.getMyTournaments(userId);
            res.status(200).json({ success: true, data: tours });
        } catch (error) {
            next(error);
        }
    }

    async getTournament(req: AuthRequest, res: Response, next: NextFunction) {
        try {
            const tour = await tournamentService.getTournament(req.params.id);
            res.status(200).json({ success: true, data: tour });
        } catch (error) {
            next(error);
        }
    }

    // API Tạo nhanh
    async createQuickTournament(req: AuthRequest, res: Response, next: NextFunction) {
        try {
            const { title } = req.body;
            const newTour = await tournamentService.createQuickTournament(title, req.userId);
            res.status(201).json({ success: true, message: 'Tạo và chia nhánh thành công!', data: newTour });
        } catch (error) {
            next(error);
        }
    }

    async startTournament(req: AuthRequest, res: Response, next: NextFunction) {
        try {
            const { id } = req.params;
            const updatedTour = await tournamentService.generateBracket(id);
            res.status(200).json({ success: true, message: 'Bốc thăm chia nhánh thành công!', data: updatedTour });
        } catch (error) {
            next(error);
        }
    }

    async updateMatch(req: AuthRequest, res: Response, next: NextFunction) {
        try {
            const { id, matchId } = req.params;
            const updatedTour = await tournamentService.updateMatch(id, matchId, req.body);
            res.status(200).json({ success: true, message: 'Cập nhật trận đấu thành công!', data: updatedTour });
        } catch (error) {
            next(error);
        }
    }
}

export const tournamentController = new TournamentController();