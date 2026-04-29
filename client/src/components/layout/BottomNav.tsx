import { Home, Search, MapPin, User } from 'lucide-react';
import { useAppStore } from '../../store';

export default function BottomNav() {
    const { page, setPage } = useAppStore();

    const NAV_ITEMS = [
        { id: 'home', icon: <Home className="w-4.5 h-4.5" />, label: 'Trang chủ' },
        { id: 'search', icon: <Search className="w-4.5 h-4.5" />, label: 'Tìm sân' },
        { id: 'map', icon: <MapPin className="w-4.5 h-4.5" />, label: 'Bản đồ' },
        { id: 'profile', icon: <User className="w-4.5 h-4.5" />, label: 'Hồ sơ' },
    ];

    return (
        <div className="fixed bottom-4 left-0 right-0 z-50 flex justify-center pointer-events-none px-4"
            style={{ paddingBottom: 'env(safe-area-inset-bottom)' }}
        >
            <nav className="pointer-events-auto w-full max-w-75 bg-[#141617] border border-[#2a2d30] rounded-[18px] shadow-[0_20px_40px_-10px_rgba(0,0,0,0.8)] flex items-center justify-around px-1.5 py-1.5">

                {NAV_ITEMS.map((item) => {
                    const isProfilePage = item.id === 'profile' && ['profile', 'edit-profile', 'favorites', 'history', 'tournaments', 'groups', 'notifications', 'settings'].includes(page);
                    const isActive = page === item.id || isProfilePage;

                    return (
                        <button
                            key={item.id}
                            onClick={() => setPage(item.id as any)}
                            className={`relative flex flex-col items-center justify-center w-15 h-11.5 rounded-[14px] transition-all duration-300 ${isActive
                                ? 'text-emerald-400'
                                : 'text-[#5f656d] hover:text-[#999] hover:bg-white/5'
                                }`}
                        >
                            {isActive && (
                                <div className="absolute inset-0 bg-emerald-500/10 rounded-[14px] transition-all duration-300 scale-100 opacity-100" />
                            )}

                            <div className={`relative z-10 transition-transform duration-300 ${isActive ? '-translate-y-1.5' : 'translate-y-0'}`}>
                                {item.icon}
                            </div>

                            <span className={`absolute bottom-1 text-[9px] font-bold tracking-wide transition-all duration-300 ${isActive ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-2'
                                }`}>
                                {item.label}
                            </span>
                        </button>
                    );
                })}
            </nav>
        </div>
    );
}