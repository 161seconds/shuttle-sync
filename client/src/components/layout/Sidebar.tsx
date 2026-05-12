import {
    Bot, Settings,
    UserCircle, BookOpen, Dumbbell,
    Zap, ChevronRight,
    BarChart2
} from 'lucide-react';
import { useAppStore } from '../../store';
import { theme as t } from '../../utils/theme';

export default function AppSidebar() {
    const { setPage, page, user } = useAppStore();

    const menuItems = [
        { id: 'aicoach', label: 'Huấn luyện viên AI', icon: <Bot className="w-5 h-5 text-emerald-400" /> },
        { id: 'rules', label: 'Luật chơi & thi đấu', icon: <BookOpen className="w-5 h-5 text-orange-400" /> },
        { id: 'supplementary', label: 'Các bài tập bổ trợ', icon: <Dumbbell className="w-5 h-5 text-red-400" /> },
    ];

    return (
        <aside className={`fixed left-0 top-16 bottom-0 z-40 w-60 ${t.bg.base} border-r ${t.border.subtle} flex flex-col h-[calc(100vh-64px)]`}>

            {/* KHU VỰC 1: TÊN NGƯỜI DÙNG (Đã trang trí thêm cho bớt trống) */}
            <button
                onClick={() => setPage('profile')}
                className={`p-5 flex items-center gap-3 hover:bg-white/5 transition-colors group border-b ${t.border.subtle}`}
            >
                <div className="relative">
                    {user?.avatar ? (
                        <img src={user.avatar} alt="avatar" className="w-11 h-11 rounded-2xl object-cover border border-emerald-500/20" />
                    ) : (
                        <div className="w-11 h-11 rounded-2xl bg-emerald-500/10 flex items-center justify-center border border-emerald-500/20">
                            <UserCircle className="w-7 h-7 text-emerald-500/60" />
                        </div>
                    )}
                    {/* Badge nhỏ xinh góc ảnh */}
                    <div className="absolute -bottom-1 -right-1 w-4 h-4 bg-emerald-500 rounded-full border-2 border-[#0a0a0a] flex items-center justify-center">
                        <Zap className="w-2.5 h-2.5 text-black fill-black" />
                    </div>
                </div>

                <div className="flex-1 min-w-0 text-left">
                    <p className={`text-sm font-black ${t.text.primary} truncate group-hover:text-emerald-400 transition-colors`}>
                        {user?.displayName || 'Vợt thủ'}
                    </p>
                    <p className="text-[10px] text-gray-500 font-bold uppercase tracking-tighter flex items-center gap-1">
                        Hạng: <span className="text-emerald-500/80">Pro Player</span>
                    </p>
                </div>
                <ChevronRight className="w-4 h-4 text-gray-700 group-hover:text-emerald-500 transition-transform group-hover:translate-x-0.5" />
            </button>

            {/* KHU VỰC 2: CÁC CHỨC NĂNG (Dùng nền đen chuẩn) */}
            <div className="flex-1 overflow-y-auto py-6 px-3 space-y-1 custom-scrollbar">
                <p className={`text-[10px] font-black ${t.text.muted} uppercase tracking-[2px] pl-3 mb-4`}>
                    Các tính năng
                </p>
                {user?.role === 'admin' && (
                    <button
                        onClick={() => setPage('admin')}
                        className={`w-full flex items-center gap-3 px-4 py-3 mb-1 rounded-xl transition-all duration-200 ${page === 'admin'
                            ? `bg-emerald-500/10 border ${t.border.accent} ${t.text.accent} font-bold shadow-[0_0_15px_rgba(16,185,129,0.05)]`
                            : `text-gray-500 hover:bg-white/5 hover:text-gray-200 font-semibold border border-transparent`
                            }`}
                    >
                        <div className={`${page === 'admin' ? 'scale-110' : 'opacity-70'} transition-transform`}>
                            <BarChart2 className="w-5 h-5 text-indigo-400" />
                        </div>
                        <span className="text-sm tracking-tight">Admin Dashboard</span>
                    </button>
                )}

                {menuItems.map((item) => (
                    <button
                        key={item.id}
                        onClick={() => setPage(item.id as any)}
                        className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 ${page === item.id
                            ? `bg-emerald-500/10 border ${t.border.accent} ${t.text.accent} font-bold shadow-[0_0_15px_rgba(16,185,129,0.05)]`
                            : `text-gray-500 hover:bg-white/3 hover:text-gray-200 font-semibold border border-transparent`
                            }`}
                    >
                        <div className={`${page === item.id ? 'scale-110' : 'opacity-70'} transition-transform`}>
                            {item.icon}
                        </div>
                        <span className="text-sm tracking-tight">{item.label}</span>
                    </button>
                ))}
            </div>

            {/* KHU VỰC 3: CÀI ĐẶT (Đưa xuống đáy và làm mờ nhẹ) */}
            <div className={`p-4 border-t ${t.border.subtle}`}>
                <button className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-gray-500 hover:bg-white/5 hover:text-gray-200 transition-all font-bold text-xs`}>
                    <Settings className="w-4 h-4 opacity-50" />
                    <span>CÀI ĐẶT HỆ THỐNG</span>
                </button>
            </div>
        </aside>
    );
}