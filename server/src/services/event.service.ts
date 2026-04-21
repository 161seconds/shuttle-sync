import { EventType, VoucherType } from '@shuttle-sync/shared';
import { Event, IEventDocument } from '../models';
import { ApiError } from '../utils/ApiError';
import { calculatePagination, generateVoucherCode } from '../utils/helpers';

class EventService {
    async createEvent(createdBy: string, data: any): Promise<IEventDocument> {
        if (data.voucher && !data.voucher.code) {
            data.voucher.code = generateVoucherCode();
        }

        const event = await Event.create({
            ...data,
            startDate: new Date(data.startDate),
            endDate: new Date(data.endDate),
            createdBy,
        });

        return event;
    }

    async getActiveEvents(params: {
        type?: EventType;
        page?: number;
        limit?: number;
    }) {
        const now = new Date();
        const filter: any = {
            isActive: true,
            startDate: { $lte: now },
            endDate: { $gte: now },
        };

        if (params.type) filter.type = params.type;

        const total = await Event.countDocuments(filter);
        const { page, limit, totalPages, skip } = calculatePagination(
            params.page || 1,
            params.limit || 20,
            total
        );

        const events = await Event.find(filter)
            .sort({ startDate: -1 })
            .skip(skip)
            .limit(limit)
            .populate('courtId', 'name slug')
            .lean();

        return { events, pagination: { page, limit, total, totalPages } };
    }

    async getEventById(id: string): Promise<IEventDocument> {
        const event = await Event.findById(id)
            .populate('courtId', 'name slug address')
            .populate('tournamentId');

        if (!event) throw ApiError.notFound('Không tìm thấy sự kiện');
        return event;
    }

    async validateVoucher(code: string, bookingAmount: number, courtId?: string) {
        const event = await Event.findOne({
            'voucher.code': code.toUpperCase(),
            isActive: true,
            endDate: { $gte: new Date() },
        });

        if (!event || !event.voucher) {
            throw ApiError.notFound('Mã giảm giá không hợp lệ hoặc đã hết hạn');
        }

        const v = event.voucher;

        if (v.usedCount >= v.usageLimit) {
            throw ApiError.badRequest('Mã giảm giá đã hết lượt sử dụng');
        }

        if (v.expiresAt && new Date(v.expiresAt) < new Date()) {
            throw ApiError.badRequest('Mã giảm giá đã hết hạn');
        }

        if (v.minBookingAmount && bookingAmount < v.minBookingAmount) {
            throw ApiError.badRequest(`Đơn hàng tối thiểu ${v.minBookingAmount.toLocaleString()}đ`);
        }

        if (courtId && v.applicableCourtIds?.length) {
            const applicable = v.applicableCourtIds.some(id => id.toString() === courtId);
            if (!applicable) {
                throw ApiError.badRequest('Mã giảm giá không áp dụng cho sân này');
            }
        }

        let discount = 0;
        if (v.type === VoucherType.PERCENTAGE) {
            discount = Math.floor(bookingAmount * v.value / 100);
            if (v.maxDiscount) discount = Math.min(discount, v.maxDiscount);
        } else if (v.type === VoucherType.FIXED_AMOUNT) {
            discount = v.value;
        }

        return {
            code: v.code,
            discount,
            type: v.type,
            value: v.value,
        };
    }

    async useVoucher(code: string) {
        await Event.findOneAndUpdate(
            { 'voucher.code': code },
            { $inc: { 'voucher.usedCount': 1 } }
        );
    }
}

export const eventService = new EventService();