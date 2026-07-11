import { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { useNavigate } from 'react-router-dom';
import {
    ShoppingCart, DollarSign, Activity,
    ArrowUpRight, ArrowDownRight, ChevronLeft, ChevronRight, Loader2, X, Calendar, MapPin, User as UserIcon
} from 'lucide-react';
import { useAppStore } from '../../store';
import { useAlertStore } from '../../stores/useAlertStore';
import {
    Area, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, ResponsiveContainer, PieChart, Pie, Cell, ComposedChart, Line
} from 'recharts';
import { adminApi } from '../../api/admin.api';
import dayjs from 'dayjs';
import { EmojiIcon } from '../../components/EmojiIcon';
import { getBookingStatusConfig } from '../../utils/bookingStatus';

const IDEAS = [
    {
        title: "Tạo chiến dịch Marketing cho sân",
        desc: "Đăng bài viết hoặc chương trình khuyến mãi giờ vàng để tăng tỷ lệ lấp đầy sân vào buổi sáng sớm.",
        btn: "Xem chi tiết",
        action: "MARKETING_CAMPAIGN"
    },
    {
        title: "Tối ưu hóa doanh thu Pickleball",
        desc: "Nhu cầu Pickleball đang tăng đột biến (+30%). Cân nhắc gửi đề xuất chuyển đổi sân cầu lông vắng khách sang Pickleball cho các chủ sân.",
        btn: "Lên chiến dịch",
        action: "PICKLEBALL_OPTIMIZATION"
    }
];

export default function AdminDashboard() {
    const { user } = useAppStore();
    const [currentIdea, setCurrentIdea] = useState(0);
    const [stats, setStats] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [recentPage, setRecentPage] = useState(1);
    const RECENT_PAGE_SIZE = 5;

    // Quản lý trạng thái Modal
    const [activeModal, setActiveModal] = useState<'none' | 'marketing' | 'allBookings' | 'bookingDetail' | 'courtDetail' | 'chartDetail'>('none');
    const [selectedData, setSelectedData] = useState<any>(null);

    const closeModal = () => {
        setActiveModal('none');
        setSelectedData(null);
    };

    const navigate = useNavigate();

    useEffect(() => {
        if (!user || user.role !== 'admin') {
            useAlertStore.getState().showAlert('Bạn không có quyền truy cập trang quản trị', 'Truy cập bị từ chối', 'error');
            navigate('/', { replace: true });
            return;
        }

        const loadStats = () => {
            adminApi.getDashboardStats()
                .then(res => {
                    setStats(res.data?.data || res.data);
                })
                .catch(err => {
                    console.error("Failed to load dashboard stats", err);
                })
                .finally(() => {
                    setLoading(false);
                });
        };

        loadStats(); // Tải lần đầu

        // Polling mỗi 60 giây để dashboard luôn được cập nhật khi có dữ liệu mới
        const interval = setInterval(loadStats, 60000);
        return () => clearInterval(interval);
    }, []);

    const nextIdea = () => setCurrentIdea((prev) => (prev + 1) % IDEAS.length);
    const prevIdea = () => setCurrentIdea((prev) => (prev - 1 + IDEAS.length) % IDEAS.length);

    // Xử lý các hành động
    const handleActionIdea = () => {
        setSelectedData(IDEAS[currentIdea]);
        setActiveModal('marketing');
    };

    const handleScrollToStats = () => {
        document.getElementById('admin-stats-section')?.scrollIntoView({ behavior: 'smooth' });
    };

    const handleViewOrder = (booking: any) => {
        setSelectedData(booking);
        setActiveModal('bookingDetail');
    };

    const handleManageCourt = (courtData: any) => {
        setSelectedData(courtData);
        setActiveModal('courtDetail');
    };

    if (loading) {
        return (
            <div className="w-full h-[calc(100vh-76px)] flex items-center justify-center bg-transparent">
                <Loader2 className="w-8 h-8 text-emerald-500 animate-spin" />
            </div>
        );
    }

    const {
        totalUsers, totalCourts, totalBookings, totalRevenue,
        bookingTrend, topCourts, recentBookings: rawRecentBookings, bookingRatio, userGrowth
    } = stats || {};

    const totalRecentPages = Math.ceil((rawRecentBookings?.length || 0) / RECENT_PAGE_SIZE);
    const recentBookings = rawRecentBookings?.slice((recentPage - 1) * RECENT_PAGE_SIZE, recentPage * RECENT_PAGE_SIZE);

    const chartData = (bookingTrend || []).map((item: any) => ({
        name: dayjs(item.date).format('DD/MM'),
        income: item.revenue,
        count: item.count,
        fullDate: item.date
    }));

    // Hàm tính toán phần trăm tăng trưởng dựa trên dữ liệu 30 ngày qua
    const calculateTrend = (dataArray: any[], valueKey: string) => {
        if (!dataArray || dataArray.length === 0) return { text: "0.00%", isPos: true };
        
        // So sánh 15 ngày gần nhất với 15 ngày trước đó
        const recent15Days = dataArray.slice(-15);
        const previous15Days = dataArray.slice(-30, -15);

        const recentSum = recent15Days.reduce((acc, curr) => acc + (curr[valueKey] || 0), 0);
        const prevSum = previous15Days.reduce((acc, curr) => acc + (curr[valueKey] || 0), 0);
        
        if (prevSum === 0) return { text: recentSum > 0 ? "+100%" : "0.00%", isPos: recentSum >= 0 };
        
        const change = ((recentSum - prevSum) / prevSum) * 100;
        return { text: `${change >= 0 ? '+' : ''}${change.toFixed(2)}%`, isPos: change >= 0 };
    };

    const bookingTrendMetrics = calculateTrend(bookingTrend || [], 'count');
    const revenueTrendMetrics = calculateTrend(bookingTrend || [], 'revenue');
    const userTrendMetrics = calculateTrend(userGrowth || [], 'count');

    const COLORS = ['#10b981', '#f97316', '#3b82f6'];
    const pieData = (bookingRatio || []).map((item: any, i: number) => ({
        name: item.name === 'BADMINTON' ? 'Cầu lông' : (item.name === 'PICKLEBALL' ? 'Pickleball' : 'Tennis'),
        value: item.value,
        color: COLORS[i % COLORS.length]
    }));
    const totalPieValue = pieData.reduce((acc: number, cur: any) => acc + cur.value, 0);

    return (
        <div className="w-full h-[calc(100vh-64px)] overflow-y-auto custom-scrollbar p-6 text-muted-foreground font-sans relative z-0 bg-[#0a0f16]">
            {/* Background elements độc quyền lấy từ Owner */}
            <div className="fixed inset-0 z-[-1] pointer-events-none">
                <div className="absolute top-0 left-0 w-full h-full bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-indigo-900/20 via-[#0a0f16] to-[#0a0f16]"></div>
                <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] rounded-full bg-indigo-500/10 blur-[120px]"></div>
                <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] rounded-full bg-emerald-500/10 blur-[120px]"></div>
                
                {/* Dot grid mờ ảo */}
                <div className="absolute inset-0 opacity-[0.03]" style={{ backgroundImage: 'radial-gradient(circle at 1px 1px, white 1px, transparent 0)', backgroundSize: '32px 32px' }}></div>
                
                {/* Giant Subtle Background Icons */}
                <div className="absolute top-[-15%] -left-[20%] opacity-[0.08] dark:opacity-[0.05] animate-[spin_120s_linear_infinite] pointer-events-none">
                    <EmojiIcon name="badminton" className="w-[800px] h-[800px] grayscale" />
                </div>
                <div className="absolute -bottom-[25%] -right-[20%] opacity-[0.08] dark:opacity-[0.05] animate-[spin_90s_linear_infinite_reverse] pointer-events-none">
                    <EmojiIcon name="pickleball" className="w-[600px] h-[600px] grayscale" />
                </div>
            </div>
            <div className="max-w-400 mx-auto space-y-6 pb-12">

                {/* ================= HÀNG 1: WELCOME & IDEAS ================= */}
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

                    <div className="lg:col-span-2 rounded-3xl p-8 lg:p-10 bg-white/50 dark:bg-black/20 backdrop-blur-3xl border border-black/5 dark:border-emerald-500/20 flex flex-col justify-center relative overflow-hidden shadow-[0_8px_30px_rgb(0,0,0,0.05)] dark:shadow-[0_0_50px_-12px_rgba(16,185,129,0.15)]">
                        {/* Hiệu ứng loang màu */}
                        <div className="absolute -right-10 -top-20 w-80 h-80 bg-emerald-500/20 dark:bg-emerald-500/15 rounded-full blur-[100px] pointer-events-none"></div>
                        <div className="absolute left-[-10%] -bottom-20 w-80 h-80 bg-indigo-500/20 dark:bg-indigo-500/15 rounded-full blur-[100px] pointer-events-none"></div>

                        <h2 className="text-4xl lg:text-5xl font-black text-foreground mb-4 tracking-tight relative z-10 leading-tight">Xin chào {user?.displayName || 'Admin'},</h2>
                        <p className="text-muted-foreground max-w-xl text-[15px] font-medium leading-relaxed mb-10 relative z-10">
                            Chào mừng đến với Bảng điều khiển ShuttleSync! Theo dõi doanh thu, quản lý sân và nắm bắt mọi thông tin chi tiết về hệ thống một cách trực quan.
                        </p>
                        <button
                            onClick={handleScrollToStats}
                            className="bg-emerald-500 text-black font-black uppercase tracking-widest text-[14px] px-8 py-4 rounded-xl w-max hover:bg-emerald-400 transition-all shadow-[0_0_30px_-5px_rgba(16,185,129,0.5)] hover:shadow-[0_0_40px_0px_rgba(16,185,129,0.6)] relative z-10 active:scale-95 flex items-center gap-2"
                        >
                            Khám phá ngay <ArrowDownRight className="w-5 h-5" />
                        </button>
                    </div>

                    {/* Thẻ Ideas for You */}
                    <div className="rounded-3xl p-7 bg-white/50 dark:bg-black/40 backdrop-blur-3xl border border-black/5 dark:border-white/10 flex flex-col justify-between shadow-[0_8px_30px_rgb(0,0,0,0.05)] dark:shadow-[0_8px_30px_rgb(0,0,0,0.5)] relative overflow-hidden">
                        <div className="absolute top-0 right-0 w-32 h-32 bg-blue-500/10 rounded-full blur-3xl pointer-events-none"></div>
                        
                        <div className="flex justify-between items-center mb-4 relative z-10">
                            <h3 className="text-sm font-semibold text-muted-foreground">Gợi ý cho bạn ({currentIdea + 1}/{IDEAS.length})</h3>
                            <div className="flex gap-2">
                                <button onClick={prevIdea} className="w-7 h-7 rounded bg-emerald-500/10 text-emerald-100/70 flex items-center justify-center hover:bg-emerald-500/20 hover:text-emerald-50 transition-colors active:scale-90">
                                    <ChevronLeft className="w-4 h-4" />
                                </button>
                                <button onClick={nextIdea} className="w-7 h-7 rounded bg-emerald-500/10 text-emerald-100/70 flex items-center justify-center hover:bg-emerald-500/20 hover:text-emerald-50 transition-colors active:scale-90">
                                    <ChevronRight className="w-4 h-4" />
                                </button>
                            </div>
                        </div>
                        <div className="animate-in fade-in slide-in-from-right-4 duration-300 relative z-10" key={currentIdea}>
                            <h2 className="text-lg font-bold text-foreground mb-2">{IDEAS[currentIdea].title}</h2>
                            <p className="text-sm text-muted-foreground mb-5 line-clamp-3 leading-relaxed min-h-15">
                                {IDEAS[currentIdea].desc}
                            </p>
                            <button
                                onClick={handleActionIdea}
                                className="px-5 py-2 bg-transparent border border-border rounded-lg text-sm font-medium text-emerald-400 hover:bg-surface transition-colors active:scale-95"
                            >
                                {IDEAS[currentIdea].btn}
                            </button>
                        </div>
                    </div>
                </div>

                {/* Gắn ID để nút Khám phá ngay cuộn xuống đây */}
                <div id="admin-stats-section"></div>

                {/* ================= HÀNG 2: THỐNG KÊ (STATS) ================= */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <StatCard title="Lượt đặt sân" value={totalBookings?.toLocaleString() || '0'} trend={bookingTrendMetrics.text} isPositive={bookingTrendMetrics.isPos} icon={<ShoppingCart className="w-5 h-5 text-orange-500" />} iconBg="bg-orange-500/10" />
                    <StatCard title="Doanh thu" value={(totalRevenue / 1000)?.toLocaleString() + 'K' || '0K'} trend={revenueTrendMetrics.text} isPositive={revenueTrendMetrics.isPos} icon={<DollarSign className="w-5 h-5 text-emerald-500" />} iconBg="bg-emerald-500/10" />
                    <StatCard title="Tổng số Sân / Người dùng" value={`${totalCourts} / ${totalUsers}`} trend={userTrendMetrics.text} isPositive={userTrendMetrics.isPos} icon={<Activity className="w-5 h-5 text-blue-500" />} iconBg="bg-blue-500/10" />
                </div>

                {/* ================= HÀNG 3: BIỂU ĐỒ SỐNG (CHARTS) ================= */}
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

                    {/* Biểu đồ Doanh thu (Recharts AreaChart) */}
                    <div className="lg:col-span-2 rounded-3xl p-7 bg-white/50 dark:bg-black/40 backdrop-blur-3xl border border-black/5 dark:border-white/10 shadow-[0_8px_30px_rgb(0,0,0,0.05)] dark:shadow-[0_8px_30px_rgb(0,0,0,0.5)] flex flex-col relative overflow-hidden group">
                        <h3 className="text-lg font-black uppercase tracking-wider text-foreground mb-6">Biến động Doanh thu</h3>
                        <div className="flex gap-6 mb-8">
                            <div className="p-4 rounded-xl bg-card border border-border flex-1">
                                <div className="flex items-center gap-2 mb-1">
                                    <div className="w-2 h-2 rounded-full bg-emerald-500"></div>
                                    <span className="text-xs font-semibold text-muted-foreground">Tổng doanh thu</span>
                                </div>
                                <p className="text-3xl font-black tracking-tight text-foreground">{(totalRevenue / 1000)?.toLocaleString() || '0'}K</p>
                            </div>
                        </div>

                        {/* CHART HOẠT ĐỘNG THỰC SỰ */}
                        <div className="w-full flex-1 min-h-62.5">
                            <ResponsiveContainer width="100%" height="100%">
                                <ComposedChart 
                                    data={chartData} 
                                    margin={{ top: 10, right: 0, left: -20, bottom: 0 }}
                                    onClick={(e: any) => {
                                        console.log("Chart clicked:", e);
                                        if (e) {
                                            if (e.activePayload && e.activePayload.length > 0) {
                                                setSelectedData(e.activePayload[0].payload);
                                                setActiveModal('chartDetail');
                                            } else if (e.activeLabel) {
                                                const item = chartData.find((d: any) => d.name === e.activeLabel);
                                                if (item) {
                                                    setSelectedData(item);
                                                    setActiveModal('chartDetail');
                                                }
                                            }
                                        }
                                    }}
                                    style={{ cursor: 'pointer' }}
                                >
                                    <defs>
                                        <linearGradient id="colorIncome" x1="0" y1="0" x2="0" y2="1">
                                            <stop offset="5%" stopColor="#10b981" stopOpacity={0.3} />
                                            <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
                                        </linearGradient>
                                    </defs>
                                    <CartesianGrid strokeDasharray="3 3" stroke="#262f3d" vertical={false} />
                                    <XAxis dataKey="name" stroke="#6b7280" fontSize={12} tickLine={false} axisLine={false} />
                                    <YAxis stroke="#6b7280" fontSize={12} tickLine={false} axisLine={false} tickFormatter={(val) => `${val / 1000}K`} />
                                    <RechartsTooltip
                                        contentStyle={{ backgroundColor: 'var(--color-card)', borderColor: 'var(--color-border)', borderRadius: '8px', color: 'var(--color-foreground)' }}
                                        itemStyle={{ color: 'var(--color-foreground)' }}
                                        formatter={(value: any) => [`${value?.toLocaleString()} VND`, 'Số tiền']} />
                                    <Area type="monotone" dataKey="income" stroke="none" fillOpacity={1} fill="url(#colorIncome)" />
                                    <Line type="monotone" dataKey="income" stroke="#10b981" strokeWidth={3} dot={false} activeDot={{ r: 6, fill: '#1a222c', stroke: '#10b981', strokeWidth: 2 }} isAnimationActive={true} animationDuration={2000} animationEasing="ease-in-out" />
                                </ComposedChart>
                            </ResponsiveContainer>
                        </div>
                    </div>

                    {/* Biểu đồ Tròn (Recharts Donut Chart) - Chỉ Cầu lông và Pickleball */}
                    <div className="rounded-3xl p-7 bg-white/50 dark:bg-black/40 backdrop-blur-3xl border border-black/5 dark:border-white/10 shadow-[0_8px_30px_rgb(0,0,0,0.05)] dark:shadow-[0_8px_30px_rgb(0,0,0,0.5)] flex flex-col relative overflow-hidden">
                        <h3 className="text-lg font-black uppercase tracking-wider text-foreground mb-2">Tỉ trọng đặt sân</h3>

                        <div className="w-full flex-1 min-h-55 relative">
                            <ResponsiveContainer width="100%" height="100%">
                                <PieChart>
                                    <Pie
                                        data={pieData}
                                        cx="50%"
                                        cy="50%"
                                        innerRadius={70}
                                        outerRadius={90}
                                        paddingAngle={5}
                                        dataKey="value"
                                        stroke="none"
                                    >
                                        {pieData.map((entry: any, index: number) => (
                                            <Cell key={`cell-${index}`} fill={entry.color} />
                                        ))}
                                    </Pie>
                                    <RechartsTooltip
                                        contentStyle={{ backgroundColor: 'var(--color-card)', borderColor: 'var(--color-border)', borderRadius: '8px', color: 'var(--color-foreground)' }}
                                        itemStyle={{ color: 'var(--color-foreground)' }}
                                        formatter={(value: any) => [value, 'Số lượng']} />
                                </PieChart>
                            </ResponsiveContainer>
                            {/* Chữ hiển thị ở giữa Donut */}
                            <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                                <span className="text-muted-foreground text-xs">Tổng số</span>
                                <span className="text-3xl font-black text-foreground">{totalPieValue}</span>
                            </div>
                        </div>

                        {/* Chú thích (Legend) */}
                        <div className="space-y-4 mt-4">
                            {pieData.map((item: any, index: number) => (
                                <div key={index} className="flex justify-between items-center text-sm">
                                    <div className="flex items-center gap-3">
                                        <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: item.color }}></div>
                                        <span className="text-muted-foreground font-medium">{item.name}</span>
                                    </div>
                                    <span className="text-foreground font-bold">{item.value.toLocaleString()} <span className="text-muted-foreground text-xs font-normal ml-1">{((item.value / (totalPieValue || 1)) * 100).toFixed(1)}%</span></span>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>

                {/* ================= HÀNG 4: BẢNG DỮ LIỆU VÀ SÂN HOT ================= */}
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
                    <div className="lg:col-span-2 rounded-3xl p-7 bg-white/50 dark:bg-black/40 backdrop-blur-3xl border border-black/5 dark:border-white/10 shadow-[0_8px_30px_rgb(0,0,0,0.05)] dark:shadow-[0_8px_30px_rgb(0,0,0,0.5)] flex flex-col min-w-0">
                        <div className="flex items-center justify-between mb-6 shrink-0">
                            <h3 className="text-lg font-black uppercase tracking-wider text-foreground">Đơn đặt gần đây</h3>
                            <button 
                                onClick={() => setActiveModal('allBookings')}
                                className="text-sm font-semibold text-emerald-400 hover:text-emerald-300 transition-colors"
                            >
                                Xem toàn bộ
                            </button>
                        </div>
                        <div className="overflow-x-auto bg-black/5 dark:bg-white/5 rounded-2xl border border-black/5 dark:border-white/5">
                            <table className="w-full text-left text-sm whitespace-nowrap">
                                <thead>
                                    <tr className="text-[11px] font-black uppercase tracking-widest text-emerald-700/70 dark:text-emerald-100/40 border-b border-black/5 dark:border-white/5 bg-black/5 dark:bg-white/5">
                                        <th className="px-4 py-4 rounded-tl-2xl">Mã đơn</th>
                                        <th className="px-4 py-4">Khách</th>
                                        <th className="px-4 py-4">Số tiền</th>
                                        <th className="px-4 py-4">Ngày</th>
                                        <th className="px-4 py-4">Trạng thái</th>
                                        <th className="px-4 py-4 text-right rounded-tr-2xl">Thao tác</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-black/5 dark:divide-white/5">
                                {recentBookings?.map((booking: any) => (
                                    <TableRow 
                                        key={booking._id}
                                        id={`#${booking.bookingCode}`}
                                        amount={`${booking.finalAmount?.toLocaleString()}đ`}
                                        type={booking.userId?.displayName || 'Khách vãng lai'}
                                        date={dayjs(booking.date).format('DD/MM')}
                                        status={getBookingStatusConfig(booking.status).label}
                                        colorConfig={getBookingStatusConfig(booking.status)}
                                        onView={() => handleViewOrder(booking)}
                                    />
                                ))}
                                {(!recentBookings || recentBookings.length === 0) && (
                                    <tr>
                                        <td colSpan={6} className="py-8 text-center text-muted-foreground">Không có đơn đặt sân nào gần đây</td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                        {totalRecentPages > 1 && (
                            <div className="flex items-center justify-between p-4 border-t border-black/5 dark:border-white/5 bg-black/5 dark:bg-white/5 rounded-b-2xl">
                                <span className="text-xs text-muted-foreground font-medium">
                                    Hiển thị {(recentPage - 1) * RECENT_PAGE_SIZE + 1} - {Math.min(recentPage * RECENT_PAGE_SIZE, rawRecentBookings?.length || 0)} trong {rawRecentBookings?.length} đơn
                                </span>
                                <div className="flex gap-2">
                                    <button 
                                        onClick={() => setRecentPage(p => Math.max(1, p - 1))}
                                        disabled={recentPage === 1}
                                        className="p-1.5 rounded-lg bg-white/5 text-white disabled:opacity-30 disabled:cursor-not-allowed hover:bg-emerald-500 hover:text-black transition-colors"
                                    >
                                        <ChevronLeft className="w-4 h-4" />
                                    </button>
                                    <button 
                                        onClick={() => setRecentPage(p => Math.min(totalRecentPages, p + 1))}
                                        disabled={recentPage === totalRecentPages}
                                        className="p-1.5 rounded-lg bg-white/5 text-white disabled:opacity-30 disabled:cursor-not-allowed hover:bg-emerald-500 hover:text-black transition-colors"
                                    >
                                        <ChevronRight className="w-4 h-4" />
                                    </button>
                                </div>
                            </div>
                        )}
                        </div>
                    </div>

                    <div className="rounded-3xl p-7 bg-white/50 dark:bg-black/40 backdrop-blur-3xl border border-black/5 dark:border-white/10 shadow-[0_8px_30px_rgb(0,0,0,0.05)] dark:shadow-[0_8px_30px_rgb(0,0,0,0.5)] min-w-0">
                        <h3 className="text-lg font-black uppercase tracking-wider text-foreground mb-6">Sân Hot Nhất</h3>
                        <div className="space-y-5">
                            {topCourts?.map((court: any) => (
                                <TopCourt
                                    key={court.courtId}
                                    name={court.name}
                                    bookings={court.bookings}
                                    revenue={`${(court.revenue / 1000).toLocaleString()}K`}
                                    status="Đang hoạt động"
                                    statusColor="text-emerald-400"
                                    onClick={() => handleManageCourt(court)}
                                />
                            ))}
                            {(!topCourts || topCourts.length === 0) && (
                                <p className="text-muted-foreground text-center text-sm py-4">Chưa có dữ liệu sân hot</p>
                            )}
                        </div>
                    </div>
                </div>
            </div>

            {/* MODALS TÍCH HỢP */}
            {activeModal === 'chartDetail' && (
                <ChartDetailModal data={selectedData} onClose={closeModal} />
            )}
            {activeModal === 'marketing' && <MarketingCampaignModal data={selectedData} onClose={closeModal} />}
            {activeModal === 'allBookings' && <AllBookingsModal onClose={closeModal} />}
            {activeModal === 'bookingDetail' && <BookingDetailModal data={selectedData} onClose={closeModal} />}
            {activeModal === 'courtDetail' && <AdminCourtManageModal data={selectedData} onClose={closeModal} />}

        </div>
    )
}

// ===============================================
// CÁC COMPONENT HỖ TRỢ VẼ UI DASHBOARD 
// ===============================================

function StatCard({ title, value, trend, isPositive, icon, iconBg }: any) {
    return (
        <div className="rounded-3xl p-7 bg-white/50 dark:bg-black/40 backdrop-blur-3xl border border-black/5 dark:border-white/10 flex flex-col justify-between shadow-[0_8px_30px_rgb(0,0,0,0.05)] dark:shadow-[0_8px_30px_rgb(0,0,0,0.5)] hover:border-emerald-500/50 transition-all duration-300 group relative overflow-hidden hover:-translate-y-1">
            <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-emerald-500 via-teal-400 to-emerald-500 opacity-0 group-hover:opacity-100 transition-all duration-500" />
            <div className="absolute -bottom-10 -right-10 w-32 h-32 bg-emerald-500/10 rounded-full blur-3xl group-hover:bg-emerald-500/20 transition-colors" />
            
            <div className="flex items-center gap-4 mb-6 relative z-10">
                <div className={`w-14 h-14 rounded-2xl shadow-inner border border-black/5 dark:border-white/5 flex items-center justify-center ${iconBg}`}>
                    {icon}
                </div>
                <span className="text-[13px] font-black uppercase tracking-wider text-muted-foreground">{title}</span>
            </div>
            <div className="flex items-end justify-between relative z-10">
                <span className="text-[36px] font-black tracking-tight text-foreground leading-none">{value}</span>
                <span className={`text-[15px] font-black flex items-center gap-0.5 px-3 py-1.5 rounded-xl bg-surface border border-black/5 dark:border-white/5 shadow-inner ${isPositive ? 'text-emerald-500 dark:text-emerald-400' : 'text-red-500 dark:text-red-400'}`}>
                    {trend} {isPositive ? <ArrowUpRight className="w-4 h-4" /> : <ArrowDownRight className="w-4 h-4" />}
                </span>
            </div>
        </div>
    )
}

function TableRow({ id, amount, type, date, status, colorConfig, onView }: any) {
    return (
        <tr className="hover:bg-emerald-500/10 transition-colors group">
            <td className="px-4 py-4 text-muted-foreground font-medium group-hover:text-emerald-700 dark:group-hover:text-emerald-50 transition-colors">{id}</td>
            <td className="px-4 py-4 text-muted-foreground group-hover:text-emerald-700 dark:group-hover:text-emerald-50 transition-colors">
                <div className="flex items-center gap-2">
                    <div className="w-6 h-6 rounded-full bg-black/5 dark:bg-white/5 flex items-center justify-center text-emerald-500 dark:text-emerald-400 group-hover:bg-emerald-500/20 transition-colors shrink-0">
                        <UserIcon className="w-3 h-3" />
                    </div>
                    {type}
                </div>
            </td>
            <td className="px-4 py-4 text-emerald-600 dark:text-emerald-400 font-bold">{amount}</td>
            <td className="px-4 py-4 text-muted-foreground group-hover:text-emerald-700/70 dark:group-hover:text-emerald-50/70 transition-colors">{date}</td>
            <td className="px-4 py-4">
                <span className={`px-2.5 py-1 rounded text-[10px] font-bold tracking-wide uppercase ${colorConfig?.bg} ${colorConfig?.color}`}>
                    {status}
                </span>
            </td>
            <td className="px-4 py-4 text-right">
                <button onClick={onView} className="px-4 py-1.5 rounded-xl bg-black/5 dark:bg-white/5 text-muted-foreground dark:text-gray-300 text-xs font-bold hover:bg-emerald-500 hover:text-white dark:hover:text-black hover:shadow-[0_0_20px_-5px_rgba(16,185,129,0.5)] transition-all active:scale-95">
                    Xem chi tiết
                </button>
            </td>
        </tr>
    )
}

function TopCourt({ name, bookings, revenue, status, statusColor, onClick }: any) {
    return (
        <div className="flex items-center justify-between group p-2 -m-2 rounded-xl hover:bg-muted transition-colors cursor-pointer" onClick={onClick}>
            <div className="flex items-center gap-4">
                <div className="w-11 h-11 rounded-lg bg-surface flex items-center justify-center text-xl shadow-sm border border-border group-hover:border-emerald-500/30 transition-colors"><EmojiIcon name="badminton" className="w-6 h-6 text-emerald-400" /></div>
                <div>
                    <p className="text-sm font-bold text-foreground group-hover:text-emerald-400 transition-colors">{name}</p>
                    <p className="text-xs text-muted-foreground mt-0.5">{bookings} lượt đặt</p>
                </div>
            </div>
            <div className="text-right">
                <p className="text-sm font-bold text-foreground">{revenue}</p>
                <p className={`text-[11px] font-bold mt-0.5 uppercase tracking-wider ${statusColor}`}>{status}</p>
            </div>
        </div>
    )
}
function ModalWrapper({ title, onClose, children, maxWidth = "max-w-2xl" }: { title: string, onClose: () => void, children: React.ReactNode, maxWidth?: string }) {
    return createPortal(
        <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-[#0a0f16]/80 backdrop-blur-md animate-in fade-in duration-300">
            <div className={`w-full ${maxWidth} bg-white/95 dark:bg-[#0a0f16]/95 backdrop-blur-3xl border border-black/5 dark:border-emerald-500/20 rounded-3xl shadow-[0_20px_60px_rgba(0,0,0,0.6)] overflow-hidden flex flex-col max-h-[90vh]`}>
                <div className="flex items-center justify-between p-6 border-b border-black/5 dark:border-emerald-500/10 relative overflow-hidden">
                    <div className="absolute top-[-50%] right-[-10%] w-64 h-64 bg-emerald-500/10 rounded-full blur-[80px] pointer-events-none"></div>
                    <div className="absolute bottom-[-50%] left-[-10%] w-64 h-64 bg-indigo-500/10 rounded-full blur-[80px] pointer-events-none"></div>
                    <h2 className="text-xl font-black text-foreground relative z-10">{title}</h2>
                    <button onClick={onClose} className="w-10 h-10 flex items-center justify-center rounded-full bg-surface border border-black/5 dark:border-white/5 text-muted-foreground hover:text-foreground dark:hover:text-white hover:bg-black/5 dark:hover:bg-emerald-500/20 transition-colors relative z-10 shadow-inner">
                        <X className="w-5 h-5" />
                    </button>
                </div>
                <div className="p-6 md:p-8 overflow-y-auto custom-scrollbar relative z-10">
                    {children}
                </div>
            </div>
        </div>,
        document.body
    );
}

function MarketingCampaignModal({ data, onClose }: { data: any, onClose: () => void }) {
    return (
        <ModalWrapper title={data?.title || 'Chiến dịch Marketing'} onClose={onClose}>
            <div className="space-y-6">
                <div className="p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/20">
                    <p className="text-emerald-400 font-medium">Gợi ý từ hệ thống AI:</p>
                    <p className="text-emerald-50 text-sm mt-1 leading-relaxed">{data?.desc}</p>
                </div>
                
                <div className="space-y-4">
                    <div>
                        <label className="block text-sm font-semibold text-muted-foreground mb-2">Ngân sách ước tính (VND)</label>
                        <input type="number" defaultValue={5000000} className="w-full px-4 py-3 rounded-xl bg-background border border-border text-foreground focus:border-emerald-500 focus:outline-none transition-colors" />
                    </div>
                    <div>
                        <label className="block text-sm font-semibold text-muted-foreground mb-2">Nội dung Push Notification</label>
                        <textarea rows={3} defaultValue="Giảm 20% khung giờ sáng. Nhanh tay đặt sân ngay!" className="w-full px-4 py-3 rounded-xl bg-background border border-border text-foreground focus:border-emerald-500 focus:outline-none transition-colors"></textarea>
                    </div>
                </div>

                <div className="flex justify-end gap-3 pt-4 border-t border-border">
                    <button onClick={onClose} className="px-5 py-2.5 rounded-xl font-semibold text-emerald-100/70 hover:text-emerald-50 hover:bg-emerald-500/10 transition-colors">Hủy</button>
                    <button onClick={() => {
                        useAlertStore.getState().showAlert('Đã khởi tạo chiến dịch thành công!', 'Thành công', 'success');
                        onClose();
                    }} className="px-5 py-2.5 rounded-xl font-bold bg-emerald-500 text-emerald-950 hover:bg-emerald-400 transition-colors">Kích hoạt ngay</button>
                </div>
            </div>
        </ModalWrapper>
    );
}

function BookingDetailModal({ data, onClose }: { data: any, onClose: () => void }) {
    if (!data) return null;
    return (
        <ModalWrapper title={"Chi tiết đơn đặt sân #" + data.bookingCode} onClose={onClose}>
            <div className="space-y-6">
                <div className="grid grid-cols-2 gap-4">
                    <div className="p-4 rounded-xl bg-white/5">
                        <p className="text-xs font-semibold text-emerald-100/50 uppercase mb-1">Khách hàng</p>
                        <div className="flex items-center gap-2">
                            <UserIcon className="w-4 h-4 text-emerald-500" />
                            <p className="font-bold text-foreground">{data.userId?.displayName || 'Khách vãng lai'}</p>
                        </div>
                    </div>
                    <div className="p-4 rounded-xl bg-white/5">
                        <p className="text-xs font-semibold text-emerald-100/50 uppercase mb-1">Số tiền</p>
                        <div className="flex items-center gap-2">
                            <DollarSign className="w-4 h-4 text-emerald-500" />
                            <p className="font-bold text-emerald-400">{data.finalAmount?.toLocaleString()}đ</p>
                        </div>
                    </div>
                    <div className="p-4 rounded-xl bg-white/5">
                        <p className="text-xs font-semibold text-emerald-100/50 uppercase mb-1">Sân / Môn</p>
                        <div className="flex items-center gap-2">
                            <MapPin className="w-4 h-4 text-emerald-500" />
                            <p className="font-bold text-foreground">{data.courtId?.name} ({data.courtId?.sportType})</p>
                        </div>
                    </div>
                    <div className="p-4 rounded-xl bg-white/5">
                        <p className="text-xs font-semibold text-emerald-100/50 uppercase mb-1">Ngày chơi</p>
                        <div className="flex items-center gap-2">
                            <Calendar className="w-4 h-4 text-emerald-500" />
                            <p className="font-bold text-foreground">{dayjs(data.date).format('DD/MM/YYYY')}</p>
                        </div>
                    </div>
                </div>

                <div>
                    <h3 className="text-sm font-bold text-foreground mb-3">Các khung giờ</h3>
                    <div className="space-y-2">
                        <div className="flex justify-between items-center p-3 rounded-lg bg-surface/30 border border-border">
                            <span className="text-muted-foreground font-medium">{data.startTime} - {data.endTime}</span>
                            <span className="text-emerald-400 font-bold">{data.finalAmount?.toLocaleString()}đ</span>
                        </div>
                    </div>
                </div>
            </div>
        </ModalWrapper>
    );
}

function AdminCourtManageModal({ data, onClose }: { data: any, onClose: () => void }) {
    if (!data) return null;
    return (
        <ModalWrapper title={"Thống kê Sân: " + (data.name || 'Sân')} onClose={onClose}>
            <div className="space-y-6">
                <div className="flex justify-between items-center p-4 rounded-xl bg-background border border-border">
                    <div>
                        <p className="text-sm text-muted-foreground">Lượt đặt tổng cộng</p>
                        <p className="text-2xl font-bold text-foreground mt-1">{data.bookings}</p>
                    </div>
                    <div className="text-right">
                        <p className="text-sm text-muted-foreground">Doanh thu mang lại</p>
                        <p className="text-2xl font-bold text-emerald-400 mt-1">{(data.revenue)?.toLocaleString()}đ</p>
                    </div>
                </div>

                <div className="p-4 rounded-xl bg-orange-500/10 border border-orange-500/20">
                    <h4 className="text-orange-400 font-bold mb-2">Hành động kiểm duyệt</h4>
                    <p className="text-sm text-orange-200/70 mb-4">Nếu sân này vi phạm chính sách hoặc bị báo cáo nhiều lần, bạn có thể tạm ngưng hoạt động của sân.</p>
                    <div className="flex gap-3">
                        <button className="px-4 py-2 bg-background border border-orange-500/50 text-orange-400 font-semibold rounded-lg hover:bg-orange-500 hover:text-foreground transition-colors">Cảnh báo Chủ Sân</button>
                        <button className="px-4 py-2 bg-red-500/20 border border-red-500/50 text-red-400 font-semibold rounded-lg hover:bg-red-500 hover:text-foreground transition-colors">Khóa Sân</button>
                    </div>
                </div>
            </div>
        </ModalWrapper>
    );
}

function AllBookingsModal({ onClose }: { onClose: () => void }) {
    const [bookings, setBookings] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        adminApi.getAllBookings({ limit: 50 }).then(res => {
            setBookings(res.data?.data?.bookings || res.data?.data || []);
        }).finally(() => setLoading(false));
    }, []);

    return (
        <ModalWrapper title="Toàn bộ đơn đặt sân" onClose={onClose} maxWidth="max-w-4xl">
            {loading ? (
                <div className="flex justify-center py-10"><Loader2 className="w-8 h-8 text-emerald-500 animate-spin" /></div>
            ) : (
                <div className="overflow-x-auto bg-black/5 dark:bg-white/5 rounded-2xl border border-black/5 dark:border-white/5">
                    <table className="w-full text-left text-sm whitespace-nowrap">
                        <thead>
                            <tr className="text-[11px] font-black uppercase tracking-widest text-emerald-700/70 dark:text-emerald-100/40 border-b border-black/5 dark:border-white/5 bg-black/5 dark:bg-white/5">
                                <th className="px-4 py-4 rounded-tl-2xl">Mã đơn</th>
                                <th className="px-4 py-4">Khách</th>
                                <th className="px-4 py-4">Số tiền</th>
                                <th className="px-4 py-4">Ngày đặt</th>
                                <th className="px-4 py-4 rounded-tr-2xl">Trạng thái</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-black/5 dark:divide-white/5">
                            {bookings.map((booking: any) => (
                                <tr key={booking._id} className="hover:bg-emerald-500/10 transition-colors group">
                                    <td className="px-4 py-4 text-muted-foreground font-medium group-hover:text-emerald-700 dark:group-hover:text-emerald-50 transition-colors">#{booking.bookingCode}</td>
                                    <td className="px-4 py-4 text-muted-foreground group-hover:text-emerald-700 dark:group-hover:text-emerald-50 transition-colors">
                                        <div className="flex items-center gap-2">
                                            <div className="w-6 h-6 rounded-full bg-black/5 dark:bg-white/5 flex items-center justify-center text-emerald-500 dark:text-emerald-400 group-hover:bg-emerald-500/20 transition-colors shrink-0">
                                                <UserIcon className="w-3 h-3" />
                                            </div>
                                            {booking.userId?.displayName || 'N/A'}
                                        </div>
                                    </td>
                                    <td className="px-4 py-4 text-emerald-600 dark:text-emerald-400 font-bold">{booking.finalAmount?.toLocaleString()}đ</td>
                                    <td className="px-4 py-4 text-muted-foreground group-hover:text-emerald-700/70 dark:group-hover:text-emerald-50/70 transition-colors">{dayjs(booking.date).format('DD/MM/YYYY')}</td>
                                    <td className="px-4 py-4">
                                        <span className={`px-2.5 py-1 rounded text-[10px] font-bold tracking-wide uppercase ${getBookingStatusConfig(booking.status).bg} ${getBookingStatusConfig(booking.status).color}`}>
                                            {getBookingStatusConfig(booking.status).label}
                                        </span>
                                    </td>
                                </tr>
                            ))}
                            {bookings.length === 0 && (
                                <tr>
                                    <td colSpan={5} className="py-8 text-center text-muted-foreground">Không có dữ liệu</td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            )}
        </ModalWrapper>
    );
}

function ChartDetailModal({ data, onClose }: { data: any, onClose: () => void }) {
    const [bookings, setBookings] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (!data?.fullDate) return;
        setLoading(true);
        const dateStr = dayjs(data.fullDate).format('YYYY-MM-DD');
        adminApi.getAllBookings({ date: dateStr, limit: 100 }).then(res => {
            setBookings(res.data?.data?.bookings || res.data?.data || []);
        }).finally(() => setLoading(false));
    }, [data]);

    if (!data) return null;
    return (
        <ModalWrapper title={`Thống kê ngày ${data.name}`} onClose={onClose} maxWidth="max-w-4xl">
            <div className="space-y-6">
                <div className="grid grid-cols-2 gap-4">
                    <div className="p-4 rounded-xl bg-background border border-border">
                        <p className="text-sm text-muted-foreground">Số đơn đặt</p>
                        <p className="text-2xl font-bold text-foreground mt-1">{data.count || 0} đơn</p>
                    </div>
                    <div className="p-4 rounded-xl bg-background border border-border text-right">
                        <p className="text-sm text-muted-foreground">Doanh thu trong ngày</p>
                        <p className="text-2xl font-bold text-emerald-400 mt-1">{(data.income)?.toLocaleString() || 0}đ</p>
                    </div>
                </div>

                <div className="p-4 rounded-xl bg-blue-500/10 border border-blue-500/20">
                    <p className="text-blue-400 font-medium text-sm">Phân tích hệ thống AI:</p>
                    <p className="text-blue-50 text-sm mt-1 leading-relaxed">
                        Ngày {data.name} có tổng cộng {data.count || 0} lượt đặt mang về {(data.income)?.toLocaleString() || 0}đ. Bạn có thể xem xét gửi Email Marketing hoặc tạo chiến dịch Push Notification kèm mã ưu đãi cho các khách hàng cũ nhằm lấp đầy các khung giờ trống và tối đa hóa doanh thu nhé!
                    </p>
                    <button className="mt-4 px-4 py-2 bg-background border border-blue-500/50 text-blue-400 text-sm font-semibold rounded-lg hover:bg-blue-500 hover:text-foreground transition-colors">Tạo chiến dịch ngay</button>
                </div>

                <div>
                    <h3 className="text-lg font-black uppercase tracking-wider text-foreground mb-4">Chi tiết các đơn đặt sân</h3>
                    {loading ? (
                        <div className="flex justify-center py-6"><Loader2 className="w-8 h-8 text-emerald-500 animate-spin" /></div>
                    ) : (
                        <div className="overflow-x-auto bg-black/5 dark:bg-white/5 rounded-2xl border border-black/5 dark:border-white/5">
                            <table className="w-full text-left text-sm whitespace-nowrap">
                                <thead>
                                    <tr className="text-[11px] font-black uppercase tracking-widest text-emerald-700/70 dark:text-emerald-100/40 border-b border-black/5 dark:border-white/5 bg-black/5 dark:bg-white/5">
                                        <th className="px-4 py-4 rounded-tl-2xl">Mã đơn</th>
                                        <th className="px-4 py-4">Khách</th>
                                        <th className="px-4 py-4">Sân</th>
                                        <th className="px-4 py-4">Thời gian</th>
                                        <th className="px-4 py-4">Số tiền</th>
                                        <th className="px-4 py-4 rounded-tr-2xl">Trạng thái</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-black/5 dark:divide-white/5">
                                    {bookings.map((booking: any) => (
                                        <tr key={booking._id} className="hover:bg-emerald-500/10 transition-colors group">
                                            <td className="px-4 py-4 text-muted-foreground font-medium group-hover:text-emerald-700 dark:group-hover:text-emerald-50 transition-colors">#{booking.bookingCode}</td>
                                            <td className="px-4 py-4 text-muted-foreground group-hover:text-emerald-700 dark:group-hover:text-emerald-50 transition-colors">
                                                <div className="flex items-center gap-2">
                                                    <div className="w-6 h-6 rounded-full bg-black/5 dark:bg-white/5 flex items-center justify-center text-emerald-500 dark:text-emerald-400 group-hover:bg-emerald-500/20 transition-colors shrink-0">
                                                        <UserIcon className="w-3 h-3" />
                                                    </div>
                                                    {booking.userId?.displayName || 'N/A'}
                                                </div>
                                            </td>
                                            <td className="px-4 py-4 text-muted-foreground group-hover:text-emerald-700 dark:group-hover:text-emerald-50 transition-colors">{booking.courtId?.name || 'N/A'}</td>
                                            <td className="px-4 py-4 text-muted-foreground group-hover:text-emerald-700/70 dark:group-hover:text-emerald-50/70 transition-colors">{booking.startTime} - {booking.endTime}</td>
                                            <td className="px-4 py-4 text-emerald-600 dark:text-emerald-400 font-bold">{booking.finalAmount?.toLocaleString()}đ</td>
                                            <td className="px-4 py-4">
                                                <span className={`px-2.5 py-1 rounded text-[10px] font-bold tracking-wide uppercase ${getBookingStatusConfig(booking.status).bg} ${getBookingStatusConfig(booking.status).color}`}>
                                                    {getBookingStatusConfig(booking.status).label}
                                                </span>
                                            </td>
                                        </tr>
                                    ))}
                                    {bookings.length === 0 && (
                                        <tr>
                                            <td colSpan={6} className="p-8 text-center text-muted-foreground">Không có đơn đặt sân nào trong ngày này.</td>
                                        </tr>
                                    )}
                                </tbody>
                            </table>
                        </div>
                    )}
                </div>
            </div>
        </ModalWrapper>
    );
}
