import { Home, Search, MapPin, User, MessageCircle } from 'lucide-react';
import { motion } from 'framer-motion';
import { useAppStore } from '../../store';

export default function BottomNav() {
    const { page, setPage } = useAppStore();

    const NAV_ITEMS = [
        { id: 'home', icon: <Home className="w-4.5 h-4.5" />, label: 'Trang chủ' },
        { id: 'search', icon: <Search className="w-4.5 h-4.5" />, label: 'Tìm sân' },
        { id: 'map', icon: <MapPin className="w-4.5 h-4.5" />, label: 'Bản đồ' },
        { id: 'chat', icon: <MessageCircle className="w-4.5 h-4.5" />, label: 'Chat' },
        { id: 'profile', icon: <User className="w-4.5 h-4.5" />, label: 'Hồ sơ' },
    ];

    return (
        <motion.div 
            initial={{ opacity: 0, y: 50 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 50 }}
            transition={{ duration: 0.3, ease: "easeInOut" }}
            className="fixed bottom-4 left-0 right-0 z-50 flex justify-center pointer-events-none px-4"
            style={{ paddingBottom: 'env(safe-area-inset-bottom)' }}
        >
            <nav className="pointer-events-auto w-full max-w-[22rem] bg-card border border-border rounded-[18px] shadow-card flex items-center justify-around px-1.5 py-1.5">

                {NAV_ITEMS.map((item) => {
                    const isProfilePage = item.id === 'profile' && ['profile', 'edit-profile', 'favorites', 'history', 'tournaments', 'groups', 'notifications', 'settings'].includes(page);
                    const isActive = page === item.id || isProfilePage;

                    return (
                        <button
                            key={item.id}
                            onClick={() => setPage(item.id as any)}
                            className={`relative flex flex-col items-center justify-center w-[4.5rem] h-12 rounded-[14px] transition-all duration-300 ${isActive
                                ? 'text-emerald-400'
                                : 'text-[#5f656d] hover:text-muted-foreground hover:bg-muted'
                                }`}
                        >
                            {isActive && (
                                <div className="absolute inset-0 bg-emerald-500/10 rounded-[14px] transition-all duration-300 scale-100 opacity-100" />
                            )}

                            <div className={`relative z-10 transition-transform duration-300 ${isActive ? '-translate-y-2' : 'translate-y-0'}`}>
                                {item.icon}
                            </div>

                            <span className={`absolute bottom-1 text-[0.65rem] font-bold tracking-wide whitespace-nowrap transition-all duration-300 ${isActive ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-2'
                                }`}>
                                {item.label}
                            </span>
                        </button>
                    );
                })}
            </nav>
        </motion.div>
    );
}