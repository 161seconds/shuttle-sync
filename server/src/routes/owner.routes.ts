import { Router } from 'express';
import { ownerController } from '../controllers/owner.controller';
import { authenticate, authorize } from '../middlewares/auth';
import { UserRole } from '@shuttle-sync/shared';

const router = Router();

router.use(authenticate);
router.use(authorize(UserRole.COURT_OWNER));

router.get('/venue', ownerController.getVenue);
router.post('/venue', ownerController.createVenue);
router.put('/venue', ownerController.updateVenue);

router.get('/courts', ownerController.getCourts);
router.post('/courts', ownerController.addCourt);
router.put('/courts/:courtId', ownerController.updateCourt);

router.get('/stats', ownerController.getDashboardStats);

router.get('/schedule', ownerController.getSchedule);
router.post('/schedule/block', ownerController.blockSlot);

router.get('/bookings', ownerController.getBookings);
router.put('/bookings/:id', ownerController.updateBooking);
router.post('/bookings/:id/notify', ownerController.sendBookingNotification);

router.get('/expenses', ownerController.getExpenses);
router.post('/expenses', ownerController.createExpense);
router.put('/expenses/:id', ownerController.updateExpense);
router.delete('/expenses/:id', ownerController.deleteExpense);

export default router;
