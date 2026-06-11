import mongoose, { Document, Schema } from 'mongoose';

export interface IMessageDocument extends Document {
    conversationId: mongoose.Types.ObjectId;
    senderId: mongoose.Types.ObjectId;
    senderName?: string;
    senderAvatar?: string;
    content: string;
    isRead: boolean;
    replyTo?: {
        messageId: mongoose.Types.ObjectId;
        senderName: string;
        content: string;
    };
    createdAt: Date;
    updatedAt: Date;
}

const messageSchema = new Schema<IMessageDocument>(
    {
        conversationId: { type: Schema.Types.ObjectId, ref: 'Conversation', required: true, index: true },
        senderId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
        senderName: { type: String },
        senderAvatar: { type: String },
        content: { type: String, required: true, maxlength: 2000 },
        isRead: { type: Boolean, default: false },
        replyTo: {
            messageId: { type: Schema.Types.ObjectId, ref: 'Message' },
            senderName: String,
            content: String,
        },
    },
    { timestamps: true }
);

// Index for fast retrieval of messages in a conversation, sorted by time
messageSchema.index({ conversationId: 1, createdAt: 1 });

export const Message = mongoose.model<IMessageDocument>('Message', messageSchema);
