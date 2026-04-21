import { nanoid } from 'nanoid';
import slugify from 'slugify';
import { PAGINATION } from '@shuttle-sync/shared';

/**
 * Generate unique booking code: SS-XXXXXX
 */
export const generateBookingCode = (): string => {
    return `SS-${nanoid(8).toUpperCase()}`;
};

/**
 * Generate unique voucher code
 */
export const generateVoucherCode = (prefix = 'SHUTTLE'): string => {
    return `${prefix}-${nanoid(6).toUpperCase()}`;
};

/**
 * Create URL-friendly slug from Vietnamese text
 */
export const createSlug = (text: string): string => {
    return slugify(text, {
        lower: true,
        strict: true,
        locale: 'vi',
    });
};

/**
 * Calculate pagination metadata
 */
export const calculatePagination = (
    page: number,
    limit: number,
    total: number
) => {
    const safePage = Math.max(1, page || PAGINATION.DEFAULT_PAGE);
    const safeLimit = Math.min(
        Math.max(1, limit || PAGINATION.DEFAULT_LIMIT),
        PAGINATION.MAX_LIMIT
    );
    const totalPages = Math.ceil(total / safeLimit);
    const skip = (safePage - 1) * safeLimit;

    return {
        page: safePage,
        limit: safeLimit,
        total,
        totalPages,
        skip,
    };
};

/**
 * Parse time string "HH:mm" to minutes since midnight
 */
export const timeToMinutes = (time: string): number => {
    const [hours, minutes] = time.split(':').map(Number);
    return hours * 60 + minutes;
};

/**
 * Check if two time ranges overlap
 */
export const isTimeOverlap = (
    start1: string, end1: string,
    start2: string, end2: string
): boolean => {
    const s1 = timeToMinutes(start1);
    const e1 = timeToMinutes(end1);
    const s2 = timeToMinutes(start2);
    const e2 = timeToMinutes(end2);
    return s1 < e2 && s2 < e1;
};

/**
 * Generate time slots for a day based on operating hours
 */
export const generateTimeSlots = (
    openTime: string,
    closeTime: string,
    durationMinutes = 60
): { start: string; end: string }[] => {
    const slots: { start: string; end: string }[] = [];
    let current = timeToMinutes(openTime);
    const close = timeToMinutes(closeTime);

    while (current + durationMinutes <= close) {
        const startH = Math.floor(current / 60).toString().padStart(2, '0');
        const startM = (current % 60).toString().padStart(2, '0');
        const endMinutes = current + durationMinutes;
        const endH = Math.floor(endMinutes / 60).toString().padStart(2, '0');
        const endM = (endMinutes % 60).toString().padStart(2, '0');

        slots.push({
            start: `${startH}:${startM}`,
            end: `${endH}:${endM}`,
        });

        current += durationMinutes;
    }

    return slots;
};

/**
 * Get Vietnam timezone date
 */
export const getVNDate = (date?: Date): Date => {
    const d = date || new Date();
    return new Date(d.toLocaleString('en-US', { timeZone: 'Asia/Ho_Chi_Minh' }));
};

/**
 * Format currency VND
 */
export const formatVND = (amount: number): string => {
    return new Intl.NumberFormat('vi-VN', {
        style: 'currency',
        currency: 'VND',
    }).format(amount);
};