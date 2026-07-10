import { useState, useEffect } from 'react';
import { useNavigate, Outlet, useLocation } from 'react-router-dom';
import { useAppStore } from '../../store';
import { ownerApi } from '../../services/ownerApi';
import { LayoutDashboard, LogOut, Settings, CalendarDays, Loader2, Dumbbell, Clock, HelpCircle } from 'lucide-react';


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
        { name: 'Cài đặt', href: '/owner/settings', icon: Settings },
    ];

    return (
        <div className="h-[calc(100vh-64px)] bg-gray-900 text-white font-sans flex">
            {/* Sidebar chỉ hiển thị khi đã có Venue (không ở trang onboarding) */}
            {hasVenue && !location.pathname.includes('/onboarding') && (
                <aside className="w-64 bg-gray-800 border-r border-gray-700 flex flex-col hidden md:flex">
                    <div className="h-16 flex items-center px-6 border-b border-gray-700">
                        <span className="text-xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-emerald-400 to-teal-500">
                            Owner Portal
                        </span>
                    </div>

                    <div className="p-4 flex items-center gap-3 border-b border-gray-700">
                        <img 
                            src={user?.avatar || "https://api.dicebear.com/7.x/avataaars/svg?seed=owner"} 
                            alt="Avatar" 
                            className="w-10 h-10 rounded-full bg-gray-700"
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
                                            ? 'bg-emerald-500/20 text-emerald-400 font-medium' 
                                            : 'text-gray-400 hover:bg-gray-700/50 hover:text-white'
                                    }`}
                                >
                                    <item.icon className="h-5 w-5" />
                                    {item.name}
                                </button>
                            );
                        })}
                    </nav>

                    <div className="p-4 border-t border-gray-700 space-y-2">
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

            <main className="flex-1 flex flex-col h-full overflow-hidden">
                <div className="flex-1 overflow-y-auto">
                    <Outlet />
                </div>
            </main>
        </div>
    );
};
