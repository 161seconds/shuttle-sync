import { Router } from 'express';
import { ownerController } from '../controllers/owner.controller';
import { authenticate, authorize } from '../middlewares/auth';
import { UserRole } from '@shuttle-sync/shared';

const router = Router();

// Tất cả các route ở đây đều yêu cầu đăng nhập và có role là COURT_OWNER
router.use(authenticate);
router.use(authorize(UserRole.COURT_OWNER));

// Quản lý Venue
router.get('/venue', ownerController.getVenue);
router.post('/venue', ownerController.createVenue);
router.put('/venue', ownerController.updateVenue);

// Quản lý Sân nhỏ (Courts)
router.get('/courts', ownerController.getCourts);
router.post('/courts', ownerController.addCourt);
router.put('/courts/:courtId', ownerController.updateCourt);

// Dashboard
router.get('/stats', ownerController.getDashboardStats);

// Lưới Lịch
router.get('/schedule', ownerController.getSchedule);
router.post('/schedule/block', ownerController.blockSlot);

// Quản lý Đặt Sân (Bookings)
router.get('/bookings', ownerController.getBookings);
router.put('/bookings/:id', ownerController.updateBooking);
router.post('/bookings/:id/notify', ownerController.sendBookingNotification);

export default router;
