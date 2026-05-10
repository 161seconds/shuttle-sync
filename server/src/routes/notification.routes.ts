import express from 'express';
import { User } from '../models/User';
import { Notification } from '../models/Notification';

const router = express.Router();

router.post('/broadcast-welcome', async (req, res) => {
    try {
        // 1. Lấy danh sách ID của toàn bộ user trong hệ thống
        const users = await User.find({}, '_id');

        // 2. Tạo mảng chứa thông báo cho từng người
        const notifications = users.map(user => ({
            userId: user._id,
            type: 'WELCOME',
            title: '🎉 Chào mừng bạn đến với ShuttleSync!',
            message: 'Cảm ơn bạn đã gia nhập cộng đồng. Để hệ thống gợi ý kèo đấu phù hợp, đừng quên cập nhật Trình độ nhé!',
            isRead: false, // Để false cho cái chuông nó đỏ lên
            link: '/profile/edit',
            createdAt: new Date()
        }));

        // 3. Insert một phát 1000 cái vào Database bằng insertMany
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