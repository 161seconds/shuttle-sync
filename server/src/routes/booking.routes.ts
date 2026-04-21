import { Router } from 'express';
import { bookingController } from '../controllers';
import { authenticate, optionalAuth, validate, bookingLimiter } from '../middlewares';
import { createBookingSchema, cancelBookingSchema } from '../validators';

const router = Router();

// Guest booking lookup
router.get('/code/:code', bookingController.getBookingByCode);

// Protected routes
router.post('/', optionalAuth, bookingLimiter, validate(createBookingSchema), bookingController.createBooking);
router.get('/my', authenticate, bookingController.getMyBookings);
router.get('/:bookingId', authenticate, bookingController.getBookingById);
router.post('/:bookingId/confirm-payment', authenticate, bookingController.confirmPayment);
router.post('/:bookingId/cancel', authenticate, validate(cancelBookingSchema), bookingController.cancelBooking);

// Court owner: view bookings for their court
router.get('/court/:courtId', authenticate, bookingController.getCourtBookings);

export default router;