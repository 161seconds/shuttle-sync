import mongoose, { Document, Schema } from 'mongoose';

export interface IPricingConfig {
    startTime: string; // HH:mm
    endTime: string;   // HH:mm
    daysOfWeek: number[]; // 0-6 (0 is Sunday)
    pricePerHour: number;
}

export interface ICourtDocument extends Document {
    venueId: mongoose.Types.ObjectId;
    name: string;
    sportType: string;
    surfaceType: string;
    pricePerHour: number;
    pricingConfigs?: IPricingConfig[];
    status: string;
    createdAt: Date;
}

const PricingConfigSchema = new Schema<IPricingConfig>({
    startTime: { type: String, required: true },
    endTime: { type: String, required: true },
    daysOfWeek: [{ type: Number, required: true }],
    pricePerHour: { type: Number, required: true }
}, { _id: false });

const CourtSchema = new Schema<ICourtDocument>({
    venueId: { type: Schema.Types.ObjectId, ref: 'Venue', required: true },
    name: { type: String, required: true },
    sportType: { type: String, enum: ['PICKLEBALL', 'BADMINTON', 'TENNIS'], required: true },
    surfaceType: { type: String, enum: ['WOOD', 'SYNTHETIC', 'CONCRETE'], default: 'SYNTHETIC' },
    pricePerHour: { type: Number, required: true },
    pricingConfigs: [PricingConfigSchema],
    status: { type: String, enum: ['AVAILABLE', 'MAINTENANCE'], default: 'AVAILABLE' },
    createdAt: { type: Date, default: Date.now }
});

CourtSchema.index({ venueId: 1, status: 1 });

export const Court = mongoose.models.Court || mongoose.model<ICourtDocument>('Court', CourtSchema);