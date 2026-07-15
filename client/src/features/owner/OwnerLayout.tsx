import { useState, useEffect, Suspense } from 'react';
import { useNavigate, Outlet, useLocation } from 'react-router-dom';
import { useAppStore } from '../../store';
import { ownerApi } from '../../services/ownerApi';
import { LayoutDashboard, LogOut, Settings, CalendarDays, Loader2, Dumbbell, Clock, HelpCircle, TrendingDown } from 'lucide-react';
import PremiumBackground from '../../components/ui/PremiumBackground';
import { OwnerWelcomeFlow } from './OwnerWelcomeFlow';


export const OwnerLayout = () => {
    const { user, setUser } = useAppStore();
    const navigate = useNavigate();
    const location = useLocation();
    
    const [isLoading, setIsLoading] = useState(true);
    const [hasVenue, setHasVenue] = useState(false);

    useEffect(() => {
        if (!user || user.role !== 'court_owner') {
            navigate('/auth/login', { replace: true });
            return;
        }

        ownerApi.getStats()
            .then(stats => {
                setHasVenue(stats.hasVenue);
                // Nếu chưa có venue và đang không ở trang onboarding thì redirect sang onboarding
                if (!stats.hasVenue && !location.pathname.includes('/onboarding')) {
                    navigate('/owner/onboarding', { replace: true });
                }
            })
            .catch(err => {
                console.error("Lỗi khi tải owner stats:", err);
            })
            .finally(() => {
                setIsLoading(false);
            });
    }, [user, navigate, location.pathname]);

    const handleLogout = async () => {
        setUser(null);
        navigate('/');
    };

    if (isLoading) {
        return (
            <div className="flex h-screen items-center justify-center bg-gray-900">
                <Loader2 className="h-10 w-10 animate-spin text-emerald-500" />
            </div>
        );
    }

    const navigation = [
        { name: 'Dashboard', href: '/owner/dashboard', icon: LayoutDashboard },
        { name: 'Cấu hình giá sân', href: '/owner/courts', icon: Dumbbell },
        { name: 'Lịch Đặt', href: '/owner/bookings', icon: CalendarDays },
        { name: 'Lịch hoạt động', href: '/owner/schedule', icon: Clock },
        { name: 'Chi phí', href: '/owner/expenses', icon: TrendingDown },
        { name: 'Cài đặt', href: '/owner/settings', icon: Settings },
    ];

    return (
        <div className="h-[calc(100vh-64px)] bg-[#030712] text-white font-sans flex relative overflow-hidden">
            <PremiumBackground />
            
            {/* Main content wrapper to sit above background */}
            <div className="flex w-full h-full relative z-10">
                {hasVenue && !location.pathname.includes('/onboarding') && <OwnerWelcomeFlow />}
                {/* Sidebar chỉ hiển thị khi đã có Venue (không ở trang onboarding) */}
                {hasVenue && !location.pathname.includes('/onboarding') && (
                    <aside className="w-64 bg-[#0a0f16]/60 backdrop-blur-3xl border-r border-white/5 flex flex-col hidden md:flex shrink-0">
                        <div className="h-16 flex items-center px-6 border-b border-white/5">
                        <span className="text-xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-emerald-400 to-teal-500">
                            Owner Portal
                        </span>
                    </div>

                    <div className="p-4 flex items-center gap-3 border-b border-white/5">
                        <img 
                            src={user?.avatar || "https://api.dicebear.com/7.x/avataaars/svg?seed=owner"} 
                            alt="Avatar" 
                            className="w-10 h-10 rounded-full bg-white/5 border border-white/10 shadow-lg"
                        />
                        <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium text-white truncate">{user?.displayName}</p>
                            <p className="text-xs text-gray-400 truncate">Quản lý cơ sở</p>
                        </div>
                    </div>

                    <nav className="flex-1 px-4 py-6 space-y-2">
                        {navigation.map((item) => {
                            const isActive = location.pathname.startsWith(item.href);
                            return (
                                <button
                                    key={item.name}
                                    onClick={() => navigate(item.href)}
                                    className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 ${
                                        isActive 
                                            ? 'bg-emerald-500/15 text-emerald-400 font-bold border border-emerald-500/20 shadow-[0_0_15px_rgba(16,185,129,0.1)]' 
                                            : 'text-gray-400 hover:bg-white/5 hover:text-white'
                                    }`}
                                >
                                    <item.icon className="h-5 w-5" />
                                    {item.name}
                                </button>
                            );
                        })}
                    </nav>

                    <div className="p-4 border-t border-white/5 space-y-2">
                        <button
                            onClick={() => navigate('/support')}
                            className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-purple-400 hover:bg-purple-500/10 transition-all duration-200"
                        >
                            <HelpCircle className="h-5 w-5" />
                            Hỗ trợ
                        </button>
                        <button
                            onClick={handleLogout}
                            className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-red-400 hover:bg-red-500/10 transition-all duration-200"
                        >
                            <LogOut className="h-5 w-5" />
                            Đăng xuất
                        </button>
                    </div>
                </aside>
            )}

                <main className="flex-1 flex flex-col h-full overflow-hidden bg-transparent">
                    <div className="flex-1 overflow-y-auto">
                        <Suspense fallback={
                            <div className="flex-1 flex flex-col items-center justify-center min-h-[50vh]">
                                <div className="w-8 h-8 rounded-full border-2 border-emerald-500/30 border-t-emerald-500 animate-spin"></div>
                            </div>
                        }>
                            <Outlet />
                        </Suspense>
                    </div>
                </main>
            </div>
        </div>
    );
};
