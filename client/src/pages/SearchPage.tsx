import { useState, useEffect } from 'react';
import { MapPin, Star, ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight } from 'lucide-react';
import { theme as t, formatPrice } from '../utils/theme';
import { useAppStore } from '../store';
import { courtApi } from '../api/court.api';
import CourtFilter from '../components/court/CourtFilter';
import { ListCardSkeleton } from '../components/ui/Skeleton';
import type { Court } from '../types';

export default function SearchPage() {
    const { filters, setFilters, setBookingCourt } = useAppStore();
    const [loading, setLoading] = useState(true);
    const [courts, setCourts] = useState<Court[]>([]);

    // Bộ lọc nâng cao (của riêng SearchPage)
    const [priceMax, setPriceMax] = useState(200000);
    //const [indoorOnly] = useState(false); 

    // Phân trang
    const [page, setPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);
    const [inputPage, setInputPage] = useState('');

    useEffect(() => {
        const fetchCourts = async () => {
            try {
                setLoading(true);
                let currentLat: number | undefined = undefined;
                let currentLng: number | undefined = undefined;

                if (filters.sortBy === 'distance') {
                    try {
                        const pos = await new Promise<GeolocationPosition>((resolve, reject) => {
                            navigator.geolocation.getCurrentPosition(resolve, reject, { timeout: 5000 });
                        });
                        currentLat = pos.coords.latitude;
                        currentLng = pos.coords.longitude;
                    } catch (geoErr) {
                        console.warn("Không thể lấy vị trí, dùng vị trí mặc định (Trung tâm TPHCM):", geoErr);
                        currentLat = 10.762622;
                        currentLng = 106.660172;
                    }
                }
                const response = await courtApi.searchCourts({
                    page: page,
                    limit: 12,
                    sportType: filters.sport !== 'all' ? filters.sport : undefined,
                    district: filters.district !== 'Tất cả' ? filters.district : undefined,
                    sortBy: filters.sortBy,
                    q: filters.keyword || undefined,
                    maxPrice: priceMax < 200000 ? priceMax : undefined,
                    lat: currentLat,
                    lng: currentLng
                });

                if (response.data && response.data.data) {
                    setCourts(response.data.data);
                    if (response.data.pagination) {
                        setTotalPages(response.data.pagination.totalPages);
                    }
                }
            } catch (error) {
                console.error('Lỗi khi lấy dữ liệu tìm kiếm:', error);
            } finally {
                setLoading(false);
            }
        };

        const timeoutId = setTimeout(() => fetchCourts(), 400);
        return () => clearTimeout(timeoutId);
    }, [filters, page, priceMax]);

    const handleFilterChange = (partial: any) => {
        setFilters(partial);
        setPage(1); // Reset về trang 1 khi đổi filter
    };

    // Hàm xử lý phân trang
    const handleGoToPage = () => {
        let p = parseInt(inputPage);
        if (isNaN(p)) return;
        if (p < 1) p = 1;
        if (p > totalPages) p = totalPages;
        setPage(p);
        setInputPage('');
        window.scrollTo({ top: 0, behavior: 'smooth' });
    };

    const handlePageChange = (newPage: number) => {
        setPage(newPage);
        window.scrollTo({ top: 0, behavior: 'smooth' });
    };

    const mainPhoto = (c: Court) =>
        c.photos?.find(p => p.isMain)?.url || c.photos?.[0]?.url || 'https://images.unsplash.com/photo-1626224583764-f87db24ac4ea?w=400&h=250&fit=crop';

    return (
        <div className="max-w-7xl mx-auto px-4 pb-24 md:pb-8">
            <div className="py-6">
                <h1 className={`text-xl font-bold ${t.text.primary} mb-4`}>Tìm kiếm sân</h1>

                <CourtFilter filters={filters} onChange={handleFilterChange} />

                {/* Extended filters */}
                <div className="mt-4 space-y-3">
                    {/* Price range */}
                    <div className={`p-4 rounded-xl ${t.bg.elevated} border ${t.border.subtle}`}>
                        <div className="flex items-center justify-between mb-3">
                            <span className={`text-xs font-semibold ${t.text.secondary}`}>Khoảng giá tối đa</span>
                            <span className={`text-xs font-mono ${t.text.accent}`}>{formatPrice(priceMax)}/h</span>
                        </div>
                        <input
                            type="range"
                            min={50000} max={200000} step={10000}
                            value={priceMax}
                            onChange={(e) => {
                                setPriceMax(Number((e.target as HTMLInputElement).value));
                                setPage(1); // Reset trang khi kéo thanh giá
                            }}
                            className="w-full accent-emerald-500 h-1"
                        />
                    </div>

                    {/* Indoor toggle */}
                    {/* <button
                        onClick={() => {
                            setIndoorOnly(!indoorOnly);
                            setPage(1); // Reset trang khi bật tắt
                        }}
                        className={`px-4 py-3 rounded-xl border text-xs font-semibold flex items-center gap-2 transition-all ${indoorOnly
                            ? `bg-emerald-500/15 border-emerald-500/30 text-emerald-400 ${t.glow.sm}`
                            : `${t.bg.elevated} ${t.border.subtle} ${t.text.secondary}`
                            }`}
                    >
                        <ShieldCheck className="w-4 h-4" /> Chỉ sân trong nhà
                    </button> */}
                </div>
            </div>

            {/* Results */}
            <div className="space-y-3">
                {/* Status bar */}
                {!loading && (
                    <p className={`text-xs ${t.text.muted}`}>
                        {courts.length === 0 ? 'Không tìm thấy sân nào phù hợp' : `Hiển thị ${courts.length} kết quả ở trang ${page}`}
                    </p>
                )}

                {loading ? (
                    Array.from({ length: 6 }).map((_, i) => <ListCardSkeleton key={i} />)
                ) : (
                    courts.map((court) => (
                        <div
                            key={court._id}
                            onClick={() => setBookingCourt(court)}
                            className={`flex gap-4 p-3 rounded-2xl ${t.bg.card} border ${t.border.subtle} hover:border-emerald-500/15 transition-all cursor-pointer active:scale-[0.99]`}
                        >
                            <img src={mainPhoto(court)} alt="" className="w-24 h-24 rounded-xl object-cover shrink-0" loading="lazy" />
                            <div className="flex-1 min-w-0 flex flex-col justify-between py-0.5">
                                <div>
                                    <h3 className={`font-bold text-sm ${t.text.primary} truncate`}>{court.name}</h3>
                                    <p className={`text-xs ${t.text.muted} flex items-center gap-1 mt-0.5`}>
                                        <MapPin className="w-3 h-3" /> {court.address.district}
                                        {court.distance !== undefined && ` · ${court.distance.toFixed(1)} km`}
                                    </p>
                                </div>
                                <div className="flex items-center justify-between">
                                    <span className="flex items-center gap-1 text-xs">
                                        <Star className="w-3 h-3 fill-amber-400 text-amber-400" />
                                        <span className={t.text.primary}>{court.averageRating?.toFixed(1) || '5.0'}</span>
                                        <span className={t.text.muted}>({court.reviewCount || 0})</span>
                                    </span>
                                    <span className="text-emerald-400 text-sm font-black">
                                        {formatPrice(court.pricePerHour?.[0]?.timeSlots?.[0]?.pricePerHour || 0)}/h
                                    </span>
                                </div>
                            </div>
                        </div>
                    ))
                )}

                {/* THANH PHÂN TRANG */}
                {!loading && totalPages > 1 && (
                    <div className="flex flex-wrap items-center justify-center sm:justify-end gap-4 sm:gap-6 pt-4 border-t border-[#1e1e1e] mt-6">

                        {/* Go to page */}
                        <div className="flex items-center gap-2 text-sm sm:flex">
                            <span className={`${t.text.muted}`}>Go to page:</span>
                            <input
                                type="number"
                                min={1} max={totalPages}
                                value={inputPage}
                                onChange={(e) => setInputPage((e.target as HTMLInputElement).value)}
                                onKeyDown={(e) => e.key === 'Enter' && handleGoToPage()}
                                className={`w-14 h-9 rounded-lg ${t.bg.input} border ${t.border.subtle} text-center outline-none text-[#eaeaea] focus:border-emerald-500/40 [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none`}
                            />
                            <button
                                onClick={handleGoToPage}
                                className={`px-3 h-9 rounded-lg ${t.bg.elevated} border ${t.border.subtle} text-[#999] hover:text-emerald-400 transition-colors`}
                            >
                                Go
                            </button>
                        </div>

                        {/* Arrows & Current Page */}
                        <div className="flex items-center gap-1">
                            <button
                                onClick={() => handlePageChange(1)} disabled={page === 1}
                                className={`w-9 h-9 flex items-center justify-center rounded-lg transition-colors ${page === 1 ? 'opacity-30 cursor-not-allowed' : `hover:${t.bg.hover} hover:text-emerald-400`} ${t.text.muted}`}
                            >
                                <ChevronsLeft className="w-5 h-5" />
                            </button>

                            <button
                                onClick={() => handlePageChange(page - 1)} disabled={page === 1}
                                className={`w-9 h-9 flex items-center justify-center rounded-lg transition-colors ${page === 1 ? 'opacity-30 cursor-not-allowed' : `hover:${t.bg.hover} hover:text-emerald-400`} ${t.text.muted}`}
                            >
                                <ChevronLeft className="w-5 h-5" />
                            </button>

                            <div className={`min-w-12.5 px-2 h-9 flex items-center justify-center rounded-lg bg-emerald-500/15 text-emerald-400 font-bold border border-emerald-500/30 text-sm`}>
                                {page} <span className="text-[10px] text-emerald-400/50 ml-1">/ {totalPages}</span>
                            </div>

                            <button
                                onClick={() => handlePageChange(page + 1)} disabled={page === totalPages}
                                className={`w-9 h-9 flex items-center justify-center rounded-lg transition-colors ${page === totalPages ? 'opacity-30 cursor-not-allowed' : `hover:${t.bg.hover} hover:text-emerald-400`} ${t.text.muted}`}
                            >
                                <ChevronRight className="w-5 h-5" />
                            </button>

                            <button
                                onClick={() => handlePageChange(totalPages)} disabled={page === totalPages}
                                className={`w-9 h-9 flex items-center justify-center rounded-lg transition-colors ${page === totalPages ? 'opacity-30 cursor-not-allowed' : `hover:${t.bg.hover} hover:text-emerald-400`} ${t.text.muted}`}
                            >
                                <ChevronsRight className="w-5 h-5" />
                            </button>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}