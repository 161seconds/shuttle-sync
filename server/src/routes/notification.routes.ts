import express from 'express';
import { User } from '../models/User';
import { Notification } from '../models/Notification';

const router = express.Router();

router.post('/broadcast-welcome', async (req, res) => {
    try {
        const users = await User.find({}, '_id');

        const notifications = users.map(user => ({
            userId: user._id,
            type: 'WELCOME',
            title: '🎉 Chào mừng bạn đến với ShuttleSync!',
            message: 'Cảm ơn bạn đã gia nhập cộng đồng. Để hệ thống gợi ý kèo đấu phù hợp, đừng quên cập nhật Trình độ nhé!',
            isRead: false, 
            link: '/profile/edit',
            createdAt: new Date()
        }));

        await Notification.insertMany(notifications);

        res.json({
            message: 'Thành công rực rỡ!',
            totalSent: notifications.length
        });
    } catch (error) {
        console.error("Lỗi phát thanh:", error);
        res.status(500).json({ error: 'Lỗi server rùi' });
    }
});

export default router;