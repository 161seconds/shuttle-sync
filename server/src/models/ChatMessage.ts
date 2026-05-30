import mongoose, { Document, Schema } from 'mongoose';

export interface IChatMessageDocument extends Document {
    groupPlayId: mongoose.Types.ObjectId;
    senderId: mongoose.Types.ObjectId;
    senderName: string;
    senderAvatar?: string;
    content: string;
    replyTo?: {
        messageId: mongoose.Types.ObjectId;
        senderName: string;
        content: string;
    };
    createdAt: Date;
    updatedAt: Date;
}

const chatMessageSchema = new Schema<IChatMessageDocument>(
    {
        groupPlayId: { type: Schema.Types.ObjectId, ref: 'GroupPlay', required: true, index: true },
        senderId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
        senderName: { type: String, required: true },
        senderAvatar: { type: String },
        content: { type: String, required: true, maxlength: 1000 },
        replyTo: {
            messageId: { type: Schema.Types.ObjectId, ref: 'ChatMessage' },
            senderName: String,
            content: String,
        },
    },
    { timestamps: true },
);

// Index for fast retrieval of chat history by group
chatMessageSchema.index({ groupPlayId: 1, createdAt: 1 });

export const ChatMessage = mongoose.model<IChatMessageDocument>('ChatMessage', chatMessageSchema);
