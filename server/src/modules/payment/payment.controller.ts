import { Request, Response } from 'express';
import { BookingModel } from '../booking/booking.model.js';
import { PaymentModel } from './payment.model.js';

export const confirmPayment = async (req: Request, res: Response) => {
    try {
        const { bookingId } = req.params;

        // 1. Tìm cái đơn đặt sân
        const booking = await BookingModel.findById(bookingId).populate('courtId');
        if (!booking) {
            return res.status(404).json({ message: 'Không tìm thấy thông tin đặt sân' });
        }

        if (booking.paymentStatus === 'paid') {
            return res.status(400).json({ message: 'Đơn này đã được thanh toán rồi!' });
        }

        // Lấy giá tiền từ thông tin sân (nhờ populate)
        const court: any = booking.courtId;

        // 2. Tạo lịch sử thanh toán (Mock)
        await PaymentModel.create({
            bookingId: booking._id,
            amount: court.pricePerHour,
            status: 'completed'
        });

        // 3. Cập nhật trạng thái Booking
        booking.status = 'confirmed';
        booking.paymentStatus = 'paid';
        await booking.save();

        res.status(200).json({ message: 'Thanh toán thành công! Sân đã được chốt.', booking });
    } catch (error) {
        res.status(500).json({ message: 'Lỗi hệ thống khi thanh toán' });
    }
};