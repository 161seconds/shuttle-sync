import { useState } from 'react';
import {
    ShoppingCart, DollarSign, Activity,
    ArrowUpRight, ArrowDownRight, ChevronLeft, ChevronRight
} from 'lucide-react';
import { useAppStore } from '../../store';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';

const REVENUE_DATA = [
    { name: 'T1', income: 30000, expense: 20000 },
    { name: 'T2', income: 40000, expense: 25000 },
    { name: 'T3', income: 28000, expense: 22000 },
    { name: 'T4', income: 50000, expense: 30000 },
    { name: 'T5', income: 42000, expense: 28000 },
    { name: 'T6', income: 100000, expense: 40000 },
    { name: 'T7', income: 120000, expense: 19821 },
];

const BOOKING_RATIO = [
    { name: 'Cầu lông', value: 22120, color: '#10b981' },
    { name: 'Pickleball', value: 4510, color: '#f97316' },
];

const IDEAS = [
    {
        title: "Tạo chiến dịch Marketing cho sân",
        desc: "Đăng bài viết hoặc chương trình khuyến mãi giờ vàng để tăng tỷ lệ lấp đầy sân vào buổi sáng sớm.",
        btn: "Xem chi tiết"
    },
    {
        title: "Tối ưu hóa doanh thu Pickleball",
        desc: "Nhu cầu Pickleball đang tăng đột biến (+30%). Cân nhắc gửi đề xuất chuyển đổi sân cầu lông vắng khách sang Pickleball cho các chủ sân.",
        btn: "Lên chiến dịch"
    }
];

export default function AdminDashboard() {
    const { user } = useAppStore();
    const [currentIdea, setCurrentIdea] = useState(0);

    const nextIdea = () => setCurrentIdea((prev) => (prev + 1) % IDEAS.length);
    const prevIdea = () => setCurrentIdea((prev) => (prev - 1 + IDEAS.length) % IDEAS.length);

    return (
        <div className="w-full h-[calc(100vh-76px)] overflow-y-auto custom-scrollbar p-6 bg-[#0f141a] text-gray-300 font-sans">
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
                        <button className="bg-[#0f141a] text-emerald-400 font-bold px-6 py-2.5 rounded-lg w-max hover:bg-black transition-colors shadow-sm relative z-10 border border-emerald-800">
                            Khám phá ngay
                        </button>
                    </div>

                    {/* Thẻ Ideas for You (Đã làm hoạt động nút bấm) */}
                    <div className="rounded-2xl p-6 bg-[#1a222c] border border-[#262f3d] flex flex-col justify-between shadow-sm">
                        <div className="flex justify-between items-center mb-4">
                            <h3 className="text-sm font-semibold text-gray-400">Gợi ý cho bạn ({currentIdea + 1}/{IDEAS.length})</h3>
                            <div className="flex gap-2">
                                <button onClick={prevIdea} className="w-7 h-7 rounded bg-[#262f3d] text-gray-400 flex items-center justify-center hover:bg-[#323d4f] hover:text-white transition-colors">
                                    <ChevronLeft className="w-4 h-4" />
                                </button>
                                <button onClick={nextIdea} className="w-7 h-7 rounded bg-[#262f3d] text-gray-400 flex items-center justify-center hover:bg-[#323d4f] hover:text-white transition-colors">
                                    <ChevronRight className="w-4 h-4" />
                                </button>
                            </div>
                        </div>
                        <div className="animate-in fade-in slide-in-from-right-4 duration-300" key={currentIdea}>
                            <h2 className="text-lg font-bold text-white mb-2">{IDEAS[currentIdea].title}</h2>
                            <p className="text-sm text-gray-400 mb-5 line-clamp-3 leading-relaxed min-h-15">
                                {IDEAS[currentIdea].desc}
                            </p>
                            <button className="px-5 py-2 bg-transparent border border-[#323d4f] rounded-lg text-sm font-medium text-emerald-400 hover:bg-[#262f3d] transition-colors">
                                {IDEAS[currentIdea].btn}
                            </button>
                        </div>
                    </div>
                </div>

                {/* ================= HÀNG 2: THỐNG KÊ (STATS) ================= */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <StatCard title="Lượt đặt sân" value="5,312" trend="+2.29%" isPositive={true} icon={<ShoppingCart className="w-5 h-5 text-orange-500" />} iconBg="bg-orange-500/10" />
                    <StatCard title="Doanh thu" value="120,000K" trend="+2.19%" isPositive={true} icon={<DollarSign className="w-5 h-5 text-emerald-500" />} iconBg="bg-emerald-500/10" />
                    <StatCard title="Tỉ lệ chuyển đổi" value="3.5%" trend="-3.18%" isPositive={false} icon={<Activity className="w-5 h-5 text-blue-500" />} iconBg="bg-blue-500/10" />
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
                                    <span className="text-xs font-semibold text-gray-400">Tổng thu nhập</span>
                                </div>
                                <p className="text-2xl font-bold text-white">120,000K</p>
                            </div>
                            <div className="p-4 rounded-xl bg-[#141b22] border border-[#262f3d] flex-1">
                                <div className="flex items-center gap-2 mb-1">
                                    <div className="w-2 h-2 rounded-full bg-orange-500"></div>
                                    <span className="text-xs font-semibold text-gray-400">Tổng chi phí</span>
                                </div>
                                <p className="text-2xl font-bold text-white">19,821K</p>
                            </div>
                        </div>

                        {/* CHART HOẠT ĐỘNG THỰC SỰ */}
                        <div className="w-full flex-1 min-h-62.5">
                            <ResponsiveContainer width="100%" height="100%">
                                <AreaChart data={REVENUE_DATA} margin={{ top: 10, right: 0, left: -20, bottom: 0 }}>
                                    <defs>
                                        <linearGradient id="colorIncome" x1="0" y1="0" x2="0" y2="1">
                                            <stop offset="5%" stopColor="#10b981" stopOpacity={0.3} />
                                            <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
                                        </linearGradient>
                                    </defs>
                                    <CartesianGrid strokeDasharray="3 3" stroke="#262f3d" vertical={false} />
                                    <XAxis dataKey="name" stroke="#6b7280" fontSize={12} tickLine={false} axisLine={false} />
                                    <YAxis stroke="#6b7280" fontSize={12} tickLine={false} axisLine={false} tickFormatter={(val) => `${val / 1000}M`} />
                                    <RechartsTooltip
                                        contentStyle={{ backgroundColor: '#141b22', borderColor: '#262f3d', borderRadius: '8px', color: '#fff' }}
                                        itemStyle={{ color: '#fff' }}
                                        formatter={(value: any) => [`${value?.toLocaleString()} VND`, 'Số tiền']} />
                                    <Area type="monotone" dataKey="income" stroke="#10b981" strokeWidth={3} fillOpacity={1} fill="url(#colorIncome)" activeDot={{ r: 6, fill: '#1a222c', stroke: '#10b981', strokeWidth: 2 }} />
                                </AreaChart>
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
                                        data={BOOKING_RATIO}
                                        cx="50%"
                                        cy="50%"
                                        innerRadius={70}
                                        outerRadius={90}
                                        paddingAngle={5}
                                        dataKey="value"
                                        stroke="none"
                                    >
                                        {BOOKING_RATIO.map((entry, index) => (
                                            <Cell key={`cell-${index}`} fill={entry.color} />
                                        ))}
                                    </Pie>
                                    <RechartsTooltip
                                        contentStyle={{ backgroundColor: '#141b22', borderColor: '#262f3d', borderRadius: '8px', color: '#fff' }}
                                        itemStyle={{ color: '#fff' }}
                                        formatter={(value: any) => [`${value?.toLocaleString()} VND`, 'Số tiền']} />
                                </PieChart>
                            </ResponsiveContainer>
                            {/* Chữ hiển thị ở giữa Donut */}
                            <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                                <span className="text-gray-400 text-xs">Tổng số</span>
                                <span className="text-2xl font-bold text-white">26,630</span>
                            </div>
                        </div>

                        {/* Chú thích (Legend) */}
                        <div className="space-y-4 mt-4">
                            {BOOKING_RATIO.map((item, index) => (
                                <div key={index} className="flex justify-between items-center text-sm">
                                    <div className="flex items-center gap-3">
                                        <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: item.color }}></div>
                                        <span className="text-gray-400 font-medium">{item.name}</span>
                                    </div>
                                    <span className="text-white font-bold">{item.value.toLocaleString()} <span className="text-gray-500 text-xs font-normal ml-1">{((item.value / 26630) * 100).toFixed(1)}%</span></span>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>

                {/* ================= HÀNG 4: BẢNG DỮ LIỆU VÀ SÂN HOT (GIỮ NGUYÊN) ================= */}
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    <div className="lg:col-span-2 rounded-2xl p-6 bg-[#1a222c] border border-[#262f3d] overflow-x-auto shadow-sm">
                        <h3 className="text-base font-bold text-white mb-6">Đơn đặt gần đây</h3>
                        <table className="w-full text-left text-sm whitespace-nowrap">
                            <thead className="text-gray-400 border-b border-[#262f3d]">
                                <tr>
                                    <th className="pb-4 font-semibold">Mã đơn</th>
                                    <th className="pb-4 font-semibold">Số tiền</th>
                                    <th className="pb-4 font-semibold">Loại sân</th>
                                    <th className="pb-4 font-semibold">Ngày đặt</th>
                                    <th className="pb-4 font-semibold">Trạng thái</th>
                                    <th className="pb-4 font-semibold text-right">Thao tác</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-[#262f3d]">
                                <TableRow id="#DU005" amount="150,000đ" type="Cầu lông" date="20 Th01, 2026" status="Hoàn tất" color="blue" />
                                <TableRow id="#DU004" amount="200,000đ" type="Pickleball" date="22 Th01, 2026" status="Chờ duyệt" color="orange" />
                                <TableRow id="#DU003" amount="300,000đ" type="Cầu lông VIP" date="18 Th01, 2026" status="Hủy" color="red" />
                                <TableRow id="#DU002" amount="560,000đ" type="Giải đấu Pickleball" date="13 Th01, 2026" status="Hoàn tất" color="emerald" />
                            </tbody>
                        </table>
                    </div>

                    <div className="rounded-2xl p-6 bg-[#1a222c] border border-[#262f3d] shadow-sm">
                        <h3 className="text-base font-bold text-white mb-6">Sân Hot Nhất</h3>
                        <div className="space-y-5">
                            <TopCourt name="Sân Nhật Thiện" bookings="454" revenue="50,000K" rating="5/5" status="Đang trống" statusColor="text-blue-400" />
                            <TopCourt name="Pickleball Gò Vấp" bookings="320" revenue="42,000K" rating="4.8/5" status="Đang trống" statusColor="text-emerald-400" />
                            <TopCourt name="Cầu lông VNU" bookings="124" revenue="30,000K" rating="4.5/5" status="Kín lịch" statusColor="text-orange-400" />
                        </div>
                    </div>
                </div>
            </div>
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

function TableRow({ id, amount, type, date, status, color }: any) {
    const bgMap: any = {
        blue: 'bg-blue-500/10 text-blue-400',
        orange: 'bg-orange-500/10 text-orange-400',
        red: 'bg-red-500/10 text-red-400',
        emerald: 'bg-emerald-500/10 text-emerald-400',
    };
    return (
        <tr className="hover:bg-white/2 transition-colors">
            <td className="py-4 text-gray-300 font-medium">{id}</td>
            <td className="py-4 text-gray-300">{amount}</td>
            <td className="py-4 text-gray-400">{type}</td>
            <td className="py-4 text-gray-400">{date}</td>
            <td className="py-4">
                <span className={`px-2.5 py-1 rounded text-[11px] font-bold tracking-wide uppercase ${bgMap[color]}`}>{status}</span>
            </td>
            <td className="py-4 text-right">
                <button className="px-3.5 py-1.5 rounded-lg bg-[#262f3d] text-gray-300 text-xs font-bold hover:bg-[#323d4f] hover:text-white transition-colors">
                    Xem
                </button>
            </td>
        </tr>
    )
}

function TopCourt({ name, bookings, revenue, status, statusColor }: any) {
    return (
        <div className="flex items-center justify-between group">
            <div className="flex items-center gap-4">
                <div className="w-11 h-11 rounded-lg bg-[#262f3d] flex items-center justify-center text-xl shadow-sm border border-[#323d4f]">🏸</div>
                <div>
                    <p className="text-sm font-bold text-gray-200 group-hover:text-emerald-400 transition-colors cursor-pointer">{name}</p>
                    <p className="text-xs text-gray-500 mt-0.5">{bookings} lượt đặt</p>
                </div>
            </div>
            <div className="text-right">
                <p className="text-sm font-bold text-gray-200">{revenue}</p>
                <p className={`text-xs font-bold mt-0.5 ${statusColor}`}>{status}</p>
            </div>
        </div>
    )
}