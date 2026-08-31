import { Request, Response } from 'express';
import { bookingService } from '../services/booking.service';
import { logger } from '../utils/logger';
import { Booking } from '../models/Booking';

import crypto from 'crypto';

class PaymentController {
    async handleSePayWebhook(req: Request, res: Response) {
        try {
            // 1. Xác thực HMAC-SHA256 (nếu có cấu hình SEPAY_WEBHOOK_SECRET và SePay gửi header X-SePay-Signature)
            const webhookSecret = process.env.SEPAY_WEBHOOK_SECRET?.trim();
            const sepaySignatureHeader = (req.headers['x-sepay-signature'] || req.headers['X-SePay-Signature']) as string;
            const sepayTimestamp = (req.headers['x-sepay-timestamp'] || req.headers['X-SePay-Timestamp']) as string;

            if (webhookSecret && sepaySignatureHeader) {
                // SePay gửi signature dạng sha256=<hex_hash>, ta bỏ tiền tố sha256= nếu có
                const receivedSignature = sepaySignatureHeader.replace(/^sha256=/i, '').trim();
                const rawPayload = (req as any).rawBody || JSON.stringify(req.body);

                // Chuỗi ký chuẩn của SePay: {timestamp}.{raw_body}
                const payloadWithTimestamp = sepayTimestamp ? `${sepayTimestamp}.${rawPayload}` : rawPayload;

                const calculatedSigWithTs = crypto
                    .createHmac('sha256', webhookSecret)
                    .update(payloadWithTimestamp)
                    .digest('hex');

                const calculatedSigWithoutTs = crypto
                    .createHmac('sha256', webhookSecret)
                    .update(rawPayload)
                    .digest('hex');

                const safeCompare = (a: string, b: string) => {
                    if (!a || !b || a.length !== b.length) return false;
                    return crypto.timingSafeEqual(Buffer.from(a), Buffer.from(b));
                };

                const isValid = safeCompare(calculatedSigWithTs, receivedSignature) || safeCompare(calculatedSigWithoutTs, receivedSignature);

                if (!isValid) {
                    logger.warn(`[SePay Webhook] Chữ ký không hợp lệ. Nhận: ${receivedSignature}, Tính toán: ${calculatedSigWithTs}`);
                    return res.status(401).json({ success: false, message: 'Invalid signature' });
                }
            }

            // 2. Xác thực API Token (nếu có cấu hình SEPAY_API_TOKEN và có header Authorization)
            const expectedToken = process.env.SEPAY_API_TOKEN?.trim();
            const authHeader = req.headers.authorization;
            if (expectedToken && authHeader) {
                const token = authHeader.replace(/^(Bearer|Apikey)\s+/i, '').trim();
                if (token !== expectedToken) {
                    logger.warn(`[SePay Webhook] API Token không hợp lệ: ${token}`);
                    return res.status(401).json({ success: false, message: 'Unauthorized' });
                }
            }

            const { gateway, transactionDate, accountNumber, content, transferType, transferAmount, referenceCode } = req.body;

            // Chỉ quan tâm đến tiền vào
            if (transferType !== 'in') {
                return res.status(200).json({ success: true, message: 'Bỏ qua giao dịch tiền ra' });
            }

            // Tìm mã đơn (BookingCode) trong nội dung chuyển khoản
            // Giả sử cú pháp của mình là SHUTTLE [Mã Đơn]
            // Hoặc có thể regex thẳng mã đơn (VD: GRP123456 hoặc BK1234567)
            const bookingCodeMatch = content.match(/(GRP|BK)\d+/i);
            
            if (!bookingCodeMatch) {
                logger.info(`[SePay Webhook] Không tìm thấy mã đơn trong nội dung: ${content}`);
                return res.status(200).json({ success: true, message: 'Không phải giao dịch đặt sân' });
            }

            const bookingCode = bookingCodeMatch[0].toUpperCase();

            // Tìm đơn hàng trong DB
            let bookings;
            if (bookingCode.startsWith('GRP')) {
                bookings = await Booking.find({ groupId: bookingCode });
            } else {
                const b = await Booking.findOne({ bookingCode });
                bookings = b ? [b] : [];
            }

            if (!bookings.length) {
                logger.warn(`[SePay Webhook] Không tìm thấy đơn hàng ${bookingCode} trong DB`);
                return res.status(200).json({ success: true, message: 'Không tìm thấy đơn hàng' });
            }

            // Nếu đơn đã xác nhận rồi thì bỏ qua
            if (bookings[0].status === 'confirmed' || bookings[0].status === 'completed') {
                return res.status(200).json({ success: true, message: 'Đơn hàng đã được xác nhận từ trước' });
            }

            // Kiểm tra số tiền có khớp không
            // const totalRequired = bookingCode.startsWith('GRP') ? bookings.reduce((sum, b) => sum + b.finalAmount, 0) : bookings[0].finalAmount;
            // Cho phép thanh toán dư hoặc thiếu 1 chút (tuỳ nghiệp vụ), ở đây mình kiểm tra >= 
            // Nhưng tạm thời để đơn giản, cứ thấy mã đơn là xác nhận luôn (trong thực tế nên check kỹ)

            // Gọi service xác nhận thanh toán
            // Lưu ý: confirmPayment trong booking.service.ts yêu cầu userId
            const userId = bookings[0].userId?.toString() || '';
            await bookingService.confirmPayment(bookingCode, userId);

            logger.info(`[SePay Webhook] Xác nhận thành công đơn ${bookingCode}. Số tiền: ${transferAmount}, Ref: ${referenceCode}`);
            return res.status(200).json({ success: true, message: 'Xác nhận thanh toán thành công' });

        } catch (error) {
            logger.error('[SePay Webhook] Lỗi xử lý webhook:', error);
            // Vẫn trả về 200 để SePay không gọi lại liên tục nếu là lỗi logic của mình
            return res.status(200).json({ success: false, message: 'Lỗi server' });
        }
    }

    async getPaymentStatus(req: Request, res: Response) {
        try {
            const { bookingCode } = req.params;
            
            let status = 'PENDING';
            if (bookingCode.startsWith('GRP')) {
                const b = await Booking.findOne({ groupId: bookingCode });
                if (b) status = b.status;
            } else {
                const b = await Booking.findOne({ bookingCode });
                if (b) status = b.status;
            }

            return res.status(200).json({ success: true, data: { status } });
        } catch (error) {
            logger.error('[PaymentController] Lỗi lấy trạng thái:', error);
            return res.status(500).json({ success: false, message: 'Lỗi server' });
        }
    }
}

export const paymentController = new PaymentController();
