import { useState, useEffect } from 'react';
import {
    ChevronLeft, Bell, CheckCheck, Rocket,
    Trophy, Users, CalendarClock, CreditCard,
    ShieldAlert, Info, Loader2, Clock
} from 'lucide-react';
import { theme as t } from '../../utils/theme';
import axiosClient from '../../api/axiosClient';
import { useAppStore } from '../../store';

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
    const { setPage } = useAppStore();
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

        const handleRefresh = () => {
            fetchNotifications();
        };

        window.addEventListener('refresh_notifications', handleRefresh);
        return () => window.removeEventListener('refresh_notifications', handleRefresh);
    }, []);

    // HÀM CHỌN ICON DỰA TRÊN LOẠI THÔNG BÁO
    const getNotificationIcon = (type: string) => {
        switch (type) {
            case 'SYSTEM': return <Rocket className="w-5 h-5 text-purple-400" />;
            case 'WELCOME': return <Trophy className="w-5 h-5 text-yellow-400" />;
            case 'BOOKING': return <CalendarClock className="w-5 h-5 text-emerald-400" />;
            case 'GROUP':
            case 'group_play': return <Users className="w-5 h-5 text-blue-400" />;
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
            case 'GROUP':
            case 'group_play': return 'bg-blue-500/10 border-blue-500/20';
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
            
            // Báo cho Header biết để tắt chấm xanh
            window.dispatchEvent(new Event('notificationsRead'));
        } catch (error) {
            console.error("Lỗi cập nhật trạng thái đã đọc:", error);
        }
    };

    return (
        <div className={`min-h-screen w-full${t.bg.base} pb-24`}>
            {/* Header */}
            <div className={`sticky top-16 z-30 ${t.bg.base}/80 backdrop-blur-2xl border-b border-white/5`}>
                <div className="flex items-center justify-between px-4 h-16">
                    <div className="flex items-center gap-3">
                        <button onClick={onBack} className={`w-10 h-10 rounded-full bg-white/5 hover:bg-white/10 flex items-center justify-center ${t.text.muted} hover:text-white transition-all`}>
                            <ChevronLeft className="w-6 h-6" />
                        </button>
                        <h1 className={`font-black text-lg text-white tracking-wide`}>Thông báo</h1>
                    </div>

                    <button
                        onClick={handleMarkAllRead}
                        disabled={loading || notifications.length === 0}
                        className="text-[11px] font-black text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-3.5 py-2 rounded-full flex items-center gap-1.5 hover:bg-emerald-500/20 hover:scale-105 active:scale-95 transition-all disabled:opacity-50 disabled:scale-100 uppercase tracking-wider"
                    >
                        <CheckCheck className="w-4 h-4" />
                        Đã đọc tất cả
                    </button>
                </div>
            </div>

            {/* Danh sách thông báo */}
            <div className="max-w-lg mx-auto p-5 space-y-4">
                {loading ? (
                    <div className="flex flex-col items-center justify-center py-24 text-center">
                        <Loader2 className="w-10 h-10 text-emerald-500 animate-spin mb-5 drop-shadow-[0_0_10px_rgba(16,185,129,0.5)]" />
                        <p className="text-gray-400 font-bold">Đang tải thông báo...</p>
                    </div>
                ) : notifications.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-24 text-center">
                        <div className="relative mb-6 group">
                            <div className="absolute inset-0 bg-white/5 blur-2xl rounded-full opacity-50 group-hover:opacity-100 transition-opacity duration-700"></div>
                            <div className="relative w-24 h-24 rounded-full bg-white/5 flex items-center justify-center border border-white/10 group-hover:scale-105 transition-transform duration-500 backdrop-blur-md">
                                <Bell className="w-10 h-10 text-gray-500 group-hover:text-white transition-colors" />
                            </div>
                        </div>
                        <p className={`text-white font-black text-xl mb-2`}>Không có thông báo nào</p>
                        <p className={`text-[15px] text-gray-400`}>Bạn đã đọc hết tất cả thông báo.</p>
                    </div>
                ) : Array.isArray(notifications) && notifications.map((noti) => (
                    <div
                        key={noti._id}
                        onClick={() => {
                            if (noti.type === 'GROUP' || noti.type === 'group_play') {
                                setPage('chat');
                            }
                        }}
                        className={`relative p-5 rounded-3xl border transition-all duration-300 cursor-pointer group hover:shadow-[0_0_20px_rgba(255,255,255,0.05)] overflow-hidden backdrop-blur-md ${noti.isRead
                            ? 'bg-white/5 border-white/5 opacity-70 hover:opacity-100 hover:bg-white/10'
                            : 'bg-white/10 border-white/10 hover:border-emerald-500/30 hover:bg-white/15'
                            }`}
                    >
                        {/* Dải màu đánh dấu chưa đọc */}
                        {!noti.isRead && (
                            <div className="absolute left-0 top-0 bottom-0 w-1.5 bg-emerald-400 shadow-[0_0_15px_rgba(52,211,153,0.8)]" />
                        )}

                        <div className="flex gap-4">
                            {/* Icon */}
                            <div className={`w-14 h-14 shrink-0 rounded-[1rem] border flex items-center justify-center ${getIconBackground(noti.type)} shadow-inner`}>
                                {getNotificationIcon(noti.type)}
                            </div>

                            {/* Content */}
                            <div className="flex-1 min-w-0">
                                <div className="flex items-start justify-between gap-3 mb-1.5">
                                    <h3 className={`text-[15px] font-black truncate ${noti.isRead ? 'text-gray-300 group-hover:text-white transition-colors' : 'text-white'}`}>
                                        {noti.title}
                                    </h3>
                                    {!noti.isRead && (
                                        <div className="relative flex h-3 w-3 shrink-0 mt-1">
                                            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                                            <span className="relative inline-flex rounded-full h-3 w-3 bg-emerald-500"></span>
                                        </div>
                                    )}
                                </div>
                                <p className={`text-[13px] leading-relaxed font-medium ${noti.isRead ? 'text-gray-400 group-hover:text-gray-300 transition-colors' : 'text-gray-300'}`}>
                                    {noti.message}
                                </p>

                                {noti.title.toLowerCase().includes('từ chối') && (
                                    <div className="mt-3">
                                        <button 
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                setNotifications(prev => prev.filter(n => n._id !== noti._id));
                                            }}
                                            className="px-4 py-1.5 bg-white/10 hover:bg-white/20 text-white rounded-xl text-[12px] font-bold transition-colors"
                                        >
                                            Đã hiểu
                                        </button>
                                    </div>
                                )}

                                <div className="mt-3 text-[11px] font-bold text-gray-500 uppercase tracking-widest flex items-center gap-1.5">
                                    <Clock className="w-3.5 h-3.5" />
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