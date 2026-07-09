import { Types } from 'mongoose';
import { Venue } from '../models/Venue.model';
import { Court } from '../models/Court';
import { Booking } from '../models/Booking';
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
            return {
                totalCourts: 0,
                totalBookings: 0,
                totalRevenue: 0,
                bookingTrend: [],
                recentBookings: [],
                hasVenue: false
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
                    createdAt: { $gte: thirtyDaysAgo },
                    status: 'confirmed'
                }
            },
            {
                $group: {
                    _id: { $dateToString: { format: "%Y-%m-%d", date: "$createdAt" } },
                    revenue: { $sum: "$finalAmount" },
                    count: { $sum: 1 }
                }
            },
            { $sort: { _id: 1 } }
        ]);

        const bookingTrend = recentBookingsTrend.map(t => ({
            date: t._id,
            revenue: t.revenue,
            count: t.count
        }));

        return {
            hasVenue: true,
            venueId: venue._id,
            venueName: venue.name,
            totalCourts,
            totalBookings,
            totalRevenue,
            bookingTrend,
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
                method: 'cash',
                status: 'paid',
                expiresAt: new Date(Date.now() + 86400000)
            }
        });

        await newBooking.save();
        return newBooking;
    }
}

export const ownerService = new OwnerService();
