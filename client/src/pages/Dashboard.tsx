import { useState, useEffect } from 'react';
import { Calendar, Search } from 'lucide-react';
import { theme as t } from '../utils/theme';
import { useAppStore } from '../store';
import { useFilteredCourts } from '../hooks';
import CourtFilter from '../components/court/CourtFilter';
import CourtList from '../components/court/CourtList';
import type { Court } from '../types';

import { MOCK_COURTS } from '../utils/mockData';

export default function Dashboard() {
    const { setPage, filters, setFilters } = useAppStore();
    const [loading, setLoading] = useState(true);
    const [courts, setCourts] = useState<Court[]>([]);
    const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');

    // Simulate API fetch
    useEffect(() => {
        const timer = setTimeout(() => {
            setCourts(MOCK_COURTS);
            setLoading(false);
        }, 600);
        return () => clearTimeout(timer);
    }, []);

    const filteredCourts = useFilteredCourts(courts, filters);

    return (
        <div className="max-w-7xl mx-auto px-4 pb-24 md:pb-8">
            {/* Hero */}
            <section className="py-6 sm:py-8">
                <h1 className="text-2xl sm:text-3xl font-black tracking-tight mb-1">
                    <span className={t.text.primary}>Tìm sân </span>
                    <span className={t.text.accent}>hoàn hảo</span>
                </h1>
                <p className={`${t.text.muted} text-sm mb-5`}>
                    Cầu lông & Pickleball tại TPHCM
                </p>

                <div className="flex gap-2">
                    <button
                        onClick={() => setPage('home')}
                        className="px-5 py-2.5 rounded-xl bg-emerald-500 text-black text-sm font-bold flex items-center gap-2 hover:bg-emerald-400 transition-colors shadow-lg shadow-emerald-500/20 active:scale-95"
                    >
                        <Calendar className="w-4 h-4" /> Đặt sân
                    </button>
                    <button
                        onClick={() => setPage('search')}
                        className={`px-5 py-2.5 rounded-xl ${t.bg.elevated} border ${t.border.subtle} text-sm font-semibold ${t.text.secondary} flex items-center gap-2 hover:border-emerald-500/20 transition-colors active:scale-95`}
                    >
                        <Search className="w-4 h-4" /> Tìm sân
                    </button>
                </div>
            </section>

            {/* Sticky filter bar */}
            <section className={`sticky top-14 z-30 ${t.bg.base}/95 backdrop-blur-2xl py-3 -mx-4 px-4 border-b ${t.border.subtle}`}>
                <CourtFilter
                    filters={filters}
                    onChange={setFilters}
                />
            </section>

            {/* Court list */}
            <CourtList
                courts={filteredCourts}
                loading={loading}
                viewMode={viewMode}
                onViewModeChange={setViewMode}
            />
        </div>
    );
}