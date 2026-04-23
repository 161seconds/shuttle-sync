import mongoose from 'mongoose';

const courtSchema = new mongoose.Schema({
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
        coordinates: { type: [Number], required: true }, // [Kinh độ (lng), Vĩ độ (lat)]
    },

    //LIÊN HỆ
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
    ownerId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
    amenities: [{ type: String }],
    status: { type: String, enum: ['active', 'maintenance', 'closed'], default: 'active' },
    isVerified: { type: Boolean, default: false },
    totalBookings: { type: Number, default: 0 },

    // Sân con, Giờ mở cửa, Giá tiền
    courts: [{ type: mongoose.Schema.Types.Mixed }],
    operatingHours: [{ type: mongoose.Schema.Types.Mixed }],
    pricePerHour: [{ type: mongoose.Schema.Types.Mixed }]
}, {
    timestamps: true
});

courtSchema.index({ location: '2dsphere' });

export const Court = mongoose.model('Court', courtSchema);