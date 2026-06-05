import mongoose, { Document, Schema, Model } from 'mongoose';

export enum NotificationType {
    SYSTEM = 'SYSTEM',
    WELCOME = 'WELCOME',
    MAINTENANCE = 'MAINTENANCE',
    BOOKING = 'BOOKING',
    GROUP = 'GROUP',
    TOURNAMENT = 'TOURNAMENT',
    REPUTATION = 'REPUTATION',
    PAYMENT = 'PAYMENT',
    ACHIEVEMENT = 'ACHIEVEMENT'
}

export interface INotificationDocument extends Document {
    userId: mongoose.Types.ObjectId;
    type: NotificationType | string;
    title: string;
    message: string;
    isRead: boolean;
    link?: string;
    createdAt: Date;
    updatedAt: Date;
}

interface INotificationModel extends Model<INotificationDocument> { }

const notificationSchema = new Schema<INotificationDocument>(
    {
        userId: {
            type: Schema.Types.ObjectId,
            ref: 'User',
            required: true
        },
        type: {
            type: String,
            enum: Object.values(NotificationType),
            required: true
        },
        title: {
            type: String,
            required: true,
            trim: true
        },
        message: {
            type: String,
            required: true
        },
        isRead: {
            type: Boolean,
            default: false
        },
        link: {
            type: String, // Đường dẫn để click vào thông báo chuyển trang
            trim: true
        }
    },
    {
        timestamps: true, // Tự động sinh ra createdAt và updatedAt
    }
);

// Tối ưu hóa tốc độ khi truy vấn: "Lấy các thông báo MỚI NHẤT của user X"
notificationSchema.index({ userId: 1, createdAt: -1 });
// Tối ưu hóa tốc độ khi đếm: "User X có bao nhiêu thông báo CHƯA ĐỌC"
notificationSchema.index({ userId: 1, isRead: 1 });
// Tự động xóa thông báo sau 5 ngày (432000 giây)
notificationSchema.index({ createdAt: 1 }, { expireAfterSeconds: 432000 });

export const Notification = (mongoose.models.Notification as INotificationModel) || mongoose.model<INotificationDocument, INotificationModel>('Notification', notificationSchema);