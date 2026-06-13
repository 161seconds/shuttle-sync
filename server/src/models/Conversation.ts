import mongoose, { Document, Schema } from 'mongoose';

export interface IConversationDocument extends Document {
    participants: mongoose.Types.ObjectId[];
    lastMessage?: mongoose.Types.ObjectId;
    unreadCount: Map<string, number>; // userId (string) -> count
    createdAt: Date;
    updatedAt: Date;
}

const conversationSchema = new Schema<IConversationDocument>(
    {
        participants: [{ type: Schema.Types.ObjectId, ref: 'User', required: true }],
        lastMessage: { type: Schema.Types.ObjectId, ref: 'Message' },
        unreadCount: {
            type: Map,
            of: Number,
            default: new Map(),
        },
    },
    { timestamps: true }
);

// Ensure fast lookup for a specific conversation between exactly two users
conversationSchema.index({ participants: 1 });

export const Conversation = mongoose.model<IConversationDocument>('Conversation', conversationSchema);
