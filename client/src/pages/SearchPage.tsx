import { useState, useEffect } from 'react';
import { MapPin, Star, ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight } from 'lucide-react';
import { theme as t, formatPrice } from '../utils/theme';
import { useAppStore } from '../store';
import { courtApi } from '../api/court.api';
import CourtFilter from '../components/court/CourtFilter';
import { ListCardSkeleton } from '../components/ui/Skeleton';
import type { Court, CourtFilters } from '../types';
import { useAlertStore } from '../stores/useAlertStore';

export default function SearchPage() {
    const { filters, setFilters, setBookingCourt } = useAppStore();
    const [loading, setLoading] = useState(true);
    const [courts, setCourts] = useState<Court[]>([]);
    const [userLocation, setUserLocation] = useState<{lat: number, lng: number} | null>(null);

    // Bộ lọc nâng cao
    const [priceMax, setPriceMax] = useState(200000);

    // Phân trang
    const [page, setPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);
    const [totalRecords, setTotalRecords] = useState(0);
    const [inputPage, setInputPage] = useState('');

    useEffect(() => {
        const fetchCourts = async () => {
            try {
                setLoading(true);
                let currentLat: number | undefined = undefined;
                let currentLng: number | undefined = undefined;

                if (filters.sortBy === 'distance') {
                    if (userLocation) {
                        currentLat = userLocation.lat;
                        currentLng = userLocation.lng;
                    } else {
                        try {
                            const pos = await new Promise<GeolocationPosition>((resolve, reject) => {
                                navigator.geolocation.getCurrentPosition(resolve, reject, { timeout: 5000 });
                            });
                            currentLat = pos.coords.latitude;
                            currentLng = pos.coords.longitude;
                            setUserLocation({ lat: currentLat, lng: currentLng });
                        } catch (geoErr) {
                            console.warn("Bị chặn quyền vị trí.");
                            useAlertStore.getState().showAlert("Bạn chưa cấp quyền vị trí! Hệ thống sẽ tạm chuyển sang sắp xếp theo Đánh giá.", 'Thông báo', 'info');
                            setFilters({ sortBy: 'rating' });
                            return;
                        }
                    }
                }

                const response = await courtApi.searchCourts({
                    page: page,
                    limit: 20,
                    sportType: filters.sport !== 'all' ? filters.sport : undefined,
                    district: filters.district !== 'Tất cả' ? filters.district : undefined,
                    sortBy: filters.sortBy,
                    q: filters.keyword || undefined,
                    maxPrice: priceMax < 200000 ? priceMax : undefined,
                    lat: currentLat,
                    lng: currentLng
                });

                if (response.data && response.data.data) {
                    setCourts(response.data.data.courts || (response.data.data as any));
                    if (response.data.pagination) {
                        setTotalPages(response.data.pagination.totalPages);
                        setTotalRecords(response.data.pagination.total);
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

    const handleFilterChange = (partial: Partial<CourtFilters>) => {
        setFilters(partial);
        setPage(1);
    };

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
        // Mở rộng tối đa màn hình để chứa 4 cột
        <div className="max-w-350 mx-auto px-4 pb-24 md:pb-8 pt-6">
            <h1 className={`text-2xl font-bold ${t.text.primary} mb-6`}>Tìm kiếm sân</h1>

            <div className="w-full flex flex-col pb-15">
                <CourtFilter filters={filters} onChange={handleFilterChange} />

                {/* Khung lọc giá
                <div className="mt-4 space-y-3">
                    <div className={`p-4 rounded-xl ${t.bg.elevated} border ${t.border.subtle} max-w-md`}>
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
                                setPage(1);
                            }}
                            className="w-full accent-emerald-500 h-1 cursor-pointer"
                        />
                    </div>
                </div> */}

                {/* 1. Smart Sort Tags */}
                <div className="flex items-center gap-2 mt-4 overflow-x-auto custom-scrollbar pb-2">
                    <button onClick={() => handleFilterChange({ sortBy: 'distance' })} className={`px-4 py-2 rounded-xl text-sm font-semibold transition-all shrink-0 ${filters.sortBy === 'distance' ? 'bg-emerald-500 text-black shadow-lg shadow-emerald-500/20' : 'bg-white/5 text-gray-300 hover:bg-white/10'}`}>
                        Gần tôi nhất
                    </button>
                    <button onClick={() => handleFilterChange({ sortBy: 'price_asc' })} className={`px-4 py-2 rounded-xl text-sm font-semibold transition-all shrink-0 ${filters.sortBy === 'price_asc' ? 'bg-emerald-500 text-black shadow-lg shadow-emerald-500/20' : 'bg-white/5 text-gray-300 hover:bg-white/10'}`}>
                        Giá rẻ nhất
                    </button>
                    <button onClick={() => handleFilterChange({ sortBy: 'rating' })} className={`px-4 py-2 rounded-xl text-sm font-semibold transition-all shrink-0 ${filters.sortBy === 'rating' ? 'bg-emerald-500 text-black shadow-lg shadow-emerald-500/20' : 'bg-white/5 text-gray-300 hover:bg-white/10'}`}>
                        Đánh giá cao
                    </button>
                </div>

                {/* Kết quả danh sách sân - Chia Grid 4 cột */}
                <div className="mt-6">
                    {(!loading || page > 1) && (
                        <p className={`text-sm mb-4 font-medium ${t.text.muted}`}>
                            {totalRecords === 0 ? 'Không tìm thấy sân nào phù hợp' : `Tìm thấy ${totalRecords} ${filters.sport === 'badminton' ? 'sân cầu lông' : filters.sport === 'pickleball' ? 'sân pickleball' : 'sân'}`}
                        </p>
                    )}

                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5 md:gap-6">
                        {loading ? (
                            Array.from({ length: 20 }).map((_, i) => <ListCardSkeleton key={i} />)
                        ) : courts.length === 0 ? (
                            /* 2. Beautiful Empty State */
                            <div className="col-span-full flex flex-col items-center justify-center py-20 px-4 text-center">
                                <div className="w-24 h-24 mb-6 relative">
                                    <div className="absolute inset-0 bg-emerald-500/20 rounded-full blur-xl animate-pulse"></div>
                                    <div className="relative w-full h-full bg-[#1e1e1e] border border-white/10 rounded-full flex items-center justify-center shadow-lg">
                                        <span className="text-4xl">{filters.sport === 'pickleball' ? '🏓' : '🏸'}</span>
                                    </div>
                                </div>
                                <h3 className="text-xl font-bold text-white mb-2">Không tìm thấy sân nào</h3>
                                <p className="text-sm text-gray-400 mb-6 max-w-sm">
                                    Thử điều chỉnh lại bộ lọc hoặc nới lỏng khoảng giá để tìm được sân phù hợp nhé!
                                </p>
                                <button
                                    onClick={() => { setFilters({ sport: 'all', district: 'Tất cả', sortBy: 'rating', keyword: '' }); setPriceMax(200000); }}
                                    className="px-6 py-2.5 bg-white text-emerald-600 font-bold rounded-xl hover:scale-105 active:scale-95 transition-transform"
                                >
                                    Xóa bộ lọc
                                </button>
                            </div>
                        ) : (
                            courts.map((court) => (
                                <div
                                    key={court._id}
                                    onClick={() => setBookingCourt(court)}
                                    className={`flex flex-col gap-2.5 p-2.5 rounded-[20px] ${t.bg.card} border ${t.border.subtle} hover:border-emerald-500/50 hover:shadow-[0_0_30px_rgba(16,185,129,0.1)] transition-all cursor-pointer group`}
                                >
                                    {/* Ảnh nằm trên, tỷ lệ 16/9 cho gọn hơn */}
                                    <div className="relative w-full aspect-video shrink-0 overflow-hidden rounded-2xl bg-[#1e1e1e]">
                                        <img
                                            src={mainPhoto(court)}
                                            alt={court.name}
                                            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700"
                                            loading="lazy"
                                        />
                                        {/* Khoảng cách */}
                                        {court.distance !== undefined && (
                                            <div className="absolute top-2 left-2 bg-black/60 backdrop-blur-md text-white text-[10px] font-semibold px-2 py-1 rounded-lg border border-white/10">
                                                {court.distance < 1 ? `${(court.distance * 1000).toFixed(0)}m` : `${court.distance.toFixed(1)}km`}
                                            </div>
                                        )}
                                        {/* 3. Availability Badge */}
                                        <div className="absolute bottom-2 left-2 bg-emerald-500/90 text-black text-[9px] font-bold px-2 py-1 rounded-md flex items-center gap-1.5 backdrop-blur-md shadow-lg">
                                            <div className="w-1.5 h-1.5 bg-black rounded-full animate-pulse"></div>
                                            Có slot
                                        </div>
                                    </div>

                                    {/* Thông tin nằm dưới */}
                                    <div className="flex-1 flex flex-col justify-between px-1 pb-1">
                                        <div>
                                            <h3 className={`font-bold text-sm ${t.text.primary} truncate group-hover:text-emerald-400 transition-colors`}>{court.name}</h3>
                                            <p className={`text-[11px] ${t.text.muted} flex items-center gap-1 mt-1 truncate`}>
                                                <MapPin className="w-3 h-3 shrink-0" />
                                                <span className="truncate">{court.address.fullAddress || court.address.district}</span>
                                            </p>
                                        </div>
                                        <div className="flex items-center justify-between mt-3">
                                            <span className="flex items-center gap-1 text-[11px] bg-white/5 px-2 py-1 rounded-md border border-white/5">
                                                <Star className="w-3 h-3 fill-amber-400 text-amber-400" />
                                                <span className={`${t.text.primary} font-bold`}>{court.averageRating?.toFixed(1) || '5.0'}</span>
                                                <span className={t.text.muted}>({court.reviewCount || 0})</span>
                                            </span>
                                            <span className="text-emerald-400 text-xs font-black bg-emerald-500/10 px-2 py-1 rounded-md border border-emerald-500/20">
                                                {formatPrice(court.pricePerHour?.[0]?.timeSlots?.[0]?.pricePerHour || 0)}
                                            </span>
                                        </div>
                                    </div>
                                </div>
                            ))
                        )}
                    </div>

                    {/* Actions Container */}
                    <div className="flex flex-col sm:flex-row items-center justify-center gap-6 mt-10">
                        {/* Go To Page Input */}
                        {!loading && totalPages > 1 && (
                            <div className="flex flex-wrap items-center gap-4">
                                <div className="flex items-center gap-2 text-sm">
                                    <span className={`${t.text.muted}`}>Đến trang:</span>
                                    <input
                                        type="number"
                                        min={1} max={totalPages}
                                        value={inputPage}
                                        onChange={(e) => setInputPage(e.target.value)}
                                        onKeyDown={(e) => e.key === 'Enter' && handleGoToPage()}
                                        className={`w-14 h-9 rounded-lg ${t.bg.input} border ${t.border.subtle} text-center outline-none text-[#eaeaea] focus:border-emerald-500/40 [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none`}
                                    />
                                    <button
                                        onClick={handleGoToPage}
                                        className={`px-3 h-9 rounded-lg ${t.bg.elevated} border ${t.border.subtle} text-[#999] hover:text-emerald-400 transition-colors`}
                                    >
                                        Đi
                                    </button>
                                </div>

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
            </div>
        </div>
    );
}