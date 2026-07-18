import mongoose from 'mongoose';
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

class BookingService {
    async createBooking(userId: string, data: any) {
        if (!data.startTime || !data.endTime) {
            throw new Error('Vui lòng chọn thời gian đặt sân');
        }

        const startTime = data.startTime;
        const endTime = data.endTime;

        const start = new Date(`2000-01-01T${startTime}:00`);
        const end = new Date(`2000-01-01T${endTime}:00`);

        if (isNaN(start.getTime()) || isNaN(end.getTime())) {
            throw new Error('Định dạng thời gian không hợp lệ');
        }

        if (end <= start) {
            throw new Error('Giờ kết thúc phải lớn hơn giờ bắt đầu');
        }

        const timeToMins = (t: string) => {
            const [h, m] = t.split(':').map(Number);
            return h * 60 + m;
        };
        const requestedStartMins = timeToMins(startTime);
        const requestedEndMins = timeToMins(endTime);

        const subCourt = await Court.findById(data.subCourtId);
        if (!subCourt) {
            throw new Error('Sân không tồn tại');
        }

        const basePrice = subCourt.pricePerHour || 100000;
        const configs = subCourt.pricingConfigs || [];

        let generatedDates: Date[] = [];
        let totalSessions = 1;

        if (data.type === BookingType.FIXED) {
            const months = parseInt(data.months) || 1;
            const weeks = months * 4;
            const daysOfWeek: number[] = Array.isArray(data.daysOfWeek) ? data.daysOfWeek : [new Date(data.date).getDay()];
            
            const baseDate = new Date();
            baseDate.setHours(12, 0, 0, 0); // Use 12:00 to avoid daylight saving time skips
            
            for (const dow of daysOfWeek) {
                let current = new Date(baseDate);
                while (current.getDay() !== dow) {
                    current.setDate(current.getDate() + 1);
                }
                for (let i = 0; i < weeks; i++) {
                    generatedDates.push(new Date(current));
                    current.setDate(current.getDate() + 7);
                }
            }
            totalSessions = generatedDates.length;
        } else {
            generatedDates = [new Date(data.date)];
        }

        const dateQueries = generatedDates.map(d => {
            const s = new Date(d);
            s.setHours(0,0,0,0);
            const e = new Date(d);
            e.setHours(23,59,59,999);
            return { date: { $gte: s, $lte: e } };
        });

        const conflictingBookings = await Booking.find({
            courtId: data.courtId,
            subCourtId: data.subCourtId,
            $or: dateQueries,
            status: { $ne: BookingStatus.CANCELLED }
        });

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
                    d.getDate() === b.date.getDate() && 
                    d.getMonth() === b.date.getMonth() && 
                    d.getFullYear() === b.date.getFullYear()
                );
                if (matchDate) exactMatchCount++;
            }
        }

        if (myPendingBookings.length > 0 && exactMatchCount === totalSessions && exactMatchCount === myPendingBookings.length) {
            // Đây là trường hợp người dùng bấm quay lại và bấm tiếp tục với thông tin y hệt
            // Trả về booking cũ để không làm reset đồng hồ đếm ngược
            const finalAmount = myPendingBookings.reduce((sum, b) => sum + b.finalAmount, 0);
            return {
                bookingCode: myPendingBookings[0].groupId || myPendingBookings[0].bookingCode,
                finalAmount: finalAmount,
                bookings: myPendingBookings,
                expiresAt: myPendingBookings[0].payment.expiresAt
            };
        }

        // Tự động huỷ các đơn đang chờ thanh toán của chính user này để giải phóng sân
        for (const b of myPendingBookings) {
            b.status = BookingStatus.CANCELLED;
            b.cancelReason = 'Người dùng tạo phiên đặt sân mới đè lên phiên cũ';
            await b.save();
        }

        const expiresAt = new Date();
        expiresAt.setMinutes(expiresAt.getMinutes() + 15);

        const groupId = totalSessions > 1 ? 'GRP' + Math.floor(100000 + Math.random() * 900000) : undefined;
        const bookingsToInsert = [];

        for (let i = 0; i < totalSessions; i++) {
            const bookingCode = 'BK' + Math.floor(1000000 + Math.random() * 9000000);
            const bDate = generatedDates[i];
            const day = bDate.getDay();

            let sessionAmount = 0;
            for (let m = requestedStartMins; m < requestedEndMins; m += 30) {
                const match = configs.find((cfg: any) => {
                    if (!cfg.daysOfWeek.includes(day)) return false;
                    const cfgStartMins = timeToMins(cfg.startTime);
                    const cfgEndMins = timeToMins(cfg.endTime);
                    return m >= cfgStartMins && m < cfgEndMins;
                });
                const chunkPrice = match ? match.pricePerHour : basePrice;
                sessionAmount += chunkPrice * 0.5;
            }

            bookingsToInsert.push({
                bookingCode,
                groupId,
                userId,
                courtId: data.courtId,
                subCourtId: data.subCourtId,
                slotIds: data.slotIds?.length ? data.slotIds.map((id: string) => new mongoose.Types.ObjectId(id)) : [],
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
            const { Voucher, VoucherStatus, DiscountType } = require('../models/Voucher');
            appliedVoucher = await Voucher.findOne({
                code: data.voucherCode.toUpperCase(),
                isActive: true,
                status: VoucherStatus.APPROVED
            });

            if (!appliedVoucher) {
                throw new Error('Mã giảm giá không tồn tại hoặc chưa được duyệt');
            }

            const now = new Date();
            if (now < appliedVoucher.startDate || now > appliedVoucher.endDate) {
                throw new Error('Mã giảm giá đã hết hạn hoặc chưa tới thời gian áp dụng');
            }

            if (appliedVoucher.usedCount >= appliedVoucher.usageLimit) {
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

            appliedVoucher.usedCount += 1;
            await appliedVoucher.save();
        }

        if (discountAmount > 0) {
            const discountPerBooking = Math.floor(discountAmount / bookingsToInsert.length);
            let remainingDiscount = discountAmount - (discountPerBooking * bookingsToInsert.length);

            bookingsToInsert.forEach((b, index) => {
                let currentDiscount = discountPerBooking;
                if (index === 0) currentDiscount += remainingDiscount; // Cộng dồn phần dư vào đơn đầu tiên
                b.discount = currentDiscount;
                b.finalAmount = b.totalAmount - currentDiscount;
                if (appliedVoucher) b.voucherCode = appliedVoucher.code;
            });
        }

        const createdBookings = await Booking.insertMany(bookingsToInsert);
        const paymentCode = groupId || createdBookings[0].bookingCode;

        // Tạo thông báo
        let newNoti = null;
        try {
            newNoti = await notificationService.createNotification({
                userId: userId,
                title: 'Chờ thanh toán',
                message: `Đơn đặt sân ${paymentCode} đang chờ thanh toán. Vui lòng thanh toán để hoàn tất đặt sân.`,
                type: 'booking',
                data: { link: `/payment/${paymentCode}` }
            });
        } catch (err) {
            logger.error('Failed to create notification', err);
        }

        // Removed auto-confirm for real payment gateway integration


        const finalAmount = createdBookings.reduce((sum, b) => sum + b.finalAmount, 0);

        return {
            bookingCode: paymentCode,
            finalAmount: finalAmount,
            bookings: createdBookings,
            expiresAt: expiresAt,
            notification: newNoti
        };
    }

    async getMyBookings(userId: string, status?: any, startDate?: string, endDate?: string): Promise<any[]> {
        const now = new Date();
        const startOfToday = new Date(now.setHours(0,0,0,0));

        // Tự động chuyển các đơn 'confirmed' trong quá khứ thành 'completed'
        await Booking.updateMany(
            {
                userId,
                status: BookingStatus.CONFIRMED,
                date: { $lt: startOfToday }
            },
            { $set: { status: BookingStatus.COMPLETED } }
        );

        const filter: any = { userId };
        if (status) filter.status = status;
        
        if (startDate && endDate) {
            filter.date = { $gte: new Date(startDate), $lte: new Date(endDate) };
        } else if (startDate) {
            filter.date = { $gte: new Date(startDate) };
        } else if (endDate) {
            filter.date = { $lte: new Date(endDate) };
        }

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

    async confirmPayment(bookingCode: string, userId: string) {
        if (bookingCode.startsWith('GRP')) {
            const bookings = await Booking.find({ groupId: bookingCode, userId }).populate({ path: 'courtId', model: 'Venue', select: 'name ownerId' });
            if (!bookings.length) throw new Error('Không tìm thấy nhóm đơn đặt sân');

            await Booking.updateMany(
                { groupId: bookingCode, userId },
                {
                    $set: {
                        status: BookingStatus.CONFIRMED,
                        'payment.status': PaymentStatus.PAID,
                        'payment.paidAt': new Date(),
                        confirmedAt: new Date()
                    }
                }
            );

            const courtName = (bookings[0].courtId as any)?.name || 'Sân cầu lông';
            const ownerId = (bookings[0].courtId as any)?.ownerId;

            await notificationService.createNotification({
                userId,
                title: '🎉 Thanh toán gói cố định thành công!',
                message: `Bạn đã thanh toán thành công ${bookings.length} buổi tại ${courtName} từ ngày ${bookings[0].date.toLocaleDateString('vi-VN')}.`,
                type: 'booking'
            }).catch(err => logger.error("Lỗi tạo thông báo:", err));

            if (ownerId) {
                await notificationService.createNotification({
                    userId: ownerId,
                    title: '🔔 Có đơn đặt sân cố định mới!',
                    message: `Khách hàng vừa thanh toán thành công ${bookings.length} buổi tại ${courtName}. Mã đơn: ${bookingCode}`,
                    type: 'booking'
                }).catch(err => logger.error("Lỗi tạo thông báo owner:", err));
            }

            return bookings[0];
        } else {
            const booking = await Booking.findOne({ bookingCode, userId }).populate({ path: 'courtId', model: 'Venue', select: 'name ownerId' });
            if (!booking) throw new Error('Không tìm thấy đơn đặt sân');

            booking.status = BookingStatus.CONFIRMED;
            booking.payment.status = PaymentStatus.PAID;
            booking.payment.paidAt = new Date();
            booking.confirmedAt = new Date();

            await booking.save();

            const courtName = (booking.courtId as any)?.name || 'Sân cầu lông';
            const ownerId = (booking.courtId as any)?.ownerId;

            await notificationService.createNotification({
                userId,
                title: '🎉 Thanh toán thành công!',
                message: `Bạn đã thanh toán thành công đơn đặt ${courtName} lúc ${booking.startTime} ngày ${booking.date.toLocaleDateString('vi-VN')}.`,
                type: 'booking'
            }).catch(err => logger.error("Lỗi tạo thông báo:", err));

            if (ownerId) {
                await notificationService.createNotification({
                    userId: ownerId,
                    title: '🔔 Có đơn đặt sân mới!',
                    message: `Khách hàng vừa thanh toán đơn đặt ${courtName} lúc ${booking.startTime} ngày ${booking.date.toLocaleDateString('vi-VN')}. Mã đơn: ${bookingCode}`,
                    type: 'booking'
                }).catch(err => logger.error("Lỗi tạo thông báo owner:", err));
            }

            return booking;
        }
    }

    async getCourtBookings(courtId: string, date: string) {
        const query: any = {
            courtId,
            status: { $ne: BookingStatus.CANCELLED }
        };

        if (date) {
            const startOfDay = new Date(date);
            startOfDay.setHours(0, 0, 0, 0);

            const endOfDay = new Date(date);
            endOfDay.setHours(23, 59, 59, 999);

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

    async getBookingByCode(code: string) {
        return null;
    }

    async getBookingById(id: string) {
        return null;
    }

    async cancelBooking(id: string, data?: any) {
        const booking = await Booking.findById(id);
        if (!booking) {
            throw new Error('Không tìm thấy đơn đặt sân');
        }
        
        booking.status = BookingStatus.CANCELLED;
        await booking.save();
        
        return booking;
    }
}

export const bookingService = new BookingService();