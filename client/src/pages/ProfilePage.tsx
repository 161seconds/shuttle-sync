import {
    Edit, Bookmark, History, Award, Users, Bell, Settings,
    LogOut, ChevronRight, Check
} from 'lucide-react';
import { theme as t } from '../utils/theme';
import { useAppStore } from '../store';
import { authApi } from '../api/auth.api';

export default function ProfilePage() {
    const { user, setUser, setPage } = useAppStore();

    const handleLogout = () => {
        const refreshToken = localStorage.getItem('refreshToken');

        if (refreshToken) {
            authApi.logout(refreshToken).catch((err) => console.log('Logout API:', err));
        }
        // Dọn dẹp trình duyệt và cập nhật state
        //localStorage.clear();
        setUser(null);
        setPage('login');
    };

    if (!user) return null;

    // Danh sách Menu đã được gộp: Đầy đủ id để chuyển trang, icon và badge thông báo
    const MENU = [
        { id: 'edit-profile', icon: <Edit className="w-4 h-4" />, label: 'Chỉnh sửa hồ sơ', badge: null },
        {
            id: 'favorites',
            icon: <Bookmark className="w-4 h-4" />,
            label: 'Sân yêu thích',
            badge: user.favoriteCourtIds && user.favoriteCourtIds.length > 0 ? user.favoriteCourtIds.length : null
        },
        {
            id: 'history',
            icon: <History className="w-4 h-4" />,
            label: 'Lịch sử đặt sân',
            badge: user.stats?.totalBookings > 0 ? user.stats.totalBookings : null
        },
        { id: 'tournaments', icon: <Award className="w-4 h-4" />, label: 'Giải đấu của tôi', badge: null },
        {
            id: 'groups',
            icon: <Users className="w-4 h-4" />,
            label: 'Nhóm chơi',
            badge: user.stats?.totalGroupPlays > 0 ? user.stats.totalGroupPlays : null
        },
        { id: 'notifications', icon: <Bell className="w-4 h-4" />, label: 'Thông báo', badge: null },
        { id: 'settings', icon: <Settings className="w-4 h-4" />, label: 'Cài đặt', badge: null },
    ];

    return (
        <div className="max-w-lg mx-auto px-4 pb-24 md:pb-8 py-6">
            {/* 1. Profile card (Giữ nguyên giao diện xịn xò của bạn) */}
            <div className={`${t.bg.card} rounded-2xl border ${t.border.subtle} p-6 mb-6 text-center shadow-lg shadow-black/20`}>
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
                        { label: 'Đánh giá', value: user.stats?.rating?.toFixed(1) || '5.0' },
                    ].map(s => (
                        <div key={s.label} className={`py-3 rounded-xl ${t.bg.elevated} border border-white/5`}>
                            <div className={`text-lg font-black ${t.text.accent}`}>{s.value}</div>
                            <div className={`text-[10px] ${t.text.muted} mt-0.5 uppercase tracking-wider`}>{s.label}</div>
                        </div>
                    ))}
                </div>
            </div>

            {/* 2. Menu items (Đã gắn sự kiện onClick chuyển trang) */}
            <div className="space-y-2">
                {MENU.map((item) => (
                    <button
                        key={item.id}
                        onClick={() => setPage(item.id as any)}
                        className={`w-full flex items-center gap-4 px-4 py-3.5 rounded-xl ${t.bg.hover} transition-colors group border border-transparent hover:border-white/5`}
                    >
                        <div className={`w-9 h-9 rounded-xl ${t.bg.elevated} flex items-center justify-center ${t.text.muted} group-hover:text-emerald-400 group-hover:scale-110 transition-all duration-300`}>
                            {item.icon}
                        </div>
                        <span className={`flex-1 text-left text-sm font-medium ${t.text.secondary} group-hover:text-white transition-colors`}>
                            {item.label}
                        </span>
                        {item.badge && (
                            <span className="px-2 py-0.5 rounded-md bg-emerald-500/15 text-emerald-400 text-[10px] font-bold shadow-sm shadow-emerald-500/10">
                                {item.badge}
                            </span>
                        )}
                        <ChevronRight className={`w-4 h-4 ${t.text.muted} group-hover:translate-x-1 transition-transform`} />
                    </button>
                ))}
            </div>

            {/* 3. Nút Đăng xuất */}
            <button
                onClick={handleLogout}
                className="w-full flex items-center justify-center gap-3 px-4 py-3.5 rounded-xl mt-6 border border-red-500/20 bg-red-500/5 hover:bg-red-500/10 hover:border-red-500/30 transition-all active:scale-95 group"
            >
                <LogOut className="w-4 h-4 text-red-400 group-hover:text-red-300 transition-colors" />
                <span className="text-sm font-bold text-red-400 group-hover:text-red-300 transition-colors">Đăng xuất khỏi ShuttleSync</span>
            </button>
        </div>
    );
}