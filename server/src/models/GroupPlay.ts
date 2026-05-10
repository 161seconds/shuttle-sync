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
    priceConfig?: {
        guestFee: { male: number; female: number };
        memberFee: { male: number; female: number };
        basePrices: { shuttlecock: number; courtPerHour: number; bettingMatchFee: number };
        beverages: { _id?: mongoose.Types.ObjectId; name: string; price: number }[];
        bankInfo?: { bankName: string; accountNumber: string; accountName: string };
    };
    matchRecords: {
        teamA: string[]; // Tên hoặc ID người chơi đội A
        teamB: string[]; // Tên hoặc ID người chơi đội B
        scoreA: number;
        scoreB: number;
        betAmount?: number; // Tiền kèo 
        recordedAt: Date;
    }[];
    participants: {
        userId: mongoose.Types.ObjectId;
        displayName: string;
        avatar?: string;
        role: GroupPlayRole;
        joinedAt: Date;
        isGuest: boolean;
        gender: 'male' | 'female';
        beveragesConsumed: { beverageId: mongoose.Types.ObjectId; quantity: number }[];
        totalOwed: number; 
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
        priceConfig: {
            guestFee: {
                male: { type: Number, default: 75000 },
                female: { type: Number, default: 65000 }
            },
            memberFee: {
                male: { type: Number, default: 65000 },
                female: { type: Number, default: 55000 }
            },
            basePrices: {
                shuttlecock: { type: Number, default: 25000 },
                courtPerHour: { type: Number, default: 80000 },
                bettingMatchFee: { type: Number, default: 20000 }
            },
            beverages: [{
                name: { type: String, trim: true },
                price: { type: Number, min: 0 }
            }],
            bankInfo: {
                bankName: { type: String, trim: true },
                accountNumber: { type: String, trim: true },
                accountName: { type: String, trim: true }
            }
        },
        matchRecords: [{
            teamA: [String],
            teamB: [String],
            scoreA: { type: Number, required: true },
            scoreB: { type: Number, required: true },
            betAmount: { type: Number, default: 0 },
            recordedAt: { type: Date, default: Date.now }
        }],
        participants: [{
            userId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
            displayName: { type: String, required: true },
            avatar: String,
            role: { type: String, enum: Object.values(GroupPlayRole), default: GroupPlayRole.PARTICIPANT },
            joinedAt: { type: Date, default: Date.now },
            // Thông tin tính bill
            isGuest: { type: Boolean, default: true },
            gender: { type: String, enum: ['male', 'female'], default: 'male' },
            beveragesConsumed: [{
                beverageId: { type: Schema.Types.ObjectId },
                quantity: { type: Number, default: 1 }
            }],
            totalOwed: { type: Number, default: 0 },
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
    { timestamps: true },
);

groupPlaySchema.index({ date: 1, sportType: 1, status: 1, skillLevel: 1 });
groupPlaySchema.index({ 'participants.userId': 1 });

export const GroupPlay = mongoose.model<IGroupPlayDocument>('GroupPlay', groupPlaySchema);