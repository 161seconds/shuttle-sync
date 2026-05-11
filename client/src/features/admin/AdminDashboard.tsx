import { useState } from 'react';
import {
    Users, MapPin, Calendar, TrendingUp, AlertTriangle, FileText,
    ShieldCheck, Activity, CheckCircle2, XCircle, Search, Filter,
    ChevronRight
} from 'lucide-react';
import { theme as DS } from '../../utils/theme';

const STATS = [
    { label: 'Tổng Người dùng', value: '1,234', icon: <Users className="w-5 h-5" />, color: 'text-emerald-400', bg: 'bg-emerald-500/10', border: 'border-emerald-500/20', trend: '+12%' },
    { label: 'Sân hoạt động', value: '48', icon: <MapPin className="w-5 h-5" />, color: 'text-blue-400', bg: 'bg-blue-500/10', border: 'border-blue-500/20', trend: '+3' },
    { label: 'Booking hôm nay', value: '156', icon: <Calendar className="w-5 h-5" />, color: 'text-amber-400', bg: 'bg-amber-500/10', border: 'border-amber-500/20', trend: '+24%' },
    { label: 'Doanh thu tháng', value: '45.2M', icon: <TrendingUp className="w-5 h-5" />, color: 'text-green-400', bg: 'bg-green-500/10', border: 'border-green-500/20', trend: '+8%' },
    { label: 'Đơn chờ duyệt', value: '5', icon: <FileText className="w-5 h-5" />, color: 'text-purple-400', bg: 'bg-purple-500/10', border: 'border-purple-500/20', trend: 'Cần xử lý' },
    { label: 'Báo cáo vi phạm', value: '3', icon: <AlertTriangle className="w-5 h-5" />, color: 'text-red-400', bg: 'bg-red-500/10', border: 'border-red-500/20', trend: 'Mức cao' },
];

const TABS = [
    { id: 'overview', label: 'Tổng quan', icon: <Activity className="w-4 h-4" /> },
    { id: 'courts', label: 'Duyệt Sân', icon: <ShieldCheck className="w-4 h-4" /> },
    { id: 'users', label: 'Người dùng', icon: <Users className="w-4 h-4" /> },
];

export default function AdminDashboard() {
    const [activeTab, setActiveTab] = useState('overview');

    return (
        <div className="w-full px-6 py-8 pb-24 h-full overflow-y-auto custom-scrollbar">
            {/* HEADER KHU VỰC ADMIN */}
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 mb-8">
                <div>
                    <div className="flex items-center gap-2 mb-2">
                        <div className="w-8 h-8 rounded-lg bg-red-500/10 border border-red-500/20 flex items-center justify-center">
                            <ShieldCheck className="w-5 h-5 text-red-500" />
                        </div>
                        <span className="text-xs font-bold text-red-500 uppercase tracking-widest">Khu vực quản trị</span>
                    </div>
                    <h1 className={`text-3xl font-black ${DS.text.primary}`}>Command Center</h1>
                    <p className={`text-sm ${DS.text.muted} mt-1`}>Chào mừng sếp trở lại! Dưới đây là tình hình hệ thống hôm nay.</p>
                </div>

                {/* TABS NAVIGATION */}
                <div className={`flex items-center p-1 bg-[#121316] border ${DS.border.subtle} rounded-xl`}>
                    {TABS.map(tab => (
                        <button
                            key={tab.id}
                            onClick={() => setActiveTab(tab.id)}
                            className={`flex items-center gap-2 px-5 py-2.5 rounded-lg text-sm font-bold transition-all ${activeTab === tab.id
                                ? 'bg-[#1a1b1f] text-emerald-400 shadow-md border border-[#2a2d35]'
                                : `text-gray-500 hover:text-gray-300 hover:bg-white/5 border border-transparent`
                                }`}
                        >
                            {tab.icon} {tab.label}
                        </button>
                    ))}
                </div>
            </div>

            {/* NỘI DUNG TỪNG TAB */}
            {activeTab === 'overview' && <OverviewTab />}
            {activeTab === 'courts' && <CourtsTab />}
            {activeTab === 'users' && <UsersTab />}

        </div>
    );
}

// ==========================================
// CÁC COMPONENT CON (CHỨA TRONG CÙNG FILE CHO GỌN)
// ==========================================

function OverviewTab() {
    return (
        <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
            {/* LƯỚI THỐNG KÊ */}
            <div className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
                {STATS.map(s => (
                    <div key={s.label} className={`${DS.bg.card} rounded-2xl border ${DS.border.subtle} p-5 hover:border-emerald-500/30 transition-colors group relative overflow-hidden`}>
                        <div className={`w-12 h-12 rounded-xl ${s.bg} border ${s.border} flex items-center justify-center mb-4 ${s.color}`}>
                            {s.icon}
                        </div>
                        <p className={`text-2xl font-black ${DS.text.primary}`}>{s.value}</p>
                        <p className={`text-xs ${DS.text.muted} mt-1 font-medium`}>{s.label}</p>

                        <div className="absolute top-5 right-5 text-[10px] font-bold text-gray-500">
                            {s.trend}
                        </div>
                    </div>
                ))}
            </div>

            <div className="grid grid-cols-1 xl:grid-cols-3 gap-4">
                {/* VIỆC CẦN LÀM KHẨN CẤP */}
                <div className={`xl:col-span-2 ${DS.bg.card} rounded-2xl border ${DS.border.subtle} p-6`}>
                    <div className="flex items-center justify-between mb-6">
                        <h3 className={`text-base font-bold ${DS.text.primary} flex items-center gap-2`}>
                            <AlertTriangle className="w-5 h-5 text-amber-500" /> Cần xử lý gấp
                        </h3>
                        <button className="text-xs text-emerald-400 font-bold hover:underline">Xem tất cả</button>
                    </div>

                    <div className="space-y-3">
                        {[
                            { title: 'Báo cáo: Sân Nhật Thiện sai giá', time: '10 phút trước', type: 'report' },
                            { title: 'Duyệt hồ sơ: Sân Pickleball Quận 9', time: '1 giờ trước', type: 'approval' },
                            { title: 'User @badboy spam booking', time: '2 giờ trước', type: 'report' },
                        ].map((item, i) => (
                            <div key={i} className={`flex items-center justify-between p-4 rounded-xl bg-[#121316] border border-transparent hover:border-[#2a2d35] transition-colors group`}>
                                <div className="flex items-center gap-4">
                                    <div className={`w-2 h-2 rounded-full ${item.type === 'report' ? 'bg-red-500 shadow-[0_0_8px_rgba(239,68,68,0.5)]' : 'bg-amber-500 shadow-[0_0_8px_rgba(245,158,11,0.5)]'}`} />
                                    <div>
                                        <p className={`text-sm font-bold ${DS.text.primary}`}>{item.title}</p>
                                        <p className={`text-xs ${DS.text.muted} mt-0.5`}>{item.time}</p>
                                    </div>
                                </div>
                                <button className="opacity-0 group-hover:opacity-100 p-2 rounded-lg bg-white/5 hover:bg-white/10 transition-all">
                                    <ChevronRight className="w-4 h-4 text-gray-400" />
                                </button>
                            </div>
                        ))}
                    </div>
                </div>

                {/* LOG HOẠT ĐỘNG */}
                <div className={`${DS.bg.card} rounded-2xl border ${DS.border.subtle} p-6`}>
                    <h3 className={`text-base font-bold ${DS.text.primary} mb-6`}>Hoạt động gần đây</h3>
                    <div className="space-y-6 relative before:absolute before:inset-0 before:ml-2 before:-translate-x-px md:before:mx-auto md:before:translate-x-0 before:h-full before:w-0.5 before:bg-linear-to-b before:from-transparent before:via-[#2a2d35] before:to-transparent">
                        {[
                            { msg: 'User Minh Hiếu vừa đặt sân.', time: 'Vừa xong' },
                            { msg: 'Admin đã duyệt sân Cầu lông Vịt.', time: '30p trước' },
                            { msg: 'Hoàn tiền 120K cho đơn #9982.', time: '1h trước' },
                        ].map((log, i) => (
                            <div key={i} className="relative flex items-center justify-between md:justify-normal md:odd:flex-row-reverse group is-active">
                                <div className="flex items-center justify-center w-4 h-4 rounded-full border-2 border-[#121316] bg-emerald-500 text-slate-500 shadow shrink-0 md:order-1 md:group-odd:-translate-x-1/2 md:group-even:translate-x-1/2" />
                                <div className="w-[calc(100%-2rem)] md:w-[calc(50%-1.5rem)] pl-4 md:pl-0 md:group-odd:text-right">
                                    <div className="flex flex-col">
                                        <span className={`text-sm font-semibold ${DS.text.primary}`}>{log.msg}</span>
                                        <span className={`text-[10px] ${DS.text.secondary}`}>{log.time}</span>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        </div>
    );
}

function CourtsTab() {
    return (
        <div className="space-y-4 animate-in fade-in slide-in-from-bottom-4 duration-500">
            <div className="flex items-center justify-between">
                <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
                    <input type="text" placeholder="Tìm kiếm sân..." className="pl-10 pr-4 py-2 bg-[#121316] border border-[#2a2d35] rounded-lg text-sm text-white focus:border-emerald-500 focus:outline-none w-64" />
                </div>
                <button className="flex items-center gap-2 px-4 py-2 rounded-lg bg-[#121316] border border-[#2a2d35] text-sm font-bold text-gray-400 hover:text-white">
                    <Filter className="w-4 h-4" /> Lọc trạng thái
                </button>
            </div>

            <div className={`${DS.bg.card} border ${DS.border.subtle} rounded-2xl overflow-hidden`}>
                <table className="w-full text-left text-sm">
                    <thead className="bg-[#121316] border-b border-[#2a2d35] text-gray-400">
                        <tr>
                            <th className="px-6 py-4 font-bold">Tên Sân / Chủ sân</th>
                            <th className="px-6 py-4 font-bold">Khu vực</th>
                            <th className="px-6 py-4 font-bold">Loại</th>
                            <th className="px-6 py-4 font-bold">Trạng thái</th>
                            <th className="px-6 py-4 font-bold text-right">Thao tác</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-[#2a2d35]">
                        {[
                            { name: 'Sân Cầu Lông ABC', owner: 'Nguyễn Văn A', loc: 'Quận 1', type: 'Cầu lông', status: 'pending' },
                            { name: 'Pickleball Gò Vấp', owner: 'Trần B', loc: 'Gò Vấp', type: 'Pickleball', status: 'active' },
                            { name: 'Sân Lê Quý Đôn', owner: 'Lê C', loc: 'Quận 3', type: 'Cầu lông', status: 'pending' },
                        ].map((c, i) => (
                            <tr key={i} className="hover:bg-white/2 transition-colors">
                                <td className="px-6 py-4">
                                    <p className="font-bold text-gray-200">{c.name}</p>
                                    <p className="text-xs text-gray-500">{c.owner}</p>
                                </td>
                                <td className="px-6 py-4 text-gray-400">{c.loc}</td>
                                <td className="px-6 py-4 text-gray-400">{c.type}</td>
                                <td className="px-6 py-4">
                                    {c.status === 'pending' ? (
                                        <span className="px-3 py-1 rounded-full bg-amber-500/10 text-amber-500 text-xs font-bold border border-amber-500/20">Chờ duyệt</span>
                                    ) : (
                                        <span className="px-3 py-1 rounded-full bg-emerald-500/10 text-emerald-500 text-xs font-bold border border-emerald-500/20">Hoạt động</span>
                                    )}
                                </td>
                                <td className="px-6 py-4 text-right">
                                    {c.status === 'pending' && (
                                        <div className="flex justify-end gap-2">
                                            <button className="w-8 h-8 rounded-lg bg-emerald-500/10 text-emerald-500 hover:bg-emerald-500 hover:text-black flex items-center justify-center transition-colors">
                                                <CheckCircle2 className="w-5 h-5" />
                                            </button>
                                            <button className="w-8 h-8 rounded-lg bg-red-500/10 text-red-500 hover:bg-red-500 hover:text-white flex items-center justify-center transition-colors">
                                                <XCircle className="w-5 h-5" />
                                            </button>
                                        </div>
                                    )}
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
}

function UsersTab() {
    return (
        <div className="flex items-center justify-center h-64 border-2 border-dashed border-[#2a2d35] rounded-2xl animate-in fade-in slide-in-from-bottom-4 duration-500">
            <div className="text-center">
                <Users className="w-10 h-10 text-gray-600 mx-auto mb-3" />
                <h3 className="text-lg font-bold text-gray-300">Quản lý Người dùng</h3>
                <p className="text-sm text-gray-500 mt-1">Tính năng đang được thiết kế. Sẽ cập nhật trong phiên bản tới.</p>
            </div>
        </div>
    );
}