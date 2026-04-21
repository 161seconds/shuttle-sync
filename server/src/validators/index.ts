import { z } from 'zod';
import {
    SportType, SkillLevel, BookingType, PaymentMethod,
    TournamentFormat, ReportReason, GroupPlayStatus,
} from '@shuttle-sync/shared';

// ========================
// AUTH
// ========================
export const registerSchema = z.object({
    body: z.object({
        email: z.string().email('Email không hợp lệ'),
        password: z.string()
            .min(6, 'Mật khẩu tối thiểu 6 ký tự')
            .max(50, 'Mật khẩu tối đa 50 ký tự')
            .regex(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/, 'Mật khẩu cần ít nhất 1 chữ hoa, 1 chữ thường và 1 số'),
        displayName: z.string().min(2, 'Tên tối thiểu 2 ký tự').max(50, 'Tên tối đa 50 ký tự').trim(),
        phone: z.string().regex(/^(0|\+84)\d{9}$/, 'Số điện thoại không hợp lệ').optional(),
    }),
});

export const loginSchema = z.object({
    body: z.object({
        email: z.string().email('Email không hợp lệ'),
        password: z.string().min(1, 'Vui lòng nhập mật khẩu'),
    }),
});

export const changePasswordSchema = z.object({
    body: z.object({
        currentPassword: z.string().min(1, 'Vui lòng nhập mật khẩu hiện tại'),
        newPassword: z.string()
            .min(6, 'Mật khẩu mới tối thiểu 6 ký tự')
            .regex(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/, 'Mật khẩu cần ít nhất 1 chữ hoa, 1 chữ thường và 1 số'),
    }),
});

export const updateProfileSchema = z.object({
    body: z.object({
        displayName: z.string().min(2).max(50).trim().optional(),
        phone: z.string().regex(/^(0|\+84)\d{9}$/, 'Số điện thoại không hợp lệ').optional(),
        avatar: z.string().url().optional(),
        skillLevel: z.nativeEnum(SkillLevel).optional(),
        sportPreferences: z.array(z.nativeEnum(SportType)).optional(),
        settings: z.object({
            notifications: z.boolean().optional(),
            emailNotifications: z.boolean().optional(),
            language: z.enum(['vi', 'en']).optional(),
            theme: z.enum(['light', 'dark']).optional(),
        }).optional(),
    }),
});

// ========================
// COURT
// ========================
export const createCourtSchema = z.object({
    body: z.object({
        name: z.string().min(2, 'Tên sân tối thiểu 2 ký tự').max(100),
        description: z.string().max(2000).optional(),
        sportTypes: z.array(z.nativeEnum(SportType)).min(1, 'Chọn ít nhất 1 loại sân'),
        address: z.object({
            street: z.string().min(1),
            ward: z.string().min(1),
            district: z.string().min(1),
            city: z.string().default('Hồ Chí Minh'),
            fullAddress: z.string().min(1),
        }),
        location: z.object({
            lat: z.number().min(-90).max(90),
            lng: z.number().min(-180).max(180),
        }),
        contact: z.object({
            phone: z.string().min(1),
            email: z.string().email().optional(),
            website: z.string().url().optional(),
            facebook: z.string().optional(),
            zalo: z.string().optional(),
        }),
        amenities: z.array(z.string()).optional(),
        operatingHours: z.array(z.object({
            dayOfWeek: z.number().min(0).max(6),
            open: z.string().regex(/^\d{2}:\d{2}$/),
            close: z.string().regex(/^\d{2}:\d{2}$/),
            isOpen: z.boolean().default(true),
        })).min(1),
        pricePerHour: z.array(z.object({
            sportType: z.nativeEnum(SportType),
            timeSlots: z.array(z.object({
                label: z.string(),
                startTime: z.string(),
                endTime: z.string(),
                pricePerHour: z.number().min(0),
                daysOfWeek: z.array(z.number().min(0).max(6)),
            })),
        })),
        courts: z.array(z.object({
            name: z.string().min(1),
            sportType: z.nativeEnum(SportType),
            isIndoor: z.boolean().default(false),
            surface: z.string().optional(),
        })).min(1, 'Cần ít nhất 1 sân con'),
        googlePlaceId: z.string().optional(),
    }),
});

export const searchCourtSchema = z.object({
    query: z.object({
        q: z.string().optional(),
        sportType: z.nativeEnum(SportType).optional(),
        district: z.string().optional(),
        minPrice: z.coerce.number().min(0).optional(),
        maxPrice: z.coerce.number().min(0).optional(),
        date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
        startTime: z.string().regex(/^\d{2}:\d{2}$/).optional(),
        endTime: z.string().regex(/^\d{2}:\d{2}$/).optional(),
        isIndoor: z.coerce.boolean().optional(),
        lat: z.coerce.number().optional(),
        lng: z.coerce.number().optional(),
        radius: z.coerce.number().min(0.5).max(50).optional(),
        sortBy: z.enum(['price', 'rating', 'distance', 'popularity']).optional(),
        sortOrder: z.enum(['asc', 'desc']).optional(),
        page: z.coerce.number().int().min(1).optional(),
        limit: z.coerce.number().int().min(1).max(100).optional(),
    }),
});

// ========================
// BOOKING
// ========================
export const createBookingSchema = z.object({
    body: z.object({
        courtId: z.string().min(1),
        subCourtId: z.string().min(1),
        slotIds: z.array(z.string()).min(1, 'Chọn ít nhất 1 khung giờ'),
        date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
        type: z.nativeEnum(BookingType).default(BookingType.CASUAL),
        paymentMethod: z.nativeEnum(PaymentMethod).default(PaymentMethod.QR_CODE),
        voucherCode: z.string().optional(),
        notes: z.string().max(500).optional(),
        // Guest booking fields
        guestInfo: z.object({
            name: z.string().min(2),
            phone: z.string().regex(/^(0|\+84)\d{9}$/),
            email: z.string().email().optional(),
        }).optional(),
    }),
});

export const cancelBookingSchema = z.object({
    body: z.object({
        reason: z.string().min(1, 'Vui lòng nhập lý do hủy').max(500),
    }),
});

// ========================
// GROUP PLAY
// ========================
export const createGroupPlaySchema = z.object({
    body: z.object({
        title: z.string().min(2).max(100),
        description: z.string().max(500).optional(),
        courtId: z.string().min(1),
        subCourtId: z.string().min(1),
        bookingId: z.string().min(1),
        date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
        startTime: z.string().regex(/^\d{2}:\d{2}$/),
        endTime: z.string().regex(/^\d{2}:\d{2}$/),
        sportType: z.nativeEnum(SportType),
        skillLevel: z.nativeEnum(SkillLevel),
        maxPlayers: z.number().int().min(2).max(30),
        pricePerPlayer: z.number().min(0),
        isPublic: z.boolean().default(true),
        requirements: z.string().max(300).optional(),
        contactInfo: z.string().optional(),
    }),
});

export const searchGroupPlaySchema = z.object({
    query: z.object({
        sportType: z.nativeEnum(SportType).optional(),
        skillLevel: z.nativeEnum(SkillLevel).optional(),
        date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
        district: z.string().optional(),
        status: z.nativeEnum(GroupPlayStatus).optional(),
        page: z.coerce.number().int().min(1).optional(),
        limit: z.coerce.number().int().min(1).max(100).optional(),
    }),
});

// ========================
// TOURNAMENT
// ========================
export const createTournamentSchema = z.object({
    body: z.object({
        title: z.string().min(2).max(200),
        description: z.string().min(10),
        courtId: z.string().min(1),
        sportType: z.nativeEnum(SportType),
        format: z.nativeEnum(TournamentFormat),
        startDate: z.string(),
        endDate: z.string(),
        registrationDeadline: z.string(),
        maxTeams: z.number().int().min(2),
        entryFee: z.number().min(0).default(0),
        prizes: z.array(z.object({
            position: z.number().int().min(1),
            description: z.string(),
            amount: z.number().optional(),
        })).optional(),
        rules: z.string().optional(),
        contactInfo: z.string().min(1),
    }),
});

// ========================
// OWNER APPLICATION
// ========================
export const createOwnerApplicationSchema = z.object({
    body: z.object({
        courtName: z.string().min(2).max(100),
        courtAddress: z.object({
            street: z.string().min(1),
            ward: z.string().min(1),
            district: z.string().min(1),
            city: z.string().default('Hồ Chí Minh'),
            fullAddress: z.string().min(1),
        }),
        courtLocation: z.object({
            lat: z.number(),
            lng: z.number(),
        }),
        sportTypes: z.array(z.nativeEnum(SportType)).min(1),
        googlePlaceId: z.string().optional(),
        additionalNotes: z.string().max(1000).optional(),
    }),
});

// ========================
// REVIEW
// ========================
export const createReviewSchema = z.object({
    body: z.object({
        courtId: z.string().min(1),
        bookingId: z.string().min(1),
        rating: z.number().int().min(1).max(5),
        comment: z.string().max(1000).optional(),
    }),
});

// ========================
// REPORT
// ========================
export const createReportSchema = z.object({
    body: z.object({
        targetUserId: z.string().optional(),
        targetCourtId: z.string().optional(),
        reason: z.nativeEnum(ReportReason),
        description: z.string().min(10).max(1000),
    }).refine(data => data.targetUserId || data.targetCourtId, {
        message: 'Cần chỉ định đối tượng báo cáo',
    }),
});

// ========================
// ADMIN
// ========================
export const banUserSchema = z.object({
    body: z.object({
        reason: z.string().min(1, 'Vui lòng nhập lý do'),
        expiresAt: z.string().optional(), // ISO date, null = permanent
    }),
});

export const reviewApplicationSchema = z.object({
    body: z.object({
        status: z.enum(['approved', 'rejected', 'requires_more_info']),
        reviewNotes: z.string().optional(),
    }),
});

// ========================
// PAGINATION (reusable)
// ========================
export const paginationSchema = z.object({
    query: z.object({
        page: z.coerce.number().int().min(1).optional(),
        limit: z.coerce.number().int().min(1).max(100).optional(),
    }),
});