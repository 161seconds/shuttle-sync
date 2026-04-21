import mongoose, { Document, Schema } from 'mongoose';
import {
    OwnerApplicationStatus, EventType, VoucherType,
    ReportReason, ReportStatus, SportType,
} from '@shuttle-sync/shared';

// ========================
// OWNER APPLICATION
// ========================
export interface IOwnerApplicationDocument extends Document {
    userId: mongoose.Types.ObjectId;
    courtName: string;
    courtAddress: {
        street: string;
        ward: string;
        district: string;
        city: string;
        fullAddress: string;
    };
    courtLocation: { lat: number; lng: number };
    sportTypes: SportType[];
    businessLicense?: string;
    identityDocument: string;
    courtPhotos: string[];
    googlePlaceId?: string;
    additionalNotes?: string;
    status: OwnerApplicationStatus;
    reviewedBy?: mongoose.Types.ObjectId;
    reviewNotes?: string;
    reviewedAt?: Date;
}

const ownerApplicationSchema = new Schema<IOwnerApplicationDocument>(
    {
        userId: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
        courtName: { type: String, required: true },
        courtAddress: {
            street: { type: String, required: true },
            ward: { type: String, required: true },
            district: { type: String, required: true },
            city: { type: String, default: 'Hồ Chí Minh' },
            fullAddress: { type: String, required: true },
        },
        courtLocation: {
            lat: { type: Number, required: true },
            lng: { type: Number, required: true },
        },
        sportTypes: [{ type: String, enum: Object.values(SportType) }],
        businessLicense: String,
        identityDocument: { type: String, required: true },
        courtPhotos: [String],
        googlePlaceId: String,
        additionalNotes: { type: String, maxlength: 1000 },
        status: {
            type: String,
            enum: Object.values(OwnerApplicationStatus),
            default: OwnerApplicationStatus.PENDING,
            index: true,
        },
        reviewedBy: { type: Schema.Types.ObjectId, ref: 'User' },
        reviewNotes: String,
        reviewedAt: Date,
    },
    { timestamps: true }
);

export const OwnerApplication = mongoose.model<IOwnerApplicationDocument>(
    'OwnerApplication', ownerApplicationSchema
);

// ========================
// EVENT
// ========================
export interface IEventDocument extends Document {
    title: string;
    description: string;
    type: EventType;
    bannerImage?: string;
    startDate: Date;
    endDate: Date;
    courtId?: mongoose.Types.ObjectId;
    tournamentId?: mongoose.Types.ObjectId;
    voucher?: {
        code: string;
        type: VoucherType;
        value: number;
        minBookingAmount?: number;
        maxDiscount?: number;
        usageLimit: number;
        usedCount: number;
        expiresAt: Date;
        applicableCourtIds?: mongoose.Types.ObjectId[];
        applicableSportTypes?: SportType[];
    };
    isActive: boolean;
    createdBy: mongoose.Types.ObjectId;
}

const eventSchema = new Schema<IEventDocument>(
    {
        title: { type: String, required: true },
        description: { type: String, required: true },
        type: { type: String, enum: Object.values(EventType), required: true, index: true },
        bannerImage: String,
        startDate: { type: Date, required: true },
        endDate: { type: Date, required: true },
        courtId: { type: Schema.Types.ObjectId, ref: 'Court' },
        tournamentId: { type: Schema.Types.ObjectId, ref: 'Tournament' },
        voucher: {
            code: { type: String, unique: true, sparse: true },
            type: { type: String, enum: Object.values(VoucherType) },
            value: Number,
            minBookingAmount: Number,
            maxDiscount: Number,
            usageLimit: { type: Number, default: 100 },
            usedCount: { type: Number, default: 0 },
            expiresAt: Date,
            applicableCourtIds: [{ type: Schema.Types.ObjectId, ref: 'Court' }],
            applicableSportTypes: [{ type: String, enum: Object.values(SportType) }],
        },
        isActive: { type: Boolean, default: true, index: true },
        createdBy: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    },
    { timestamps: true }
);

eventSchema.index({ startDate: 1, endDate: 1, isActive: 1 });

export const Event = mongoose.model<IEventDocument>('Event', eventSchema);

// ========================
// REVIEW
// ========================
export interface IReviewDocument extends Document {
    userId: mongoose.Types.ObjectId;
    courtId: mongoose.Types.ObjectId;
    bookingId: mongoose.Types.ObjectId;
    rating: number;
    comment?: string;
    photos?: string[];
    reply?: {
        userId: mongoose.Types.ObjectId;
        comment: string;
        repliedAt: Date;
    };
}

const reviewSchema = new Schema<IReviewDocument>(
    {
        userId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
        courtId: { type: Schema.Types.ObjectId, ref: 'Court', required: true, index: true },
        bookingId: { type: Schema.Types.ObjectId, ref: 'Booking', required: true, unique: true },
        rating: { type: Number, required: true, min: 1, max: 5 },
        comment: { type: String, maxlength: 1000 },
        photos: [String],
        reply: {
            userId: { type: Schema.Types.ObjectId, ref: 'User' },
            comment: String,
            repliedAt: Date,
        },
    },
    { timestamps: true }
);

reviewSchema.index({ courtId: 1, rating: -1 });
reviewSchema.index({ userId: 1, courtId: 1 }, { unique: true });

export const Review = mongoose.model<IReviewDocument>('Review', reviewSchema);

// ========================
// REPORT
// ========================
export interface IReportDocument extends Document {
    reporterId: mongoose.Types.ObjectId;
    targetUserId?: mongoose.Types.ObjectId;
    targetCourtId?: mongoose.Types.ObjectId;
    reason: ReportReason;
    description: string;
    evidence?: string[];
    status: ReportStatus;
    resolution?: string;
    resolvedBy?: mongoose.Types.ObjectId;
    resolvedAt?: Date;
}

const reportSchema = new Schema<IReportDocument>(
    {
        reporterId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
        targetUserId: { type: Schema.Types.ObjectId, ref: 'User' },
        targetCourtId: { type: Schema.Types.ObjectId, ref: 'Court' },
        reason: { type: String, enum: Object.values(ReportReason), required: true },
        description: { type: String, required: true, maxlength: 1000 },
        evidence: [String],
        status: {
            type: String,
            enum: Object.values(ReportStatus),
            default: ReportStatus.PENDING,
            index: true,
        },
        resolution: String,
        resolvedBy: { type: Schema.Types.ObjectId, ref: 'User' },
        resolvedAt: Date,
    },
    { timestamps: true }
);

export const Report = mongoose.model<IReportDocument>('Report', reportSchema);

// ========================
// NOTIFICATION
// ========================
export interface INotificationDocument extends Document {
    userId: mongoose.Types.ObjectId;
    title: string;
    message: string;
    type: 'booking' | 'group_play' | 'tournament' | 'system' | 'promotion';
    data?: Record<string, unknown>;
    isRead: boolean;
    readAt?: Date;
}

const notificationSchema = new Schema<INotificationDocument>(
    {
        userId: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
        title: { type: String, required: true },
        message: { type: String, required: true },
        type: {
            type: String,
            enum: ['booking', 'group_play', 'tournament', 'system', 'promotion'],
            required: true,
        },
        data: { type: Schema.Types.Mixed },
        isRead: { type: Boolean, default: false, index: true },
        readAt: Date,
    },
    { timestamps: true }
);

notificationSchema.index({ userId: 1, isRead: 1, createdAt: -1 });

export const Notification = mongoose.model<INotificationDocument>(
    'Notification', notificationSchema
);