import { Router } from 'express';
import { paymentController } from '../controllers/payment.controller';

const router = Router();

// Webhook endpoint cho SePay
router.post('/sepay-webhook', paymentController.handleSePayWebhook.bind(paymentController));

// Endpoint để frontend polling trạng thái thanh toán
router.get('/status/:bookingCode', paymentController.getPaymentStatus.bind(paymentController));

export default router;
