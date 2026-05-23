import { useState, useEffect } from 'react';
import {
    ChevronLeft, Bell, CheckCheck, Rocket,
    Trophy, Users, CalendarClock, CreditCard,
    ShieldAlert, Info, Circle, Loader2
} from 'lucide-react';
import { theme as t } from '../../utils/theme';
import axiosClient from '../../api/axiosClient';

interface Props {
    onBack: () => void;
}

// Hàm tính thời gian trôi qua (Ví dụ: 5 phút trước, 2 giờ trước...)
const timeAgo = (dateString: string) => {
    const now = new Date();
    const past = new Date(dateString);
    const diffInSeconds = Math.floor((now.getTime() - past.getTime()) / 1000);

    if (diffInSeconds < 60) return 'Vừa xong';
    const diffInMinutes = Math.floor(diffInSeconds / 60);
    if (diffInMinutes < 60) return `${diffInMinutes} phút trước`;
    const diffInHours = Math.floor(diffInMinutes / 60);
    if (diffInHours < 24) return `${diffInHours} giờ trước`;
    const diffInDays = Math.floor(diffInHours / 24);
    if (diffInDays < 30) return `${diffInDays} ngày trước`;
    return past.toLocaleDateString('vi-VN');
};

export default function Notifications({ onBack }: Props) {
    const [notifications, setNotifications] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchNotifications = async () => {
            try {
                const res = await axiosClient.get('/notifications');

                // 2. Trích xuất đúng mảng dữ liệu (Phòng hờ các cấu trúc trả về khác nhau)
                let dataList = res.data.data || res.data.notifications || res.data;
                if (dataList && !Array.isArray(dataList) && Array.isArray(dataList.notifications)) {
                    dataList = dataList.notifications;
                }

                // 3. Ép kiểu an toàn: Nếu là mảng thì lấy, không thì lấy mảng rỗng
                setNotifications(Array.isArray(dataList) ? dataList : []);

            } catch (error) {
                console.error("Lỗi lấy thông báo:", error);
                setNotifications([]); // Lỗi API thì cho mảng rỗng để không bị crash
            } finally {
                setLoading(false);
            }
        };

        fetchNotifications();
    }, []);

    // HÀM CHỌN ICON DỰA TRÊN LOẠI THÔNG BÁO
    const getNotificationIcon = (type: string) => {
        switch (type) {
            case 'SYSTEM': return <Rocket className="w-5 h-5 text-purple-400" />;
            case 'WELCOME': return <Trophy className="w-5 h-5 text-yellow-400" />;
            case 'BOOKING': return <CalendarClock className="w-5 h-5 text-emerald-400" />;
            case 'GROUP': return <Users className="w-5 h-5 text-blue-400" />;
            case 'PAYMENT': return <CreditCard className="w-5 h-5 text-amber-400" />;
            case 'REPUTATION': return <ShieldAlert className="w-5 h-5 text-red-400" />;
            default: return <Info className="w-5 h-5 text-emerald-400" />;
        }
    };

    const getIconBackground = (type: string) => {
        switch (type) {
            case 'SYSTEM': return 'bg-purple-500/10 border-purple-500/20';
            case 'WELCOME': return 'bg-yellow-500/10 border-yellow-500/20';
            case 'BOOKING': return 'bg-emerald-500/10 border-emerald-500/20';
            case 'GROUP': return 'bg-blue-500/10 border-blue-500/20';
            case 'PAYMENT': return 'bg-amber-500/10 border-amber-500/20';
            case 'REPUTATION': return 'bg-red-500/10 border-red-500/20';
            default: return 'bg-emerald-500/10 border-emerald-500/20';
        }
    };

    // GỌI API ĐÁNH DẤU ĐÃ ĐỌC TOÀN BỘ
    const handleMarkAllRead = async () => {
        try {
            // Cập nhật UI ngay lập tức để người dùng thấy mượt (Optimistic Update)
            setNotifications(prev => prev.map(n => ({ ...n, isRead: true })));

            // Bắn lệnh xuống Backend để lưu vào DB
            await axiosClient.put('/notifications/read-all');
        } catch (error) {
            console.error("Lỗi cập nhật trạng thái đã đọc:", error);
        }
    };

    return (
        <div className={`min-h-screen ${t.bg.base} pb-24`}>
            {/* Header */}
            <div className={`sticky top-0 z-30 ${t.bg.base}/95 backdrop-blur-xl border-b ${t.border.subtle}`}>
                <div className="flex items-center justify-between px-4 h-14">
                    <div className="flex items-center gap-3">
                        <button onClick={onBack} className={`w-9 h-9 rounded-xl ${t.bg.elevated} flex items-center justify-center ${t.text.muted} hover:text-white transition-colors`}>
                            <ChevronLeft className="w-5 h-5" />
                        </button>
                        <h1 className={`font-bold ${t.text.primary}`}>Thông báo</h1>
                    </div>

                    <button
                        onClick={handleMarkAllRead}
                        disabled={loading || notifications.length === 0}
                        className="text-xs font-semibold text-emerald-400 bg-emerald-500/10 px-3 py-1.5 rounded-lg flex items-center gap-1.5 hover:bg-emerald-500/20 transition-colors disabled:opacity-50"
                    >
                        <CheckCheck className="w-3.5 h-3.5" />
                        Đã đọc tất cả
                    </button>
                </div>
            </div>

            {/* Danh sách thông báo */}
            <div className="max-w-lg mx-auto p-4 space-y-3">
                {loading ? (
                    <div className="flex flex-col items-center justify-center py-20 text-center">
                        <Loader2 className="w-8 h-8 text-emerald-500 animate-spin mb-4" />
                        <p className={t.text.muted}>Đang tải thông báo...</p>
                    </div>
                ) : notifications.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-20 text-center">
                        <div className="w-20 h-20 rounded-full bg-white/5 flex items-center justify-center mb-4">
                            <Bell className="w-8 h-8 text-white/20" />
                        </div>
                        <p className={t.text.muted}>Bạn chưa có thông báo nào.</p>
                    </div>
                ) : Array.isArray(notifications) && notifications.map((noti) => (
                    <div
                        key={noti._id}
                        className={`relative p-4 rounded-2xl border transition-all cursor-pointer group hover:bg-[#1a1b1f] overflow-hidden ${noti.isRead
                            ? 'bg-[#121316] border-[#22242a] opacity-75 hover:opacity-100'
                            : 'bg-[#16181c] border-[#2a2d35] shadow-lg'
                            }`}
                    >
                        {/* Dải màu đánh dấu chưa đọc */}
                        {!noti.isRead && (
                            <div className="absolute left-0 top-0 bottom-0 w-1 bg-emerald-500 shadow-[0_0_10px_rgba(16,185,129,0.5)]" />
                        )}

                        <div className="flex gap-4">
                            {/* Icon */}
                            <div className={`w-12 h-12 shrink-0 rounded-full border flex items-center justify-center ${getIconBackground(noti.type)}`}>
                                {getNotificationIcon(noti.type)}
                            </div>

                            {/* Content */}
                            <div className="flex-1 min-w-0">
                                <div className="flex items-start justify-between gap-2 mb-1">
                                    <h3 className={`text-sm font-bold truncate ${noti.isRead ? 'text-white/80' : 'text-white'}`}>
                                        {noti.title}
                                    </h3>
                                    {!noti.isRead && (
                                        <Circle className="w-2.5 h-2.5 fill-emerald-500 text-emerald-500 shrink-0 mt-1" />
                                    )}
                                </div>
                                <p className={`text-xs leading-relaxed ${noti.isRead ? 'text-white/40' : 'text-white/60'}`}>
                                    {noti.message}
                                </p>
                                <div className="mt-2 text-[10px] font-medium text-white/30 uppercase tracking-wider">
                                    {timeAgo(noti.createdAt)}
                                </div>
                            </div>
                        </div>
                    </div>
                ))
                }
            </div>
        </div>
    );
}