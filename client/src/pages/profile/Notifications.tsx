import { useState, useEffect } from 'react';
import {
    CheckCheck, Rocket,
    Trophy, Users, CalendarClock, CreditCard,
    ShieldAlert, Info, Loader2
} from 'lucide-react';
import { theme as t } from '../../utils/theme';
import axiosClient from '../../api/axiosClient';
import { useAppStore } from '../../store';
import { useSocialStore } from '../../stores/useSocialStore';
import UserProfileModal from '../chat/UserProfileModal';
import type { ChatUser } from '../chat/mockData';
import { friendApi } from '../../api/friend.api';
import { AnimatePresence } from 'framer-motion';
import ProfileHeader from '../../components/layout/ProfileHeader';

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
    const { pendingRequests, fetchPendingRequests, fetchFriends, fetchConversations } = useSocialStore();
    const [notifications, setNotifications] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [selectedUser, setSelectedUser] = useState<ChatUser | null>(null);

    const handleAvatarClick = (u: any) => {
        setSelectedUser({
            id: u._id,
            name: u.displayName,
            avatar: u.avatar || '',
            skillLevel: u.skillLevel || 'Chưa cập nhật',
            status: 'active',
            matchesPlayed: (u.stats?.totalGroupsJoined || 0) + (u.stats?.totalGroupsCreated || 0),
            favoriteCourt: 'Chưa cập nhật',
            joinedDate: new Date().toISOString()
        });
    };

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
            fetchPendingRequests();
        };

        window.addEventListener('refresh_notifications', handleRefresh);
        fetchPendingRequests();
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
            <ProfileHeader 
                title="Thông báo" 
                onBack={onBack}
                rightContent={
                    <button
                        onClick={handleMarkAllRead}
                        disabled={loading || notifications.length === 0}
                        className="text-[11px] font-black text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-3.5 py-2 rounded-full flex items-center gap-1.5 hover:bg-emerald-500/20 hover:scale-105 active:scale-95 transition-all disabled:opacity-50 disabled:scale-100 uppercase tracking-wider"
                    >
                        <CheckCheck className="w-4 h-4" />
                        Đã đọc tất cả
                    </button>
                }
            />

            {/* Danh sách thông báo */}
            <div className="max-w-3xl mx-auto px-4 py-6">
                
                {/* Lời mời kết bạn */}
                {pendingRequests.length > 0 && (
                    <div className="mb-8">
                        <div className="flex items-center justify-between mb-3 px-1">
                            <h2 className="text-[13px] font-bold text-muted-foreground uppercase tracking-wider">
                                Lời mời kết bạn ({pendingRequests.length})
                            </h2>
                        </div>
                        <div className="bg-card border border-border rounded-2xl overflow-hidden">
                            {pendingRequests.map((req, index) => (
                                <div key={req._id} className={`flex flex-col sm:flex-row gap-4 p-4 ${index !== pendingRequests.length - 1 ? 'border-b border-border' : ''} hover:bg-muted transition-colors`}>
                                    <div className="flex gap-4 flex-1">
                                        <div 
                                            className="w-12 h-12 rounded-full overflow-hidden border border-emerald-500/30 shrink-0 cursor-pointer bg-card flex items-center justify-center text-emerald-400 font-bold"
                                            onClick={() => handleAvatarClick(req.requesterId)}
                                        >
                                            {req.requesterId.avatar ? <img src={req.requesterId.avatar || undefined} alt="avatar" className="w-full h-full object-cover" /> : req.requesterId.displayName.charAt(0)}
                                        </div>
                                        <div className="flex-1 min-w-0 flex flex-col justify-center">
                                            <h3 className="text-[14px] font-bold text-foreground">{req.requesterId.displayName}</h3>
                                            <p className="text-[13px] text-muted-foreground mt-0.5">Đã gửi lời mời kết bạn</p>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-2 sm:ml-auto">
                                        <button 
                                            className="px-4 py-2 bg-emerald-500 hover:bg-emerald-400 text-black text-[13px] font-bold rounded-xl transition-all w-full sm:w-auto"
                                            onClick={async () => {
                                                try {
                                                    await friendApi.acceptRequest(req._id);
                                                    await Promise.all([fetchPendingRequests(), fetchFriends(), fetchConversations()]);
                                                } catch (e) {
                                                    console.error(e);
                                                }
                                            }}
                                        >
                                            Chấp nhận
                                        </button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                )}

                <div>
                    <div className="flex items-center justify-between mb-3 px-1">
                        <h2 className="text-[13px] font-bold text-muted-foreground uppercase tracking-wider">Hoạt động</h2>
                    </div>

                    <div className="bg-card border border-border rounded-2xl overflow-hidden">
                        {loading ? (
                            <div className="flex flex-col items-center justify-center py-20 text-center">
                                <Loader2 className="w-8 h-8 text-emerald-500 animate-spin mb-4" />
                                <p className="text-muted-foreground text-sm font-medium">Đang tải thông báo...</p>
                            </div>
                        ) : notifications.length === 0 ? (
                            <div className="flex flex-col items-center justify-center py-20 text-center px-4">
                                <div className="w-16 h-16 rounded-full bg-card flex items-center justify-center border border-border mb-4">
                                    <CheckCheck className="w-8 h-8 text-emerald-500" />
                                </div>
                                <p className="text-foreground font-bold text-[15px] mb-1">Không có thông báo nào</p>
                                <p className="text-sm text-muted-foreground">Bạn đã cập nhật mọi thông tin.</p>
                            </div>
                        ) : (
                            <div className="flex flex-col">
                                {Array.isArray(notifications) && notifications.map((noti, index) => (
                                    <div
                                        key={noti._id}
                                        onClick={() => {
                                            if (noti.type === 'GROUP' || noti.type === 'group_play') {
                                                setPage('chat');
                                            }
                                        }}
                                        className={`group relative flex gap-4 px-4 py-4 cursor-pointer transition-colors ${
                                            noti.isRead ? 'hover:bg-muted' : 'bg-emerald-500/5 hover:bg-emerald-500/10'
                                        } ${index !== notifications.length - 1 ? 'border-b border-border' : ''}`}
                                    >
                                        {/* Icon */}
                                        <div className={`w-11 h-11 shrink-0 rounded-xl border flex items-center justify-center ${getIconBackground(noti.type)}`}>
                                            {getNotificationIcon(noti.type)}
                                        </div>

                                        {/* Content */}
                                        <div className="flex-1 min-w-0">
                                            <div className="flex justify-between items-start mb-1">
                                                <h3 className={`text-[14px] font-bold leading-tight ${noti.isRead ? 'text-muted-foreground' : 'text-foreground'}`}>
                                                    {noti.title}
                                                </h3>
                                                {!noti.isRead && (
                                                    <span className="w-2 h-2 rounded-full bg-emerald-500 shrink-0 mt-1 shadow-glow-lg" />
                                                )}
                                            </div>
                                            <p className={`text-[13px] leading-relaxed ${noti.isRead ? 'text-muted-foreground' : 'text-muted-foreground'}`}>
                                                {noti.message}
                                            </p>

                                            {noti.title.toLowerCase().includes('từ chối') && (
                                                <div className="mt-3">
                                                    <button 
                                                        onClick={(e) => {
                                                            e.stopPropagation();
                                                            setNotifications(prev => prev.filter(n => n._id !== noti._id));
                                                        }}
                                                        className="px-3 py-1.5 bg-card hover:bg-muted border border-border text-muted-foreground rounded-lg text-[12px] font-medium transition-colors"
                                                    >
                                                        Đã hiểu
                                                    </button>
                                                </div>
                                            )}

                                            <div className="mt-2.5 text-[11px] font-bold text-muted-foreground flex items-center gap-1.5">
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
                </div>
            </div>

            <AnimatePresence>
                {selectedUser && (
                    <UserProfileModal
                        user={selectedUser}
                        onClose={() => setSelectedUser(null)}
                    />
                )}
            </AnimatePresence>
        </div>
    );
}