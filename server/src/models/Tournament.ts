import mongoose, { Document, Schema } from 'mongoose';
import {
    SportType, TournamentStatus, TournamentFormat,
} from '@shuttle-sync/shared';

export interface ITournamentDocument extends Document {
    title: string;
    description: string;
    organizerId: mongoose.Types.ObjectId;
    courtId: mongoose.Types.ObjectId;
    sportType: SportType;
    format: TournamentFormat;
    status: TournamentStatus;
    startDate: Date;
    endDate: Date;
    registrationDeadline: Date;
    maxTeams: number;
    currentTeams: number;
    entryFee: number;
    prizes: { position: number; description: string; amount?: number }[];
    rules?: string;
    contactInfo: string;
    bannerImage?: string;
    teams: {
        _id: mongoose.Types.ObjectId;
        name: string;
        members: mongoose.Types.ObjectId[];
        registeredAt: Date;
        hasPaid: boolean;
        seed?: number;
    }[];
    matches: {
        _id: mongoose.Types.ObjectId;
        round: number;
        matchNumber: number;
        team1Id?: mongoose.Types.ObjectId;
        team2Id?: mongoose.Types.ObjectId;
        score1?: number;
        score2?: number;
        winnerId?: mongoose.Types.ObjectId;
        courtId: mongoose.Types.ObjectId;
        subCourtId?: mongoose.Types.ObjectId;
        scheduledAt?: Date;
        completedAt?: Date;
    }[];
}

const tournamentSchema = new Schema<ITournamentDocument>(
    {
        title: { type: String, required: true, trim: true },
        description: { type: String, required: true },
        organizerId: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
        courtId: { type: Schema.Types.ObjectId, ref: 'Court', required: true, index: true },
        sportType: { type: String, enum: Object.values(SportType), required: true },
        format: { type: String, enum: Object.values(TournamentFormat), required: true },
        status: {
            type: String,
            enum: Object.values(TournamentStatus),
            default: TournamentStatus.DRAFT,
            index: true,
        },
        startDate: { type: Date, required: true },
        endDate: { type: Date, required: true },
        registrationDeadline: { type: Date, required: true },
        maxTeams: { type: Number, required: true, min: 2 },
        currentTeams: { type: Number, default: 0 },
        entryFee: { type: Number, default: 0, min: 0 },
        prizes: [{
            position: { type: Number, required: true },
            description: { type: String, required: true },
            amount: Number,
        }],
        rules: String,
        contactInfo: { type: String, required: true },
        bannerImage: String,
        teams: [{
            name: { type: String, required: true },
            members: [{ type: Schema.Types.ObjectId, ref: 'User' }],
            registeredAt: { type: Date, default: Date.now },
            hasPaid: { type: Boolean, default: false },
            seed: Number,
        }],
        matches: [{
            round: { type: Number, required: true },
            matchNumber: { type: Number, required: true },
            team1Id: { type: Schema.Types.ObjectId },
            team2Id: { type: Schema.Types.ObjectId },
            score1: Number,
            score2: Number,
            winnerId: { type: Schema.Types.ObjectId },
            courtId: { type: Schema.Types.ObjectId, ref: 'Court' },
            subCourtId: { type: Schema.Types.ObjectId },
            scheduledAt: Date,
            completedAt: Date,
        }],
    },
    { timestamps: true }
);

tournamentSchema.index({ startDate: 1, status: 1, sportType: 1 });

export const Tournament = mongoose.model<ITournamentDocument>('Tournament', tournamentSchema);