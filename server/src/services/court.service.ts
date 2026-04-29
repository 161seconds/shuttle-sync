import mongoose from 'mongoose';
import { CourtStatus, SportType, SlotStatus } from '@shuttle-sync/shared';
import { ICourtDocument, TimeSlot, Court, Venue } from '../models';
import { ApiError } from '../utils/ApiError';
import { createSlug, calculatePagination, generateTimeSlots } from '../utils/helpers';
import { logger } from '../utils/logger';

class CourtService {
    private async formatVenueForFrontend(venue: any) {
        const subCourts = await Court.find({ venueId: venue._id, status: 'AVAILABLE' }).lean();

        const formattedSubCourts = subCourts.map(c => ({
            ...c,
            sportType: c.sportType.toLowerCase()
        }));

        // 2. Xử lý địa chỉ thông minh: Loại bỏ các phần tử bị trống
        const street = venue.address?.street || '';
        const ward = venue.address?.state || '';
        const district = venue.address?.city || '';
        const city = 'Hồ Chí Minh';

        const addrParts = [street, ward, district, city].filter(part => part && part.trim() !== '');
        const fullAddr = addrParts.join(', ');

        return {
            ...venue,
            id: venue._id,
            _id: venue._id,

            address: {
                street: street,
                ward: ward,
                district: district,
                city: city,
                fullAddress: fullAddr
            },
            fullAddress: fullAddr,

            sportTypes: venue.sports ? venue.sports.map((s: string) => s.toLowerCase()) : ['pickleball'],
            averageRating: venue.rating?.totalScore || 0,
            reviewCount: venue.rating?.reviewsCount || 0,
            status: venue.isActive ? 'active' : 'closed',
            isVerified: true,
            totalBookings: 0,
            photos: venue.photos || [],
            amenities: venue.amenities || [],

            courts: formattedSubCourts || [],

            operatingHours: Array.from({ length: 7 }, (_, i) => ({
                dayOfWeek: i, open: '06:00', close: '22:00', isOpen: true,
            })),

            pricePerHour: [
                { sportType: 'pickleball', timeSlots: [{ pricePerHour: 120000, daysOfWeek: [0, 1, 2, 3, 4, 5, 6], startTime: '00:00', endTime: '23:59' }] },
                { sportType: 'badminton', timeSlots: [{ pricePerHour: 80000, daysOfWeek: [0, 1, 2, 3, 4, 5, 6], startTime: '00:00', endTime: '23:59' }] }
            ]
        };
    }

    // ============================================================================
    // 1. TẠO SÂN MỚI (Tạm giữ logic cũ cho Owner)
    // ============================================================================
    async createCourt(ownerId: string, data: any): Promise<any> {
        const slug = createSlug(data.name) + '-' + Date.now().toString(36);

        const court = await Court.create({
            ...data,
            slug,
            ownerId,
            location: {
                type: 'Point',
                coordinates: [data.location.lng, data.location.lat],
            },
            status: CourtStatus.PENDING_APPROVAL,
            courts: data.courts.map((c: any) => ({
                ...c,
                _id: new mongoose.Types.ObjectId(),
                isActive: true,
            })),
        });

        logger.info(`Court created: ${court.name} by owner ${ownerId}`);
        return court;
    }

    // ============================================================================
    // 2. LẤY CHI TIẾT 1 CƠ SỞ (Tích hợp bộ chuyển đổi)
    // ============================================================================
    async getCourtByIdOrSlug(idOrSlug: string) {
        const query = mongoose.isValidObjectId(idOrSlug)
            ? { _id: idOrSlug }
            : { _id: idOrSlug }; // Tạm dùng _id vì Venue chưa có slug

        const venue = await Venue.findOne({
            ...query,
            isActive: true,
        }).populate('ownerId', 'displayName avatar phone').lean();

        if (!venue) {
            throw ApiError.notFound('Không tìm thấy cơ sở sân này');
        }

        return await this.formatVenueForFrontend(venue);
    }

    // ============================================================================
    // 3. TÌM KIẾM CƠ SỞ
    // ============================================================================
    async searchCourts(params: any) {
        const { q, sportType, district, sortBy, page = 1, limit = 12, lat, lng, radius } = params;

        const filter: any = { isActive: true };

        if (q) filter.name = { $regex: q as string, $options: 'i' };

        if (sportType) {
            filter.sports = sportType.toUpperCase();
        }

        if (district && district !== 'Tất cả') {
            filter['address.city'] = { $regex: district as string, $options: 'i' };
        }

        if (lat && lng) {
            const radiusKm = radius || 10;
            filter.location = {
                $near: {
                    $geometry: { type: 'Point', coordinates: [lng, lat] },
                    $maxDistance: radiusKm * 1000,
                },
            };
        }

        // Đếm số lượng tổng (Xử lý lỗi $near)
        const countFilter = { ...filter };
        if (countFilter.location && countFilter.location.$near) {
            const maxDistance = countFilter.location.$near.$maxDistance;
            const coords = countFilter.location.$near.$geometry.coordinates;
            countFilter.location = {
                $geoWithin: { $centerSphere: [coords, maxDistance / 6378100] }
            };
        }

        const totalCourts = await Venue.countDocuments(countFilter);
        const { page: currentPage, limit: currentLimit, totalPages, skip } = calculatePagination(
            page,
            limit,
            totalCourts
        );

        // Sắp xếp
        let sort: any = {};
        switch (sortBy) {
            case 'rating':
                sort = { 'rating.totalScore': -1 };
                break;
            case 'distance':
                sort = undefined;
                break;
            default:
                if (!lat || !lng) sort = { createdAt: -1 };
                else sort = undefined;
        }

        let query = Venue.find(filter)
            .skip(skip)
            .limit(currentLimit)
            .populate('ownerId', 'displayName avatar');

        if (sort) query = query.sort(sort);

        const venues = await query.lean();

        // CHẠY QUA BỘ CHUYỂN ĐỔI FRONTEND
        const formattedVenues = await Promise.all(venues.map(v => this.formatVenueForFrontend(v)));

        // Tính khoảng cách
        if (lat && lng) {
            formattedVenues.forEach(venue => {
                if (venue.location && venue.location.coordinates) {
                    const [vLng, vLat] = venue.location.coordinates;
                    const R = 6371;
                    const dLat = (vLat - lat) * Math.PI / 180;
                    const dLng = (vLng - lng) * Math.PI / 180;
                    const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
                        Math.cos(lat * Math.PI / 180) * Math.cos(vLat * Math.PI / 180) *
                        Math.sin(dLng / 2) * Math.sin(dLng / 2);
                    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
                    (venue as any).distance = R * c;
                }
            });
        }

        return {
            courts: formattedVenues,
            pagination: { page: currentPage, limit: currentLimit, totalCourts, totalPages },
        };
    }

    // ============================================================================
    // 4. SINH GIỜ ĐẶT SÂN TỰ ĐỘNG
    // ============================================================================
    async generateSlotsForDate(venueId: string, date: Date): Promise<void> {
        const activeCourts = await Court.find({ venueId: venueId, status: 'AVAILABLE' });
        if (!activeCourts || activeCourts.length === 0) return;

        const openTime = '06:00';
        const closeTime = '22:00';

        for (const subCourt of activeCourts) {
            const slots = generateTimeSlots(openTime, closeTime, 60);

            for (const slot of slots) {
                const exists = await TimeSlot.findOne({
                    courtId: venueId,
                    subCourtId: subCourt._id,
                    date,
                    startTime: slot.start,
                });

                if (!exists) {
                    const price = subCourt.pricePerHour || 100000;
                    await TimeSlot.create({
                        courtId: venueId,
                        subCourtId: subCourt._id,
                        date,
                        startTime: slot.start,
                        endTime: slot.end,
                        price,
                        status: SlotStatus.AVAILABLE,
                    });
                }
            }
        }
    }

    // ============================================================================
    // 5. LẤY DANH SÁCH KHUNG GIỜ TRỐNG
    // ============================================================================
    async getAvailableSlots(courtId: string, subCourtId: string, date: string) {
        const dateObj = new Date(date);
        dateObj.setHours(0, 0, 0, 0);

        const existingSlots = await TimeSlot.countDocuments({
            courtId: courtId,
            subCourtId: subCourtId,
            date: dateObj,
        });

        if (existingSlots === 0) {
            await this.generateSlotsForDate(courtId, dateObj);
        }

        const slots = await TimeSlot.find({
            courtId: courtId,
            subCourtId: subCourtId,
            date: dateObj,
        }).sort({ startTime: 1 }).lean();

        return slots;
    }

    // ============================================================================
    // 6. LẤY DANH SÁCH CƠ SỞ ĐANG HOẠT ĐỘNG
    // ============================================================================
    async getActiveCourts(params: any) {
        const filter: any = { isActive: true };
        if (params.sportType) filter.sports = params.sportType;
        if (params.district) filter['address.city'] = { $regex: params.district, $options: 'i' };

        const total = await Venue.countDocuments(filter);
        const { page, limit, totalPages, skip } = calculatePagination(
            params.page || 1,
            params.limit || 20,
            total
        );

        const venues = await Venue.find(filter)
            .skip(skip)
            .limit(limit)
            .populate('ownerId', 'displayName avatar')
            .lean();

        // CHẠY QUA BỘ CHUYỂN ĐỔI FRONTEND
        const formattedVenues = await Promise.all(venues.map(v => this.formatVenueForFrontend(v)));

        return {
            courts: formattedVenues,
            pagination: { page, limit, total, totalPages },
        };
    }

    // ============================================================================
    // 7. LẤY DANH SÁCH QUẬN/HUYỆN
    // ============================================================================
    async getDistricts(): Promise<string[]> {
        const districts = await Venue.distinct('address.city', {
            isActive: true,
        });
        return districts.sort();
    }

    // ============================================================================
    // CÁC HÀM CÒN LẠI CHO OWNER & ADMIN (Tạm giữ nguyên)
    // ============================================================================
    async getCourtsByOwner(ownerId: string): Promise<any[]> {
        return Court.find({ ownerId }).sort({ createdAt: -1 });
    }

    async updateCourt(
        courtId: string,
        ownerId: string,
        updates: Partial<ICourtDocument>,
        isAdmin = false
    ): Promise<ICourtDocument> {
        const court = await Court.findById(courtId);
        if (!court) throw ApiError.notFound('Không tìm thấy sân');
        if (!isAdmin && court.ownerId?.toString() !== ownerId) {
            throw ApiError.forbidden('Bạn không phải chủ sân này');
        }
        delete (updates as any)._id;
        delete (updates as any).ownerId;
        delete (updates as any).status;
        if (updates.name) {
            (updates as any).slug = createSlug(updates.name) + '-' + Date.now().toString(36);
        }
        Object.assign(court, updates);
        await court.save();
        return court;
    }

    async updateCourtStatus(
        courtId: string,
        status: CourtStatus,
        adminId: string
    ): Promise<ICourtDocument> {
        const court = await Court.findById(courtId);
        if (!court) throw ApiError.notFound('Không tìm thấy sân');
        court.status = status;
        await court.save();
        return court;
    }
}

export const courtService = new CourtService();