import { useState, useEffect } from 'react';
import { ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight } from 'lucide-react';
import { courtApi } from '../api/court.api';
import { theme as DS } from '../utils/theme';
import CourtFilter from '../components/court/CourtFilter';
import CourtList from '../components/court/CourtList';
import type { Court, CourtFilters } from '../types';

export default function Home() {
    const [courts, setCourts] = useState<Court[]>([]);
    const [loading, setLoading] = useState(true);
    const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');

    // Phân trang
    const [page, setPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);
    const [inputPage, setInputPage] = useState('');

    const [filters, setFilters] = useState<CourtFilters>({
        sport: 'all',
        district: 'Tất cả',
        keyword: '',
        sortBy: 'distance',
    });

    const handleFilterChange = (partial: Partial<CourtFilters>) => {
        setFilters(prev => ({ ...prev, ...partial }));
        setPage(1); // Trở về trang 1 mỗi khi đổi bộ lọc
    };

    useEffect(() => {
        const fetchCourts = async () => {
            try {
                setLoading(true);
                const response = await courtApi.searchCourts({
                    page: page,
                    limit: 12,
                    sportType: filters.sport !== 'all' ? filters.sport : undefined,
                    district: filters.district !== 'Tất cả' ? filters.district : undefined,
                    sortBy: filters.sortBy,
                    q: filters.keyword || undefined
                });

                if (response.data && response.data.data) {
                    setCourts(response.data.data);

                    if (response.data.pagination) {
                        setTotalPages(response.data.pagination.totalPages);
                    }
                }
            } catch (error) {
                console.error('Lỗi khi lấy dữ liệu sân:', error);
            } finally {
                setLoading(false);
            }
        };

        const timeoutId = setTimeout(() => fetchCourts(), 400);
        return () => clearTimeout(timeoutId);
    }, [filters, page]);

    // Hàm xử lý khi bấm nút "Go" (Thông minh hơn)
    const handleGoToPage = () => {
        let p = parseInt(inputPage);
        if (isNaN(p)) return; // Nếu bỏ trống thì không làm gì

        // Ép về Min/Max nếu nhập lố
        if (p < 1) p = 1;
        if (p > totalPages) p = totalPages;

        setPage(p);
        setInputPage('');
        window.scrollTo({ top: 0, behavior: 'smooth' });
    };

    // Hàm chuyển trang bằng nút mũi tên
    const handlePageChange = (newPage: number) => {
        setPage(newPage);
        window.scrollTo({ top: 0, behavior: 'smooth' });
    };

    return (
        <div className={`min-h-screen ${DS.bg.base} p-4 pb-24`}>
            <div className="max-w-6xl mx-auto space-y-6">

                {/* Header Text */}
                <div>
                    <h1 className={`text-2xl font-black ${DS.text.primary} mb-1`}>
                        Khám phá sân gần bạn 🏸
                    </h1>
                    <p className={`text-sm ${DS.text.muted}`}>
                        Hơn 800 sân cầu lông và pickleball đang chờ bạn
                    </p>
                </div>

                {/* Thanh Lọc & Tìm kiếm */}
                <CourtFilter
                    filters={filters}
                    onChange={handleFilterChange}
                />

                {/* Danh sách hiển thị sân */}
                <CourtList
                    courts={courts}
                    loading={loading}
                    viewMode={viewMode}
                    onViewModeChange={setViewMode}
                />

                {/* THANH PHÂN TRANG  */}
                {!loading && totalPages > 1 && (
                    <div className="flex flex-wrap items-center justify-end gap-6 pt-4 border-t border-[#1e1e1e] mt-4">

                        {/* Go to page */}
                        <div className="flex items-center gap-2 text-sm sm:flex">
                            <span className={`${DS.text.muted}`}>Go to page:</span>
                            <input
                                type="number"
                                min={1} max={totalPages}
                                value={inputPage}
                                onChange={(e) => setInputPage((e.target as HTMLInputElement).value)}
                                onKeyDown={(e) => e.key === 'Enter' && handleGoToPage()}
                                className={`w-14 h-9 rounded-lg ${DS.bg.input} border ${DS.border.subtle} text-center outline-none text-[#eaeaea] focus:border-emerald-500/40 [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none`}
                            />
                            <button
                                onClick={handleGoToPage}
                                className={`px-3 h-9 rounded-lg ${DS.bg.elevated} border ${DS.border.subtle} text-[#999] hover:text-emerald-400 transition-colors`}
                            >
                                Go
                            </button>
                        </div>

                        {/* Arrows & Current Page */}
                        <div className="flex items-center gap-1">
                            {/* Nút Min (Trang 1) */}
                            <button
                                onClick={() => handlePageChange(1)}
                                disabled={page === 1}
                                title="Trang đầu (Min)"
                                className={`w-9 h-9 flex items-center justify-center rounded-lg transition-colors ${page === 1 ? 'opacity-30 cursor-not-allowed' : `hover:${DS.bg.hover} hover:text-emerald-400`} ${DS.text.muted}`}
                            >
                                <ChevronsLeft className="w-5 h-5" />
                            </button>

                            {/* Nút Prev (Lùi 1 trang) */}
                            <button
                                onClick={() => handlePageChange(page - 1)}
                                disabled={page === 1}
                                className={`w-9 h-9 flex items-center justify-center rounded-lg transition-colors ${page === 1 ? 'opacity-30 cursor-not-allowed' : `hover:${DS.bg.hover} hover:text-emerald-400`} ${DS.text.muted}`}
                            >
                                <ChevronLeft className="w-5 h-5" />
                            </button>

                            {/* Trang hiện tại / Tổng trang */}
                            <div className={`min-w-12.5 px-2 h-9 flex items-center justify-center rounded-lg bg-emerald-500/15 text-emerald-400 font-bold border border-emerald-500/30 text-sm`}>
                                {page} <span className="text-[10px] text-emerald-400/50 ml-1">/ {totalPages}</span>
                            </div>

                            {/* Nút Next (Tới 1 trang) */}
                            <button
                                onClick={() => handlePageChange(page + 1)}
                                disabled={page === totalPages}
                                className={`w-9 h-9 flex items-center justify-center rounded-lg transition-colors ${page === totalPages ? 'opacity-30 cursor-not-allowed' : `hover:${DS.bg.hover} hover:text-emerald-400`} ${DS.text.muted}`}
                            >
                                <ChevronRight className="w-5 h-5" />
                            </button>

                            {/* Nút Max (Trang cuối) */}
                            <button
                                onClick={() => handlePageChange(totalPages)}
                                disabled={page === totalPages}
                                title="Trang cuối (Max)"
                                className={`w-9 h-9 flex items-center justify-center rounded-lg transition-colors ${page === totalPages ? 'opacity-30 cursor-not-allowed' : `hover:${DS.bg.hover} hover:text-emerald-400`} ${DS.text.muted}`}
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