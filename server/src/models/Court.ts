import mongoose, { Document, Schema } from 'mongoose';

export interface ICourtDocument extends Document {
    venueId: mongoose.Types.ObjectId;
    name: string;
    sportType: string;
    surfaceType: string;
    pricePerHour: number;
    status: string;
    createdAt: Date;
}

const CourtSchema = new Schema<ICourtDocument>({
    venueId: { type: Schema.Types.ObjectId, ref: 'Venue', required: true },
    name: { type: String, required: true },
    sportType: { type: String, enum: ['PICKLEBALL', 'BADMINTON', 'TENNIS'], required: true },
    surfaceType: { type: String, enum: ['WOOD', 'SYNTHETIC', 'CONCRETE'], default: 'SYNTHETIC' },
    pricePerHour: { type: Number, required: true },
    status: { type: String, enum: ['AVAILABLE', 'MAINTENANCE'], default: 'AVAILABLE' },
    createdAt: { type: Date, default: Date.now }
});

export const Court = mongoose.models.Court || mongoose.model<ICourtDocument>('Court', CourtSchema);