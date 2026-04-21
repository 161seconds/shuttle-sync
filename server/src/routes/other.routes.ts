import { Router } from 'express';
import {
    userController, reviewController, notificationController,
    eventController, ownerApplicationController, reportController,
} from '../controllers';
import { authenticate, requireCourtOwner, validate } from '../middlewares';
import {
    updateProfileSchema, createReviewSchema, createReportSchema,
    createOwnerApplicationSchema,
} from '../validators';

// ========================
// USER ROUTES
// ========================
export const userRoutes = Router();

userRoutes.get('/profile', authenticate, userController.getProfile);
userRoutes.put('/profile', authenticate, validate(updateProfileSchema), userController.updateProfile);
userRoutes.post('/favorites/:courtId', authenticate, userController.toggleFavorite);
userRoutes.get('/favorites', authenticate, userController.getFavorites);
userRoutes.get('/public/:userId', userController.getPublicProfile);

// ========================
// REVIEW ROUTES
// ========================
export const reviewRoutes = Router();

reviewRoutes.post('/', authenticate, validate(createReviewSchema), reviewController.createReview);
reviewRoutes.get('/court/:courtId', reviewController.getCourtReviews);
reviewRoutes.post('/:reviewId/reply', authenticate, requireCourtOwner, reviewController.replyToReview);

// ========================
// NOTIFICATION ROUTES
// ========================
export const notificationRoutes = Router();

notificationRoutes.get('/', authenticate, notificationController.getNotifications);
notificationRoutes.put('/:notificationId/read', authenticate, notificationController.markAsRead);
notificationRoutes.put('/read-all', authenticate, notificationController.markAllAsRead);

// ========================
// EVENT ROUTES
// ========================
export const eventRoutes = Router();

eventRoutes.get('/', eventController.getActiveEvents);
eventRoutes.get('/:id', eventController.getEventById);
eventRoutes.post('/', authenticate, eventController.createEvent);
eventRoutes.post('/validate-voucher', eventController.validateVoucher);

// ========================
// OWNER APPLICATION ROUTES
// ========================
export const ownerApplicationRoutes = Router();

ownerApplicationRoutes.post('/', authenticate, validate(createOwnerApplicationSchema), ownerApplicationController.createApplication);
ownerApplicationRoutes.get('/my', authenticate, ownerApplicationController.getMyApplications);

// ========================
// REPORT ROUTES
// ========================
export const reportRoutes = Router();

reportRoutes.post('/', authenticate, validate(createReportSchema), reportController.createReport);