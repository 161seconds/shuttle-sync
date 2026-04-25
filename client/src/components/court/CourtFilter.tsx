import { useState } from 'react';
import {
    Search, ChevronDown, ArrowUpDown, Check, Navigation, Star,
    TrendingUp, DollarSign,
} from 'lucide-react';
import { theme as t, SPORT_FILTERS, DISTRICTS, SORT_OPTIONS } from '../../utils/theme';
import type { CourtFilters } from '../../types';

interface CourtFilterProps {
    filters: CourtFilters;
    onChange: (partial: Partial<CourtFilters>) => void;
    showSearch?: boolean;
}

export default function CourtFilter({ filters, onChange, showSearch = true }: CourtFilterProps) {
    const [showSort, setShowSort] = useState(false);

    const sortIcons: Record<string, React.ReactNode> = {
        distance: <Navigation className="w-3.5 h-3.5" />,
        rating: <Star className="w-3.5 h-3.5" />,
        price_asc: <TrendingUp className="w-3.5 h-3.5" />,
        price_desc: <DollarSign className="w-3.5 h-3.5" />,
    };

    return (
        <div className="space-y-3">
            {/* Search */}
            {showSearch && (
                <div className="relative">
                    <Search className={`absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 ${t.text.muted}`} />
                    <input
                        type="text"
                        placeholder="Tìm theo tên sân, khu vực..."
                        value={filters.keyword}
                        onChange={(e) => onChange({ keyword: (e.target as HTMLInputElement).value })}
                        className={`w-full h-11 pl-11 pr-4 rounded-xl ${t.bg.input} border ${t.border.subtle} ${t.text.primary} placeholder:text-[#555] text-sm outline-none focus:border-emerald-500/40 transition-colors`}
                    />
                </div>
            )}

            {/* Sport pills */}
            <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-none">
                {/* Đã thêm kiểu dữ liệu cho 's' (Giả sử s có id và label là string, icon là ReactNode) */}
                {SPORT_FILTERS.map((s: { id: string; label: string; icon: React.ReactNode }) => {
                    const active = filters.sport === s.id;
                    return (
                        <button
                            key={s.id}
                            onClick={() => onChange({ sport: s.id })}
                            className={`shrink-0 px-4 py-2 rounded-xl text-xs font-semibold flex items-center gap-1.5 border transition-all ${active
                                ? `bg-emerald-500/15 border-emerald-500/30 text-emerald-400 ${t.glow.sm}`
                                : `${t.bg.elevated} ${t.border.subtle} ${t.text.secondary} hover:border-emerald-500/20`
                                }`}
                        >
                            <span>{s.icon}</span> {s.label}
                        </button>
                    );
                })}
            </div>

            {/* District + Sort row */}
            <div className="flex gap-2">
                {/* District */}
                <div className="relative flex-1">
                    <select
                        value={filters.district}
                        onChange={(e) => onChange({ district: (e.target as HTMLSelectElement).value })}
                        className={`w-full h-10 px-3 pr-8 rounded-xl ${t.bg.elevated} border ${t.border.subtle} ${t.text.secondary} text-xs font-medium appearance-none outline-none focus:border-emerald-500/40 transition-colors cursor-pointer`}
                    >
                        {/* Đã thêm kiểu dữ liệu string cho 'd' */}
                        {DISTRICTS.map((d: string) => (
                            <option key={d} value={d}>{d === 'Tất cả' ? '📍 Khu vực' : `📍 ${d}`}</option>
                        ))}
                    </select>
                    <ChevronDown className={`absolute right-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 ${t.text.muted} pointer-events-none`} />
                </div>

                {/* Sort */}
                <div className="relative">
                    <button
                        onClick={() => setShowSort(!showSort)}
                        className={`h-10 px-3 rounded-xl ${t.bg.elevated} border ${t.border.subtle} ${t.text.secondary} text-xs font-medium flex items-center gap-1.5 hover:border-emerald-500/20 transition-colors`}
                    >
                        <ArrowUpDown className="w-3.5 h-3.5" />
                        <span className="hidden sm:inline">Sắp xếp</span>
                    </button>

                    {showSort && (
                        <>
                            <div className="fixed inset-0 z-40" onClick={() => setShowSort(false)} />
                            <div className={`absolute right-0 top-12 z-50 w-52 ${t.bg.card} border ${t.border.muted} rounded-xl shadow-2xl overflow-hidden`}>
                                {/* Đã thêm kiểu dữ liệu cho 'opt' */}
                                {SORT_OPTIONS.map((opt: { id: string; label: string }) => (
                                    <button
                                        key={opt.id}
                                        onClick={() => { onChange({ sortBy: opt.id as CourtFilters['sortBy'] }); setShowSort(false); }}
                                        className={`w-full px-4 py-3 text-left text-xs font-medium flex items-center gap-2.5 transition-colors ${filters.sortBy === opt.id
                                            ? 'text-emerald-400 bg-emerald-500/10'
                                            : `${t.text.secondary} ${t.bg.hover}`
                                            }`}
                                    >
                                        {sortIcons[opt.id]} {opt.label}
                                        {filters.sortBy === opt.id && <Check className="w-3.5 h-3.5 ml-auto" />}
                                    </button>
                                ))}
                            </div>
                        </>
                    )}
                </div>
            </div>
        </div>
    );
}