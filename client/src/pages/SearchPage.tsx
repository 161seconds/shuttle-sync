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

    // Bộ lọc nâng cao
    const [priceMax, setPriceMax] = useState(200000);

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
                        console.warn("Bị chặn quyền vị trí.");
                        alert("Bạn chưa cấp quyền vị trí! Hệ thống sẽ tạm chuyển sang sắp xếp theo Đánh giá.");
                        setFilters({ sortBy: 'rating' });
                        return;
                    }
                }

                const response = await courtApi.searchCourts({
                    page: page,
                    limit: 24,
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

                {/* Khung lọc giá */}
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
                </div>

                {/* Kết quả danh sách sân - Chia Grid 4 cột */}
                <div className="mt-6">
                    {!loading && (
                        <p className={`text-sm mb-4 font-medium ${t.text.muted}`}>
                            {courts.length === 0 ? 'Không tìm thấy sân nào phù hợp' : `Hiển thị ${courts.length} kết quả ở trang ${page}`}
                        </p>
                    )}

                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5 md:gap-6">
                        {loading ? (
                            Array.from({ length: 24 }).map((_, i) => <ListCardSkeleton key={i} />)
                        ) : (
                            courts.map((court) => (
                                <div
                                    key={court._id}
                                    onClick={() => setBookingCourt(court)}
                                    // 👈 Chuyển sang flex-col để thẻ đứng dọc
                                    className={`flex flex-col gap-3 p-3.5 rounded-2xl ${t.bg.card} border ${t.border.subtle} hover:border-emerald-500/50 hover:shadow-[0_0_20px_rgba(16,185,129,0.15)] transition-all cursor-pointer group`}
                                >
                                    {/* Ảnh nằm trên, tỷ lệ 4/3 */}
                                    <div className="relative w-full aspect-4/3 shrink-0 overflow-hidden rounded-xl bg-[#1e1e1e]">
                                        <img
                                            src={mainPhoto(court)}
                                            alt={court.name}
                                            className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700"
                                            loading="lazy"
                                        />
                                        {/* Khoảng cách (nếu có) đè lên góc ảnh */}
                                        {court.distance !== undefined && (
                                            <div className="absolute top-2 left-2 bg-black/70 backdrop-blur-sm text-emerald-400 text-[11px] font-bold px-2 py-1 rounded-lg border border-white/10">
                                                Cách {(court.distance).toFixed(1)} km
                                            </div>
                                        )}
                                    </div>

                                    {/* Thông tin nằm dưới */}
                                    <div className="flex-1 flex flex-col justify-between pt-1">
                                        <div>
                                            <h3 className={`font-bold text-base ${t.text.primary} truncate group-hover:text-emerald-400 transition-colors`}>{court.name}</h3>
                                            <p className={`text-[13px] ${t.text.muted} flex items-center gap-1.5 mt-1 truncate`}>
                                                <MapPin className="w-3.5 h-3.5 shrink-0" />
                                                <span className="truncate">{court.address.fullAddress || court.address.district}</span>
                                            </p>
                                        </div>
                                        <div className="flex items-center justify-between mt-4">
                                            <span className="flex items-center gap-1.5 text-xs bg-[#1a1a1a] px-2 py-1.5 rounded-md border border-[#333]">
                                                <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />
                                                <span className={`${t.text.primary} font-semibold`}>{court.averageRating?.toFixed(1) || '5.0'}</span>
                                                <span className={t.text.muted}>({court.reviewCount || 0})</span>
                                            </span>
                                            <span className="text-emerald-400 text-[13px] font-black bg-emerald-500/10 px-2.5 py-1.5 rounded-md">
                                                {formatPrice(court.pricePerHour?.[0]?.timeSlots?.[0]?.pricePerHour || 0)}/h
                                            </span>
                                        </div>
                                    </div>
                                </div>
                            ))
                        )}
                    </div>

                    {/* THANH PHÂN TRANG */}
                    {!loading && totalPages > 1 && (
                        <div className="flex flex-wrap items-center justify-center sm:justify-end gap-4 sm:gap-6 pt-6 border-t border-[#1e1e1e] mt-8">
                            <div className="flex items-center gap-2 text-sm sm:flex">
                                <span className={`${t.text.muted}`}>Đến trang:</span>
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
    );
}