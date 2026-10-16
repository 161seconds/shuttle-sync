import mongoose, { ClientSession } from 'mongoose';
import crypto from 'crypto';
import { ApiError } from '../utils/ApiError';
import { Venue } from '../models/Venue.model';
import { bookingDate, validateBookingId, validateBookingRange } from './booking.validation';
import { Voucher, VoucherStatus, DiscountType } from '../models/Voucher';
import { Booking } from '../models/Booking';
import { Court } from '../models/Court';
import { notificationService } from './other.service';
import { logger } from '../utils/logger';
import {
    BookingStatus,
    PaymentStatus,
    BookingType,
    PaymentMethod
} from '@shuttle-sync/shared';

// All schedule writers lock the court first; withTransaction retries write conflicts.
export async function withCourtTransaction<T>(ids: string[], action: (session: ClientSession) => Promise<T>): Promise<T> {
    const session = await mongoose.startSession();
    try {
        return await session.withTransaction(async () => {
            for (const id of [...new Set(ids)].sort()) {
                validateBookingId(id);
                if (!await Court.findOneAndUpdate({ _id: id }, { $inc: { __v: 1 } }, { session, new: true })) throw ApiError.notFound('Sân không tồn tại');
            }
            return action(session);
        }) as T;
    } finally { await session.endSession(); }
}

export async function assertCourtAvailable(courtId: string, subCourtId: string, date: Date, startTime: string, endTime: string, session: ClientSession, excludedIds: unknown[] = []) {
    const start = new Date(date); start.setUTCHours(0, 0, 0, 0);
    const end = new Date(date); end.setUTCHours(23, 59, 59, 999);
    if (await Booking.exists({ _id: { $nin: excludedIds }, courtId, subCourtId, date: { $gte: start, $lte: end },
        startTime: { $lt: endTime }, endTime: { $gt: startTime },
        $or: [{ status: { $in: [BookingStatus.CONFIRMED, BookingStatus.COMPLETED] } },
            { status: BookingStatus.PENDING_PAYMENT, 'payment.expiresAt': { $gt: new Date() } }]
    }).session(session)) throw ApiError.conflict('Sân đã có người đặt trong khung giờ này');
}

class BookingService {
    async createBooking(userId: string, data: any) {
        validateBookingId(data.courtId); validateBookingId(data.subCourtId);
        validateBookingRange(data.startTime, data.endTime);
        const selectedDate = bookingDate(data.date);
        const today = bookingDate(new Date(Date.now() + 7 * 3600000).toISOString().slice(0, 10));
        if (selectedDate < today) throw ApiError.badRequest('Không thể đặt sân trong quá khứ');
        if (data.type && !Object.values(BookingType).includes(data.type)) throw ApiError.badRequest('Loại đặt sân không hợp lệ');
        if (data.type === BookingType.FIXED && (!Number.isInteger(data.months) || data.months < 1 || data.months > 12 ||
            !Array.isArray(data.daysOfWeek) || !data.daysOfWeek.length || data.daysOfWeek.length > 7 ||
            new Set(data.daysOfWeek).size !== data.daysOfWeek.length || data.daysOfWeek.some((d: unknown) => !Number.isInteger(d) || Number(d) < 0 || Number(d) > 6))) throw ApiError.badRequest('Gói cố định không hợp lệ');
        if (data.voucherCode !== undefined && (typeof data.voucherCode !== 'string' || !data.voucherCode.trim())) throw ApiError.badRequest('Mã giảm giá không hợp lệ');
        const startTime = data.startTime;
        const endTime = data.endTime;

        const timeToMins = (t: string) => {
            const [h, m] = t.split(':').map(Number);
            return h * 60 + m;
        };
        const requestedStartMins = timeToMins(startTime);
        const requestedEndMins = timeToMins(endTime);

        let generatedDates: Date[] = [];
        let totalSessions = 1;

        if (data.type === BookingType.FIXED) {
            const months = data.months;
            const weeks = months * 4;
            const daysOfWeek: number[] = Array.isArray(data.daysOfWeek) ? data.daysOfWeek : [new Date(data.date).getDay()];
            
            const baseDate = selectedDate;
            baseDate.setUTCHours(12, 0, 0, 0);
            
            for (const dow of daysOfWeek) {
                let current = new Date(baseDate);
                while (current.getUTCDay() !== dow) {
                    current.setUTCDate(current.getUTCDate() + 1);
                }
                for (let i = 0; i < weeks; i++) {
                    generatedDates.push(new Date(current));
                    current.setUTCDate(current.getUTCDate() + 7);
                }
            }
            totalSessions = generatedDates.length;
        } else {
            generatedDates = [selectedDate];
        }

        const dateQueries = generatedDates.map(d => {
            const s = new Date(d);
            s.setUTCHours(0,0,0,0);
            const e = new Date(d);
            e.setUTCHours(23,59,59,999);
            return { date: { $gte: s, $lte: e } };
        });

        const result = await withCourtTransaction([data.subCourtId], async session => {
            const subCourt = await Court.findById(data.subCourtId).session(session);
            if (subCourt.venueId.toString() !== data.courtId || subCourt.status !== 'AVAILABLE') throw ApiError.badRequest('Sân không thuộc cơ sở hoặc đang bảo trì');
            if (!await Venue.exists({ _id: data.courtId, isActive: true }).session(session)) throw ApiError.badRequest('Cơ sở không hoạt động');
            const basePrice = subCourt.pricePerHour;
            const configs = subCourt.pricingConfigs || [];
            const conflictingBookings = await Booking.find({
                courtId: data.courtId,
                subCourtId: data.subCourtId,
                $or: dateQueries,
                $and: [{ $or: [{ status: { $in: [BookingStatus.CONFIRMED, BookingStatus.COMPLETED] } },
                    { status: BookingStatus.PENDING_PAYMENT, 'payment.expiresAt': { $gt: new Date() } }] }]
            }).session(session);

            const myPendingBookings = [];
            for (const b of conflictingBookings) {
                const bStartMins = timeToMins(b.startTime);
                const bEndMins = timeToMins(b.endTime);
                if (requestedStartMins < bEndMins && requestedEndMins > bStartMins) {
                    if (b.userId?.toString() === userId.toString() && b.status === BookingStatus.PENDING_PAYMENT) {
                        myPendingBookings.push(b);
                    } else {
                        throw new Error(`Sân đã có người đặt hoặc đang chờ thanh toán từ ${b.startTime} đến ${b.endTime}. Vui lòng chọn khung giờ khác!`);
                    }
                }
            }

            let exactMatchCount = 0;
            for (const b of myPendingBookings) {
                const bStartMins = timeToMins(b.startTime);
                const bEndMins = timeToMins(b.endTime);
                if (bStartMins === requestedStartMins && bEndMins === requestedEndMins) {
                    const matchDate = generatedDates.find(d => 
                        d.getUTCDate() === b.date.getUTCDate() &&
                        d.getUTCMonth() === b.date.getUTCMonth() &&
                        d.getUTCFullYear() === b.date.getUTCFullYear()
                    );
                    if (matchDate) exactMatchCount++;
                }
            }

            if (myPendingBookings.length > 0 && exactMatchCount === totalSessions && exactMatchCount === myPendingBookings.length) {
                const finalAmount = myPendingBookings.reduce((sum, b) => sum + b.finalAmount, 0);
                return {
                    bookingCode: myPendingBookings[0].groupId || myPendingBookings[0].bookingCode,
                    finalAmount: finalAmount,
                    bookings: myPendingBookings,
                    expiresAt: myPendingBookings[0].payment.expiresAt
                };
            }

            for (const b of myPendingBookings) {
                b.status = BookingStatus.CANCELLED;
                b.cancelReason = 'Người dùng tạo phiên đặt sân mới đè lên phiên cũ';
                await b.save({ session });
            }

            const expiresAt = new Date();
            expiresAt.setMinutes(expiresAt.getMinutes() + 15);

            const groupId = totalSessions > 1 ? 'GRP' + crypto.randomInt(100000000, 1000000000) : undefined;
            const bookingsToInsert = [];

            for (let i = 0; i < totalSessions; i++) {
                const bookingCode = 'BK' + crypto.randomInt(100000000, 1000000000);
                const bDate = generatedDates[i];
                const day = bDate.getUTCDay();

                let sessionAmount = 0;
                for (let m = requestedStartMins; m < requestedEndMins; m += 30) {
                    const match = configs.find((cfg: any) => {
                        if (!cfg.daysOfWeek.includes(day)) return false;
                        const cfgStartMins = timeToMins(cfg.startTime);
                        const cfgEndMins = timeToMins(cfg.endTime);
                        return m >= cfgStartMins && m < cfgEndMins;
                    });
                    const chunkPrice = match ? match.pricePerHour : basePrice;
                    if (!Number.isFinite(chunkPrice) || chunkPrice < 0) throw ApiError.badRequest('Giá sân không hợp lệ');
                    sessionAmount += chunkPrice * 0.5;
                }

                bookingsToInsert.push({
                    bookingCode,
                    groupId,
                    userId,
                    courtId: data.courtId,
                    subCourtId: data.subCourtId,
                    slotIds: [],
                    date: bDate,
                    startTime,
                    endTime,
                    type: data.type || BookingType.CASUAL,
                    status: BookingStatus.PENDING_PAYMENT,
                    totalAmount: sessionAmount,
                    discount: 0,
                    finalAmount: sessionAmount,
                    voucherCode: undefined as string | undefined,
                    payment: {
                        method: PaymentMethod.QR_CODE,
                        status: PaymentStatus.PENDING,
                        expiresAt
                    }
                });
            }

            // Tính toán voucher
            let totalAmountAll = bookingsToInsert.reduce((sum, b) => sum + b.totalAmount, 0);
            let discountAmount = 0;
            let appliedVoucher: any = null;

            if (data.voucherCode) {
                appliedVoucher = await Voucher.findOneAndUpdate({
                    code: data.voucherCode.toUpperCase(),
                    isActive: true,
                    status: VoucherStatus.APPROVED,
                    $expr: { $lt: ['$usedCount', '$usageLimit'] }
                }, { $inc: { usedCount: 1 } }, { new: true, session });

                if (!appliedVoucher) {
                    throw new Error('Mã giảm giá không tồn tại hoặc chưa được duyệt');
                }

                const now = new Date();
                if (now < appliedVoucher.startDate || now > appliedVoucher.endDate) {
                    throw new Error('Mã giảm giá đã hết hạn hoặc chưa tới thời gian áp dụng');
                }

                if (appliedVoucher.usedCount > appliedVoucher.usageLimit) {
                    throw new Error('Mã giảm giá đã hết lượt sử dụng');
                }

                if (appliedVoucher.venueId && appliedVoucher.venueId.toString() !== data.courtId) {
                    throw new Error('Mã giảm giá không áp dụng cho cơ sở này');
                }

                if (appliedVoucher.minOrderValue && totalAmountAll < appliedVoucher.minOrderValue) {
                    throw new Error(`Đơn hàng tối thiểu ${appliedVoucher.minOrderValue.toLocaleString()}đ để áp dụng mã`);
                }

                if (appliedVoucher.discountType === DiscountType.PERCENTAGE) {
                    discountAmount = (totalAmountAll * appliedVoucher.discountValue) / 100;
                    if (appliedVoucher.maxDiscount && discountAmount > appliedVoucher.maxDiscount) {
                        discountAmount = appliedVoucher.maxDiscount;
                    }
                } else {
                    discountAmount = appliedVoucher.discountValue;
                }

                if (discountAmount > totalAmountAll) discountAmount = totalAmountAll;

            }

            if (discountAmount > 0) {
                let remainingDiscount = discountAmount;
                bookingsToInsert.forEach((b, index) => {
                    const currentDiscount = index === bookingsToInsert.length - 1 ? remainingDiscount : Math.min(remainingDiscount, Math.floor(discountAmount * b.totalAmount / (totalAmountAll || 1)));
                    remainingDiscount -= currentDiscount;
                    b.discount = currentDiscount;
                    b.finalAmount = b.totalAmount - currentDiscount;
                    if (appliedVoucher) b.voucherCode = appliedVoucher.code;
                });
            }

            const createdBookings = await Booking.insertMany(bookingsToInsert, {
                session
            });

            const paymentCode = groupId || createdBookings[0].bookingCode;


            const finalAmount = createdBookings.reduce((sum, b) => sum + b.finalAmount, 0);

            return {
                bookingCode: paymentCode,
                finalAmount: finalAmount,
                bookings: createdBookings,
                expiresAt: expiresAt,
            };
        });
        const notification = await notificationService.createNotification({ userId, title: 'Chờ thanh toán',
            message: `Đơn đặt sân ${result.bookingCode} đang chờ thanh toán.`, type: 'booking',
            data: { link: `/payment/${result.bookingCode}` } }).catch(error => { logger.error('Failed to create notification', error); return null; });
        return { ...result, notification };
    }

    async getMyBookings(userId: string, status?: any, startDate?: string, endDate?: string): Promise<any[]> {
        const filter: any = { userId };
        if (status) {
            if (!Object.values(BookingStatus).includes(status)) throw ApiError.badRequest('Trạng thái không hợp lệ');
            filter.status = status;
        }
        if (startDate || endDate) {
            const start = startDate ? bookingDate(startDate) : undefined;
            const end = endDate ? bookingDate(endDate) : undefined;
            if (start && end && start > end) throw ApiError.badRequest('Ngày kết thúc phải từ ngày bắt đầu');
            start?.setUTCHours(0, 0, 0, 0);
            end?.setUTCHours(23, 59, 59, 999);
            filter.date = { ...(start && { $gte: start }), ...(end && { $lte: end }) };
        }
        const startOfToday = bookingDate(new Date(Date.now() + 7 * 3600000).toISOString().slice(0, 10));
        startOfToday.setUTCHours(0,0,0,0);

        // Tự động chuyển các đơn 'confirmed' trong quá khứ thành 'completed'
        await Booking.updateMany(
            {
                userId,
                status: BookingStatus.CONFIRMED,
                date: { $lt: startOfToday }
            },
            { $set: { status: BookingStatus.COMPLETED } }
        );

        const bookings = await Booking.find(filter)
            .sort({ date: -1, createdAt: -1 })
            .populate({ path: 'courtId', model: 'Venue', select: 'name address photos' })
            .lean();
            
        const mongoose = require('mongoose');
        const GroupPlay = mongoose.model('GroupPlay');

        const bookingIds = bookings.map(b => b._id);
        const groupPlays = await GroupPlay.find({ bookingId: { $in: bookingIds } }).select('bookingId').lean();
        const usedBookingIds = new Set(groupPlays.map((gp: any) => gp.bookingId?.toString()));

        return bookings.map(b => ({
            ...b,
            hasGroupPlay: usedBookingIds.has(b._id.toString())
        }));
    }

    async confirmPayment(bookingCode: string, userId: string, transaction?: { id: string; amount: number }) {
        if (!transaction) throw ApiError.forbidden('Thanh toán chỉ được xác nhận từ giao dịch đã xác minh');
        if (!transaction.id || !Number.isFinite(transaction.amount) || transaction.amount <= 0) throw ApiError.badRequest('Giao dịch không hợp lệ');
        const query = bookingCode.startsWith('GRP') ? { groupId: bookingCode, userId } : { bookingCode, userId };
        const initial = await Booking.find(query).select('subCourtId');
        if (!initial.length) throw ApiError.notFound('Không tìm thấy đơn đặt sân');
        const result = await withCourtTransaction(initial.map(b => b.subCourtId.toString()), async session => {
            const bookings = await Booking.find(query).sort({ _id: 1 }).session(session);
            const previous = await Booking.findOne({ 'payment.transactionId': transaction.id }).session(session);
            if (previous) {
                if (!bookings.some(b => b._id.equals(previous._id))) throw ApiError.conflict('Giao dịch đã được sử dụng cho đơn khác');
                return { booking: bookings[0], changed: false };
            }
            const now = new Date();
            if (bookings.some(b => b.status !== BookingStatus.PENDING_PAYMENT || b.payment.status !== PaymentStatus.PENDING || b.payment.expiresAt <= now)) throw ApiError.conflict('Đơn không còn chờ thanh toán; cần đối soát giao dịch');
            if (transaction.amount < bookings.reduce((sum, b) => sum + b.finalAmount, 0)) throw ApiError.badRequest('Số tiền thanh toán không đủ');
            for (let i = 0; i < bookings.length; i++) {
                const booking = bookings[i];
                await assertCourtAvailable(booking.courtId.toString(), booking.subCourtId.toString(), booking.date, booking.startTime, booking.endTime, session, bookings.map(b => b._id));
                booking.status = BookingStatus.CONFIRMED;
                booking.payment.status = PaymentStatus.PAID;
                booking.payment.paidAt = now;
                booking.confirmedAt = now;
                // One record per group carries the unique bank transaction identifier.
                if (i === 0) booking.payment.transactionId = transaction.id;
                await booking.save({ session });
            }
            return { booking: bookings[0], changed: true };
        });
        if (result.changed) {
            const venue = await Venue.findById(result.booking.courtId).select('ownerId name');
            const recipients = [userId, venue?.ownerId?.toString()].filter(Boolean);
            await Promise.all(recipients.map(id => notificationService.createNotification({ userId: id, title: 'Thanh toán thành công',
                message: `Đơn đặt sân ${bookingCode} đã thanh toán thành công.`, type: 'booking' }).catch(error => logger.error('Failed to create notification', error))));
        }
        return result.booking;
    }

    async getCourtBookings(courtId: string, date: string) {
        validateBookingId(courtId);
        const query: any = {
            courtId,
            $or: [{ status: { $in: [BookingStatus.CONFIRMED, BookingStatus.COMPLETED] } },
                { status: BookingStatus.PENDING_PAYMENT, 'payment.expiresAt': { $gt: new Date() } }]
        };

        if (date) {
            const startOfDay = bookingDate(date);
            startOfDay.setUTCHours(0, 0, 0, 0);

            const endOfDay = bookingDate(date);
            endOfDay.setUTCHours(23, 59, 59, 999);

            query.date = { $gte: startOfDay, $lte: endOfDay };
        }

        const bookings = await Booking.find(query)
            .select('subCourtId startTime endTime date status')
            .lean();

        return bookings;
    }

    async cleanupExpiredBookings(): Promise<number> {
        const now = new Date();
        const result = await Booking.updateMany(
            { status: BookingStatus.PENDING_PAYMENT, 'payment.expiresAt': { $lt: now } },
            { 
                $set: { 
                    status: BookingStatus.CANCELLED, 
                    cancelReason: 'Hết hạn thanh toán' 
                } 
            }
        );
        return result.modifiedCount;
    }

    async getBookingByCode(code: string, userId: string) {
        const bookings = await Booking.find({ userId, $or: [{ bookingCode: code }, { groupId: code }] }).populate('courtId');
        if (!bookings.length) throw ApiError.notFound('Không tìm thấy đơn đặt sân');
        return bookings;
    }

    async getBookingById(id: string, userId: string) {
        validateBookingId(id);
        const booking = await Booking.findOne({ _id: id, userId }).populate('courtId');
        if (!booking) throw ApiError.notFound('Không tìm thấy đơn đặt sân');
        return booking;
    }

    async cancelBooking(id: string, userId: string, reason?: string) {
        validateBookingId(id);
        if (reason !== undefined && (typeof reason !== 'string' || reason.length > 500)) throw ApiError.badRequest('Lý do hủy không hợp lệ');
        const initial = await Booking.findOne({ _id: id, userId });
        if (!initial) throw ApiError.notFound('Không tìm thấy đơn đặt sân');
        return withCourtTransaction([initial.subCourtId.toString()], async session => {
            const booking = await Booking.findOne({ _id: id, userId }).session(session);
            if (!booking) throw ApiError.notFound('Không tìm thấy đơn đặt sân');
            if (booking.status === BookingStatus.CANCELLED) return booking;
            if (booking.status !== BookingStatus.PENDING_PAYMENT || booking.payment.status === PaymentStatus.PAID) throw ApiError.conflict('Đơn đã thanh toán cần chủ sân xử lý hoàn tiền');
            booking.status = BookingStatus.CANCELLED;
            booking.cancelledAt = new Date();
            booking.cancelReason = reason;
            await booking.save({ session });
            return booking;
        });
    }
}

export const bookingService = new BookingService();
