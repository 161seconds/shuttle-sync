import { Router } from 'express';
import { adminController } from '../controllers';
import { authenticate, requireAdmin, validate } from '../middlewares';
import { banUserSchema, reviewApplicationSchema } from '../validators';

const router = Router();

// All admin routes require authentication + admin role
router.use(authenticate, requireAdmin);

// Dashboard
router.get('/dashboard', adminController.getDashboard);

// User management
router.get('/users', adminController.getUsers);
router.post('/users/:userId/ban', validate(banUserSchema), adminController.banUser);
router.post('/users/:userId/unban', adminController.unbanUser);

// Court management
router.get('/courts', adminController.getAllCourts);
router.put('/courts/:courtId/status', adminController.updateCourtStatus);

// Owner applications
router.get('/applications', adminController.getOwnerApplications);
router.put('/applications/:applicationId', validate(reviewApplicationSchema), adminController.reviewApplication);

// Reports
router.get('/reports', adminController.getReports);
router.put('/reports/:reportId', adminController.resolveReport);

export default router;