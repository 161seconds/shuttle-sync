import mongoose, { Document, Schema, Model } from 'mongoose';
import bcrypt from 'bcryptjs';
import {
    UserRole, UserStatus, AuthProvider, SkillLevel, SportType,
} from '@shuttle-sync/shared';

export interface IUserDocument extends Document {
    email: string;
    phone?: string;
    password?: string;
    displayName: string;
    avatar?: string;
    role: UserRole;
    status: UserStatus;
    authProvider: AuthProvider;
    googleId?: string;
    skillLevel?: SkillLevel;
    sportPreferences: SportType[];
    favoriteCourtIds: mongoose.Types.ObjectId[];
    stats: {
        totalBookings: number;
        totalGroupPlays: number;
        totalTournaments: number;
        noShowCount: number;
        rating: number;
        reviewCount: number;
    };
    settings: {
        notifications: boolean;
        emailNotifications: boolean;
        language: 'vi' | 'en';
        theme: 'light' | 'dark';
    };
    banInfo?: {
        reason: string;
        bannedAt: Date;
        bannedBy: mongoose.Types.ObjectId;
        expiresAt?: Date;
    };
    refreshTokens: string[];
    lastLoginAt?: Date;
    comparePassword(candidatePassword: string): Promise<boolean>;
    toPublicProfile(): Record<string, unknown>;
}

interface IUserModel extends Model<IUserDocument> {
    findByEmail(email: string): Promise<IUserDocument | null>;
}

const userSchema = new Schema<IUserDocument>(
    {
        email: {
            type: String,
            required: true,
            unique: true,
            lowercase: true,
            trim: true,
            index: true,
        },
        phone: { type: String, trim: true },
        password: { type: String, select: false },
        displayName: { type: String, required: true, trim: true, maxlength: 50 },
        avatar: { type: String },
        role: {
            type: String,
            enum: Object.values(UserRole),
            default: UserRole.USER,
            index: true,
        },
        status: {
            type: String,
            enum: Object.values(UserStatus),
            default: UserStatus.ACTIVE,
            index: true,
        },
        authProvider: {
            type: String,
            enum: Object.values(AuthProvider),
            default: AuthProvider.LOCAL,
        },
        googleId: { type: String, sparse: true },
        skillLevel: {
            type: String,
            enum: Object.values(SkillLevel),
        },
        sportPreferences: [{
            type: String,
            enum: Object.values(SportType),
        }],
        favoriteCourtIds: [{ type: Schema.Types.ObjectId, ref: 'Court' }],
        stats: {
            totalBookings: { type: Number, default: 0 },
            totalGroupPlays: { type: Number, default: 0 },
            totalTournaments: { type: Number, default: 0 },
            noShowCount: { type: Number, default: 0 },
            rating: { type: Number, default: 0 },
            reviewCount: { type: Number, default: 0 },
        },
        settings: {
            notifications: { type: Boolean, default: true },
            emailNotifications: { type: Boolean, default: true },
            language: { type: String, enum: ['vi', 'en'], default: 'vi' },
            theme: { type: String, enum: ['light', 'dark'], default: 'light' },
        },
        banInfo: {
            reason: String,
            bannedAt: Date,
            bannedBy: { type: Schema.Types.ObjectId, ref: 'User' },
            expiresAt: Date,
        },
        refreshTokens: { type: [String], select: false, default: [] },
        lastLoginAt: { type: Date },
    },
    {
        timestamps: true,
        toJSON: {
            transform(_, ret: Record<string, any>) {
                delete ret.password;
                delete ret.refreshTokens;
                delete ret.__v;
                return ret;
            },
        },
    }
);

// Hash password before save
userSchema.pre('save', async function () {
    if (!this.isModified('password') || !this.password) return;
    this.password = await bcrypt.hash(this.password, 12);
});

// Instance methods
userSchema.methods.comparePassword = async function (
    candidatePassword: string
): Promise<boolean> {
    if (!this.password) return false;
    return bcrypt.compare(candidatePassword, this.password);
};

userSchema.methods.toPublicProfile = function () {
    return {
        _id: this._id,
        displayName: this.displayName,
        avatar: this.avatar,
        skillLevel: this.skillLevel,
        stats: {
            rating: this.stats.rating,
            reviewCount: this.stats.reviewCount,
            totalGroupPlays: this.stats.totalGroupPlays,
        },
    };
};

// Static methods
userSchema.statics.findByEmail = function (email: string) {
    return this.findOne({ email: email.toLowerCase() });
};

// Indexes
userSchema.index({ displayName: 'text' });
userSchema.index({ role: 1, status: 1 });

export const User = mongoose.model<IUserDocument, IUserModel>('User', userSchema);