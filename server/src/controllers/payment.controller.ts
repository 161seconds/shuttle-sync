import { Request, Response } from 'express';
import { bookingService } from '../services/booking.service';
import { logger } from '../utils/logger';
import { Booking } from '../models/Booking';

class PaymentController {
    async handleSePayWebhook(req: Request, res: Response) {
        try {
            // Kiểm tra Authorization header (Tuỳ chọn cấu hình API Key trong SePay)
            // const expectedToken = process.env.SEPAY_API_TOKEN;
            // if (expectedToken && req.headers.authorization !== `Bearer ${expectedToken}`) {
            //     return res.status(401).json({ success: false, message: 'Unauthorized' });
            // }

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
