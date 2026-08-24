import { Router } from 'express';
import { tournamentController } from '../controllers/tournament.controller';

import { authenticate } from '../middlewares';

const router = Router();

router.get('/my', authenticate, tournamentController.getMyTournaments);
router.post('/quick', authenticate, tournamentController.createQuickTournament);
router.get('/:id', tournamentController.getTournament);
router.post('/:id/start', tournamentController.startTournament);
router.put('/:id/matches/:matchId', authenticate, tournamentController.updateMatch);

export default router;