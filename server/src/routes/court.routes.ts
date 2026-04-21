import { Router } from 'express';
import { courtController } from '../controllers';
import { authenticate, optionalAuth, requireCourtOwner, validate } from '../middlewares';
import { createCourtSchema, searchCourtSchema } from '../validators';

const router = Router();

// Public routes
router.get('/search', validate(searchCourtSchema), courtController.searchCourts);
router.get('/districts', courtController.getDistricts);
router.get('/active', courtController.getActiveCourts);
router.get('/:idOrSlug', courtController.getCourt);
router.get('/:courtId/slots/:subCourtId', courtController.getAvailableSlots);

// Protected routes
router.post('/', authenticate, requireCourtOwner, validate(createCourtSchema), courtController.createCourt);
router.get('/owner/my-courts', authenticate, requireCourtOwner, courtController.getMyCourts);
router.put('/:courtId', authenticate, requireCourtOwner, courtController.updateCourt);

export default router;