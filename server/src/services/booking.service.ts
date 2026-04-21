import mongoose from 'mongoose';
import {
    BookingStatus, BookingType, PaymentStatus, PaymentMethod,
    SlotStatus, PAYMENT_TIMEOUT_MS,
} from '@shuttle-sync/shared';
import { Booking, IBookingDocument, TimeSlot, Court, User } from '../models';
import { ApiError } from '../utils/ApiError';
import { generateBookingCode, calculatePagination } from '../utils/helpers';
import { config } from '../config';
import { logger } from '../utils/logger';

class BookingService {
    /**
     * Create a booking with atomic slot locking
     */
    async createBooking(data: {
        userId?: string;
        guestInfo?: { name: string; phone: string; email?: string };
        courtId: string;
        subCourtId: string;
        slotIds: string[];
        date: string;
        type: BookingType;
        paymentMethod: PaymentMethod;
        voucherCode?: string;
        notes?: string;
    }): Promise<IBookingDocument> {
        const session = await mongoose.startSession();
        session.startTransaction();

        try {
            // 1. Verify court exists
            const court = await Court.findById(data.courtId).session(session);
            if (!court) throw ApiError.notFound('Không tìm thấy sân');

            // 2. Atomically lock all slots - prevents double booking
            const slots = await TimeSlot.find({
                _id: { $in: data.slotIds },
                courtId: data.courtId,
                subCourtId: data.subCourtId,
                status: { $in: [SlotStatus.AVAILABLE, SlotStatus.SELECTED] },
            }).session(session).sort({ startTime: 1 });

            if (slots.length !== data.slotIds.length) {
                throw ApiError.conflict('Một số khung giờ đã được đặt hoặc không tồn tại');
            }

            // Verify selected slots belong to the requesting user if locked
            for (const slot of slots) {
                if (
                    slot.status === SlotStatus.SELECTED &&
                    slot.lockedBy?.toString() !== data.userId
                ) {
                    throw ApiError.conflict(`Khung giờ ${slot.startTime}-${slot.endTime} đang được giữ bởi người khác`);
                }
            }

            // 3. Calculate pricing
            const totalAmount = slots.reduce((sum, slot) => sum + slot.price, 0);
            let discount = 0;

            // TODO: Apply voucher discount if voucherCode provided

            const finalAmount = totalAmount - discount;

            // 4. Create booking
            const bookingCode = generateBookingCode();
            const startTime = slots[0].startTime;
            const endTime = slots[slots.length - 1].endTime;
            const paymentExpiresAt = new Date(Date.now() + config.slotLock.paymentTimeoutMs);

            const [booking] = await Booking.create(
                [{
                    bookingCode,
                    userId: data.userId || undefined,
                    guestInfo: data.guestInfo || undefined,
                    courtId: data.courtId,
                    subCourtId: data.subCourtId,
                    slotIds: data.slotIds,
                    date: new Date(data.date),
                    startTime,
                    endTime,
                    type: data.type,
                    status: BookingStatus.PENDING_PAYMENT,
                    totalAmount,
                    discount,
                    finalAmount,
                    voucherCode: data.voucherCode,
                    payment: {
                        method: data.paymentMethod,
                        status: PaymentStatus.PENDING,
                        expiresAt: paymentExpiresAt,
                    },
                    notes: data.notes,
                }],
                { session }
            );

            // 5. Update slot statuses to booked
            await TimeSlot.updateMany(
                { _id: { $in: data.slotIds } },
                {
                    status: SlotStatus.BOOKED,
                    bookingId: booking._id,
                    lockedBy: null,
                    lockedAt: null,
                },
                { session }
            );

            // 6. Update court stats
            await Court.findByIdAndUpdate(
                data.courtId,
                { $inc: { totalBookings: 1 } },
                { session }
            );

            // 7. Update user stats
            if (data.userId) {
                await User.findByIdAndUpdate(
                    data.userId,
                    { $inc: { 'stats.totalBookings': 1 } },
                    { session }
                );
            }

            await session.commitTransaction();
            logger.info(`Booking created: ${bookingCode} for court ${data.courtId}`);

            return booking;
        } catch (error) {
            await session.abortTransaction();
            throw error;
        } finally {
            session.endSession();
        }
    }

    /**
     * Confirm payment for a booking
     */
    async confirmPayment(
        bookingId: string,
        transactionId: string,
        userId?: string
    ): Promise<IBookingDocument> {
        const booking = await Booking.findById(bookingId);
        if (!booking) throw ApiError.notFound('Không tìm thấy đơn đặt sân');

        if (userId && booking.userId?.toString() !== userId) {
            throw ApiError.forbidden('Bạn không có quyền xác nhận đơn này');
        }

        if (booking.status !== BookingStatus.PENDING_PAYMENT) {
            throw ApiError.badRequest('Đơn đặt sân không ở trạng thái chờ thanh toán');
        }

        // Check payment timeout
        if (new Date() > booking.payment.expiresAt) {
            await this.cancelBooking(bookingId, 'Hết thời gian thanh toán', undefined, true);
            throw ApiError.badRequest('Đã hết thời gian thanh toán, đơn đã bị hủy');
        }

        booking.status = BookingStatus.CONFIRMED;
        booking.payment.status = PaymentStatus.PAID;
        booking.payment.transactionId = transactionId;
        booking.payment.paidAt = new Date();
        booking.confirmedAt = new Date();
        await booking.save();

        logger.info(`Booking ${booking.bookingCode} payment confirmed`);
        return booking;
    }

    /**
     * Cancel a booking and release slots
     */
    async cancelBooking(
        bookingId: string,
        reason: string,
        userId?: string,
        isSystem = false
    ): Promise<IBookingDocument> {
        const session = await mongoose.startSession();
        session.startTransaction();

        try {
            const booking = await Booking.findById(bookingId).session(session);
            if (!booking) throw ApiError.notFound('Không tìm thấy đơn đặt sân');

            if (
                !isSystem &&
                userId &&
                booking.userId?.toString() !== userId
            ) {
                throw ApiError.forbidden('Bạn không có quyền hủy đơn này');
            }

            if (
                booking.status === BookingStatus.CANCELLED ||
                booking.status === BookingStatus.COMPLETED
            ) {
                throw ApiError.badRequest('Không thể hủy đơn ở trạng thái này');
            }

            // Release slots
            await TimeSlot.updateMany(
                { _id: { $in: booking.slotIds } },
                {
                    status: SlotStatus.AVAILABLE,
                    bookingId: null,
                    lockedBy: null,
                    lockedAt: null,
                },
                { session }
            );

            booking.status = BookingStatus.CANCELLED;
            booking.cancelReason = reason;
            booking.cancelledAt = new Date();

            if (booking.payment.status === PaymentStatus.PAID) {
                booking.payment.status = PaymentStatus.REFUNDED;
            }

            await booking.save({ session });

            await session.commitTransaction();
            logger.info(`Booking ${booking.bookingCode} cancelled: ${reason}`);

            return booking;
        } catch (error) {
            await session.abortTransaction();
            throw error;
        } finally {
            session.endSession();
        }
    }

    /**
     * Get bookings for a user
     */
    async getUserBookings(userId: string, params: {
        status?: BookingStatus;
        page?: number;
        limit?: number;
    }) {
        const filter: any = { userId };
        if (params.status) filter.status = params.status;

        const total = await Booking.countDocuments(filter);
        const { page, limit, totalPages, skip } = calculatePagination(
            params.page || 1,
            params.limit || 20,
            total
        );

        const bookings = await Booking.find(filter)
            .sort({ createdAt: -1 })
            .skip(skip)
            .limit(limit)
            .populate('courtId', 'name slug address photos')
            .lean();

        return {
            bookings,
            pagination: { page, limit, total, totalPages },
        };
    }

    /**
     * Get booking by ID
     */
    async getBookingById(bookingId: string, userId?: string): Promise<IBookingDocument> {
        const booking = await Booking.findById(bookingId)
            .populate('courtId', 'name slug address photos contact')
            .populate('userId', 'displayName email phone');

        if (!booking) throw ApiError.notFound('Không tìm thấy đơn đặt sân');

        if (userId && booking.userId?.toString() !== userId) {
            throw ApiError.forbidden('Bạn không có quyền xem đơn này');
        }

        return booking;
    }

    /**
     * Get booking by code (for guest lookup)
     */
    async getBookingByCode(bookingCode: string): Promise<IBookingDocument> {
        const booking = await Booking.findOne({ bookingCode })
            .populate('courtId', 'name slug address photos contact');

        if (!booking) throw ApiError.notFound('Không tìm thấy đơn đặt sân');
        return booking;
    }

    /**
     * Get bookings for a court (court owner view)
     */
    async getCourtBookings(courtId: string, params: {
        date?: string;
        status?: BookingStatus;
        page?: number;
        limit?: number;
    }) {
        const filter: any = { courtId };
        if (params.status) filter.status = params.status;
        if (params.date) {
            const date = new Date(params.date);
            date.setHours(0, 0, 0, 0);
            const nextDay = new Date(date);
            nextDay.setDate(nextDay.getDate() + 1);
            filter.date = { $gte: date, $lt: nextDay };
        }

        const total = await Booking.countDocuments(filter);
        const { page, limit, totalPages, skip } = calculatePagination(
            params.page || 1,
            params.limit || 20,
            total
        );

        const bookings = await Booking.find(filter)
            .sort({ date: -1, startTime: 1 })
            .skip(skip)
            .limit(limit)
            .populate('userId', 'displayName phone email')
            .lean();

        return {
            bookings,
            pagination: { page, limit, total, totalPages },
        };
    }

    /**
     * Cleanup expired pending bookings (cron job)
     */
    async cleanupExpiredBookings(): Promise<number> {
        const expiredBookings = await Booking.find({
            status: BookingStatus.PENDING_PAYMENT,
            'payment.expiresAt': { $lt: new Date() },
        });

        let count = 0;
        for (const booking of expiredBookings) {
            try {
                await this.cancelBooking(
                    booking._id.toString(),
                    'Hết thời gian thanh toán',
                    undefined,
                    true
                );
                count++;
            } catch (error) {
                logger.error(`Failed to cleanup booking ${booking.bookingCode}:`, error);
            }
        }

        if (count > 0) {
            logger.info(`Cleaned up ${count} expired bookings`);
        }
        return count;
    }
}

export const bookingService = new BookingService();