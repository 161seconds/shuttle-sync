import { useState, useEffect } from 'react';
import { ShieldCheck } from 'lucide-react';
import { theme as t, formatPrice } from '../utils/theme';
import { useAppStore } from '../store';
import { useFilteredCourts } from '../hooks';
import CourtFilter from '../components/court/CourtFilter';
//import CourtCard from '../components/court/CourtCard';
import { ListCardSkeleton } from '../components/ui/Skeleton';
import type { Court } from '../types';
import { MOCK_COURTS } from '../utils/mockData';
import { MapPin, Star } from 'lucide-react';

export default function SearchPage() {
    const { filters, setFilters, setBookingCourt } = useAppStore();
    const [loading, setLoading] = useState(true);
    const [courts, setCourts] = useState<Court[]>([]);
    const [priceMax, setPriceMax] = useState(200000);
    const [indoorOnly, setIndoorOnly] = useState(false);

    useEffect(() => {
        const timer = setTimeout(() => { setCourts(MOCK_COURTS); setLoading(false); }, 500);
        return () => clearTimeout(timer);
    }, []);

    // Apply local extended filters on top of global filters
    const baseFiltered = useFilteredCourts(courts, { ...filters, maxPrice: priceMax, indoorOnly });

    const mainPhoto = (c: Court) =>
        c.photos.find(p => p.isMain)?.url || c.photos[0]?.url || '';

    return (
        <div className="max-w-7xl mx-auto px-4 pb-24 md:pb-8">
            <div className="py-6">
                <h1 className={`text-xl font-bold ${t.text.primary} mb-4`}>Tìm kiếm sân</h1>

                <CourtFilter filters={filters} onChange={setFilters} />

                {/* Extended filters */}
                <div className="mt-4 space-y-3">
                    {/* Price range */}
                    <div className={`p-4 rounded-xl ${t.bg.elevated} border ${t.border.subtle}`}>
                        <div className="flex items-center justify-between mb-3">
                            <span className={`text-xs font-semibold ${t.text.secondary}`}>Khoảng giá</span>
                            <span className={`text-xs font-mono ${t.text.accent}`}>0 - {formatPrice(priceMax)}/h</span>
                        </div>
                        <input
                            type="range"
                            min={0} max={200000} step={10000}
                            value={priceMax}
                            onChange={(e) => setPriceMax(Number((e.target as HTMLInputElement).value))}
                            className="w-full accent-emerald-500 h-1"
                        />
                    </div>

                    {/* Indoor toggle */}
                    <button
                        onClick={() => setIndoorOnly(!indoorOnly)}
                        className={`px-4 py-3 rounded-xl border text-xs font-semibold flex items-center gap-2 transition-all ${indoorOnly
                            ? `bg-emerald-500/15 border-emerald-500/30 text-emerald-400 ${t.glow.sm}`
                            : `${t.bg.elevated} ${t.border.subtle} ${t.text.secondary}`
                            }`}
                    >
                        <ShieldCheck className="w-4 h-4" /> Chỉ sân trong nhà
                    </button>
                </div>
            </div>

            {/* Results */}
            <div className="space-y-3">
                <p className={`text-xs ${t.text.muted}`}>{baseFiltered.length} kết quả</p>

                {loading ? (
                    Array.from({ length: 6 }).map((_, i) => <ListCardSkeleton key={i} />)
                ) : (
                    baseFiltered.map((court) => (
                        <div
                            key={court._id}
                            onClick={() => setBookingCourt(court)}
                            className={`flex gap-4 p-3 rounded-2xl ${t.bg.card} border ${t.border.subtle} hover:border-emerald-500/15 transition-all cursor-pointer active:scale-[0.99]`}
                        >
                            <img src={mainPhoto(court)} alt="" className="w-24 h-24 rounded-xl object-cover flex-shrink-0" loading="lazy" />
                            <div className="flex-1 min-w-0 flex flex-col justify-between py-0.5">
                                <div>
                                    <h3 className={`font-bold text-sm ${t.text.primary} truncate`}>{court.name}</h3>
                                    <p className={`text-xs ${t.text.muted} flex items-center gap-1 mt-0.5`}>
                                        <MapPin className="w-3 h-3" /> {court.address.district}
                                        {court.distance && ` · ${court.distance.toFixed(1)} km`}
                                    </p>
                                </div>
                                <div className="flex items-center justify-between">
                                    <span className="flex items-center gap-1 text-xs">
                                        <Star className="w-3 h-3 fill-amber-400 text-amber-400" />
                                        <span className={t.text.primary}>{court.averageRating.toFixed(1)}</span>
                                        <span className={t.text.muted}>({court.reviewCount})</span>
                                    </span>
                                    <span className="text-emerald-400 text-sm font-black">
                                        {formatPrice(court.pricePerHour[0]?.timeSlots[0]?.pricePerHour || 0)}/h
                                    </span>
                                </div>
                            </div>
                        </div>
                    ))
                )}
            </div>
        </div>
    );
}