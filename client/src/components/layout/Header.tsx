import { Calendar, Search, Bell } from 'lucide-react';
import { useAppStore } from '../../store';
import { theme as t } from '../../utils/theme';

export default function Header() {
    // 🚨 Lấy thêm biến user từ store để kiểm tra trạng thái
    const { setPage, user } = useAppStore();

    return (
        <header className={`sticky top-0 z-50 ${t.bg.base}/95 backdrop-blur-2xl border-b ${t.border.subtle}`}>
            <div className="max-w-7xl mx-auto px-4 h-14 flex items-center justify-between">

                {/* Logo */}
                <button onClick={() => setPage('home')} className="flex items-center gap-2 group">
                    <div className="w-8 h-8 rounded-lg bg-linear-to-br from-emerald-400 to-green-600 flex items-center justify-center shadow-lg shadow-emerald-500/20 group-hover:shadow-emerald-500/40 transition-shadow">
                        <span className="text-sm">🏸</span>
                    </div>
                    <span className="font-black text-lg hidden sm:block">
                        <span className={t.text.primary}>Shuttle</span>
                        <span className={t.text.accent}>Sync</span>
                    </span>
                </button>

                {/* Navigation */}
                <nav className="hidden md:flex items-center gap-1">
                    <NavBtn icon={<Calendar className="w-4 h-4" />} label="Đặt sân" onClick={() => setPage('home')} />
                    <NavBtn icon={<Search className="w-4 h-4" />} label="Tìm sân" onClick={() => setPage('search')} />
                </nav>

                {/* Phần Avatar / Login */}
                <div className="flex items-center gap-2">
                    {/* 🚨 RẼ NHÁNH Ở ĐÂY: Nếu CÓ user thì hiện avatar, KHÔNG thì hiện nút Đăng Nhập */}
                    {user ? (
                        <>
                            <button onClick={() => setPage('notifications')}
                                className={`relative w-9 h-9 rounded-xl ${t.bg.elevated} flex items-center justify-center ${t.text.muted} hover:text-emerald-400 transition-colors`}>
                                <Bell className="w-4 h-4" />
                                <span className="absolute -top-0.5 -right-0.5 w-2 h-2 rounded-full bg-emerald-400 ring-2 ring-[#0a0a0a]" />
                            </button>
                            <button onClick={() => setPage('profile')}
                                className="w-9 h-9 rounded-xl bg-emerald-500/15 flex items-center justify-center text-emerald-400 font-bold text-xs border border-emerald-500/20 hover:bg-emerald-500/25 transition-colors overflow-hidden">
                                {/* Lấy chữ cái đầu tiên của tên, hoặc avatar thật */}
                                {user.avatar ? (
                                    <img src={user.avatar} alt="avatar" className="w-full h-full object-cover" />
                                ) : (
                                    user.displayName?.charAt(0).toUpperCase() || 'U'
                                )}
                            </button>
                        </>
                    ) : (
                        /* Giao diện dành cho Khách (Chưa đăng nhập) */
                        <button onClick={() => setPage('login')}
                            className="px-4 py-2 rounded-xl bg-emerald-500 text-black font-bold text-sm shadow-lg shadow-emerald-500/20 hover:bg-emerald-400 active:scale-95 transition-all">
                            Đăng nhập
                        </button>
                    )}
                </div>
            </div>
        </header>
    );
}

function NavBtn({ icon, label, onClick }: { icon: React.ReactNode; label: string; onClick: () => void }) {
    return (
        <button onClick={onClick}
            className={`px-4 py-2 rounded-xl text-sm font-semibold flex items-center gap-2 text-[#999] hover:bg-[#1e1e1e] hover:text-emerald-400 transition-all`}>
            {icon} {label}
        </button>
    );
}