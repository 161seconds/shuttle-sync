import mongoose, { Document, Schema } from 'mongoose';
import { SlotStatus } from '@shuttle-sync/shared';

export interface ITimeSlotDocument extends Document {
    courtId: mongoose.Types.ObjectId;
    subCourtId: mongoose.Types.ObjectId;
    date: Date;
    startTime: string;
    endTime: string;
    status: SlotStatus;
    price: number;
    lockedBy?: mongoose.Types.ObjectId;
    lockedAt?: Date;
    bookingId?: mongoose.Types.ObjectId;
}

const timeSlotSchema = new Schema<ITimeSlotDocument>(
    {
        courtId: { type: Schema.Types.ObjectId, ref: 'Court', required: true, index: true },
        subCourtId: { type: Schema.Types.ObjectId, required: true, index: true },
        date: { type: Date, required: true, index: true },
        startTime: { type: String, required: true },
        endTime: { type: String, required: true },
        status: {
            type: String,
            enum: Object.values(SlotStatus),
            default: SlotStatus.AVAILABLE,
            index: true,
        },
        price: { type: Number, required: true, min: 0 },
        lockedBy: { type: Schema.Types.ObjectId, ref: 'User' },
        lockedAt: { type: Date },
        bookingId: { type: Schema.Types.ObjectId, ref: 'Booking' },
    },
    { timestamps: true }
);

// Compound indexes for fast lookups
timeSlotSchema.index({ courtId: 1, subCourtId: 1, date: 1, startTime: 1 }, { unique: true });
timeSlotSchema.index({ courtId: 1, date: 1, status: 1 });
timeSlotSchema.index({ lockedAt: 1 }, { expireAfterSeconds: 300, partialFilterExpression: { status: SlotStatus.SELECTED } });

export const TimeSlot = mongoose.model<ITimeSlotDocument>('TimeSlot', timeSlotSchema);