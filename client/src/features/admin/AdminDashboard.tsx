import {
    ShoppingCart, DollarSign, Activity,
    ArrowUpRight, ArrowDownRight, ChevronLeft, ChevronRight
} from 'lucide-react';
import { useAppStore } from '../../store';

export default function AdminDashboard() {
    const { user } = useAppStore();

    return (
        <div className="w-full h-[calc(100vh-76px)] overflow-y-auto custom-scrollbar p-6 bg-[#0f141a] text-gray-300 font-sans">
            <div className="max-w-7xl mx-auto space-y-6 pb-12">

                {/* ================= HÀNG 1: WELCOME & IDEAS ================= */}
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    {/* Thẻ Welcome (Gradient Đỏ - Xanh lá y hệt ảnh) */}
                    <div className="lg:col-span-2 rounded-2xl p-8 bg-linear-to-r from-[#c0392b] via-[#d35400] to-[#27ae60] flex flex-col justify-center relative overflow-hidden shadow-lg">
                        <h2 className="text-3xl font-bold text-white mb-2">Xin chào {user?.displayName || 'Admin'},</h2>
                        <p className="text-white/85 max-w-lg text-sm leading-relaxed mb-6">
                            Chào mừng đến với Bảng điều khiển ShuttleSync! Theo dõi doanh thu, quản lý sân và nắm bắt mọi thông tin chi tiết về hệ thống.
                        </p>
                    </div>

                    {/* Thẻ Ideas for You */}
                    <div className="rounded-2xl p-6 bg-[#1a222c] border border-[#262f3d] flex flex-col justify-between shadow-sm">
                        <div className="flex justify-between items-center mb-4">
                            <h3 className="text-sm font-semibold text-gray-400">Gợi ý cho bạn</h3>
                            <div className="flex gap-2">
                                <button className="w-7 h-7 rounded bg-[#262f3d] text-gray-400 flex items-center justify-center hover:bg-[#323d4f] hover:text-white transition-colors">
                                    <ChevronLeft className="w-4 h-4" />
                                </button>
                                <button className="w-7 h-7 rounded bg-[#262f3d] text-gray-400 flex items-center justify-center hover:bg-[#323d4f] hover:text-white transition-colors">
                                    <ChevronRight className="w-4 h-4" />
                                </button>
                            </div>
                        </div>
                        <div>
                            <h2 className="text-lg font-bold text-white mb-2">Tạo chiến dịch Marketing cho sân</h2>
                            <p className="text-sm text-gray-400 mb-5 line-clamp-2 leading-relaxed">
                                Đăng bài viết hoặc chương trình khuyến mãi giờ vàng để tăng tỷ lệ lấp đầy sân vào buổi sáng.
                            </p>
                            <button className="px-5 py-2 bg-transparent border border-[#323d4f] rounded-lg text-sm font-medium text-gray-300 hover:bg-[#262f3d] hover:text-white transition-colors">
                                Xem ngay
                            </button>
                        </div>
                    </div>
                </div>

                {/* ================= HÀNG 2: THỐNG KÊ (STATS) ================= */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <StatCard
                        title="Lượt đặt sân"
                        value="5,312"
                        trend="+2.29%"
                        isPositive={true}
                        icon={<ShoppingCart className="w-5 h-5 text-orange-500" />}
                        iconBg="bg-orange-500/10"
                    />
                    <StatCard
                        title="Doanh thu"
                        value="120,000K"
                        trend="+2.19%"
                        isPositive={true}
                        icon={<DollarSign className="w-5 h-5 text-emerald-500" />}
                        iconBg="bg-emerald-500/10"
                    />
                    <StatCard
                        title="Tỉ lệ chuyển đổi"
                        value="3.5%"
                        trend="-3.18%"
                        isPositive={false}
                        icon={<Activity className="w-5 h-5 text-blue-500" />}
                        iconBg="bg-blue-500/10"
                    />
                </div>

                {/* ================= HÀNG 3: BIỂU ĐỒ (CHARTS) ================= */}
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

                    {/* Line Chart Area */}
                    <div className="lg:col-span-2 rounded-2xl p-6 bg-[#1a222c] border border-[#262f3d] shadow-sm">
                        <h3 className="text-base font-bold text-white mb-6">Doanh thu</h3>
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

                        {/* Mock SVG Chart (Vẽ nét thẳng uốn lượn y hệt Dasher) */}
                        <div className="w-full h-56 relative border-b border-l border-[#323d4f]">
                            {/* Grid lines */}
                            <div className="absolute inset-0 flex flex-col justify-between">
                                {[1, 2, 3, 4, 5, 6].map(i => <div key={i} className="w-full h-px bg-[#323d4f]/30"></div>)}
                            </div>
                            {/* SVG Line mượt */}
                            <svg className="absolute inset-0 w-full h-full" preserveAspectRatio="none" viewBox="0 0 100 100">
                                <path d="M0,80 Q20,60 40,70 T80,20 L100,30 L100,100 L0,100 Z" fill="rgba(16, 185, 129, 0.1)" />
                                <path d="M0,80 Q20,60 40,70 T80,20 L100,30" fill="none" stroke="#10b981" strokeWidth="2.5" />
                                <circle cx="0" cy="80" r="2.5" fill="#1a222c" stroke="#10b981" strokeWidth="2" />
                                <circle cx="40" cy="70" r="2.5" fill="#1a222c" stroke="#10b981" strokeWidth="2" />
                                <circle cx="80" cy="20" r="2.5" fill="#1a222c" stroke="#10b981" strokeWidth="2" />
                                <circle cx="100" cy="30" r="2.5" fill="#1a222c" stroke="#10b981" strokeWidth="2" />
                            </svg>
                        </div>
                    </div>

                    {/* Donut Chart Area (CSS Vòng cung) */}
                    <div className="rounded-2xl p-6 bg-[#1a222c] border border-[#262f3d] shadow-sm">
                        <h3 className="text-base font-bold text-white mb-6">Tỉ trọng đặt sân</h3>
                        <div className="relative w-52 h-52 mx-auto mb-10 flex items-center justify-center">
                            {/* Mock CSS Donut Chart */}
                            <div className="w-full h-full rounded-full border-20 border-[#262f3d] relative drop-shadow-md">
                                <div className="absolute inset-5 rounded-full border-20 border-emerald-500 border-r-transparent border-b-transparent transform rotate-45"></div>
                                <div className="absolute inset-5 rounded-full border-20 border-blue-500 border-l-transparent border-b-transparent transform rotate-12"></div>
                                <div className="absolute inset-5 rounded-full border-20 border-orange-500 border-t-transparent border-l-transparent transform -rotate-12"></div>
                            </div>
                        </div>
                        <div className="space-y-4">
                            <div className="flex justify-between items-center text-sm">
                                <div className="flex items-center gap-3"><div className="w-2.5 h-2.5 rounded-full bg-emerald-500"></div><span className="text-gray-400 font-medium">Cầu lông</span></div>
                                <span className="text-white font-bold">22,120K <span className="text-gray-500 text-xs font-normal ml-1">38.1%</span></span>
                            </div>
                            <div className="flex justify-between items-center text-sm">
                                <div className="flex items-center gap-3"><div className="w-2.5 h-2.5 rounded-full bg-orange-500"></div><span className="text-gray-400 font-medium">Pickleball</span></div>
                                <span className="text-white font-bold">4,510K <span className="text-gray-500 text-xs font-normal ml-1">28.6%</span></span>
                            </div>
                            <div className="flex justify-between items-center text-sm">
                                <div className="flex items-center gap-3"><div className="w-2.5 h-2.5 rounded-full bg-blue-500"></div><span className="text-gray-400 font-medium">Tennis</span></div>
                                <span className="text-white font-bold">800K <span className="text-gray-500 text-xs font-normal ml-1">23.8%</span></span>
                            </div>
                        </div>
                    </div>
                </div>

                {/* ================= HÀNG 4: BẢNG DỮ LIỆU (TABLE) ================= */}
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    {/* Bảng Đơn hàng */}
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
                                <TableRow id="#DU005" amount="$150" type="Tiêu chuẩn" date="20 Th01, 2026" status="Hoàn tất" color="blue" />
                                <TableRow id="#DU004" amount="$200" type="VIP" date="22 Th01, 2026" status="Chờ duyệt" color="orange" />
                                <TableRow id="#DU003" amount="$300" type="Khuyến mãi" date="18 Th01, 2026" status="Hủy" color="red" />
                                <TableRow id="#DU002" amount="$560" type="Giải đấu" date="13 Th01, 2026" status="Hoàn tất" color="emerald" />
                            </tbody>
                        </table>
                    </div>

                    {/* Danh sách Sân Hot (Tương tự Top Selling Products) */}
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