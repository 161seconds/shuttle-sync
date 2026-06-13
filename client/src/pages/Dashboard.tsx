import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { MapPin, Star, Flame, ChevronRight, Search, Users, Zap, Clock } from 'lucide-react';
import { theme as t, formatPrice } from '../utils/theme';
import { useAppStore } from '../store';
import { courtApi } from '../api/court.api';
import type { Court } from '../types';
import { EmojiIcon } from '../components/EmojiIcon';


export default function Dashboard() {
    const { user, setPage, setFilters, setBookingCourt } = useAppStore();
    const [loading, setLoading] = useState(true);
    const [popularCourts, setPopularCourts] = useState<Court[]>([]);

    useEffect(() => {
        const fetchDashboardData = async () => {
            try {
                setLoading(true);
                const response = await courtApi.searchCourts({
                    page: 1,
                    limit: 4,
                    sortBy: 'rating'
                });

                if (response.data && response.data.data) {
                    setPopularCourts(response.data.data.courts || (response.data.data as any));
                }
            } catch (error) {
                console.error('Lỗi khi lấy dữ liệu trang chủ:', error);
            } finally {
                setLoading(false);
            }
        };

        fetchDashboardData();
    }, []);

    // Hàm tiện ích lấy ảnh chính của sân
    const mainPhoto = (c: Court) =>
        c.photos?.find(p => p.isMain)?.url || c.photos?.[0]?.url || 'https://images.unsplash.com/photo-1626224583764-f87db24ac4ea?w=400&h=250&fit=crop';

    // Xử lý khi bấm vào các danh mục truy cập nhanh
    const handleQuickFilter = (sportType: 'all' | 'badminton' | 'pickleball') => {
        setFilters({ sport: sportType });
        setPage('search'); // Chuyển sang trang tìm kiếm
    };

    const getGreeting = () => {
        const hour = new Date().getHours();
        if (hour < 12) return 'Chào buổi sáng';
        if (hour < 18) return 'Chào buổi chiều';
        return 'Chào buổi tối';
    };

    return (
        <div className="max-w-7xl mx-auto px-4 pb-24 md:pb-8 pt-6 space-y-8 overflow-x-hidden">
            {/* 1. Header & Lời chào */}
            <motion.div
                initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
                className="flex items-center justify-between"
            >
                <div>
                    <p className={`text-sm ${t.text.muted}`}>{getGreeting()},</p>
                    <h1 className={`text-2xl font-bold flex items-center gap-2 ${t.text.primary}`}>
                        {user?.name || 'Lông thủ'} <EmojiIcon name="badminton" className="w-8 h-8" />
                    </h1>
                </div>
                <div
                    id="tour-matchmaking"
                    onClick={() => setPage('groupplay')}
                    className="w-10 h-10 rounded-full bg-emerald-500/10 flex items-center justify-center border border-emerald-500/20 cursor-pointer hover:bg-emerald-500/20 transition-colors"
                >
                    <Users className="w-5 h-5 text-emerald-400" />
                </div>
            </motion.div>

            {/* 2. Widget: Trận đấu sắp tới */}
            <motion.div
                initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}
                className="w-full rounded-2xl bg-gradient-to-br from-emerald-500/10 to-card border border-emerald-500/20 p-4 relative overflow-hidden shadow-lg shadow-emerald-500/5"
            >
                <div className="absolute top-0 right-0 w-32 h-32 bg-emerald-500/10 blur-2xl rounded-full"></div>
                <div className="relative z-10 flex justify-between items-center mb-3">
                    <h3 className="text-emerald-400 font-bold flex items-center gap-2 text-sm">
                        <Clock className="w-4 h-4" /> Trận đấu sắp diễn ra
                    </h3>
                    <span className="text-xs font-semibold px-2 py-1 bg-emerald-500/20 text-emerald-400 rounded-lg">
                        Hôm nay
                    </span>
                </div>
                <div className="relative z-10 bg-background/60 rounded-xl p-3 border border-border flex gap-3 items-center backdrop-blur-sm">
                    <div className="w-12 h-12 rounded-xl bg-card flex items-center justify-center shrink-0 border border-border">
                        <EmojiIcon name="badminton" className="w-6 h-6 text-emerald-400" />
                    </div>
                    <div className="flex-1 min-w-0">
                        <h4 className="font-bold text-foreground text-sm truncate">SÂN CẦU LÔNG LÊ ĐỨC SPORT</h4>
                        <p className="text-xs text-muted-foreground truncate mt-0.5">Sân số 3 • 20:00 - 22:00</p>
                    </div>
                    <button onClick={() => setPage('map')} className="px-3 py-1.5 bg-emerald-500 text-black text-xs font-bold rounded-lg shrink-0 hover:bg-emerald-400 active:scale-95 transition-all shadow-md shadow-emerald-500/20">
                        Bản đồ
                    </button>
                </div>
            </motion.div>

            {/* 3. Thanh tìm kiếm nhanh */}
            <motion.div
                id="tour-search"
                initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: 0.15 }}
                onClick={() => setPage('search')}
                className={`relative flex items-center w-full p-4 rounded-2xl ${t.bg.elevated} border ${t.border.subtle} cursor-text shadow-lg hover:border-emerald-500/30 transition-colors`}
            >
                <Search className={`w-5 h-5 ${t.text.muted} mr-3`} />
                <span className={`text-sm ${t.text.muted}`}>Tìm kiếm sân cầu lông, pickleball...</span>
                <div className="absolute right-2 px-3 py-1.5 rounded-lg bg-card text-emerald-400 border border-emerald-500/20 text-xs font-bold hover:bg-emerald-500/10 transition-colors">
                    Tìm ngay
                </div>
            </motion.div>

            {/* 4. Truy cập nhanh (Quick Categories) */}
            <motion.div
                id="tour-booking"
                initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}
                className="grid grid-cols-2 gap-3"
            >
                <button onClick={() => handleQuickFilter('badminton')} className={`p-4 rounded-2xl ${t.bg.card} border ${t.border.subtle} hover:border-emerald-500/30 flex flex-col items-center gap-2 transition-all`}>
                    <EmojiIcon name="badminton" className="w-8 h-8 text-emerald-400" />
                    <span className={`text-xs font-semibold ${t.text.primary}`}>Cầu lông</span>
                </button>
                <button onClick={() => handleQuickFilter('pickleball')} className={`p-4 rounded-2xl ${t.bg.card} border ${t.border.subtle} hover:border-lime-500/30 flex flex-col items-center gap-2 transition-all`}>
                    <EmojiIcon name="pickleball" className="w-8 h-8 text-emerald-400" />
                    <span className={`text-xs font-semibold ${t.text.primary}`}>Pickleball</span>
                </button>
            </motion.div>

            {/* 5. Kèo đang chờ (Matchmaking Teaser) */}
            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.25 }}>
                <div className="flex items-center justify-between mb-4">
                    <h2 className={`text-lg font-bold ${t.text.primary} flex items-center gap-2`}>
                        <Users className="w-5 h-5 text-blue-400" /> Kèo đang thiếu người
                    </h2>
                    <button onClick={() => setPage('groupplay')} className={`text-xs font-semibold text-emerald-400 flex items-center hover:underline`}>
                        Xem tất cả <ChevronRight className="w-4 h-4" />
                    </button>
                </div>
                <div className={`p-3 rounded-2xl ${t.bg.card} border ${t.border.subtle} hover:border-emerald-500/20 transition-all flex items-center justify-between cursor-pointer`} onClick={() => setPage('groupplay')}>
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-blue-500/10 flex items-center justify-center border border-blue-500/20">
                            <span className="text-lg">🏸</span>
                        </div>
                        <div>
                            <h4 className="font-bold text-sm text-foreground">Giao lưu trình độ TB</h4>
                            <p className="text-xs text-muted-foreground mt-0.5">Tối nay 19:30 • Còn 1 slot</p>
                        </div>
                    </div>
                    <div className="w-8 h-8 rounded-full bg-card flex items-center justify-center hover:bg-muted transition-colors text-foreground">
                        <ChevronRight className="w-4 h-4" />
                    </div>
                </div>
            </motion.div>

            {/* 4. Sân nổi bật (Horizontal Scroll) */}
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.3 }}>
                <div className="flex items-center justify-between mb-4">
                    <h2 className={`text-lg font-bold ${t.text.primary} flex items-center gap-2`}>
                        <Flame className="w-5 h-5 text-orange-500" /> Sân nổi bật
                    </h2>
                    <button onClick={() => setPage('search')} className={`text-xs font-semibold text-emerald-400 flex items-center hover:underline`}>
                        Xem tất cả <ChevronRight className="w-4 h-4" />
                    </button>
                </div>

                <div className="flex gap-4 overflow-x-auto pb-4 snap-x snap-mandatory scrollbar-hide -mx-4 px-4">
                    {loading ? (
                        /* Skeleton Loading */
                        Array.from({ length: 3 }).map((_, i) => (
                            <div key={i} className={`w-64 shrink-0 snap-start rounded-2xl ${t.bg.card} border ${t.border.subtle} p-3 animate-pulse`}>
                                <div className="w-full h-32 bg-card rounded-xl mb-3"></div>
                                <div className="h-4 bg-card rounded w-3/4 mb-2"></div>
                                <div className="h-3 bg-card rounded w-1/2"></div>
                            </div>
                        ))
                    ) : (
                        /* Data thật từ API */
                        popularCourts.map((court) => (
                            <div
                                key={court._id}
                                onClick={() => setBookingCourt(court)}
                                className={`w-64 shrink-0 snap-start rounded-2xl ${t.bg.card} border ${t.border.subtle} p-3 hover:border-emerald-500/20 transition-all cursor-pointer group`}
                            >
                                <div className="relative w-full h-32 mb-3 overflow-hidden rounded-xl">
                                    <img
                                        src={mainPhoto(court)}
                                        alt={court.name}
                                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                                    />
                                    <div className="absolute top-2 right-2 px-2 py-1 bg-card backdrop-blur-md rounded-lg flex items-center gap-1">
                                        <Star className="w-3 h-3 text-amber-400 fill-amber-400" />
                                        <span className="text-xs font-bold text-foreground">{court.averageRating?.toFixed(1) || '5.0'}</span>
                                    </div>
                                </div>

                                <h3 className={`font-bold text-sm ${t.text.primary} truncate mb-1`}>{court.name}</h3>

                                <p className={`text-xs ${t.text.muted} flex items-center gap-1 mb-2 truncate`}>
                                    <MapPin className="w-3 h-3 shrink-0" /> {court.address.district}
                                </p>

                                <div className="flex items-center justify-between mt-auto pt-2 border-t border-border">
                                    <span className="text-emerald-400 text-sm font-black">
                                        {formatPrice(court.pricePerHour?.[0]?.timeSlots?.[0]?.pricePerHour || 0)}/h
                                    </span>
                                    <div className="w-6 h-6 rounded-full bg-emerald-500/10 flex items-center justify-center">
                                        <ChevronRight className="w-4 h-4 text-emerald-400" />
                                    </div>
                                </div>
                            </div>
                        ))
                    )}
                </div>
            </motion.div>

            {/* 5. Banner Quảng cáo / Sự kiện */}
            <motion.div
                initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }}
                className="w-full rounded-2xl bg-linear-to-r from-emerald-500 to-teal-600 p-5 relative overflow-hidden shadow-xl shadow-emerald-500/20"
            >
                <div className="absolute right-0 top-0 w-32 h-32 bg-card rounded-full blur-2xl translate-x-1/2 -translate-y-1/2"></div>
                <div className="relative z-10 w-2/3">
                    <span className="inline-flex items-center gap-1 px-2 py-1 rounded-md bg-card text-foreground text-[10px] font-bold uppercase tracking-wider mb-2">
                        <Zap className="w-3 h-3" /> Khuyến mãi
                    </span>
                    <h3 className="text-xl font-black text-foreground mb-1 leading-tight">Giảm 20% khung giờ vàng</h3>
                    <p className="text-foreground/80 text-xs mb-3">Áp dụng cho các sân đặt từ 9h-15h</p>
                    <button onClick={() => setPage('search')} className="px-4 py-2 bg-white text-emerald-600 text-sm font-bold rounded-xl shadow-sm active:scale-95 transition-transform">
                        Đặt ngay
                    </button>
                </div>
            </motion.div>
        </div>
    );
}