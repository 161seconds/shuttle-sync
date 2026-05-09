import { Response, NextFunction } from 'express';
import { tournamentService } from '../services/tournament.service';

class TournamentController {

    async getTournament(req: any, res: Response, next: NextFunction) {
        try {
            const tour = await tournamentService.getTournament(req.params.id);
            res.status(200).json({ success: true, data: tour });
        } catch (error: any) {
            res.status(404).json({ success: false, message: error.message });
        }
    }

    // API Tạo nhanh
    async createQuickTournament(req: any, res: Response, next: NextFunction) {
        try {
            const { title } = req.body;
            const newTour = await tournamentService.createQuickTournament(title);
            res.status(201).json({ success: true, message: 'Tạo và chia nhánh thành công!', data: newTour });
        } catch (error: any) {
            console.error("Lỗi tạo giải nhanh:", error);
            res.status(500).json({ success: false, message: error.message });
        }
    }

    async startTournament(req: any, res: Response, next: NextFunction) {
        try {
            const { id } = req.params;
            const updatedTour = await tournamentService.generateBracket(id);
            res.status(200).json({ success: true, message: 'Bốc thăm chia nhánh thành công!', data: updatedTour });
        } catch (error: any) {
            console.error("Lỗi bắt đầu giải đấu:", error);
            res.status(400).json({ success: false, message: error.message });
        }
    }
}

export const tournamentController = new TournamentController();