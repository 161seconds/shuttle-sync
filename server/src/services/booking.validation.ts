import mongoose from 'mongoose';
import { ApiError } from '../utils/ApiError';

export function bookingDate(value: unknown): Date {
    const text = value instanceof Date ? value.toISOString().slice(0, 10) : value;
    if (typeof text !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(text)) throw ApiError.badRequest('Ngày không hợp lệ');
    const date = new Date(`${text}T12:00:00+07:00`);
    if (!Number.isFinite(date.getTime()) || date.toISOString().slice(0, 10) !== text) throw ApiError.badRequest('Ngày không hợp lệ');
    return date;
}

export function validateBookingRange(start: unknown, end: unknown): void {
    const pattern = /^(?:[01]\d|2[0-3]):(?:00|30)$/;
    if (typeof start !== 'string' || typeof end !== 'string' || !pattern.test(start) || !pattern.test(end) || end <= start) {
        throw ApiError.badRequest('Khung giờ phải theo mốc 30 phút, giờ kết thúc lớn hơn giờ bắt đầu');
    }
}

export function validateBookingId(id: unknown): asserts id is string {
    if (typeof id !== 'string' || !mongoose.isObjectIdOrHexString(id)) throw ApiError.badRequest('ID không hợp lệ');
}
