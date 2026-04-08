import { Router } from 'express';
import { createBooking, getBookingsByCourtAndDate } from './booking.controller.js';
import { protect } from '../../middlewares/auth.middleware.js';

const router = Router();

router.get('/:courtId/:date', getBookingsByCourtAndDate);

router.post('/', protect, createBooking);

export default router;