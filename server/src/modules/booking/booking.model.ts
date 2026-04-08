import mongoose, { Schema, Document } from 'mongoose';
import type { Booking } from '../../../../shared/types.js';

export interface IBookingModel extends Omit<Booking, '_id'>, Document { }

const BookingSchema: Schema = new Schema({
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    courtId: { type: Schema.Types.ObjectId, ref: 'Court', required: true },
    date: { type: String, required: true }, // YYYY-MM-DD
    timeSlot: { type: String, required: true }, // e.g., "08:00 - 09:00"
    status: { type: String, enum: ['pending', 'confirmed', 'cancelled'], default: 'pending' },
    paymentStatus: { type: String, enum: ['unpaid', 'paid'], default: 'unpaid' }
}, { timestamps: true });

BookingSchema.index({ courtId: 1, date: 1, timeSlot: 1 }, { unique: true });

export const BookingModel = mongoose.model<IBookingModel>('Booking', BookingSchema);