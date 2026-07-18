import express from 'express';
import { voucherController } from '../controllers/voucher.controller';
import { authenticate as auth, requireCourtOwner as requireOwner, requireAdmin } from '../middlewares/auth';

const router = express.Router();

// Admin Routes
router.get('/admin/all', auth, requireAdmin, voucherController.getAllVouchers);
router.post('/admin/global', auth, requireAdmin, voucherController.createGlobalVoucher);
router.patch('/admin/:id/approve', auth, requireAdmin, voucherController.approveVoucher);

// Owner Routes
router.get('/owner/me', auth, requireOwner, voucherController.getOwnerVouchers);
router.post('/owner/request', auth, requireOwner, voucherController.requestVoucher);

// Shared Admin/Owner Routes for update & delete
router.patch('/:id', auth, voucherController.updateVoucher);
router.delete('/:id', auth, voucherController.deleteVoucher);

// Public / User Routes for checkout
router.post('/validate', auth, voucherController.validateVoucher);

export default router;
