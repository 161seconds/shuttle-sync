import mongoose, { Document, Schema } from 'mongoose';
import {
    SportType, CourtStatus,
} from '@shuttle-sync/shared';

export interface ICourtDocument extends Document {
    name: string;
    slug: string;
    description?: string;
    ownerId: mongoose.Types.ObjectId;
    sportTypes: SportType[];
    status: CourtStatus;
    address: {
        street: string;
        ward: string;
        district: string;
        city: string;
        fullAddress: string;
    };
    location: {
        type: 'Point';
        coordinates: [number, number]; // [lng, lat]
    };
    contact: {
        phone: string;
        email?: string;
        website?: string;
        facebook?: string;
        zalo?: string;
    };
    amenities: string[];
    operatingHours: {
        dayOfWeek: number;
        open: string;
        close: string;
        isOpen: boolean;
    }[];
    pricePerHour: {
        sportType: SportType;
        timeSlots: {
            label: string;
            startTime: string;
            endTime: string;
            pricePerHour: number;
            daysOfWeek: number[];
        }[];
    }[];
    courts: {
        _id: mongoose.Types.ObjectId;
        name: string;
        sportType: SportType;
        isIndoor: boolean;
        surface?: string;
        isActive: boolean;
    }[];
    photos: {
        url: string;
        caption?: string;
        isMain: boolean;
        source: 'upload' | 'google';
    }[];
    googlePlaceId?: string;
    googleRating?: number;
    googleReviewCount?: number;
    googlePhotos?: string[];
    totalBookings: number;
    averageRating: number;
    reviewCount: number;
    isVerified: boolean;
}

const courtSchema = new Schema<ICourtDocument>(
    {
        name: { type: String, required: true, trim: true, index: true },
        slug: { type: String, required: true, unique: true, lowercase: true },
        description: { type: String, maxlength: 2000 },
        ownerId: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
        sportTypes: [{
            type: String,
            enum: Object.values(SportType),
            required: true,
        }],
        status: {
            type: String,
            enum: Object.values(CourtStatus),
            default: CourtStatus.PENDING_APPROVAL,
            index: true,
        },
        address: {
            street: { type: String, required: true },
            ward: { type: String, required: true },
            district: { type: String, required: true, index: true },
            city: { type: String, required: true, default: 'Hồ Chí Minh' },
            fullAddress: { type: String, required: true },
        },
        location: {
            type: { type: String, enum: ['Point'], default: 'Point' },
            coordinates: {
                type: [Number], // [longitude, latitude]
                required: true,
            },
        },
        contact: {
            phone: { type: String, required: true },
            email: String,
            website: String,
            facebook: String,
            zalo: String,
        },
        amenities: [{ type: String }],
        operatingHours: [{
            dayOfWeek: { type: Number, min: 0, max: 6, required: true },
            open: { type: String, required: true },
            close: { type: String, required: true },
            isOpen: { type: Boolean, default: true },
        }],
        pricePerHour: [{
            sportType: { type: String, enum: Object.values(SportType) },
            timeSlots: [{
                label: String,
                startTime: String,
                endTime: String,
                pricePerHour: Number,
                daysOfWeek: [Number],
            }],
        }],
        courts: [{
            name: { type: String, required: true },
            sportType: { type: String, enum: Object.values(SportType), required: true },
            isIndoor: { type: Boolean, default: false },
            surface: String,
            isActive: { type: Boolean, default: true },
        }],
        photos: [{
            url: { type: String, required: true },
            caption: String,
            isMain: { type: Boolean, default: false },
            source: { type: String, enum: ['upload', 'google'], default: 'upload' },
        }],
        googlePlaceId: { type: String, sparse: true },
        googleRating: Number,
        googleReviewCount: Number,
        googlePhotos: [String],
        totalBookings: { type: Number, default: 0 },
        averageRating: { type: Number, default: 0 },
        reviewCount: { type: Number, default: 0 },
        isVerified: { type: Boolean, default: false },
    },
    {
        timestamps: true,
        toJSON: { virtuals: true },
        toObject: { virtuals: true },
    }
);

// 2dsphere index for geospatial queries
courtSchema.index({ location: '2dsphere' });
// Text search index
courtSchema.index({ name: 'text', 'address.fullAddress': 'text', 'address.district': 'text' });
// Compound indexes
courtSchema.index({ sportTypes: 1, status: 1, 'address.district': 1 });
courtSchema.index({ status: 1, averageRating: -1 });

export const Court = mongoose.model<ICourtDocument>('Court', courtSchema);