import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Menu, X, Bot, BookOpen, Trophy, Wallet, Settings } from 'lucide-react';
import { useAppStore } from '../../store';
import { theme as t } from '../../utils/theme';

export default function AppSidebar() {
    const [isOpen, setIsOpen] = useState(false);
    const { setPage, page } = useAppStore();

    const menuItems = [
        { id: 'aicoach', label: 'Huấn luyện viên AI', icon: <Bot className="w-5 h-5 text-emerald-400" /> },
        { id: 'exercises', label: 'Thư viện Bài tập', icon: <BookOpen className="w-5 h-5 text-blue-400" /> },
        { id: 'leaderboard', label: 'Bảng Xếp hạng', icon: <Trophy className="w-5 h-5 text-yellow-500" /> },
        { id: 'finance', label: 'Quản lý Chi Phí', icon: <Wallet className="w-5 h-5 text-purple-400" /> },
    ];

    // Hàm chuyển trang và tự động đóng Sidebar
    const handleNav = (targetPage: string) => {
        setPage(targetPage as any);
        setIsOpen(false);
    };

    return (
        <>
            {/* NÚT HAMBURGER (3 GẠCH)*/}
            <button
                onClick={() => setIsOpen(true)}
                className={`fixed top-5 left-5 z-9999 w-11 h-11 rounded-full ${t.bg.elevated} border border-emerald-500/30 flex items-center justify-center text-white hover:bg-emerald-500/20 transition-all shadow-lg shadow-black/50`}
            >
                <Menu className="w-6 h-6 text-emerald-400" />
            </button>

            {/* SIDEBAR TRƯỢT RA TRƯỢT VÀO */}
            <AnimatePresence>
                {isOpen && (
                    <>
                        {/* Lớp mờ nền đằng sau, bấm vào nền sẽ đóng menu */}
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            onClick={() => setIsOpen(false)}
                            className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm"
                        />

                        {/* Thân Sidebar */}
                        <motion.div
                            initial={{ x: '-100%' }}
                            animate={{ x: 0 }}
                            exit={{ x: '-100%' }}
                            transition={{ type: 'spring', bounce: 0, duration: 0.3 }}
                            className={`fixed top-0 left-0 bottom-0 z-50 w-72 ${t.bg.base} border-r ${t.border.subtle} shadow-2xl flex flex-col`}
                        >
                            {/* Logo & Nút Đóng */}
                            <div className="flex items-center justify-between p-6 border-b border-[#2a2d35]">
                                <h2 className="text-xl font-black text-white italic flex items-center gap-2">
                                    <span className="text-emerald-500">Shuttle</span>Sync
                                </h2>
                                <button onClick={() => setIsOpen(false)} className="text-gray-400 hover:text-white transition-colors">
                                    <X className="w-6 h-6" />
                                </button>
                            </div>

                            {/* Danh sách Menu */}
                            <div className="flex-1 overflow-y-auto py-4 px-3 space-y-1">
                                <p className="text-[10px] font-bold text-gray-500 uppercase tracking-widest pl-3 mb-3 mt-2">
                                    Tính năng mở rộng
                                </p>

                                {menuItems.map((item) => (
                                    <button
                                        key={item.id}
                                        onClick={() => handleNav(item.id)}
                                        className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all ${page === item.id
                                            ? 'bg-emerald-500/10 border border-emerald-500/20 text-white'
                                            : `text-gray-400 hover:${t.bg.elevated} hover:text-white`
                                            }`}
                                    >
                                        {item.icon}
                                        <span className="text-sm font-semibold">{item.label}</span>
                                    </button>
                                ))}
                            </div>

                            {/* Nút Cài đặt dưới đáy */}
                            <div className="p-4 border-t border-[#2a2d35]">
                                <button className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-gray-400 hover:bg-[#1a1b1f] hover:text-white transition-all">
                                    <Settings className="w-5 h-5" />
                                    <span className="text-sm font-semibold">Cài đặt hệ thống</span>
                                </button>
                            </div>
                        </motion.div>
                    </>
                )}
            </AnimatePresence>
        </>
    );
}