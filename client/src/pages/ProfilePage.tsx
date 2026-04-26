import {
    Edit, Bookmark, History, Award, Users, Bell, Settings,
    LogOut, ChevronRight, Check,
} from 'lucide-react';
import { theme as t } from '../utils/theme';
import { useAppStore } from '../store';
import { authApi } from '../api/auth.api';

export default function ProfilePage() {
    const { user, setUser, setPage } = useAppStore();

    const handleLogout = () => {
        // 1. Lấy token để gửi API đăng xuất ngầm (Không dùng await để tránh bị treo nút)
        const refreshToken = localStorage.getItem('refreshToken');
        if (refreshToken) {
            authApi.logout(refreshToken).catch((err) => console.log('Logout API:', err));
        }

        // 2. Xóa sạch sẽ dữ liệu ở dưới LocalStorage NGAY LẬP TỨC
        localStorage.removeItem('accessToken');
        localStorage.removeItem('refreshToken');

        // 3. Xóa user trong Store và đá về trang Login
        setUser(null);
        setPage('login');
    };

    if (!user) return null;

    // Đưa MENU vào bên trong component để móc data thật từ biến `user`
    const MENU = [
        { icon: <Edit className="w-4 h-4" />, label: 'Chỉnh sửa hồ sơ', badge: null },
        {
            icon: <Bookmark className="w-4 h-4" />,
            label: 'Sân yêu thích',
            badge: user.favoriteCourtIds && user.favoriteCourtIds.length > 0 ? user.favoriteCourtIds.length : null
        },
        {
            icon: <History className="w-4 h-4" />,
            label: 'Lịch sử đặt sân',
            badge: user.stats?.totalBookings > 0 ? user.stats.totalBookings : null
        },
        { icon: <Award className="w-4 h-4" />, label: 'Giải đấu của tôi', badge: null },
        {
            icon: <Users className="w-4 h-4" />,
            label: 'Nhóm chơi',
            badge: user.stats?.totalGroupPlays > 0 ? user.stats.totalGroupPlays : null
        },
        // Tạm ẩn số thông báo ảo đi, sau này bạn gọi API Notifications thì lắp vào đây
        { icon: <Bell className="w-4 h-4" />, label: 'Thông báo', badge: null },
        { icon: <Settings className="w-4 h-4" />, label: 'Cài đặt', badge: null },
    ];

    return (
        <div className="max-w-lg mx-auto px-4 pb-24 md:pb-8 py-6">
            {/* Profile card */}
            <div className={`${t.bg.card} rounded-2xl border ${t.border.subtle} p-6 mb-6 text-center`}>
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
                    <button
                        key={item.label}
                        className={`w-full flex items-center gap-4 px-4 py-3.5 rounded-xl ${t.bg.hover} transition-colors group`}
                    >
                        <div className={`w-9 h-9 rounded-xl ${t.bg.elevated} flex items-center justify-center ${t.text.muted} group-hover:text-emerald-400 transition-colors`}>
                            {item.icon}
                        </div>
                        <span className={`flex-1 text-left text-sm font-medium ${t.text.secondary}`}>
                            {item.label}
                        </span>
                        {item.badge && (
                            <span className="px-2 py-0.5 rounded-md bg-emerald-500/15 text-emerald-400 text-[10px] font-bold">
                                {item.badge}
                            </span>
                        )}
                        <ChevronRight className={`w-4 h-4 ${t.text.muted}`} />
                    </button>
                ))}
            </div>

            {/* Logout */}
            <button
                onClick={handleLogout}
                className="w-full flex items-center gap-4 px-4 py-3.5 rounded-xl mt-4 hover:bg-red-500/5 transition-colors active:scale-95"
            >
                <div className="w-9 h-9 rounded-xl bg-red-500/10 flex items-center justify-center text-red-400">
                    <LogOut className="w-4 h-4" />
                </div>
                <span className="text-sm font-medium text-red-400">Đăng xuất</span>
            </button>
        </div>
    );
}