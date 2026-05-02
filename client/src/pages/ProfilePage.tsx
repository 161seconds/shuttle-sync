import { useState, useEffect } from 'react';
import {
    Edit, Bookmark, History, Award, Users, Bell, Settings,
    LogOut, ChevronRight, Check, UserCircle, LogIn, ShieldAlert
} from 'lucide-react';
import { theme as t } from '../utils/theme';
import { useAppStore } from '../store';
import { authApi } from '../api/auth.api';

// Sub-pages
import EditProfile from './profile/EditProfile';
import FavoriteCourts from './profile/FavoriteCourts';
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
                const res = await authApi.getMe();
                setUser(res.data.user || res.data.data || res.data);
            } catch (error) {
                console.error("Lỗi đồng bộ dữ liệu Profile:", error);
            } finally {
                setIsSyncing(false);
            }
        };

        if (localStorage.getItem('accessToken')) {
            syncData();
        }
    }, [setUser]);

    const handleLogout = () => {
        const refreshToken = localStorage.getItem('refreshToken');
        if (refreshToken) {
            authApi.logout(refreshToken).catch((err) => console.log('Logout API:', err));
        }
        localStorage.removeItem('accessToken');
        localStorage.removeItem('refreshToken');
        setUser(null);
        setPage('login');
    };

    if (!user) {
        return (
            <div className="max-w-md mx-auto px-6 pt-20 pb-24 flex flex-col items-center justify-center min-h-[75vh] text-center">
                <div className="relative w-28 h-28 bg-[#1e1e1e] rounded-full flex items-center justify-center mb-6 border border-white/10 shadow-[0_0_40px_rgba(16,185,129,0.15)]">
                    <div className="absolute inset-0 rounded-full border border-emerald-500/20 animate-ping" style={{ animationDuration: '3s' }}></div>
                    <UserCircle className="w-14 h-14 text-emerald-500/80" />
                </div>

                <h2 className="text-2xl font-black text-white mb-3">Chưa đăng nhập</h2>

                <p className="text-gray-400 text-[14px] leading-relaxed mb-10 px-2">
                    Vui lòng đăng nhập để xem thông tin cá nhân, quản lý lịch đặt sân và nhận nhiều ưu đãi hấp dẫn từ ShuttleSync.
                </p>

                <button
                    onClick={() => setPage('login')}
                    className="w-full flex items-center justify-center gap-2 bg-linear-to-r from-emerald-500 to-emerald-400 hover:opacity-90 text-black font-bold py-4 px-6 rounded-2xl transition-all shadow-[0_8px_25px_rgba(16,185,129,0.3)] active:scale-[0.98]"
                >
                    <LogIn className="w-5 h-5" />
                    Đăng nhập / Đăng ký ngay
                </button>

                <div className="mt-8 flex items-center gap-2 text-xs text-gray-500">
                    <ShieldAlert className="w-4 h-4" />
                    <span>Dữ liệu của bạn được mã hóa và bảo mật 100%</span>
                </div>
            </div>
        );
    }

    // Sub-page routing
    if (subPage === 'edit') return <EditProfile onBack={() => setSubPage(null)} />;
    if (subPage === 'favorites') return <FavoriteCourts onBack={() => setSubPage(null)} />;
    if (subPage === 'history') return <BookingHistory onBack={() => setSubPage(null)} />;
    if (subPage === 'tournaments') return <MyTournaments onBack={() => setSubPage(null)} />;
    if (subPage === 'groups') return <MyGroupPlays onBack={() => setSubPage(null)} />;
    if (subPage === 'notifications') return <Notifications onBack={() => setSubPage(null)} />;
    if (subPage === 'settings') return <SettingsPage onBack={() => setSubPage(null)} />;

    const MENU: { icon: React.ReactNode; label: string; badge: any; action: SubPage }[] = [
        { icon: <Edit className="w-4 h-4" />, label: 'Chỉnh sửa hồ sơ', badge: null, action: 'edit' },
        {
            icon: <Bookmark className="w-4 h-4" />, label: 'Sân yêu thích',
            badge: user.favoriteCourtIds?.length || null, action: 'favorites'
        },
        {
            icon: <History className="w-4 h-4" />, label: 'Lịch sử đặt sân',
            badge: user.stats?.totalBookings || null, action: 'history'
        },
        { icon: <Award className="w-4 h-4" />, label: 'Giải đấu của tôi', badge: null, action: 'tournaments' },
        {
            icon: <Users className="w-4 h-4" />, label: 'Nhóm chơi',
            badge: user.stats?.totalGroupPlays || null, action: 'groups'
        },
        { icon: <Bell className="w-4 h-4" />, label: 'Thông báo', badge: null, action: 'notifications' },
        { icon: <Settings className="w-4 h-4" />, label: 'Cài đặt', badge: null, action: 'settings' },
    ];

    return (
        <div className="max-w-lg mx-auto px-4 pb-36 md:pb-16 py-6">
            {/* Profile card */}
            <div className={`${t.bg.card} rounded-2xl border ${t.border.subtle} p-6 mb-6 text-center relative overflow-hidden`}>

                {isSyncing && (
                    <div className="absolute top-3 right-3 w-3 h-3 rounded-full border-2 border-emerald-500/30 border-t-emerald-500 animate-spin" />
                )}

                <div className="relative inline-block mb-4">
                    <div className="w-20 h-20 rounded-2xl bg-linear-to-br from-emerald-400 to-green-600 flex items-center justify-center text-3xl font-black text-black shadow-lg shadow-emerald-500/20 overflow-hidden">
                        {user.avatar ? (
                            <img src={user.avatar} alt="avatar" className="w-full h-full object-cover" />
                        ) : (
                            user.displayName?.charAt(0).toUpperCase() || 'U'
                        )}
                    </div>
                    <div className="absolute -bottom-1 -right-1 w-6 h-6 rounded-lg bg-emerald-500 flex items-center justify-center border-2 border-[#151515]">
                        <Check className="w-3 h-3 text-black" strokeWidth={3} />
                    </div>
                </div>
                <h2 className={`text-lg font-bold ${t.text.primary}`}>{user.displayName || 'Vợt thủ'}</h2>
                <p className={`text-xs ${t.text.muted} mt-0.5`}>{user.email}</p>

                <div className="grid grid-cols-3 gap-3 mt-5">
                    {[
                        { label: 'Đã đặt', value: user.stats?.totalBookings || '0' },
                        { label: 'Nhóm chơi', value: user.stats?.totalGroupPlays || '0' },
                        { label: 'Đánh giá', value: user.stats?.rating?.toFixed(1) || '0.0' },
                    ].map(s => (
                        <div key={s.label} className={`py-3 rounded-xl ${t.bg.elevated}`}>
                            <div className={`text-lg font-black ${t.text.accent}`}>{s.value}</div>
                            <div className={`text-[10px] ${t.text.muted} mt-0.5`}>{s.label}</div>
                        </div>
                    ))}
                </div>
            </div>

            {/* Menu items */}
            <div className="space-y-1">
                {MENU.map((item) => (
                    <button key={item.label} onClick={() => setSubPage(item.action)}
                        className={`w-full flex items-center gap-4 px-4 py-3.5 rounded-xl ${t.bg.hover} transition-colors group`}>
                        <div className={`w-9 h-9 rounded-xl ${t.bg.elevated} flex items-center justify-center ${t.text.muted} group-hover:text-emerald-400 transition-colors`}>
                            {item.icon}
                        </div>
                        <span className={`flex-1 text-left text-sm font-medium ${t.text.secondary}`}>
                            {item.label}
                        </span>
                        {item.badge != null && item.badge > 0 && (
                            <span className="px-2 py-0.5 rounded-md bg-emerald-500/15 text-emerald-400 text-[10px] font-bold">
                                {item.badge}
                            </span>
                        )}
                        <ChevronRight className={`w-4 h-4 ${t.text.muted}`} />
                    </button>
                ))}
            </div>

            {/* Logout */}
            <button onClick={handleLogout}
                className="w-full flex items-center gap-4 px-4 py-3.5 rounded-xl mt-4 hover:bg-red-500/5 transition-colors active:scale-95">
                <div className="w-9 h-9 rounded-xl bg-red-500/10 flex items-center justify-center text-red-400">
                    <LogOut className="w-4 h-4" />
                </div>
                <span className="text-sm font-medium text-red-400">Đăng xuất</span>
            </button>
        </div>
    );
}