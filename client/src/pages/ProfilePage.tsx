import { useState, useEffect } from 'react';
import {
    Edit, History, Award, Users, Bell, Settings,
    LogOut, ChevronRight, Check, UserCircle, LogIn
} from 'lucide-react';
import { theme as t } from '../utils/theme';
import { useAppStore } from '../store';
import { authApi } from '../api/auth.api';
import { socketService } from '../utils/socket';

// Sub-pages
import EditProfile from './profile/EditProfile';
import BookingHistory from './profile/BookingHistory';
import MyTournaments from './profile/MyTournaments';
import MyGroupPlays from './profile/MyGroupPlays';
import Notifications from './profile/Notifications';
import SettingsPage from './profile/SettingsPage';

type SubPage = null | 'edit' | 'favorites' | 'history' | 'tournaments' | 'groups' | 'notifications' | 'settings';

export default function ProfilePage() {
    const { user, setUser, setPage } = useAppStore();
    const [subPage, setSubPage] = useState<SubPage>(null);
    const [isSyncing, setIsSyncing] = useState(false);

    useEffect(() => {
        const syncData = async () => {
            try {
                setIsSyncing(true);
                const res: any = await authApi.getMe();
                const userData = res.data?.data?.user || res.data?.data || res.data?.user || res.data;
                if (userData) {
                    setUser(userData as any);
                } else {
                    setUser(null);
                }
            } catch (error) {
                console.error("Lỗi đồng bộ dữ liệu Profile:", error);
                setUser(null);
            } finally {
                setIsSyncing(false);
            }
        };

        syncData();
    }, []);

    const handleLogout = async () => {
        try {
            await authApi.logout();
        } catch (err) {
            console.log('Logout API Error:', err);
        }
        socketService.disconnect();
        setUser(null);
        setPage('login');
    };

    if (!user) {
        return (
            <div className="w-full flex-1 flex flex-col items-center justify-center min-h-[75vh] px-6 pt-20 pb-24 text-center">
                <div className="max-w-md w-full flex flex-col items-center">
                    <div className="relative w-28 h-28 bg-card rounded-full flex items-center justify-center mb-6 border border-border shadow-glow">
                        <div className="absolute inset-0 rounded-full border border-emerald-500/20 animate-ping" style={{ animationDuration: '3s' }}></div>
                        <UserCircle className="w-14 h-14 text-emerald-500/80" />
                    </div>
                    <h2 className="text-2xl font-black text-foreground mb-3">Chưa đăng nhập</h2>
                    <p className="text-emerald-100/70 text-[14px] leading-relaxed mb-10 px-2">
                        Vui lòng đăng nhập để xem thông tin cá nhân và quản lý lịch đặt sân.
                    </p>
                    <button onClick={() => setPage('login')} className="w-full flex items-center justify-center gap-2 bg-linear-to-r from-emerald-500 to-emerald-400 hover:opacity-90 text-black font-bold py-4 px-6 rounded-2xl transition-all shadow-glow-lg active:scale-[0.98]">
                        <LogIn className="w-5 h-5" /> Đăng nhập ngay
                    </button>
                </div>
            </div>
        );
    }

    // Sub-page routing
    if (subPage === 'edit') return <EditProfile onBack={() => setSubPage(null)} />;
    if (subPage === 'history') return <BookingHistory onBack={() => setSubPage(null)} />;
    if (subPage === 'tournaments') return <MyTournaments onBack={() => setSubPage(null)} />;
    if (subPage === 'groups') return <MyGroupPlays onBack={() => setSubPage(null)} />;
    if (subPage === 'notifications') return <Notifications onBack={() => setSubPage(null)} />;
    if (subPage === 'settings') return <SettingsPage onBack={() => setSubPage(null)} />;

    const MENU: { icon: React.ReactNode; label: string; badge: number | null; action: SubPage }[] = [
        { icon: <Edit className="w-4 h-4" />, label: 'Chỉnh sửa hồ sơ', badge: null, action: 'edit' },
        ...(user.role !== 'admin' ? [
            { icon: <History className="w-4 h-4" />, label: 'Lịch sử đặt sân', badge: user.stats?.totalBookings || null, action: 'history' },
            { icon: <Award className="w-4 h-4" />, label: 'Giải đấu của tôi', badge: null, action: 'tournaments' },
            { icon: <Users className="w-4 h-4" />, label: 'Quản lý nhóm chơi', badge: (user.stats?.totalGroupsCreated || 0) + (user.stats?.totalGroupsJoined || 0) || null, action: 'groups' },
        ] : []),
        { icon: <Bell className="w-4 h-4" />, label: 'Thông báo', badge: null, action: 'notifications' },
        { icon: <Settings className="w-4 h-4" />, label: 'Cài đặt', badge: null, action: 'settings' },
    ];

    return (
        // 🔥 Thêm w-full và flex flex-col items-center để khóa mục tiêu luôn nằm giữa màn hình
        <div className="w-full flex-1 flex flex-col items-center pt-15 pb-36 md:pb-16 px-4 overflow-y-auto">

            {/* 🔥 Ép về max-w-lg (khoảng 512px) để nó thon gọn như thiết kế cũ */}
            <div className="w-full max-w-lg">

                {/* Aurora Glow Profile Card */}
                <div className="relative rounded-[32px] overflow-hidden mb-6 group">
                    {/* Aurora Background Layers */}
                    <div className="absolute inset-0 bg-linear-to-b from-emerald-500/20 to-transparent z-0 opacity-50 group-hover:opacity-80 transition-opacity duration-700"></div>
                    <div className="absolute top-[-50%] left-[-20%] w-[150%] h-[150%] bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-emerald-500/15 via-transparent to-transparent blur-2xl z-0 animate-pulse-slow"></div>
                    <div className="absolute bottom-[-50%] right-[-20%] w-[150%] h-[150%] bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-teal-500/10 via-transparent to-transparent blur-3xl z-0"></div>

                    {/* Glassmorphism Content */}
                    <div className={`relative z-10 bg-white/5 backdrop-blur-xl border border-white/5 p-8 text-center`}>
                        {isSyncing && (
                            <div className="absolute top-4 right-4 w-4 h-4 rounded-full border-2 border-emerald-500/30 border-t-emerald-500 animate-spin" />
                        )}

                        {/* Avatar */}
                        <div className="relative inline-block mb-5 group-hover:scale-105 transition-transform duration-500">
                            <div className="absolute inset-0 bg-emerald-500/40 rounded-[28px] blur-xl opacity-0 group-hover:opacity-100 transition-opacity duration-700"></div>
                            <div className="relative w-24 h-24 rounded-[28px] bg-linear-to-br from-emerald-400 to-teal-600 flex items-center justify-center text-4xl font-black text-black shadow-glow-lg overflow-hidden border border-border">
                                {user.avatar ? (
                                    <img src={user.avatar} alt="avatar" className="w-full h-full object-cover" />
                                ) : (
                                    user.displayName?.charAt(0).toUpperCase() || 'U'
                                )}
                            </div>
                            <div className="absolute -bottom-2 -right-2 w-8 h-8 rounded-xl bg-linear-to-br from-emerald-400 to-emerald-500 flex items-center justify-center border-2 border-border shadow-lg shadow-emerald-500/50">
                                <Check className="w-4 h-4 text-black" strokeWidth={4} />
                            </div>
                        </div>

                        {/* User Info */}
                        <h2 className={`text-2xl font-black text-foreground tracking-tight`}>{user.displayName || 'Vợt thủ'}</h2>
                        <p className={`text-sm text-emerald-100/70 mt-1 font-medium`}>{user.email}</p>

                        {/* Floating Stats */}
                        <div className="grid grid-cols-2 gap-4 mt-8">
                            {[
                                { label: 'Sân đã đặt', value: user.stats?.totalBookings || '0', color: 'text-emerald-400', bg: 'bg-emerald-500/5' },
                                { label: 'Nhóm đã tạo', value: user.stats?.totalGroupsCreated || '0', color: 'text-amber-400', bg: 'bg-amber-500/5' },
                                { label: 'Nhóm tham gia', value: user.stats?.totalGroupsJoined || '0', color: 'text-blue-400', bg: 'bg-blue-500/5' },
                                { label: 'Điểm đánh giá', value: user.stats?.rating?.toFixed(1) || '0.0', color: 'text-purple-400', bg: 'bg-purple-500/5' },
                            ].map(s => (
                                <div key={s.label} className={`py-4 rounded-2xl ${s.bg} bg-opacity-50 backdrop-blur-md border border-white/5 flex flex-col items-center justify-center hover:-translate-y-1 hover:shadow-lg transition-all duration-300`}>
                                    <div className={`text-2xl font-black ${s.color} drop-shadow-[0_0_10px_rgba(255,255,255,0.1)]`}>{s.value}</div>
                                    <div className={`text-[11px] text-emerald-100/50 mt-1 font-bold uppercase tracking-wider`}>{s.label}</div>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>

                {/* Menu items */}
                <div className="space-y-2.5">
                    {MENU.map((item) => (
                        <button key={item.label} onClick={() => setSubPage(item.action)}
                            className={`w-full flex items-center gap-4 px-5 py-4 rounded-[20px] bg-white/5 border border-white/5 hover:bg-emerald-500/10 hover:border-emerald-500/30 hover:shadow-glow transition-all duration-300 group`}>
                            <div className={`w-10 h-10 rounded-xl bg-white/10 flex items-center justify-center text-emerald-100/70 group-hover:text-emerald-400 group-hover:scale-110 group-hover:bg-emerald-500/10 transition-all duration-300`}>
                                {item.icon}
                            </div>
                            <span className={`flex-1 text-left text-[15px] font-bold text-emerald-100/70 group-hover:text-emerald-50 transition-colors duration-300`}>
                                {item.label}
                            </span>
                            {item.badge != null && item.badge > 0 && (
                                <span className="px-2.5 py-1 rounded-lg bg-emerald-500/20 text-emerald-400 text-[11px] font-black border border-emerald-500/20">
                                    {item.badge}
                                </span>
                            )}
                            <ChevronRight className={`w-5 h-5 text-emerald-100/50 group-hover:text-emerald-500 group-hover:translate-x-1 transition-all duration-300`} />
                        </button>
                    ))}
                </div>

                {/* Logout */}
                <button onClick={handleLogout}
                    className="w-full flex items-center gap-4 px-5 py-4 rounded-[20px] mt-6 mb-8 bg-red-500/5 border border-red-500/10 hover:bg-red-500/10 hover:border-red-500/30 hover:shadow-[0_0_20px_rgba(239,68,68,0.15)] transition-all duration-300 group active:scale-[0.98]">
                    <div className="w-10 h-10 rounded-xl bg-red-500/10 flex items-center justify-center text-red-500 group-hover:scale-110 transition-transform duration-300">
                        <LogOut className="w-5 h-5" />
                    </div>
                    <span className="text-[15px] font-bold text-red-400 group-hover:text-red-300 transition-colors">Đăng xuất tài khoản</span>
                </button>
            </div>
        </div>
    );
}