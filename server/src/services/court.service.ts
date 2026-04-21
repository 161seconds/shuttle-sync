import mongoose from 'mongoose';
import { CourtStatus, SportType, SlotStatus } from '@shuttle-sync/shared';
import { Court, ICourtDocument, TimeSlot } from '../models';
import { ApiError } from '../utils/ApiError';
import { createSlug, calculatePagination, generateTimeSlots } from '../utils/helpers';
import { logger } from '../utils/logger';

class CourtService {
    /**
     * Create a new court (by court owner)
     */
    async createCourt(ownerId: string, data: any): Promise<ICourtDocument> {
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

    /**
     * Get court by ID or slug
     */
    async getCourtByIdOrSlug(idOrSlug: string): Promise<ICourtDocument> {
        const query = mongoose.isValidObjectId(idOrSlug)
            ? { _id: idOrSlug }
            : { slug: idOrSlug };

        const court = await Court.findOne({
            ...query,
            status: { $in: [CourtStatus.ACTIVE, CourtStatus.PENDING_APPROVAL] },
        }).populate('ownerId', 'displayName avatar phone');

        if (!court) {
            throw ApiError.notFound('Không tìm thấy sân');
        }

        return court;
    }

    /**
     * Search courts with filters, geo, text search
     */
    async searchCourts(params: {
        q?: string;
        sportType?: SportType;
        district?: string;
        minPrice?: number;
        maxPrice?: number;
        date?: string;
        isIndoor?: boolean;
        lat?: number;
        lng?: number;
        radius?: number;
        sortBy?: string;
        sortOrder?: string;
        page?: number;
        limit?: number;
    }) {
        const filter: any = { status: CourtStatus.ACTIVE };

        // Text search
        if (params.q) {
            filter.$text = { $search: params.q };
        }

        // Sport type
        if (params.sportType) {
            filter.sportTypes = params.sportType;
        }

        // District
        if (params.district) {
            filter['address.district'] = { $regex: params.district, $options: 'i' };
        }

        // Indoor filter
        if (params.isIndoor !== undefined) {
            filter['courts.isIndoor'] = params.isIndoor;
        }

        // Price range
        if (params.minPrice || params.maxPrice) {
            filter['pricePerHour.timeSlots.pricePerHour'] = {};
            if (params.minPrice) filter['pricePerHour.timeSlots.pricePerHour'].$gte = params.minPrice;
            if (params.maxPrice) filter['pricePerHour.timeSlots.pricePerHour'].$lte = params.maxPrice;
        }

        // Geo search
        if (params.lat && params.lng) {
            const radiusKm = params.radius || 10;
            filter.location = {
                $near: {
                    $geometry: {
                        type: 'Point',
                        coordinates: [params.lng, params.lat],
                    },
                    $maxDistance: radiusKm * 1000,
                },
            };
        }

        // Count total
        const total = await Court.countDocuments(filter);
        const { page, limit, totalPages, skip } = calculatePagination(
            params.page || 1,
            params.limit || 20,
            total
        );

        // Sort
        let sort: any = {};
        switch (params.sortBy) {
            case 'price':
                sort = { 'pricePerHour.timeSlots.pricePerHour': params.sortOrder === 'desc' ? -1 : 1 };
                break;
            case 'rating':
                sort = { averageRating: -1 };
                break;
            case 'popularity':
                sort = { totalBookings: -1 };
                break;
            default:
                if (params.q) {
                    sort = { score: { $meta: 'textScore' } };
                } else {
                    sort = { averageRating: -1, totalBookings: -1 };
                }
        }

        const courts = await Court.find(filter)
            .sort(sort)
            .skip(skip)
            .limit(limit)
            .populate('ownerId', 'displayName avatar')
            .lean();

        return {
            courts,
            pagination: { page, limit, total, totalPages },
        };
    }

    /**
     * Get all courts owned by a specific user
     */
    async getCourtsByOwner(ownerId: string): Promise<ICourtDocument[]> {
        return Court.find({ ownerId }).sort({ createdAt: -1 });
    }

    /**
     * Update court details
     */
    async updateCourt(
        courtId: string,
        ownerId: string,
        updates: Partial<ICourtDocument>,
        isAdmin = false
    ): Promise<ICourtDocument> {
        const court = await Court.findById(courtId);
        if (!court) throw ApiError.notFound('Không tìm thấy sân');

        if (!isAdmin && court.ownerId.toString() !== ownerId) {
            throw ApiError.forbidden('Bạn không phải chủ sân này');
        }

        // Don't allow changing certain fields
        delete (updates as any)._id;
        delete (updates as any).ownerId;
        delete (updates as any).status;
        delete (updates as any).totalBookings;
        delete (updates as any).averageRating;
        delete (updates as any).reviewCount;

        if (updates.name) {
            (updates as any).slug = createSlug(updates.name) + '-' + Date.now().toString(36);
        }

        Object.assign(court, updates);
        await court.save();

        return court;
    }

    /**
     * Generate time slots for a court on a specific date
     */
    async generateSlotsForDate(courtId: string, date: Date): Promise<void> {
        const court = await Court.findById(courtId);
        if (!court) throw ApiError.notFound('Không tìm thấy sân');

        const dayOfWeek = date.getDay();
        const opHours = court.operatingHours.find(
            h => h.dayOfWeek === dayOfWeek && h.isOpen
        );

        if (!opHours) return; // Sân đóng ngày này

        const activeCourts = court.courts.filter(c => c.isActive);

        for (const subCourt of activeCourts) {
            const slots = generateTimeSlots(opHours.open, opHours.close, 60);

            // Find price for this time
            const pricing = court.pricePerHour.find(
                p => p.sportType === subCourt.sportType
            );

            for (const slot of slots) {
                // Check if slot already exists
                const exists = await TimeSlot.findOne({
                    courtId: court._id,
                    subCourtId: subCourt._id,
                    date,
                    startTime: slot.start,
                });

                if (!exists) {
                    // Determine price based on time slot config
                    let price = 100000; // default
                    if (pricing) {
                        const matchingPrice = pricing.timeSlots.find(
                            ts =>
                                ts.daysOfWeek.includes(dayOfWeek) &&
                                slot.start >= ts.startTime &&
                                slot.start < ts.endTime
                        );
                        if (matchingPrice) price = matchingPrice.pricePerHour;
                    }

                    await TimeSlot.create({
                        courtId: court._id,
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

    /**
     * Get available time slots for a court on a date
     */
    async getAvailableSlots(courtId: string, subCourtId: string, date: string) {
        const dateObj = new Date(date);
        dateObj.setHours(0, 0, 0, 0);

        // Auto-generate slots if they don't exist
        const existingSlots = await TimeSlot.countDocuments({
            courtId,
            subCourtId,
            date: dateObj,
        });

        if (existingSlots === 0) {
            await this.generateSlotsForDate(courtId, dateObj);
        }

        const slots = await TimeSlot.find({
            courtId,
            subCourtId,
            date: dateObj,
        }).sort({ startTime: 1 }).lean();

        return slots;
    }

    /**
     * Get courts with active group plays or bookings (for "sân đang có người chơi" feature)
     */
    async getActiveCourts(params: {
        sportType?: SportType;
        district?: string;
        page?: number;
        limit?: number;
    }) {
        const today = new Date();
        today.setHours(0, 0, 0, 0);

        const filter: any = {
            status: CourtStatus.ACTIVE,
        };

        if (params.sportType) filter.sportTypes = params.sportType;
        if (params.district) filter['address.district'] = { $regex: params.district, $options: 'i' };

        // Find courts that have booked slots today
        const bookedCourtIds = await TimeSlot.distinct('courtId', {
            date: today,
            status: SlotStatus.BOOKED,
        });

        filter._id = { $in: bookedCourtIds };

        const total = await Court.countDocuments(filter);
        const { page, limit, totalPages, skip } = calculatePagination(
            params.page || 1,
            params.limit || 20,
            total
        );

        const courts = await Court.find(filter)
            .skip(skip)
            .limit(limit)
            .populate('ownerId', 'displayName avatar')
            .lean();

        return {
            courts,
            pagination: { page, limit, total, totalPages },
        };
    }

    /**
     * Admin: approve/reject court
     */
    async updateCourtStatus(
        courtId: string,
        status: CourtStatus,
        adminId: string
    ): Promise<ICourtDocument> {
        const court = await Court.findById(courtId);
        if (!court) throw ApiError.notFound('Không tìm thấy sân');

        court.status = status;
        if (status === CourtStatus.ACTIVE) {
            court.isVerified = true;
        }
        await court.save();

        logger.info(`Court ${courtId} status updated to ${status} by admin ${adminId}`);
        return court;
    }

    /**
     * Get all districts with courts (for filter dropdown)
     */
    async getDistricts(): Promise<string[]> {
        const districts = await Court.distinct('address.district', {
            status: CourtStatus.ACTIVE,
        });
        return districts.sort();
    }
}

export const courtService = new CourtService();