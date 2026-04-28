import { useState, useEffect } from 'react';
import { ChevronLeft, Bell, Calendar, Users, Trophy, Megaphone, Settings, Check, Loader2 } from 'lucide-react';
import { theme as t } from '../../utils/theme';
import axiosClient from '../../api/axiosClient';

interface Notification {
    _id: string;
    title: string;
    message: string;
    type: 'booking' | 'group_play' | 'tournament' | 'system' | 'promotion';
    isRead: boolean;
    createdAt: string;
}

const TYPE_ICON: Record<string, { icon: React.ReactNode; color: string; bg: string }> = {
    booking: { icon: <Calendar className="w-4 h-4" />, color: 'text-emerald-400', bg: 'bg-emerald-500/10' },
    group_play: { icon: <Users className="w-4 h-4" />, color: 'text-blue-400', bg: 'bg-blue-500/10' },
    tournament: { icon: <Trophy className="w-4 h-4" />, color: 'text-amber-400', bg: 'bg-amber-500/10' },
    system: { icon: <Settings className="w-4 h-4" />, color: 'text-[#999]', bg: 'bg-white/5' },
    promotion: { icon: <Megaphone className="w-4 h-4" />, color: 'text-purple-400', bg: 'bg-purple-500/10' },
};

interface Props {
    onBack: () => void;
}

export default function Notifications({ onBack }: Props) {
    const [notifications, setNotifications] = useState<Notification[]>([]);
    const [unreadCount, setUnreadCount] = useState(0);
    const [loading, setLoading] = useState(true);
    const [markingAll, setMarkingAll] = useState(false);

    useEffect(() => {
        const fetch = async () => {
            try {
                const res = await axiosClient.get('/notifications');
                const data = res.data.data || {};
                setNotifications(data.notifications || []);
                setUnreadCount(data.unreadCount || 0);
            } catch (err) {
                console.error('Lỗi lấy thông báo:', err);
            } finally {
                setLoading(false);
            }
        };
        fetch();
    }, []);

    const markAsRead = async (id: string) => {
        try {
            await axiosClient.put(`/notifications/${id}/read`);
            setNotifications(prev => prev.map(n => n._id === id ? { ...n, isRead: true } : n));
            setUnreadCount(prev => Math.max(0, prev - 1));
        } catch (err) {
            console.error('Lỗi:', err);
        }
    };

    const markAllRead = async () => {
        setMarkingAll(true);
        try {
            await axiosClient.put('/notifications/read-all');
            setNotifications(prev => prev.map(n => ({ ...n, isRead: true })));
            setUnreadCount(0);
        } catch (err) {
            console.error('Lỗi:', err);
        } finally {
            setMarkingAll(false);
        }
    };

    const timeAgo = (dateStr: string) => {
        const diff = Date.now() - new Date(dateStr).getTime();
        const mins = Math.floor(diff / 60000);
        if (mins < 1) return 'Vừa xong';
        if (mins < 60) return `${mins} phút trước`;
        const hours = Math.floor(mins / 60);
        if (hours < 24) return `${hours} giờ trước`;
        const days = Math.floor(hours / 24);
        if (days < 7) return `${days} ngày trước`;
        return new Date(dateStr).toLocaleDateString('vi-VN');
    };

    return (
        <div className={`min-h-screen ${t.bg.base} pb-24`}>
            <div className={`sticky top-0 z-30 ${t.bg.base}/95 backdrop-blur-xl border-b ${t.border.subtle}`}>
                <div className="flex items-center gap-3 px-4 h-14">
                    <button onClick={onBack} className={`w-9 h-9 rounded-xl ${t.bg.elevated} flex items-center justify-center ${t.text.muted}`}>
                        <ChevronLeft className="w-5 h-5" />
                    </button>
                    <h1 className={`font-bold ${t.text.primary}`}>Thông báo</h1>
                    {unreadCount > 0 && (
                        <span className="px-2 py-0.5 rounded-full bg-emerald-500/15 text-emerald-400 text-[10px] font-bold">
                            {unreadCount} mới
                        </span>
                    )}
                    <div className="flex-1" />
                    {unreadCount > 0 && (
                        <button onClick={markAllRead} disabled={markingAll}
                            className={`text-xs ${t.text.accent} font-semibold flex items-center gap-1`}>
                            {markingAll ? <Loader2 className="w-3 h-3 animate-spin" /> : <Check className="w-3 h-3" />}
                            Đọc hết
                        </button>
                    )}
                </div>
            </div>

            <div className="max-w-lg mx-auto">
                {loading ? (
                    <div className="px-4 py-4 space-y-3">
                        {Array.from({ length: 5 }).map((_, i) => (
                            <div key={i} className={`h-20 rounded-2xl ${t.bg.card} border ${t.border.subtle} animate-pulse`} />
                        ))}
                    </div>
                ) : notifications.length === 0 ? (
                    <div className="flex flex-col items-center py-20">
                        <Bell className={`w-12 h-12 ${t.text.muted} mb-4`} />
                        <p className={`${t.text.secondary} font-semibold mb-1`}>Không có thông báo</p>
                        <p className={`text-xs ${t.text.muted}`}>Bạn sẽ nhận thông báo khi có hoạt động mới</p>
                    </div>
                ) : (
                    <div>
                        {notifications.map(n => {
                            const ti = TYPE_ICON[n.type] || TYPE_ICON.system;
                            return (
                                <button key={n._id} onClick={() => !n.isRead && markAsRead(n._id)}
                                    className={`w-full flex items-start gap-3 px-4 py-4 border-b ${t.border.subtle} text-left transition-colors ${n.isRead ? '' : `${t.bg.card}`
                                        }`}>
                                    <div className={`w-10 h-10 rounded-xl ${ti.bg} flex items-center justify-center shrink-0 mt-0.5 ${ti.color}`}>
                                        {ti.icon}
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <div className="flex items-center gap-2 mb-0.5">
                                            <h3 className={`text-sm font-semibold ${n.isRead ? t.text.secondary : t.text.primary} truncate`}>
                                                {n.title}
                                            </h3>
                                            {!n.isRead && <span className="w-2 h-2 rounded-full bg-emerald-400 shrink-0" />}
                                        </div>
                                        <p className={`text-xs ${t.text.muted} line-clamp-2 leading-relaxed`}>{n.message}</p>
                                        <p className={`text-[10px] ${t.text.muted} mt-1.5`}>{timeAgo(n.createdAt)}</p>
                                    </div>
                                </button>
                            );
                        })}
                    </div>
                )}
            </div>
        </div>
    );
}