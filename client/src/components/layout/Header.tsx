import { Calendar, Search, Bell, Menu } from 'lucide-react';
import { useAppStore } from '../../store';
import { theme as t } from '../../utils/theme';

export default function Header() {
    const { setPage, user, isSideBarOpen, toggleSidebar } = useAppStore();

    return (
        <header
            className={`fixed top-0 left-0 right-0 z-50 w-full h-16 border-b ${t.border.subtle} ${t.bg.base}/90 backdrop-blur-xl`}
        >
            <div className="w-full h-full grid grid-cols-3 items-center px-4 md:px-6">
                {/* LEFT */}
                <div className="flex items-center justify-start gap-2">
                    {/* NÚT BẬT TẮT SIDEBAR */}
                    <button
                        onClick={toggleSidebar}
                        className={`p-2 rounded-xl transition-all ${isSideBarOpen ? 'bg-emerald-500/10 text-emerald-400' : 'hover:bg-white/5 text-gray-400 hover:text-white'}`}
                    >
                        {isSideBarOpen ? <Menu className="w-5 h-5 md:w-6 md:h-6" /> : <Menu className="w-5 h-5 md:w-6 md:h-6" />}
                    </button>

                    <button
                        onClick={() => setPage('home')}
                        className="flex items-center gap-3 group"
                    >
                        <div className="w-10 h-10 rounded-2xl bg-linear-to-br from-emerald-400 to-green-600 flex items-center justify-center shadow-lg shadow-emerald-500/20 group-hover:scale-105 transition-all">
                            <span className="text-lg">🏸</span>
                        </div>

                        <span className="font-black text-xl hidden sm:block">
                            <span className={t.text.primary}>Shuttle</span>
                            <span className={t.text.accent}>Sync</span>
                        </span>
                    </button>
                </div>

                {/* CENTER */}
                <nav className="hidden md:flex items-center justify-center gap-3">
                    <NavBtn
                        icon={<Calendar className="w-4 h-4" />}
                        label="Đặt sân"
                        onClick={() => setPage('home')}
                    />

                    <NavBtn
                        icon={<Search className="w-4 h-4" />}
                        label="Tìm sân"
                        onClick={() => setPage('search')}
                    />
                </nav>

                {/* RIGHT */}
                <div className="flex items-center justify-end gap-3">
                    {user ? (
                        <>
                            <button
                                onClick={() => setPage('notifications')}
                                className={`relative w-10 h-10 rounded-xl ${t.bg.elevated} flex items-center justify-center ${t.text.muted} hover:text-emerald-400 hover:bg-white/5 transition-all`}
                            >
                                <Bell className="w-5 h-5" />
                                <span className="absolute top-2 right-2 w-2 h-2 rounded-full bg-emerald-400 ring-2 ring-[#0a0a0a]" />
                            </button>

                            <button
                                onClick={() => setPage('profile')}
                                className="w-10 h-10 rounded-xl bg-emerald-500/15 flex items-center justify-center text-emerald-400 font-bold text-sm border border-emerald-500/20 hover:bg-emerald-500/25 transition-all overflow-hidden"
                            >
                                {user.avatar ? (
                                    <img
                                        src={user.avatar}
                                        alt="avatar"
                                        className="w-full h-full object-cover"
                                    />
                                ) : (
                                    user.displayName?.charAt(0).toUpperCase() || 'U'
                                )}
                            </button>
                        </>
                    ) : (
                        <button
                            onClick={() => setPage('login')}
                            className="px-5 py-2.5 rounded-xl bg-emerald-500 text-black font-bold text-sm shadow-lg shadow-emerald-500/20 hover:bg-emerald-400 active:scale-95 transition-all"
                        >
                            Đăng nhập
                        </button>
                    )}
                </div>
            </div>
        </header>
    );
}

function NavBtn({
    icon,
    label,
    onClick,
}: {
    icon: React.ReactNode;
    label: string;
    onClick: () => void;
}) {
    return (
        <button
            onClick={onClick}
            className="px-4 py-2.5 rounded-xl text-sm font-semibold flex items-center gap-2 text-[#999] hover:bg-[#1e1e1e] hover:text-emerald-400 transition-all"
        >
            {icon}
            {label}
        </button>
    );
}