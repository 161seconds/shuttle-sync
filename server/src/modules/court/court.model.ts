import mongoose, { Schema, Document } from 'mongoose';
import type { Court } from '../../../../shared/types.js';

export interface ICourtModel extends Omit<Court, '_id'>, Document { }

const CourtSchema: Schema = new Schema({
    name: { type: String, required: true },
    location: { type: String, required: true },
    pricePerHour: { type: Number, required: true },
    imageUrl: { type: String, default: 'https://placehold.co/600x400?text=Badminton+Court' }
}, { timestamps: true });

export const CourtModel = mongoose.model<ICourtModel>('Court', CourtSchema);