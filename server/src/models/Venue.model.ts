import mongoose, { Document, Schema } from 'mongoose';

export interface IVenueDocument extends Document {
    name: string;
    ownerId: mongoose.Types.ObjectId | null;
    googlePlaceId: string | null;
    location: {
        type: string;
        coordinates: number[];
    };
    address: {
        street: string;
        state: string;
        city: string;
        countryCode: string;
    };
    contact: {
        phone: string;
        website: string;
    };
    sports: string[];
    rating: {
        totalScore: number;
        reviewsCount: number;
    };
    isActive: boolean;
    createdAt: Date;
}

const VenueSchema = new Schema<IVenueDocument>({
    name: { type: String, required: true },
    ownerId: { type: Schema.Types.ObjectId, ref: 'User', default: null },
    googlePlaceId: { type: String, default: null },
    location: {
        type: { type: String, enum: ['Point'], default: 'Point' },
        coordinates: { type: [Number], default: [0, 0] }
    },
    address: {
        street: { type: String, default: '' },
        state: { type: String, default: '' },
        city: { type: String, default: '' },
        countryCode: { type: String, default: 'VN' }
    },
    contact: {
        phone: { type: String, default: '' },
        website: { type: String, default: '' }
    },
    sports: [{ type: String, enum: ['PICKLEBALL', 'BADMINTON', 'TENNIS'] }],
    rating: {
        totalScore: { type: Number, default: 0 },
        reviewsCount: { type: Number, default: 0 }
    },
    isActive: { type: Boolean, default: true },
    createdAt: { type: Date, default: Date.now }
});

VenueSchema.index({ location: '2dsphere' });

export const Venue = mongoose.models.Venue || mongoose.model<IVenueDocument>('Venue', VenueSchema);