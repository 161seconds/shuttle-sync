import mongoose, { Document, Schema } from 'mongoose';
import {
    SportType, SkillLevel, GroupPlayStatus, GroupPlayRole,
} from '@shuttle-sync/shared';

export interface IGroupPlayDocument extends Document {
    title: string;
    description?: string;
    organizerId: mongoose.Types.ObjectId;
    courtId: mongoose.Types.ObjectId;
    subCourtId: mongoose.Types.ObjectId;
    bookingId: mongoose.Types.ObjectId;
    date: Date;
    startTime: string;
    endTime: string;
    sportType: SportType;
    skillLevel: SkillLevel;
    maxPlayers: number;
    currentPlayers: number;
    pricePerPlayer: number;
    participants: {
        userId: mongoose.Types.ObjectId;
        displayName: string;
        avatar?: string;
        role: GroupPlayRole;
        joinedAt: Date;
        hasPaid: boolean;
    }[];
    status: GroupPlayStatus;
    isPublic: boolean;
    requirements?: string;
    contactInfo?: string;
}

const groupPlaySchema = new Schema<IGroupPlayDocument>(
    {
        title: { type: String, required: true, trim: true, maxlength: 100 },
        description: { type: String, maxlength: 500 },
        organizerId: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
        courtId: { type: Schema.Types.ObjectId, ref: 'Court', required: true, index: true },
        subCourtId: { type: Schema.Types.ObjectId, required: true },
        bookingId: { type: Schema.Types.ObjectId, ref: 'Booking', required: true },
        date: { type: Date, required: true, index: true },
        startTime: { type: String, required: true },
        endTime: { type: String, required: true },
        sportType: { type: String, enum: Object.values(SportType), required: true, index: true },
        skillLevel: { type: String, enum: Object.values(SkillLevel), required: true },
        maxPlayers: { type: Number, required: true, min: 2, max: 30 },
        currentPlayers: { type: Number, default: 1 },
        pricePerPlayer: { type: Number, required: true, min: 0 },
        participants: [{
            userId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
            displayName: { type: String, required: true },
            avatar: String,
            role: { type: String, enum: Object.values(GroupPlayRole), default: GroupPlayRole.PARTICIPANT },
            joinedAt: { type: Date, default: Date.now },
            hasPaid: { type: Boolean, default: false },
        }],
        status: {
            type: String,
            enum: Object.values(GroupPlayStatus),
            default: GroupPlayStatus.OPEN,
            index: true,
        },
        isPublic: { type: Boolean, default: true },
        requirements: { type: String, maxlength: 300 },
        contactInfo: String,
    },
    { timestamps: true }
);

groupPlaySchema.index({ date: 1, sportType: 1, status: 1, skillLevel: 1 });
groupPlaySchema.index({ 'participants.userId': 1 });

export const GroupPlay = mongoose.model<IGroupPlayDocument>('GroupPlay', groupPlaySchema);