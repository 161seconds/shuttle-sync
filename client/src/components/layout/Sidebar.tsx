import {
    Bot, Trophy, Wallet, Settings,
    UserCircle, ClipboardList, BookOpen, Dumbbell
} from 'lucide-react';
import { useAppStore } from '../../store';
import { theme as t } from '../../utils/theme';

export default function AppSidebar() {
    // Gọi thêm 'user' từ store ra để lấy tên và avatar
    const { setPage, page, user } = useAppStore();

    // Gộp cả chức năng cũ và 3 chức năng mới sếp vừa yêu cầu
    const menuItems = [
        { id: 'aicoach', label: 'Huấn luyện viên AI', icon: <Bot className="w-5 h-5 text-emerald-400" /> },
        { id: 'leaderboard', label: 'Bảng Xếp hạng', icon: <Trophy className="w-5 h-5 text-yellow-500" /> },
        { id: 'finance', label: 'Quản lý Chi Phí', icon: <Wallet className="w-5 h-5 text-purple-400" /> },

        // 3 MÓN MỚI SẾP ORDER:
        { id: 'diary', label: 'Nhật kí buổi chơi', icon: <ClipboardList className="w-5 h-5 text-blue-400" /> },
        { id: 'rules', label: 'Bài tập, luật chơi', icon: <BookOpen className="w-5 h-5 text-orange-400" /> },
        { id: 'supplementary', label: 'Các bài tập bổ trợ', icon: <Dumbbell className="w-5 h-5 text-red-400" /> },
    ];

    return (
        // Dùng t.bg.base và t.border.subtle từ theme.ts
        <aside className={`fixed left-0 bottom-0 top-19 z-40 w-60 ${t.bg.base} border-r ${t.border.subtle} flex flex-col`}>

            {/* KHU VỰC 1: TÊN NGƯỜI DÙNG CỦA SẾP */}
            <div className={`p-5 border-b ${t.border.subtle} flex items-center gap-3 ${t.bg.elevated}`}>
                {user?.avatar ? (
                    <img src={user.avatar} alt="avatar" className="w-10 h-10 rounded-full object-cover border border-emerald-500/30" />
                ) : (
                    <div className="w-10 h-10 rounded-full bg-emerald-500/20 flex items-center justify-center border border-emerald-500/30">
                        <UserCircle className="w-6 h-6 text-emerald-400" />
                    </div>
                )}
                <div className="flex-1 min-w-0">
                    <p className={`text-sm font-bold ${t.text.primary} truncate`}>
                        {user?.displayName || 'Khách vãng lai'}
                    </p>
                </div>
            </div>

            {/* KHU VỰC 2: CÁC CHỨC NĂNG Ở DƯỚI */}
            <div className="flex-1 overflow-y-auto py-6 px-4 space-y-6 custom-scrollbar">
                <div>
                    <p className={`text-[10px] font-bold ${t.text.muted} uppercase tracking-widest pl-2 mb-4`}>
                        Tính năng mở rộng
                    </p>
                    <div className="space-y-1">
                        {menuItems.map((item) => (
                            <button
                                key={item.id}
                                onClick={() => setPage(item.id as any)}
                                className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all ${page === item.id
                                        ? `bg-emerald-500/10 border ${t.border.accent} ${t.text.accent} font-bold`
                                        : `${t.text.secondary} ${t.bg.hover} hover:${t.text.primary} font-semibold`
                                    }`}
                            >
                                {item.icon}
                                <span className="text-sm">{item.label}</span>
                            </button>
                        ))}
                    </div>
                </div>
            </div>

            {/* KHU VỰC 3: CÀI ĐẶT */}
            <div className={`p-4 border-t ${t.border.subtle} ${t.bg.base}`}>
                <button className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl ${t.text.secondary} ${t.bg.hover} hover:${t.text.primary} transition-all font-semibold`}>
                    <Settings className="w-5 h-5" />
                    <span className="text-sm">Cài đặt hệ thống</span>
                </button>
            </div>

        </aside>
    );
}