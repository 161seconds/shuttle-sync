import { Types } from 'mongoose';
import { BookingStatus, PaymentStatus } from '@shuttle-sync/shared';
import { Venue } from '../models/Venue.model';
import { Court } from '../models/Court';
import { Booking } from '../models/Booking';
import { Notification, NotificationType } from '../models/Notification';
import { Expense } from '../models/Expense';
import { ApiError } from '../utils/ApiError';

class OwnerService {
    async getVenueByOwnerId(ownerId: string) {
        return Venue.findOne({ ownerId });
    }

    async createVenue(ownerId: string, venueData: any) {
        // Kiểm tra xem owner đã có venue chưa (chỉ cho phép 1)
        const existingVenue = await Venue.findOne({ ownerId });
        if (existingVenue) {
            throw new ApiError(400, 'Tài khoản này đã sở hữu một cơ sở');
        }

        const newVenue = new Venue({
            ...venueData,
            ownerId,
            isActive: true, // Mặc định cho active luôn
        });

        await newVenue.save();
        return newVenue;
    }

    async updateVenue(ownerId: string, updateData: any) {
        const venue = await Venue.findOneAndUpdate({ ownerId }, updateData, { new: true });
        if (!venue) throw new ApiError(404, 'Không tìm thấy cơ sở');
        return venue;
    }

    async updateCourt(ownerId: string, courtId: string, updateData: any) {
        const venue = await this.getVenueByOwnerId(ownerId);
        if (!venue) throw new ApiError(400, 'Cần tạo cơ sở trước khi cập nhật sân');

        const court = await Court.findOne({ _id: courtId, venueId: venue._id });
        if (!court) throw new ApiError(404, 'Không tìm thấy sân');

        Object.assign(court, updateData);
        await court.save();
        return court;
    }


    async getCourts(ownerId: string) {
        const venue = await this.getVenueByOwnerId(ownerId);
        if (!venue) return [];
        return Court.find({ venueId: venue._id });
    }

    async addCourt(ownerId: string, courtData: any) {
        const venue = await this.getVenueByOwnerId(ownerId);
        if (!venue) throw new ApiError(400, 'Cần tạo cơ sở trước khi thêm sân');

        const newCourt = new Court({
            ...courtData,
            venueId: venue._id,
        });
        await newCourt.save();
        return newCourt;
    }

    async getDashboardStats(ownerId: string) {
        const venue = await this.getVenueByOwnerId(ownerId);
        if (!venue) {
            const emptyTrend = Array.from({ length: 30 }, (_, i) => {
                const d = new Date();
                d.setDate(d.getDate() - (29 - i));
                return { date: d.toISOString().slice(0, 10), revenue: 0, count: 0 };
            });
            return {
                totalCourts: 0,
                totalBookings: 0,
                totalRevenue: 0,
                totalExpenses: 0,
                netProfit: 0,
                bookingTrend: emptyTrend,
                bookingTrendBySport: emptyTrend.map(t => ({ date: t.date })),
                bookingsByStatus: [],
                recentBookings: [],
                hasVenue: false,
                venueSports: []
            };
        }

        const thirtyDaysAgo = new Date();
        thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

        // Đếm số sân
        const totalCourts = await Court.countDocuments({ venueId: venue._id });

        // Tổng doanh thu và lượt đặt
        const bookings = await Booking.find({ courtId: venue._id, status: 'confirmed' });
        const totalBookings = bookings.length;
        const totalRevenue = bookings.reduce((sum, b) => sum + (b.finalAmount || 0), 0);

        // Bookings gần đây (10 cái mới nhất)
        const recentBookings = await Booking.find({ courtId: venue._id })
            .sort({ createdAt: -1 })
            .limit(10)
            .populate('userId', 'displayName email avatar')
            .populate('subCourtId', 'name sportType');

        // Xu hướng booking 30 ngày qua
        const recentBookingsTrend = await Booking.aggregate([
            {
                $match: {
                    courtId: venue._id,
                    date: { $gte: thirtyDaysAgo },
                    status: 'confirmed'
                }
            },
            {
                $group: {
                    _id: { $dateToString: { format: "%Y-%m-%d", date: "$date" } },
                    revenue: { $sum: "$finalAmount" },
                    count: { $sum: 1 }
                }
            },
            { $sort: { _id: 1 } }
        ]);

        // Chuẩn bị danh sách 30 ngày gần nhất (từ 29 ngày trước đến hôm nay)
        const dateMap = new Map<string, { revenue: number; count: number }>();
        const sportMap = new Map<string, Record<string, number>>();

        for (let i = 29; i >= 0; i--) {
            const d = new Date();
            d.setDate(d.getDate() - i);
            const dateStr = d.toISOString().slice(0, 10);
            dateMap.set(dateStr, { revenue: 0, count: 0 });
            sportMap.set(dateStr, {});
        }

        recentBookingsTrend.forEach(t => {
            if (dateMap.has(t._id)) {
                dateMap.set(t._id, { revenue: t.revenue, count: t.count });
            }
        });

        const bookingTrend = Array.from(dateMap.entries()).map(([date, val]) => ({
            date,
            revenue: val.revenue,
            count: val.count
        }));

        // Doanh thu 30 ngày qua theo môn thể thao
        const bookingTrendBySportAgg = await Booking.aggregate([
            {
                $match: {
                    courtId: venue._id,
                    date: { $gte: thirtyDaysAgo },
                    status: 'confirmed'
                }
            },
            {
                $lookup: {
                    from: 'courts',
                    localField: 'subCourtId',
                    foreignField: '_id',
                    as: 'courtInfo'
                }
            },
            { $unwind: "$courtInfo" },
            {
                $group: {
                    _id: {
                        date: { $dateToString: { format: "%Y-%m-%d", date: "$date" } },
                        sportType: "$courtInfo.sportType"
                    },
                    revenue: { $sum: "$finalAmount" }
                }
            },
            {
                $group: {
                    _id: "$_id.date",
                    revenues: {
                        $push: {
                            sport: "$_id.sportType",
                            amount: "$revenue"
                        }
                    }
                }
            },
            { $sort: { _id: 1 } }
        ]);

        const sports = (venue.sports && venue.sports.length > 0) ? venue.sports : ['BADMINTON', 'PICKLEBALL'];
        bookingTrendBySportAgg.forEach(t => {
            if (sportMap.has(t._id)) {
                const sportObj: Record<string, number> = {};
                t.revenues.forEach((r: any) => {
                    sportObj[r.sport] = r.amount;
                });
                sportMap.set(t._id, sportObj);
            }
        });

        const bookingTrendBySport = Array.from(sportMap.entries()).map(([date, sportValues]) => {
            const res: any = { date };
            sports.forEach((s: any) => {
                res[s] = sportValues[s] || 0;
            });
            return res;
        });

        // Booking theo trạng thái trong 30 ngày qua
        const bookingsByStatusAgg = await Booking.aggregate([
            {
                $match: {
                    courtId: venue._id,
                    createdAt: { $gte: thirtyDaysAgo }
                }
            },
            {
                $group: {
                    _id: "$status",
                    count: { $sum: 1 }
                }
            }
        ]);
        const bookingsByStatus = bookingsByStatusAgg.map(t => ({
            name: t._id,
            value: t.count
        }));

        const expenses = await Expense.find({
            venueId: venue._id,
            date: { $gte: thirtyDaysAgo }
        }).lean();

        const totalExpenses = expenses.reduce((sum, e) => sum + e.amount, 0);

        const expensesByCategory = Object.entries(
            expenses.reduce((acc: any, e) => {
                acc[e.category] = (acc[e.category] || 0) + e.amount;
                return acc;
            }, {})
        ).map(([name, value]) => ({ name, value }));

        return {
            hasVenue: true,
            venueId: venue._id,
            venueName: venue.name,
            venueSports: venue.sports || [],
            totalCourts,
            totalBookings,
            totalRevenue,
            totalExpenses,
            netProfit: totalRevenue - totalExpenses,
            bookingTrend,
            bookingTrendBySport,
            bookingsByStatus,
            expensesByCategory,
            recentBookings
        };
    }

    async getBookings(ownerId: string) {
        const venue = await this.getVenueByOwnerId(ownerId);
        if (!venue) throw new ApiError(400, 'Cần tạo cơ sở trước khi xem danh sách đặt sân');

        return Booking.find({ courtId: venue._id })
            .sort({ createdAt: -1 })
            .populate('userId', 'displayName email phone avatar')
            .populate('subCourtId', 'name sportType')
            .lean();
    }

    async getSchedule(ownerId: string, dateStr: string) {
        const venue = await this.getVenueByOwnerId(ownerId);
        if (!venue) throw new ApiError(400, 'Cần tạo cơ sở trước khi xem lịch');

        // Tìm tất cả các sân con (sub-courts)
        const courts = await Court.find({ venueId: venue._id }).select('name sportType surfaceType status');
        
        // Parse ngày
        const targetDate = new Date(dateStr);
        targetDate.setHours(0, 0, 0, 0);
        const endOfDay = new Date(targetDate);
        endOfDay.setHours(23, 59, 59, 999);

        // Tìm các booking trong ngày
        const bookings = await Booking.find({
            courtId: venue._id,
            date: { $gte: targetDate, $lte: endOfDay },
            status: { $in: ['confirmed', 'completed', 'pending_payment'] }
        }).populate('userId', 'displayName phone');

        return {
            courts,
            bookings
        };
    }

    async blockSlot(ownerId: string, data: any) {
        const venue = await this.getVenueByOwnerId(ownerId);
        if (!venue) throw new ApiError(400, 'Cần tạo cơ sở trước khi thao tác');

        const { subCourtId, startTime, endTime, date, notes } = data;
        
        const targetDate = new Date(date);
        targetDate.setHours(12, 0, 0, 0);

        // Tạo một booking offline
        const bookingCode = 'OFFLINE_' + Math.floor(100000 + Math.random() * 900000);
        
        const newBooking = new Booking({
            bookingCode,
            courtId: venue._id,
            subCourtId,
            date: targetDate,
            startTime,
            endTime,
            type: 'casual',
            status: 'confirmed', // Đã chốt luôn
            totalAmount: 0,
            finalAmount: 0,
            notes: notes || 'Lịch Offline / Bảo trì',
            payment: {
                method: 'cash' as any,
                status: PaymentStatus.PAID,
                expiresAt: new Date(Date.now() + 86400000)
            }
        });

        await newBooking.save();
        return newBooking;
    }

    async updateBooking(ownerId: string, bookingId: string, data: any) {
        const venue = await this.getVenueByOwnerId(ownerId);
        if (!venue) throw new ApiError(400, 'Cần tạo cơ sở trước khi thao tác');

        const booking = await Booking.findOne({ _id: bookingId, courtId: venue._id });
        if (!booking) throw new ApiError(404, 'Không tìm thấy đơn đặt sân');

        const oldStatus = booking.status;
        if (data.status) {
            booking.status = data.status;
            
            // If the owner marks it as confirmed manually
            if (data.status === 'confirmed' && oldStatus !== 'confirmed') {
                booking.payment.status = PaymentStatus.PAID;
                booking.payment.paidAt = new Date();
                
                if (booking.userId) {
                    await Notification.create({
                        userId: booking.userId,
                        title: 'Đơn đặt sân đã được xác nhận',
                        message: 'Thanh toán thành công và đơn đặt sân đã được duyệt.',
                        type: NotificationType.BOOKING
                    });
                }
            }
        }

        if (data.notes !== undefined) {
            booking.notes = data.notes;
        }

        const timeToMins = (t: string) => {
            const [h, m] = t.split(':').map(Number);
            return h * 60 + m;
        };

        // Rescheduling logic
        if (data.date || data.startTime || data.endTime || data.subCourtId) {
            const newDate = data.date ? new Date(data.date) : booking.date;
            const newStartTime = data.startTime || booking.startTime;
            const newEndTime = data.endTime || booking.endTime;
            const newSubCourtId = data.subCourtId || booking.subCourtId;

            // Normalize newDate to ignore time part
            const s = new Date(newDate);
            s.setHours(0,0,0,0);
            const e = new Date(newDate);
            e.setHours(23,59,59,999);

            const requestedStartMins = timeToMins(newStartTime);
            const requestedEndMins = timeToMins(newEndTime);

            // Fetch conflicting bookings for this court and date
            const conflictingBookings = await Booking.find({
                _id: { $ne: booking._id }, // Ignore current booking
                courtId: venue._id,
                subCourtId: newSubCourtId,
                date: { $gte: s, $lte: e },
                status: { $ne: 'cancelled' }
            });

            for (const b of conflictingBookings) {
                const bStartMins = timeToMins(b.startTime);
                const bEndMins = timeToMins(b.endTime);
                if (requestedStartMins < bEndMins && requestedEndMins > bStartMins) {
                    throw new ApiError(400, `Sân đã có người đặt từ ${b.startTime} đến ${b.endTime}. Vui lòng chọn giờ/sân khác!`);
                }
            }

            booking.date = s; // Save normalized date
            booking.startTime = newStartTime;
            booking.endTime = newEndTime;
            booking.subCourtId = newSubCourtId;
        }

        await booking.save();
        return booking;
    }

    async sendBookingNotification(ownerId: string, bookingId: string, message: string) {
        const venue = await this.getVenueByOwnerId(ownerId);
        if (!venue) throw new ApiError(400, 'Cần tạo cơ sở trước khi thao tác');

        const booking = await Booking.findOne({ _id: bookingId, courtId: venue._id });
        if (!booking) throw new ApiError(404, 'Không tìm thấy đơn đặt sân');
        if (!booking.userId) throw new ApiError(400, 'Không thể gửi thông báo cho khách vãng lai');

        await Notification.create({
            userId: booking.userId,
            title: 'Thông báo từ chủ sân',
            message: message,
            type: NotificationType.BOOKING
        });

        return { success: true };
    }

    // EXPENSE MANAGEMENT
    async getExpenses(ownerId: string, query: any) {
        const venue = await this.getVenueByOwnerId(ownerId);
        if (!venue) throw new ApiError(400, 'Cần tạo cơ sở trước khi thao tác');

        const filter: any = { venueId: venue._id };
        
        if (query.month && query.year) {
            const startDate = new Date(parseInt(query.year), parseInt(query.month) - 1, 1);
            const endDate = new Date(parseInt(query.year), parseInt(query.month), 0, 23, 59, 59, 999);
            filter.date = { $gte: startDate, $lte: endDate };
        }

        const expenses = await Expense.find(filter).sort({ date: -1 });
        return expenses;
    }

    async createExpense(ownerId: string, data: any) {
        const venue = await this.getVenueByOwnerId(ownerId);
        if (!venue) throw new ApiError(400, 'Cần tạo cơ sở trước khi thao tác');

        const expense = new Expense({
            ...data,
            venueId: venue._id
        });

        await expense.save();
        return expense;
    }

    async updateExpense(ownerId: string, expenseId: string, data: any) {
        const venue = await this.getVenueByOwnerId(ownerId);
        if (!venue) throw new ApiError(400, 'Cần tạo cơ sở trước khi thao tác');

        const expense = await Expense.findOneAndUpdate(
            { _id: expenseId, venueId: venue._id },
            { $set: data },
            { new: true }
        );

        if (!expense) throw new ApiError(404, 'Không tìm thấy chi phí');
        return expense;
    }

    async deleteExpense(ownerId: string, expenseId: string) {
        const venue = await this.getVenueByOwnerId(ownerId);
        if (!venue) throw new ApiError(400, 'Cần tạo cơ sở trước khi thao tác');

        const result = await Expense.findOneAndDelete({ _id: expenseId, venueId: venue._id });
        if (!result) throw new ApiError(404, 'Không tìm thấy chi phí');
        
        return { success: true };
    }
}

export const ownerService = new OwnerService();
