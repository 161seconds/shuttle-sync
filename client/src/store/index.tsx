import { createContext, useContext, useState, useCallback, type ReactNode } from 'react';
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
}

const defaultFilters: CourtFilters = {
    sport: 'all',
    district: 'Tất cả',
    keyword: '',
    sortBy: 'distance',
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

    const setFilters = useCallback((partial: Partial<CourtFilters>) => {
        setFiltersState(prev => ({ ...prev, ...partial }));
    }, []);

    const resetFilters = useCallback(() => setFiltersState(defaultFilters), []);

    return (
        <AppContext.Provider
            value={{
                page,
                setPage,
                bookingCourt,
                setBookingCourt,
                user,
                setUser,
                filters,
                setFilters,
                resetFilters
            }
            }
        >
            {children}
        </AppContext.Provider>
    );
}

export function useAppStore() {
    const ctx = useContext(AppContext);
    if (!ctx) throw new Error('useAppStore must be used within AppProvi der');
    return ctx;
}