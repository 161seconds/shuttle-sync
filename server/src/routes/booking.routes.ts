import { Router } from 'express';
import { bookingController } from '../controllers/booking.controller';
import { authenticate } from '../middlewares';

const router = Router();

router.get('/court/:courtId', bookingController.getCourtBookings);
router.get('/code/:code', bookingController.getBookingByCode);

router.post('/', authenticate, bookingController.createBooking);
router.get('/my', authenticate, bookingController.getMyBookings);
router.get('/:bookingId', authenticate, bookingController.getBookingById);
router.post('/:bookingId/confirm-payment', authenticate, bookingController.confirmPayment);
router.post('/:bookingId/cancel', authenticate, bookingController.cancelBooking);

router.get('/court/:courtId', authenticate, bookingController.getCourtBookings);

export default router;