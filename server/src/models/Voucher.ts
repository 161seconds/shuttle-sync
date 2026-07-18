import mongoose, { Document, Schema, Model } from 'mongoose';

export enum VoucherStatus {
    PENDING = 'PENDING',
    APPROVED = 'APPROVED',
    REJECTED = 'REJECTED'
}

export enum DiscountType {
    PERCENTAGE = 'percentage',
    FIXED = 'fixed'
}

export interface IVoucherDocument extends Document {
    code: string;
    venueId?: mongoose.Types.ObjectId;
    ownerId?: mongoose.Types.ObjectId;
    discountType: DiscountType | string;
    discountValue: number;
    maxDiscount?: number;
    minOrderValue?: number;
    startDate: Date;
    endDate: Date;
    usageLimit: number;
    usedCount: number;
    status: VoucherStatus | string;
    isActive: boolean;
    createdAt: Date;
    updatedAt: Date;
}

interface IVoucherModel extends Model<IVoucherDocument> {}

const voucherSchema = new Schema<IVoucherDocument>(
    {
        code: {
            type: String,
            required: true,
            unique: true,
            uppercase: true,
            trim: true,
            index: true
        },
        venueId: {
            type: Schema.Types.ObjectId,
            ref: 'Venue',
            default: null,
            index: true
        },
        ownerId: {
            type: Schema.Types.ObjectId,
            ref: 'User',
            default: null,
            index: true
        },
        discountType: {
            type: String,
            enum: Object.values(DiscountType),
            required: true
        },
        discountValue: {
            type: Number,
            required: true,
            min: 0
        },
        maxDiscount: {
            type: Number,
            default: null
        },
        minOrderValue: {
            type: Number,
            default: 0
        },
        startDate: {
            type: Date,
            required: true
        },
        endDate: {
            type: Date,
            required: true
        },
        usageLimit: {
            type: Number,
            required: true,
            min: 1
        },
        usedCount: {
            type: Number,
            default: 0
        },
        status: {
            type: String,
            enum: Object.values(VoucherStatus),
            default: VoucherStatus.PENDING,
            index: true
        },
        isActive: {
            type: Boolean,
            default: true,
            index: true
        }
    },
    {
        timestamps: true
    }
);

// Tự động vô hiệu hoá nếu vượt quá lượt dùng
voucherSchema.pre('save', function(next) {
    if (this.usedCount >= this.usageLimit) {
        this.isActive = false;
    }
    next();
});

export const Voucher = (mongoose.models.Voucher as IVoucherModel) || mongoose.model<IVoucherDocument, IVoucherModel>('Voucher', voucherSchema);
