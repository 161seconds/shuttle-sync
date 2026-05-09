import { Router } from 'express';
import { tournamentController } from '../controllers/tournament.controller';

const router = Router();

router.post('/quick', tournamentController.createQuickTournament);
router.get('/:id', tournamentController.getTournament);
router.post('/:id/start', tournamentController.startTournament);

export default router;