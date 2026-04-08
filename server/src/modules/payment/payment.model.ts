import mongoose, { Schema, Document } from 'mongoose';

export interface IPaymentModel extends Document {
    bookingId: mongoose.Types.ObjectId;
    method: string;
    amount: number;
    status: 'completed' | 'failed';
}

const PaymentSchema: Schema = new Schema({
    bookingId: { type: Schema.Types.ObjectId, ref: 'Booking', required: true },
    method: { type: String, default: 'QR_CODE_MOCK' },
    amount: { type: Number, required: true },
    status: { type: String, enum: ['completed', 'failed'], default: 'completed' }
}, { timestamps: true });

export const PaymentModel = mongoose.model<IPaymentModel>('Payment', PaymentSchema);