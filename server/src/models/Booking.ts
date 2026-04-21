import mongoose, { Document, Schema } from 'mongoose';
import {
    BookingStatus, BookingType, PaymentStatus, PaymentMethod,
} from '@shuttle-sync/shared';

export interface IBookingDocument extends Document {
    bookingCode: string;
    userId?: mongoose.Types.ObjectId;
    guestInfo?: {
        name: string;
        phone: string;
        email?: string;
    };
    courtId: mongoose.Types.ObjectId;
    subCourtId: mongoose.Types.ObjectId;
    slotIds: mongoose.Types.ObjectId[];
    date: Date;
    startTime: string;
    endTime: string;
    type: BookingType;
    status: BookingStatus;
    totalAmount: number;
    discount: number;
    finalAmount: number;
    voucherCode?: string;
    payment: {
        method: PaymentMethod;
        status: PaymentStatus;
        transactionId?: string;
        qrCodeUrl?: string;
        paidAt?: Date;
        expiresAt: Date;
    };
    notes?: string;
    cancelReason?: string;
    cancelledAt?: Date;
    confirmedAt?: Date;
}

const bookingSchema = new Schema<IBookingDocument>(
    {
        bookingCode: { type: String, required: true, unique: true, index: true },
        userId: { type: Schema.Types.ObjectId, ref: 'User', index: true },
        guestInfo: {
            name: String,
            phone: String,
            email: String,
        },
        courtId: { type: Schema.Types.ObjectId, ref: 'Court', required: true, index: true },
        subCourtId: { type: Schema.Types.ObjectId, required: true },
        slotIds: [{ type: Schema.Types.ObjectId, ref: 'TimeSlot' }],
        date: { type: Date, required: true, index: true },
        startTime: { type: String, required: true },
        endTime: { type: String, required: true },
        type: {
            type: String,
            enum: Object.values(BookingType),
            default: BookingType.CASUAL,
            index: true,
        },
        status: {
            type: String,
            enum: Object.values(BookingStatus),
            default: BookingStatus.PENDING_PAYMENT,
            index: true,
        },
        totalAmount: { type: Number, required: true, min: 0 },
        discount: { type: Number, default: 0, min: 0 },
        finalAmount: { type: Number, required: true, min: 0 },
        voucherCode: String,
        payment: {
            method: { type: String, enum: Object.values(PaymentMethod), default: PaymentMethod.QR_CODE },
            status: { type: String, enum: Object.values(PaymentStatus), default: PaymentStatus.PENDING },
            transactionId: String,
            qrCodeUrl: String,
            paidAt: Date,
            expiresAt: { type: Date, required: true },
        },
        notes: { type: String, maxlength: 500 },
        cancelReason: String,
        cancelledAt: Date,
        confirmedAt: Date,
    },
    { timestamps: true }
);

bookingSchema.index({ userId: 1, date: -1 });
bookingSchema.index({ courtId: 1, date: 1, status: 1 });
bookingSchema.index({ 'payment.expiresAt': 1 }, {
    partialFilterExpression: { status: BookingStatus.PENDING_PAYMENT },
});

export const Booking = mongoose.model<IBookingDocument>('Booking', bookingSchema);