import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { MapPin, Star, Flame, ChevronRight, ChevronLeft, Search, Users, Zap, Clock, Activity } from 'lucide-react';
import { theme as t, formatPrice } from '../utils/theme';
import { useAppStore } from '../store';
import { courtApi } from '../api/court.api';
import type { Court } from '../types';
import { EmojiIcon } from '../components/EmojiIcon';


const MOCK_UPCOMING_GROUPS = [
    { id: 1, name: "Giao lưu lông thủ Q10", level: "Trung bình", time: "19:00 - 21:00", location: "Sân Vạn Thọ", slots: "3/4", price: "50K" },
    { id: 2, name: "Pickleball Newbie", level: "Mới tập chơi", time: "20:00 - 22:00", location: "Sân Bình Thạnh", slots: "2/4", price: "70K" },
    { id: 3, name: "Trình TB Khá - Cầu Lông", level: "TB Khá", time: "18:00 - 20:00", location: "Sân Lê Đức", slots: "5/6", price: "55K" },
    { id: 4, name: "Giao lưu vui vẻ cuối tuần", level: "Trung bình yếu", time: "08:00 - 10:00", location: "Sân Hoàng Hoa Thám", slots: "2/8", price: "60K" },
    { id: 5, name: "Tập luyện Pickleball", level: "Trung bình", time: "17:30 - 19:30", location: "Sân Gia Định", slots: "3/4", price: "80K" },
    { id: 6, name: "Hội Cầu Lông Tân Bình", level: "Khá", time: "20:00 - 22:00", location: "Sân Viettel", slots: "4/6", price: "65K" },
    { id: 7, name: "Giao lưu Pickleball Pro", level: "Chuyên nghiệp", time: "19:00 - 21:00", location: "Sân D-Court", slots: "1/4", price: "100K" },
    { id: 8, name: "Đánh đôi nam nữ (Cầu lông)", level: "Trung bình", time: "18:30 - 20:30", location: "Sân Kỳ Hòa", slots: "3/4", price: "50K" },
    { id: 9, name: "Nhóm Pickleball Sinh Viên", level: "Mới tập chơi", time: "16:00 - 18:00", location: "Sân Quận 7", slots: "6/8", price: "40K" },
    { id: 10, name: "Cầu lông sáng sớm", level: "Trung bình khá", time: "05:30 - 07:30", location: "Sân Phú Thọ", slots: "2/4", price: "45K" },
    { id: 11, name: "Giao lưu dưỡng sinh", level: "Yếu", time: "06:00 - 08:00", location: "Sân Tao Đàn", slots: "3/6", price: "30K" },
    { id: 12, name: "Pickleball Chuyên Nghiệp", level: "Chuyên nghiệp", time: "20:00 - 23:00", location: "Sân CELADON", slots: "2/4", price: "120K" },
    { id: 13, name: "Nhóm Khá Giỏi - Kèo Đơn", level: "Giỏi", time: "19:30 - 21:30", location: "Sân Lan Anh", slots: "1/2", price: "90K" },
];

const PROMOTIONS = [
    { id: 1, title: 'Giảm 20% khung giờ vàng', desc: 'Áp dụng cho các sân đặt từ 9h-15h', code: 'VANG20', bg: 'from-emerald-500 to-teal-600' },
    { id: 2, title: 'Bạn mới giảm 50K', desc: 'Cho lần đặt sân đầu tiên trên ứng dụng', code: 'NEWBIE', bg: 'from-blue-500 to-indigo-600' },
    { id: 3, title: 'Cuối tuần bùng nổ', desc: 'Hoàn tiền 10% khi đặt sân Thứ 7, CN', code: 'WEEKEND', bg: 'from-orange-500 to-red-600' },
    { id: 4, title: 'Cặp đôi hoàn hảo', desc: 'Giảm 15% khi đặt sân chơi đôi nam nữ', code: 'COUPLE15', bg: 'from-pink-500 to-rose-600' },
    { id: 5, title: 'Thẻ thành viên', desc: 'Tặng 1h chơi miễn phí khi tích đủ 10 điểm', code: 'LOYALTY', bg: 'from-purple-500 to-fuchsia-600' }
];

export default function Dashboard() {
    const { user, setPage, setFilters, setBookingCourt } = useAppStore();
    const [loading, setLoading] = useState(true);
    const [popularCourts, setPopularCourts] = useState<Court[]>([]);
    const [currentGroupIndex, setCurrentGroupIndex] = useState(0);
    const [currentPromoIndex, setCurrentPromoIndex] = useState(0);
    const scrollContainerRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        if (!scrollContainerRef.current || popularCourts.length === 0) return;

        const interval = setInterval(() => {
            const container = scrollContainerRef.current;
            if (!container) return;

            const maxScrollLeft = container.scrollWidth - container.clientWidth;

            if (container.scrollLeft >= maxScrollLeft - 10) {
                container.scrollTo({ left: 0, behavior: 'smooth' });
            } else {
                container.scrollTo({ left: container.scrollLeft + 272, behavior: 'smooth' });
            }
        }, 10000);

        return () => clearInterval(interval);
    }, [popularCourts]);

    useEffect(() => {
        const timer = setInterval(() => {
            setCurrentGroupIndex((prev) => (prev + 1) % MOCK_UPCOMING_GROUPS.length);
        }, 6000);
        return () => clearInterval(timer);
    }, [currentGroupIndex]);

    useEffect(() => {
        const timer = setInterval(() => {
            setCurrentPromoIndex((prev) => (prev + 1) % PROMOTIONS.length);
        }, 4000);
        return () => clearInterval(timer);
    }, [currentPromoIndex]);

    const handlePrevGroup = () => {
        setCurrentGroupIndex((prev) => (prev - 1 + MOCK_UPCOMING_GROUPS.length) % MOCK_UPCOMING_GROUPS.length);
    };

    const handleNextGroup = () => {
        setCurrentGroupIndex((prev) => (prev + 1) % MOCK_UPCOMING_GROUPS.length);
    };

    const getVisibleDots = () => {
        const total = MOCK_UPCOMING_GROUPS.length;
        if (total <= 3) return Array.from({ length: total }, (_, i) => i);
        return [
            (currentGroupIndex - 1 + total) % total,
            currentGroupIndex,
            (currentGroupIndex + 1) % total
        ];
    };

    useEffect(() => {
        const fetchDashboardData = async () => {
            try {
                setLoading(true);
                const response = await courtApi.searchCourts({
                    page: 1,
                    limit: 20,
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
        if (hour < 5) return 'Ngủ muộn hay dậy sớm thế';
        if (hour < 11) return 'Khởi động ngày mới rực rỡ nào';
        if (hour < 14) return 'Nghỉ trưa nhớ chốt kèo chiều nhé';
        if (hour < 18) return 'Chiều năng động, xách vợt ra sân thôi';
        if (hour < 22) return 'Tối mát mẻ, làm vài ván giao lưu không';
        return 'Khuya rồi, nghỉ ngơi dưỡng sức mai chiến';
    };

    return (
        <div className="max-w-7xl mx-auto px-4 pb-24 pt-6 space-y-8 overflow-x-hidden">
            {/* 1. Header & Lời chào */}
            <div className="relative">
                <motion.div
                    initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
                    className="flex items-center justify-between relative z-10"
                >
                    <div>
                        <motion.p
                            initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.1 }}
                            className={`text-sm font-medium ${t.text.muted} mb-1`}
                        >
                            {getGreeting()},
                        </motion.p>
                        <motion.h1
                            initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.2 }}
                            className="text-2xl font-black flex items-center gap-2"
                        >
                            <span className="bg-gradient-to-r from-emerald-400 to-cyan-400 bg-clip-text text-transparent">
                                {user?.name || 'Lông thủ'}
                            </span>
                            <motion.div
                                animate={{ rotate: [0, 15, -10, 0], y: [0, -5, 0] }}
                                transition={{ repeat: Infinity, duration: 2.5, ease: "easeInOut" }}
                            >
                                <EmojiIcon name="badminton" className="w-8 h-8 drop-shadow-md" />
                            </motion.div>
                        </motion.h1>

                        {(user?.stats?.activityStreak && user.stats.activityStreak > 0) ? (
                            <motion.div
                                initial={{ opacity: 0, y: 5 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}
                                className="mt-2 inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-orange-500/10 border border-orange-500/20 shadow-sm shadow-orange-500/5"
                            >
                                <Flame className="w-3.5 h-3.5 text-orange-500" />
                                <span className="text-[10px] font-bold text-orange-400 uppercase tracking-wider">Chuỗi {user.stats.activityStreak} ngày hoạt động</span>
                            </motion.div>
                        ) : null}
                    </div>

                    <motion.div
                        id="tour-matchmaking"
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                        initial={{ opacity: 0, scale: 0.8 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: 0.2 }}
                        onClick={() => setPage('groupplay')}
                        className="w-12 h-12 rounded-full bg-gradient-to-br from-emerald-500/20 to-teal-500/10 flex items-center justify-center border border-emerald-500/30 cursor-pointer shadow-lg shadow-emerald-500/10 relative group"
                    >
                        <div className="absolute inset-0 rounded-full bg-emerald-400/20 animate-ping opacity-20"></div>
                        <Users className="w-6 h-6 text-emerald-400 group-hover:text-emerald-300 transition-colors relative z-10" />

                        {/* Notification dot */}
                        {MOCK_UPCOMING_GROUPS.length > 0 && (
                            <div className="absolute top-0 right-0 w-3 h-3 bg-emerald-500 rounded-full border-2 border-background shadow-sm shadow-emerald-500/50"></div>
                        )}
                    </motion.div>
                </motion.div>
            </div>

            {/* 2. Widget: Nhóm sắp diễn ra */}
            <motion.div
                initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}
                className="w-full rounded-2xl bg-gradient-to-br from-emerald-500/10 to-card border border-emerald-500/20 p-4 relative overflow-hidden shadow-lg shadow-emerald-500/5"
            >
                <div className="absolute top-0 right-0 w-32 h-32 bg-emerald-500/10 blur-2xl rounded-full"></div>
                <div className="relative z-10 flex justify-between items-center mb-3">
                    <h3 className="text-emerald-400 font-bold flex items-center gap-2 text-sm">
                        <Clock className="w-4 h-4" /> Nhóm sắp diễn ra
                    </h3>
                    <div className="flex items-center gap-2">
                        <button onClick={handlePrevGroup} className="w-6 h-6 flex items-center justify-center rounded-full bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 transition-colors">
                            <ChevronLeft className="w-3 h-3" />
                        </button>
                        <div className="flex gap-1.5 items-center justify-center w-[36px]">
                            <AnimatePresence mode="popLayout">
                                {getVisibleDots().map((idx) => (
                                    <motion.button
                                        layout
                                        initial={{ opacity: 0, scale: 0 }}
                                        animate={{ opacity: 1, scale: 1 }}
                                        exit={{ opacity: 0, scale: 0 }}
                                        transition={{ duration: 0.2 }}
                                        key={idx}
                                        onClick={() => setCurrentGroupIndex(idx)}
                                        className={`rounded-full shrink-0 ${idx === currentGroupIndex ? 'w-2 h-2 bg-emerald-400' : 'w-1.5 h-1.5 bg-emerald-400/20 hover:bg-emerald-400/60'}`}
                                    />
                                ))}
                            </AnimatePresence>
                        </div>
                        <button onClick={handleNextGroup} className="w-6 h-6 flex items-center justify-center rounded-full bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 transition-colors">
                            <ChevronRight className="w-3 h-3" />
                        </button>
                    </div>
                </div>
                <div className="relative z-10 h-[82px]">
                    <AnimatePresence mode="wait">
                        <motion.div
                            key={currentGroupIndex}
                            initial={{ opacity: 0, x: 20 }}
                            animate={{ opacity: 1, x: 0 }}
                            exit={{ opacity: 0, x: -20 }}
                            transition={{ duration: 0.3 }}
                            className="bg-background/60 rounded-xl p-3 border border-border flex gap-3 items-center backdrop-blur-sm absolute inset-0"
                        >
                            <div className="w-12 h-12 rounded-xl bg-card flex items-center justify-center shrink-0 border border-border">
                                <EmojiIcon name={MOCK_UPCOMING_GROUPS[currentGroupIndex].name.toLowerCase().includes('pickleball') ? 'pickleball' : 'badminton'} className="w-6 h-6 text-emerald-400" />
                            </div>
                            <div className="flex-1 min-w-0">
                                <h4 className="font-bold text-foreground text-sm truncate">{MOCK_UPCOMING_GROUPS[currentGroupIndex].location}</h4>
                                <p className="text-xs font-semibold text-emerald-400 truncate mt-0.5">{MOCK_UPCOMING_GROUPS[currentGroupIndex].name} • {MOCK_UPCOMING_GROUPS[currentGroupIndex].level}</p>
                                <p className="text-[10px] text-muted-foreground truncate mt-0.5 flex items-center gap-2">
                                    <span>⏰ {MOCK_UPCOMING_GROUPS[currentGroupIndex].time}</span>
                                    <span>💸 {MOCK_UPCOMING_GROUPS[currentGroupIndex].price}/người</span>
                                </p>
                            </div>
                            <div className="flex flex-col items-end gap-1">
                                <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-emerald-500/10 text-emerald-400">{MOCK_UPCOMING_GROUPS[currentGroupIndex].slots}</span>
                                <button onClick={() => setPage('groupplay')} className="px-3 py-1.5 bg-emerald-500 text-black text-xs font-bold rounded-lg hover:bg-emerald-400 active:scale-95 transition-all shadow-md shadow-emerald-500/20">
                                    Vào
                                </button>
                            </div>
                        </motion.div>
                    </AnimatePresence>
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

            {/* 5. Hoạt động bạn bè (Social Feed) */}
            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.25 }}>
                <div className="flex items-center justify-between mb-4">
                    <h2 className={`text-lg font-bold ${t.text.primary} flex items-center gap-2`}>
                        <Activity className="w-5 h-5 text-blue-400" /> Hoạt động bạn bè
                    </h2>
                </div>
                <div className={`p-3 rounded-2xl ${t.bg.card} border ${t.border.subtle} hover:border-blue-500/20 transition-all flex items-center justify-between cursor-pointer`} onClick={() => setPage('groupplay')}>
                    <div className="flex items-center gap-3">
                        <div className="relative">
                            <img src="https://i.pravatar.cc/100?img=12" alt="Avatar" className="w-10 h-10 rounded-full border-2 border-background" />
                            <div className="absolute -bottom-1 -right-1 w-4 h-4 bg-blue-500 rounded-full border border-background flex items-center justify-center">
                                <Users className="w-2.5 h-2.5 text-white" />
                            </div>
                        </div>
                        <div>
                            <h4 className="font-bold text-sm text-foreground">Tuấn Anh <span className="text-muted-foreground font-normal">vừa tạo nhóm</span></h4>
                            <p className="text-xs font-semibold text-blue-400 mt-0.5">Sân Lê Đức • Tối nay 19:30</p>
                        </div>
                    </div>
                    <div className="w-8 h-8 rounded-full bg-blue-500/10 flex items-center justify-center hover:bg-blue-500/20 transition-colors text-blue-500">
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

                <div ref={scrollContainerRef} className="flex gap-4 overflow-x-auto pb-4 snap-x snap-mandatory scrollbar-hide -mx-4 px-4">
                    {loading ? (
                        /* Skeleton Loading */
                        Array.from({ length: 5 }).map((_, i) => (
                            <div key={i} className={`w-59 shrink-0 snap-start rounded-2xl ${t.bg.card} border ${t.border.subtle} p-3 animate-pulse`}>
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
                                className={`w-59 shrink-0 snap-start rounded-2xl ${t.bg.card} border ${t.border.subtle} p-3 hover:border-emerald-500/20 transition-all cursor-pointer group`}
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

            {/* 6. Banner Quảng cáo / Sự kiện */}
            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }}>
                <div className="flex items-center justify-between mb-4">
                    <h2 className={`text-lg font-bold ${t.text.primary} flex items-center gap-2`}>
                        <Zap className="w-5 h-5 text-yellow-500" /> Ưu đãi cho bạn
                    </h2>
                </div>
                <div className="relative w-full overflow-hidden rounded-2xl h-[180px] shadow-lg">
                    <AnimatePresence mode="wait">
                        <motion.div
                            key={currentPromoIndex}
                            initial={{ opacity: 0, x: 20 }}
                            animate={{ opacity: 1, x: 0 }}
                            exit={{ opacity: 0, x: -20 }}
                            transition={{ duration: 0.3 }}
                            className={`absolute inset-0 bg-gradient-to-r ${PROMOTIONS[currentPromoIndex].bg} p-5 flex flex-col justify-between`}
                        >
                            <div className="absolute right-0 top-0 w-48 h-48 bg-white/20 rounded-full blur-2xl translate-x-1/3 -translate-y-1/3"></div>
                            <div className="relative z-10 w-[85%] flex flex-col h-full">
                                <div>
                                    <span className="inline-flex items-center gap-1 px-2 py-1 rounded-md bg-white/20 text-white text-[10px] font-bold uppercase tracking-wider mb-2">
                                        Mã: {PROMOTIONS[currentPromoIndex].code}
                                    </span>
                                    <h3 className="text-xl font-black text-white mb-2 leading-tight">{PROMOTIONS[currentPromoIndex].title}</h3>
                                    <p className="text-white/90 text-xs line-clamp-2 leading-relaxed">{PROMOTIONS[currentPromoIndex].desc}</p>
                                </div>
                                <button onClick={() => setPage('search')} className="mt-auto self-start px-4 py-2 bg-white text-gray-900 text-sm font-bold rounded-xl shadow-sm active:scale-95 transition-transform hover:bg-gray-50">
                                    Dùng ngay
                                </button>
                            </div>
                        </motion.div>
                    </AnimatePresence>
                    
                    {/* Dots indicator */}
                    <div className="absolute bottom-4 right-4 flex gap-1.5 z-20">
                        {PROMOTIONS.map((_, idx) => (
                            <div 
                                key={idx} 
                                onClick={() => setCurrentPromoIndex(idx)}
                                className={`h-1.5 rounded-full transition-all duration-300 cursor-pointer ${idx === currentPromoIndex ? 'w-4 bg-white' : 'w-1.5 bg-white/40 hover:bg-white/60'}`} 
                            />
                        ))}
                    </div>
                </div>
            </motion.div>

        </div>
    );
}