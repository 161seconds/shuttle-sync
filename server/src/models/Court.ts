import mongoose, { Document, Schema } from 'mongoose';

// 1. Định nghĩa Interface (Giúp báo lỗi khi code sai)
export interface ICourtDocument extends Document {
    name: string;
    slug: string;
    description: string;
    sportTypes: string[];
    address: {
        street: string;
        ward: string;
        district: string;
        city: string;
        fullAddress: string;
    };
    location: {
        type: string;
        coordinates: number[];
    };
    contact: {
        phone: string;
        website?: string;
    };
    averageRating: number;
    reviewCount: number;
    googlePlaceId?: string;
    googleRating?: number;
    googleReviewCount?: number;
    photos: { url: string; caption?: string; isMain: boolean }[];
    ownerId?: mongoose.Types.ObjectId;
    amenities: string[];
    status: string;
    isVerified: boolean;
    totalBookings: number;
    courts: any[];
    operatingHours: any[];
    pricePerHour: any[];
}

// 2. Tạo Schema
const courtSchema = new Schema<ICourtDocument>({
    name: { type: String, required: true },
    slug: { type: String, unique: true },
    description: { type: String, default: 'Đang cập nhật thông tin...' },
    sportTypes: [{ type: String, enum: ['badminton', 'pickleball', 'both'] }],

    // ĐỊA CHỈ & TOẠ ĐỘ 
    address: {
        street: { type: String, default: '' },
        ward: { type: String, default: '' },
        district: { type: String, required: true },
        city: { type: String, default: 'Hồ Chí Minh' },
        fullAddress: { type: String, required: true },
    },
    location: {
        type: { type: String, enum: ['Point'], default: 'Point' },
        coordinates: { type: [Number], required: true }, // [lng, lat]
    },

    // LIÊN HỆ
    contact: {
        phone: { type: String, default: '' },
        website: { type: String, default: '' },
    },

    // ĐÁNH GIÁ TỪ GOOGLE
    averageRating: { type: Number, default: 0 },
    reviewCount: { type: Number, default: 0 },
    googlePlaceId: { type: String, default: '' },
    googleRating: { type: Number },
    googleReviewCount: { type: Number },

    // HÌNH ẢNH
    photos: [{
        url: String,
        caption: String,
        isMain: { type: Boolean, default: false }
    }],

    // CÁC THÔNG TIN ĐỘNG
    ownerId: { type: Schema.Types.ObjectId, ref: 'User', default: null },
    amenities: [{ type: String }],
    status: { type: String, enum: ['active', 'maintenance', 'closed'], default: 'active' },
    isVerified: { type: Boolean, default: false },
    totalBookings: { type: Number, default: 0 },

    // Sân con, Giờ mở cửa, Giá tiền
    courts: [{ type: Schema.Types.Mixed }],
    operatingHours: [{ type: Schema.Types.Mixed }],
    pricePerHour: [{ type: Schema.Types.Mixed }]
}, {
    timestamps: true
});

courtSchema.index({ name: 'text', address: 'text', description: 'text' });
courtSchema.index({ location: '2dsphere' });

// 3. Export chuẩn ES6
export const Court = mongoose.model<ICourtDocument>('Court', courtSchema);