import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Rocket, Trophy, CalendarClock, Users, CreditCard, ShieldAlert, Info, Loader2, CheckCheck } from 'lucide-react';
import axiosClient from '../../api/axiosClient';
import { useAppStore } from '../../store';

interface NotificationDropdownProps {
    isOpen: boolean;
    onClose: () => void;
}

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

export default function NotificationDropdown({ isOpen, onClose }: NotificationDropdownProps) {
    const { setPage } = useAppStore();
    const dropdownRef = useRef<HTMLDivElement>(null);
    const [notifications, setNotifications] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    // Xử lý click ra ngoài hoặc nhấn Esc
    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
                // Kiểm tra nếu click không phải vào chuông (nút chuông ở Header)
                // Nút chuông sẽ được bao bọc bên ngoài hoặc ta phải truyền id/ref, 
                // nhưng cách tốt nhất là dùng div bao quanh nút chuông trong Header.
                onClose();
            }
        };

        const handleEscape = (e: KeyboardEvent) => {
            if (e.key === 'Escape') onClose();
        };

        if (isOpen) {
            document.addEventListener('mousedown', handleClickOutside);
            document.addEventListener('keydown', handleEscape);
        }

        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
            document.removeEventListener('keydown', handleEscape);
        };
    }, [isOpen, onClose]);

    // Lấy thông báo khi mở
    useEffect(() => {
        if (!isOpen) return;

        const fetchNotifications = async () => {
            setLoading(true);
            try {
                const res = await axiosClient.get('/notifications');
                let dataList = res.data.data || res.data.notifications || res.data;
                if (dataList && !Array.isArray(dataList) && Array.isArray(dataList.notifications)) {
                    dataList = dataList.notifications;
                }
                setNotifications(Array.isArray(dataList) ? dataList : []);
            } catch (error) {
                console.error("Lỗi lấy thông báo:", error);
            } finally {
                setLoading(false);
            }
        };

        fetchNotifications();
    }, [isOpen]);

    const handleMarkAllRead = async () => {
        try {
            setNotifications(prev => prev.map(n => ({ ...n, isRead: true })));
            await axiosClient.put('/notifications/read-all');
            window.dispatchEvent(new Event('notificationsRead'));
        } catch (error) {
            console.error("Lỗi cập nhật trạng thái đã đọc:", error);
        }
    };

    const handleViewAll = () => {
        onClose();
        setPage('notifications');
    };

    return (
        <AnimatePresence>
            {isOpen && (
                <motion.div
                    ref={dropdownRef}
                    initial={{ opacity: 0, y: 10, scale: 0.95 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: 10, scale: 0.95 }}
                    transition={{ duration: 0.2, ease: "easeOut" }}
                    className="absolute right-0 top-[110%] w-[90vw] md:w-[420px] bg-card/95 backdrop-blur-xl border border-border rounded-2xl shadow-card z-50 overflow-hidden"
                >
                    {/* Header */}
                    <div className="flex items-center justify-between px-5 py-4 border-b border-border">
                        <h2 className="text-[17px] font-black text-foreground">Thông báo</h2>
                        <button
                            onClick={handleMarkAllRead}
                            disabled={loading || notifications.length === 0}
                            className="text-[13px] font-bold text-emerald-400 hover:text-emerald-300 transition-colors disabled:opacity-50"
                        >
                            Đánh dấu đã đọc
                        </button>
                    </div>

                    {/* Content List */}
                    <div className="max-h-[360px] overflow-y-auto custom-scrollbar">
                        {loading ? (
                            <div className="flex flex-col items-center justify-center py-10">
                                <Loader2 className="w-8 h-8 text-emerald-500 animate-spin mb-3" />
                                <span className="text-sm font-medium text-muted-foreground">Đang tải...</span>
                            </div>
                        ) : notifications.length === 0 ? (
                            <div className="flex flex-col items-center justify-center py-10 text-center px-4">
                                <div className="w-16 h-16 rounded-full bg-card flex items-center justify-center border border-border mb-4">
                                    <CheckCheck className="w-8 h-8 text-emerald-500" />
                                </div>
                                <p className="text-foreground font-bold mb-1">Không có thông báo mới</p>
                                <p className="text-xs text-muted-foreground">Bạn đã cập nhật mọi thông tin.</p>
                            </div>
                        ) : (
                            <div className="flex flex-col">
                                {notifications.slice(0, 5).map((noti, index) => (
                                    <div
                                        key={noti._id}
                                        onClick={() => {
                                            if (noti.type === 'GROUP' || noti.type === 'group_play') {
                                                onClose();
                                                setPage('chat');
                                            }
                                        }}
                                        className={`group relative flex gap-4 px-5 py-4 cursor-pointer transition-colors ${
                                            noti.isRead ? 'hover:bg-muted' : 'bg-emerald-500/5 hover:bg-emerald-500/10'
                                        } ${index !== notifications.length - 1 ? 'border-b border-border' : ''}`}
                                    >
                                        {/* Icon */}
                                        <div className={`w-11 h-11 shrink-0 rounded-xl border flex items-center justify-center ${getIconBackground(noti.type)}`}>
                                            {getNotificationIcon(noti.type)}
                                        </div>

                                        {/* Info */}
                                        <div className="flex-1 min-w-0">
                                            <div className="flex justify-between items-start mb-1 gap-2">
                                                <h3 className={`text-[14px] font-bold leading-tight break-words ${noti.isRead ? 'text-muted-foreground' : 'text-foreground'}`}>
                                                    {noti.title}
                                                </h3>
                                                {!noti.isRead && (
                                                    <span className="w-2 h-2 rounded-full bg-emerald-500 shrink-0 mt-1" />
                                                )}
                                            </div>
                                            <p className={`text-[13px] line-clamp-2 break-words ${noti.isRead ? 'text-muted-foreground' : 'text-muted-foreground'}`}>
                                                {noti.message}
                                            </p>
                                            <div className="mt-2 text-[11px] font-bold text-muted-foreground flex items-center gap-1.5">
                                                <span>Hệ thống</span>
                                                <span className="w-1 h-1 rounded-full bg-gray-600" />
                                                <span>{timeAgo(noti.createdAt)}</span>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>

                    {/* Footer */}
                    <div className="border-t border-border p-3">
                        <button
                            onClick={handleViewAll}
                            className="w-full py-2.5 rounded-xl text-[14px] font-bold text-emerald-400 hover:bg-emerald-500/10 transition-colors flex items-center justify-center"
                        >
                            Xem tất cả thông báo
                        </button>
                    </div>
                </motion.div>
            )}
        </AnimatePresence>
    );
}
