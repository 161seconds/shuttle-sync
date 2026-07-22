import { Router } from 'express';
import { courtController } from '../controllers';
import { authenticate, optionalAuth, requireCourtOwner, validate, cacheMiddleware } from '../middlewares';
import { createCourtSchema, searchCourtSchema } from '../validators';

const router = Router();

// Public routes
router.get('/search', validate(searchCourtSchema), cacheMiddleware(30), courtController.searchCourts);
router.get('/districts', cacheMiddleware(3600), courtController.getDistricts); // Các quận huyện hiếm khi đổi
router.get('/active', cacheMiddleware(30), courtController.getActiveCourts);
router.get('/:idOrSlug', courtController.getCourt);
router.get('/:courtId/slots/:subCourtId', courtController.getAvailableSlots);

// Protected routes
router.post('/', authenticate, requireCourtOwner, validate(createCourtSchema), courtController.createCourt);
router.get('/owner/my-courts', authenticate, requireCourtOwner, courtController.getMyCourts);
router.put('/:courtId', authenticate, requireCourtOwner, courtController.updateCourt);

export default router;