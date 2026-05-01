import rateLimit from 'express-rate-limit';
import { config } from '../config';

/**
 * General API rate limiter
 */
export const apiLimiter = rateLimit({
    windowMs: config.rateLimit.windowMs,
    max: config.rateLimit.maxRequests,
    standardHeaders: true,
    legacyHeaders: false,
    message: {
        success: false,
        message: 'Quá nhiều yêu cầu, vui lòng thử lại sau',
    },
});

/**
 * Strict limiter for auth endpoints
 */
export const authLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 10, // 10 attempts per 15 min
    standardHeaders: true,
    legacyHeaders: false,
    message: {
        success: false,
        message: 'Quá nhiều lần đăng nhập thất bại, vui lòng thử lại sau 15 phút',
    },
});

/**
 * Booking rate limiter - prevent slot abuse
 */
export const bookingLimiter = rateLimit({
    windowMs: 60 * 1000, // 1 minute
    max: 5,
    standardHeaders: true,
    legacyHeaders: false,
    message: {
        success: false,
        message: 'Vui lòng chờ trước khi đặt sân tiếp',
    },
});

// Thêm khiên bảo vệ riêng cho API Tìm Sân
export const searchCourtLimiter = rateLimit({
    windowMs: 1 * 60 * 1000, // 1 phút
    max: 30, // 30 requests / phút
    message: {
        success: false,
        message: 'Thao tác tìm kiếm quá nhanh! Vui lòng chậm lại chút nhé.'
    }
});