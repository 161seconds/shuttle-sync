import { createContext, useContext, useState, useCallback, useEffect, type ReactNode } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAlertStore } from '../stores/useAlertStore';
import type { AppPage, Court, CourtFilters, User } from '../types';

interface AppState {
    // Navigation
    page: AppPage;
    setPage: (p: AppPage) => void;
    // Booking
    bookingCourt: Court | null;
    setBookingCourt: (c: Court | null) => void;
    // Auth
    user: User | null;
    setUser: (u: User | null) => void;
    // Filters
    filters: CourtFilters;
    setFilters: (f: Partial<CourtFilters>) => void;
    resetFilters: () => void;

    profileSubPage: string | null;
    setProfileSubPage: (p: string | null) => void;

    //sidebar
    isSideBarOpen: boolean;
    toggleSidebar: () => void;
}

const defaultFilters: CourtFilters = {
    sport: 'all',
    district: 'Tất cả',
    keyword: '',
    sortBy: 'rating',
};

const AppContext = createContext<AppState | null>(null);

interface AppProviderProps {
    children: ReactNode;
}

export function AppProvider({ children }: AppProviderProps) {
    const [page, setPage] = useState<AppPage>('home');
    const [bookingCourt, setBookingCourt] = useState<Court | null>(null);
    const [user, setUser] = useState<User | null>(null);
    const [filters, setFiltersState] = useState<CourtFilters>(defaultFilters);
    const [profileSubPage, setProfileSubPage] = useState<string | null>(null);

    const [isSideBarOpen, setIsSideBarOpen] = useState(false);

    const navigate = useNavigate();
    const location = useLocation();

    // Sync URL path back to page state (for Back/Forward buttons)
    useEffect(() => {
        const path = location.pathname;
        let newPage = '';
        if (path === '/') newPage = 'home';
        else if (path === '/login') newPage = 'login';
        else if (path === '/map') newPage = 'map';
        else if (path === '/search') newPage = 'search';
        else if (path === '/profile') newPage = 'profile';
        else if (path === '/edit-profile') newPage = 'edit-profile';
        else if (path === '/groupplay') newPage = 'groupplay';
        else if (path === '/aicoach') newPage = 'aicoach';
        else if (path === '/admin') newPage = 'admin';
        else if (path === '/notifications') newPage = 'notifications';
        else if (path === '/match-leaderboard') newPage = 'match-leaderboard';
        else if (path === '/rules') newPage = 'rules';
        else if (path === '/supplementary') newPage = 'supplementary';
        else if (path === '/chat') newPage = 'chat';
        else if (path === '/news') newPage = 'news';
        else if (path === '/support') newPage = 'support';
        
        if (newPage && newPage !== page) {
            setPage(newPage as AppPage);
        }
        setIsSideBarOpen(false); // Luôn đóng sidebar khi chuyển trang
    }, [location.pathname]);

    const setFilters = useCallback((partial: Partial<CourtFilters>) => {
        setFiltersState(prev => ({ ...prev, ...partial }));
    }, []);

    const resetFilters = useCallback(() => setFiltersState(defaultFilters), []);

    const handleSetPage = useCallback((newPage: AppPage) => {
        const protectedPages = ['chat', 'profile', 'edit-profile', 'notifications', 'match-leaderboard', 'admin'];
        if (!user && protectedPages.includes(newPage)) {
            useAlertStore.getState().showAlert('Vui lòng đăng nhập để sử dụng tính năng này!', 'Thông báo', 'info');
            return;
        }
        setPage(newPage);
        if (newPage === 'home') navigate('/');
        else if (newPage === 'edit-profile') navigate('/edit-profile');
        else if (newPage === 'match-leaderboard') navigate('/match-leaderboard');
        else navigate(`/${newPage}`);
    }, [navigate, user]);

    const toggleSidebar = useCallback(() => {
        setIsSideBarOpen(prev => !prev);
    }, []);

    return (
        <AppContext.Provider
            value={{
                page,
                setPage: handleSetPage, // Dùng hàm mới đã bọc logic tự đóng sidebar
                bookingCourt,
                setBookingCourt,
                user,
                setUser,
                filters,
                setFilters,
                resetFilters,
                profileSubPage,
                setProfileSubPage,
                isSideBarOpen,
                toggleSidebar,
            }}
        >
            {children}
        </AppContext.Provider>
    );
}

export function useAppStore() {
    const ctx = useContext(AppContext);
    if (!ctx) throw new Error('useAppStore must be used within AppProvider');
    return ctx;
}