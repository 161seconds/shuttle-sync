import { Request, Response } from 'express';
import { BookingModel } from './booking.model.js';

interface AuthRequest extends Request {
    user?: { id: string; role: string };
}

// 1. Lấy danh sách slot đã đặt của 1 sân trong 1 ngày (Để UI biết đường disable)
export const getBookingsByCourtAndDate = async (req: Request, res: Response) => {
    try {
        const { courtId, date } = req.params;

        // Tìm các booking chưa bị hủy
        const bookings = await BookingModel.find({
            courtId,
            date,
            status: { $ne: 'cancelled' }
        }).select('timeSlot status');

        res.status(200).json(bookings);
    } catch (error) {
        res.status(500).json({ message: 'Lỗi khi tải dữ liệu đặt sân' });
    }
};

// 2. Tạo Booking mới (User đặt sân)
export const createBooking = async (req: AuthRequest, res: Response) => {
    try {
        const { courtId, date, timeSlot } = req.body;
        const userId = req.user?.id;

        const newBooking = await BookingModel.create({
            userId,
            courtId,
            date,
            timeSlot,
            status: 'pending', // Mới đặt thì pending, chờ thanh toán
            paymentStatus: 'unpaid'
        });

        const io = req.app.get('io');
        io.to(courtId.toString()).emit('new_booking', {
            timeSlot: newBooking.timeSlot,
            date: newBooking.date
        });

        res.status(201).json({
            message: 'Đặt sân thành công, vui lòng thanh toán!',
            booking: newBooking
        });

    } catch (error: any) {
        // 11000 là mã lỗi Duplicate Key của MongoDB (Trùng sân + ngày + giờ)
        if (error.code === 11000) {
            return res.status(400).json({ message: 'Rất tiếc, Slot này vừa có người nhanh tay đặt mất rồi!' });
        }
        res.status(500).json({ message: 'Lỗi hệ thống khi đặt sân' });
    }
};