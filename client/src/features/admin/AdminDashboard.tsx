import { useState, useEffect } from 'react';
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

    // Quản lý trạng thái Modal
    const [activeModal, setActiveModal] = useState<'none' | 'marketing' | 'allBookings' | 'bookingDetail' | 'courtDetail' | 'chartDetail'>('none');
    const [selectedData, setSelectedData] = useState<any>(null);

    const closeModal = () => {
        setActiveModal('none');
        setSelectedData(null);
    };

    useEffect(() => {
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

        // Polling mỗi 10 giây để dashboard luôn được cập nhật khi có dữ liệu mới
        const interval = setInterval(loadStats, 10000);
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
            <div className="w-full h-[calc(100vh-76px)] flex items-center justify-center bg-[#0f141a]">
                <Loader2 className="w-8 h-8 text-emerald-500 animate-spin" />
            </div>
        );
    }

    const {
        totalUsers, totalCourts, totalBookings, totalRevenue,
        bookingTrend, topCourts, recentBookings, bookingRatio, userGrowth
    } = stats || {};

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
        <div className="w-full h-[calc(100vh-64px)] overflow-y-auto custom-scrollbar p-6 bg-[#0f141a] text-gray-300 font-sans">
            <div className="max-w-400 mx-auto space-y-6 pb-12">

                {/* ================= HÀNG 1: WELCOME & IDEAS ================= */}
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

                    <div className="lg:col-span-2 rounded-2xl p-8 bg-linear-to-r from-[#064e3b] via-[#047857] to-[#10b981] flex flex-col justify-center relative overflow-hidden shadow-[0_4px_30px_rgba(16,185,129,0.15)]">
                        <div className="absolute -right-10 -top-20 w-64 h-64 bg-white opacity-5 rounded-full blur-3xl"></div>
                        <div className="absolute right-32 -bottom-20 w-48 h-48 bg-emerald-900 opacity-20 rounded-full blur-2xl"></div>

                        <h2 className="text-3xl font-bold text-white mb-2 relative z-10">Xin chào {user?.displayName || 'Admin'},</h2>
                        <p className="text-emerald-50 max-w-lg text-sm leading-relaxed mb-6 relative z-10">
                            Chào mừng đến với Bảng điều khiển ShuttleSync! Theo dõi doanh thu, quản lý sân và nắm bắt mọi thông tin chi tiết về hệ thống một cách trực quan.
                        </p>
                        <button
                            onClick={handleScrollToStats}
                            className="bg-[#0f141a] text-emerald-400 font-bold px-6 py-2.5 rounded-lg w-max hover:bg-black transition-colors shadow-sm relative z-10 border border-emerald-800 active:scale-95"
                        >
                            Khám phá ngay
                        </button>
                    </div>

                    {/* Thẻ Ideas for You */}
                    <div className="rounded-2xl p-6 bg-[#1a222c] border border-[#262f3d] flex flex-col justify-between shadow-sm">
                        <div className="flex justify-between items-center mb-4">
                            <h3 className="text-sm font-semibold text-gray-400">Gợi ý cho bạn ({currentIdea + 1}/{IDEAS.length})</h3>
                            <div className="flex gap-2">
                                <button onClick={prevIdea} className="w-7 h-7 rounded bg-[#262f3d] text-gray-400 flex items-center justify-center hover:bg-[#323d4f] hover:text-white transition-colors active:scale-90">
                                    <ChevronLeft className="w-4 h-4" />
                                </button>
                                <button onClick={nextIdea} className="w-7 h-7 rounded bg-[#262f3d] text-gray-400 flex items-center justify-center hover:bg-[#323d4f] hover:text-white transition-colors active:scale-90">
                                    <ChevronRight className="w-4 h-4" />
                                </button>
                            </div>
                        </div>
                        <div className="animate-in fade-in slide-in-from-right-4 duration-300" key={currentIdea}>
                            <h2 className="text-lg font-bold text-white mb-2">{IDEAS[currentIdea].title}</h2>
                            <p className="text-sm text-gray-400 mb-5 line-clamp-3 leading-relaxed min-h-15">
                                {IDEAS[currentIdea].desc}
                            </p>
                            <button
                                onClick={handleActionIdea}
                                className="px-5 py-2 bg-transparent border border-[#323d4f] rounded-lg text-sm font-medium text-emerald-400 hover:bg-[#262f3d] transition-colors active:scale-95"
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
                    <div className="lg:col-span-2 rounded-2xl p-6 bg-[#1a222c] border border-[#262f3d] shadow-sm flex flex-col">
                        <h3 className="text-base font-bold text-white mb-6">Biến động Doanh thu</h3>
                        <div className="flex gap-6 mb-8">
                            <div className="p-4 rounded-xl bg-[#141b22] border border-[#262f3d] flex-1">
                                <div className="flex items-center gap-2 mb-1">
                                    <div className="w-2 h-2 rounded-full bg-emerald-500"></div>
                                    <span className="text-xs font-semibold text-gray-400">Tổng doanh thu</span>
                                </div>
                                <p className="text-2xl font-bold text-white">{(totalRevenue / 1000)?.toLocaleString() || '0'}K</p>
                            </div>
                        </div>

                        {/* CHART HOẠT ĐỘNG THỰC SỰ */}
                        <div className="w-full flex-1 min-h-62.5">
                            <ResponsiveContainer width="100%" height="100%">
                                <ComposedChart 
                                    data={chartData} 
                                    margin={{ top: 10, right: 0, left: -20, bottom: 0 }}
                                    onClick={(e: any) => {
                                        if (e && e.activePayload && e.activePayload.length > 0) {
                                            setSelectedData(e.activePayload[0].payload);
                                            setActiveModal('chartDetail');
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
                                        contentStyle={{ backgroundColor: '#141b22', borderColor: '#262f3d', borderRadius: '8px', color: '#fff' }}
                                        itemStyle={{ color: '#fff' }}
                                        formatter={(value: any) => [`${value?.toLocaleString()} VND`, 'Số tiền']} />
                                    <Area type="monotone" dataKey="income" stroke="none" fillOpacity={1} fill="url(#colorIncome)" />
                                    <Line type="monotone" dataKey="income" stroke="#10b981" strokeWidth={3} dot={false} activeDot={{ r: 6, fill: '#1a222c', stroke: '#10b981', strokeWidth: 2 }} isAnimationActive={true} animationDuration={2000} animationEasing="ease-in-out" />
                                </ComposedChart>
                            </ResponsiveContainer>
                        </div>
                    </div>

                    {/* Biểu đồ Tròn (Recharts Donut Chart) - Chỉ Cầu lông và Pickleball */}
                    <div className="rounded-2xl p-6 bg-[#1a222c] border border-[#262f3d] shadow-sm flex flex-col">
                        <h3 className="text-base font-bold text-white mb-2">Tỉ trọng đặt sân</h3>

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
                                        contentStyle={{ backgroundColor: '#141b22', borderColor: '#262f3d', borderRadius: '8px', color: '#fff' }}
                                        itemStyle={{ color: '#fff' }}
                                        formatter={(value: any) => [value, 'Số lượng']} />
                                </PieChart>
                            </ResponsiveContainer>
                            {/* Chữ hiển thị ở giữa Donut */}
                            <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                                <span className="text-gray-400 text-xs">Tổng số</span>
                                <span className="text-2xl font-bold text-white">{totalPieValue}</span>
                            </div>
                        </div>

                        {/* Chú thích (Legend) */}
                        <div className="space-y-4 mt-4">
                            {pieData.map((item: any, index: number) => (
                                <div key={index} className="flex justify-between items-center text-sm">
                                    <div className="flex items-center gap-3">
                                        <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: item.color }}></div>
                                        <span className="text-gray-400 font-medium">{item.name}</span>
                                    </div>
                                    <span className="text-white font-bold">{item.value.toLocaleString()} <span className="text-gray-500 text-xs font-normal ml-1">{((item.value / (totalPieValue || 1)) * 100).toFixed(1)}%</span></span>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>

                {/* ================= HÀNG 4: BẢNG DỮ LIỆU VÀ SÂN HOT ================= */}
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    <div className="lg:col-span-2 rounded-2xl p-6 bg-[#1a222c] border border-[#262f3d] shadow-sm flex flex-col min-w-0">
                        <div className="flex items-center justify-between mb-6 shrink-0">
                            <h3 className="text-base font-bold text-white">Đơn đặt gần đây</h3>
                            <button 
                                onClick={() => setActiveModal('allBookings')}
                                className="text-sm font-semibold text-emerald-400 hover:text-emerald-300 transition-colors"
                            >
                                Xem toàn bộ
                            </button>
                        </div>
                        <div className="overflow-x-auto flex-1">
                            <table className="w-full text-left text-sm whitespace-nowrap">
                                <thead className="text-gray-400 border-b border-[#262f3d]">
                                <tr>
                                    <th className="pb-4 font-semibold">Mã đơn</th>
                                    <th className="pb-4 font-semibold">Khách</th>
                                    <th className="pb-4 font-semibold">Số tiền</th>
                                    <th className="pb-4 font-semibold">Ngày</th>
                                    <th className="pb-4 font-semibold">Trạng thái</th>
                                    <th className="pb-4 font-semibold text-right">Thao tác</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-[#262f3d]">
                                {recentBookings?.map((booking: any) => (
                                    <TableRow 
                                        key={booking._id}
                                        id={`#${booking.bookingCode}`}
                                        amount={`${booking.finalAmount?.toLocaleString()}đ`}
                                        type={booking.userId?.displayName || 'Khách vãng lai'}
                                        date={dayjs(booking.date).format('DD/MM')}
                                        status={booking.status === 'confirmed' ? 'Đã xác nhận' : booking.status === 'cancelled' ? 'Đã hủy' : 'Chờ xử lý'}
                                        color={booking.status === 'confirmed' ? 'emerald' : booking.status === 'cancelled' ? 'red' : 'orange'}
                                        onView={() => handleViewOrder(booking)}
                                    />
                                ))}
                                {(!recentBookings || recentBookings.length === 0) && (
                                    <tr>
                                        <td colSpan={6} className="py-8 text-center text-gray-500">Không có đơn đặt sân nào gần đây</td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                        </div>
                    </div>

                    <div className="rounded-2xl p-6 bg-[#1a222c] border border-[#262f3d] shadow-sm min-w-0">
                        <h3 className="text-base font-bold text-white mb-6">Sân Hot Nhất</h3>
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
                                <p className="text-gray-400 text-center text-sm py-4">Chưa có dữ liệu sân hot</p>
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
        <div className="rounded-2xl p-6 bg-[#1a222c] border border-[#262f3d] flex flex-col justify-between shadow-sm hover:border-[#323d4f] transition-colors">
            <div className="flex items-center gap-4 mb-5">
                <div className={`w-12 h-12 rounded-full flex items-center justify-center ${iconBg}`}>
                    {icon}
                </div>
                <span className="text-sm font-semibold text-gray-400">{title}</span>
            </div>
            <div className="flex items-end justify-between">
                <span className="text-[28px] font-bold text-white leading-none">{value}</span>
                <span className={`text-sm font-bold flex items-center gap-0.5 ${isPositive ? 'text-emerald-500' : 'text-red-500'}`}>
                    {trend} {isPositive ? <ArrowUpRight className="w-4 h-4" /> : <ArrowDownRight className="w-4 h-4" />}
                </span>
            </div>
        </div>
    )
}

function TableRow({ id, amount, type, date, status, color, onView }: any) {
    const bgMap: any = {
        blue: 'bg-blue-500/10 text-blue-400 border border-blue-500/20',
        orange: 'bg-orange-500/10 text-orange-400 border border-orange-500/20',
        red: 'bg-red-500/10 text-red-400 border border-red-500/20',
        emerald: 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20',
    };
    return (
        <tr className="hover:bg-white/5 transition-colors">
            <td className="py-4 text-gray-300 font-medium">{id}</td>
            <td className="py-4 text-gray-400">{type}</td>
            <td className="py-4 text-emerald-400 font-bold">{amount}</td>
            <td className="py-4 text-gray-400">{date}</td>
            <td className="py-4">
                <span className={`px-2.5 py-1 rounded text-[10px] font-bold tracking-wide uppercase ${bgMap[color]}`}>{status}</span>
            </td>
            <td className="py-4 text-right">
                <button onClick={onView} className="px-3.5 py-1.5 rounded-lg bg-[#262f3d] text-gray-300 text-xs font-bold hover:bg-emerald-500/20 hover:text-emerald-400 transition-colors active:scale-95">
                    Xem
                </button>
            </td>
        </tr>
    )
}

function TopCourt({ name, bookings, revenue, status, statusColor, onClick }: any) {
    return (
        <div className="flex items-center justify-between group p-2 -m-2 rounded-xl hover:bg-white/5 transition-colors cursor-pointer" onClick={onClick}>
            <div className="flex items-center gap-4">
                <div className="w-11 h-11 rounded-lg bg-[#262f3d] flex items-center justify-center text-xl shadow-sm border border-[#323d4f] group-hover:border-emerald-500/30 transition-colors"><EmojiIcon name="badminton" className="w-6 h-6 text-emerald-400" /></div>
                <div>
                    <p className="text-sm font-bold text-gray-200 group-hover:text-emerald-400 transition-colors">{name}</p>
                    <p className="text-xs text-gray-500 mt-0.5">{bookings} lượt đặt</p>
                </div>
            </div>
            <div className="text-right">
                <p className="text-sm font-bold text-white">{revenue}</p>
                <p className={`text-[11px] font-bold mt-0.5 uppercase tracking-wider ${statusColor}`}>{status}</p>
            </div>
        </div>
    )
}
function ModalWrapper({ title, onClose, children, maxWidth = "max-w-2xl" }: { title: string, onClose: () => void, children: React.ReactNode, maxWidth?: string }) {
    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
            <div className={`w-full ${maxWidth} bg-[#141b22] border border-[#262f3d] rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]`}>
                <div className="flex items-center justify-between p-5 border-b border-[#262f3d]">
                    <h2 className="text-lg font-bold text-white">{title}</h2>
                    <button onClick={onClose} className="p-2 rounded-lg hover:bg-[#262f3d] text-gray-400 hover:text-white transition-colors">
                        <X className="w-5 h-5" />
                    </button>
                </div>
                <div className="p-6 overflow-y-auto custom-scrollbar">
                    {children}
                </div>
            </div>
        </div>
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
                        <label className="block text-sm font-semibold text-gray-400 mb-2">Ngân sách ước tính (VND)</label>
                        <input type="number" defaultValue={5000000} className="w-full px-4 py-3 rounded-xl bg-[#0f141a] border border-[#262f3d] text-white focus:border-emerald-500 focus:outline-none transition-colors" />
                    </div>
                    <div>
                        <label className="block text-sm font-semibold text-gray-400 mb-2">Nội dung Push Notification</label>
                        <textarea rows={3} defaultValue="Giảm 20% khung giờ sáng. Nhanh tay đặt sân ngay!" className="w-full px-4 py-3 rounded-xl bg-[#0f141a] border border-[#262f3d] text-white focus:border-emerald-500 focus:outline-none transition-colors"></textarea>
                    </div>
                </div>

                <div className="flex justify-end gap-3 pt-4 border-t border-[#262f3d]">
                    <button onClick={onClose} className="px-5 py-2.5 rounded-xl font-semibold text-gray-400 hover:text-white hover:bg-[#262f3d] transition-colors">Hủy</button>
                    <button onClick={() => {
                        useAlertStore.getState().showAlert('Đã khởi tạo chiến dịch thành công!', 'Thành công', 'success');
                        onClose();
                    }} className="px-5 py-2.5 rounded-xl font-bold bg-emerald-500 text-white hover:bg-emerald-600 transition-colors">Kích hoạt ngay</button>
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
                    <div className="p-4 rounded-xl bg-[#0f141a] border border-[#262f3d]">
                        <p className="text-xs font-semibold text-gray-500 uppercase mb-1">Khách hàng</p>
                        <div className="flex items-center gap-2">
                            <UserIcon className="w-4 h-4 text-emerald-500" />
                            <p className="font-bold text-white">{data.userId?.displayName || 'Khách vãng lai'}</p>
                        </div>
                    </div>
                    <div className="p-4 rounded-xl bg-[#0f141a] border border-[#262f3d]">
                        <p className="text-xs font-semibold text-gray-500 uppercase mb-1">Số tiền</p>
                        <div className="flex items-center gap-2">
                            <DollarSign className="w-4 h-4 text-emerald-500" />
                            <p className="font-bold text-emerald-400">{data.finalAmount?.toLocaleString()}đ</p>
                        </div>
                    </div>
                    <div className="p-4 rounded-xl bg-[#0f141a] border border-[#262f3d]">
                        <p className="text-xs font-semibold text-gray-500 uppercase mb-1">Sân / Môn</p>
                        <div className="flex items-center gap-2">
                            <MapPin className="w-4 h-4 text-emerald-500" />
                            <p className="font-bold text-white">{data.courtId?.name} ({data.courtId?.sportType})</p>
                        </div>
                    </div>
                    <div className="p-4 rounded-xl bg-[#0f141a] border border-[#262f3d]">
                        <p className="text-xs font-semibold text-gray-500 uppercase mb-1">Ngày chơi</p>
                        <div className="flex items-center gap-2">
                            <Calendar className="w-4 h-4 text-emerald-500" />
                            <p className="font-bold text-white">{dayjs(data.date).format('DD/MM/YYYY')}</p>
                        </div>
                    </div>
                </div>

                <div>
                    <h3 className="text-sm font-bold text-white mb-3">Các khung giờ</h3>
                    <div className="space-y-2">
                        <div className="flex justify-between items-center p-3 rounded-lg bg-[#262f3d]/30 border border-[#262f3d]">
                            <span className="text-gray-300 font-medium">{data.startTime} - {data.endTime}</span>
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
                <div className="flex justify-between items-center p-4 rounded-xl bg-[#0f141a] border border-[#262f3d]">
                    <div>
                        <p className="text-sm text-gray-400">Lượt đặt tổng cộng</p>
                        <p className="text-2xl font-bold text-white mt-1">{data.bookings}</p>
                    </div>
                    <div className="text-right">
                        <p className="text-sm text-gray-400">Doanh thu mang lại</p>
                        <p className="text-2xl font-bold text-emerald-400 mt-1">{(data.revenue)?.toLocaleString()}đ</p>
                    </div>
                </div>

                <div className="p-4 rounded-xl bg-orange-500/10 border border-orange-500/20">
                    <h4 className="text-orange-400 font-bold mb-2">Hành động kiểm duyệt</h4>
                    <p className="text-sm text-orange-200/70 mb-4">Nếu sân này vi phạm chính sách hoặc bị báo cáo nhiều lần, bạn có thể tạm ngưng hoạt động của sân.</p>
                    <div className="flex gap-3">
                        <button className="px-4 py-2 bg-[#0f141a] border border-orange-500/50 text-orange-400 font-semibold rounded-lg hover:bg-orange-500 hover:text-white transition-colors">Cảnh báo Chủ Sân</button>
                        <button className="px-4 py-2 bg-red-500/20 border border-red-500/50 text-red-400 font-semibold rounded-lg hover:bg-red-500 hover:text-white transition-colors">Khóa Sân</button>
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
                <div className="overflow-x-auto">
                    <table className="w-full text-left text-sm whitespace-nowrap">
                        <thead className="text-gray-400 border-b border-[#262f3d]">
                            <tr>
                                <th className="pb-4 font-semibold">Mã đơn</th>
                                <th className="pb-4 font-semibold">Khách</th>
                                <th className="pb-4 font-semibold">Số tiền</th>
                                <th className="pb-4 font-semibold">Ngày đặt</th>
                                <th className="pb-4 font-semibold">Trạng thái</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-[#262f3d]">
                            {bookings.map((booking: any) => (
                                <tr key={booking._id} className="hover:bg-white/5 transition-colors">
                                    <td className="py-4 text-gray-300 font-medium">#{booking.bookingCode}</td>
                                    <td className="py-4 text-gray-400">{booking.userId?.displayName || 'N/A'}</td>
                                    <td className="py-4 text-emerald-400 font-bold">{booking.finalAmount?.toLocaleString()}đ</td>
                                    <td className="py-4 text-gray-400">{dayjs(booking.date).format('DD/MM/YYYY')}</td>
                                    <td className="py-4">
                                        <span className={`px-2.5 py-1 rounded text-[10px] font-bold tracking-wide uppercase ${booking.status === 'confirmed' ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' : booking.status === 'cancelled' ? 'bg-red-500/10 text-red-400 border border-red-500/20' : 'bg-orange-500/10 text-orange-400 border border-orange-500/20'}`}>
                                            {booking.status}
                                        </span>
                                    </td>
                                </tr>
                            ))}
                            {bookings.length === 0 && (
                                <tr>
                                    <td colSpan={5} className="py-8 text-center text-gray-500">Không có dữ liệu</td>
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
    if (!data) return null;
    return (
        <ModalWrapper title={`Thống kê ngày ${data.name}`} onClose={onClose}>
            <div className="space-y-6">
                <div className="flex justify-between items-center p-4 rounded-xl bg-[#0f141a] border border-[#262f3d]">
                    <div>
                        <p className="text-sm text-gray-400">Số đơn đặt</p>
                        <p className="text-2xl font-bold text-white mt-1">{data.count || 0} đơn</p>
                    </div>
                    <div className="text-right">
                        <p className="text-sm text-gray-400">Doanh thu trong ngày</p>
                        <p className="text-2xl font-bold text-emerald-400 mt-1">{(data.income)?.toLocaleString() || 0}đ</p>
                    </div>
                </div>

                <div className="p-4 rounded-xl bg-blue-500/10 border border-blue-500/20">
                    <p className="text-blue-400 font-medium text-sm">Phân tích hệ thống AI:</p>
                    <p className="text-blue-50 text-sm mt-1 leading-relaxed">
                        Ngày {data.name} có tổng cộng {data.count || 0} lượt đặt mang về {(data.income)?.toLocaleString() || 0}đ. Bạn có thể xem xét gửi Email Marketing hoặc tạo chiến dịch Push Notification kèm mã ưu đãi cho các khách hàng cũ nhằm lấp đầy các khung giờ trống và tối đa hóa doanh thu nhé!
                    </p>
                    <button className="mt-4 px-4 py-2 bg-[#0f141a] border border-blue-500/50 text-blue-400 text-sm font-semibold rounded-lg hover:bg-blue-500 hover:text-white transition-colors">Tạo chiến dịch ngay</button>
                </div>
            </div>
        </ModalWrapper>
    );
}
