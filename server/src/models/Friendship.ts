import mongoose, { Document, Schema } from 'mongoose';
import { FriendshipStatus } from '@shuttle-sync/shared';

export interface IFriendshipDocument extends Document {
    requesterId: mongoose.Types.ObjectId;
    recipientId: mongoose.Types.ObjectId;
    status: FriendshipStatus;
    createdAt: Date;
    updatedAt: Date;
}

const friendshipSchema = new Schema<IFriendshipDocument>(
    {
        requesterId: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
        recipientId: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
        status: {
            type: String,
            enum: Object.values(FriendshipStatus),
            default: FriendshipStatus.PENDING,
        },
    },
    { timestamps: true }
);

// Prevent duplicate friend requests between two users
friendshipSchema.index({ requesterId: 1, recipientId: 1 }, { unique: true });

export const Friendship = mongoose.model<IFriendshipDocument>('Friendship', friendshipSchema);
