import { Users, MapPin, Calendar, TrendingUp, AlertTriangle, FileText } from 'lucide-react';
import { theme as DS } from '../../utils/theme';

const STATS = [
    { label: 'Người dùng', value: '1,234', icon: <Users className="w-5 h-5" />, color: 'text-emerald-400' },
    { label: 'Sân hoạt động', value: '48', icon: <MapPin className="w-5 h-5" />, color: 'text-blue-400' },
    { label: 'Booking hôm nay', value: '89', icon: <Calendar className="w-5 h-5" />, color: 'text-amber-400' },
    { label: 'Doanh thu tháng', value: '45.2M', icon: <TrendingUp className="w-5 h-5" />, color: 'text-green-400' },
    { label: 'Đơn chờ duyệt', value: '5', icon: <FileText className="w-5 h-5" />, color: 'text-purple-400' },
    { label: 'Báo cáo mới', value: '3', icon: <AlertTriangle className="w-5 h-5" />, color: 'text-red-400' },
];

export default function AdminDashboard() {
    return (
        <div className="max-w-6xl mx-auto px-4 py-6 pb-24 md:pb-8">
            <h1 className={`text-2xl font-black ${DS.text.primary} mb-1`}>Admin Dashboard</h1>
            <p className={`text-sm ${DS.text.muted} mb-6`}>Tổng quan hệ thống ShuttleSync</p>

            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 mb-8">
                {STATS.map(s => (
                    <div key={s.label} className={`${DS.bg.card} rounded-2xl border ${DS.border.subtle} p-5`}>
                        <div className={`w-10 h-10 rounded-xl ${DS.bg.elevated} flex items-center justify-center mb-3 ${s.color}`}>{s.icon}</div>
                        <p className={`text-2xl font-black ${DS.text.primary}`}>{s.value}</p>
                        <p className={`text-xs ${DS.text.muted} mt-0.5`}>{s.label}</p>
                    </div>
                ))}
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                {/* Applications */}
                <div className={`${DS.bg.card} rounded-2xl border ${DS.border.subtle} p-6`}>
                    <h3 className={`text-sm font-bold ${DS.text.primary} mb-4`}>Đơn đăng ký chủ sân</h3>
                    <div className="space-y-3">
                        {['Nguyễn Văn A — Sân ABC Q.1', 'Trần B — PB Center Thủ Đức', 'Lê C — CLB CL Gò Vấp'].map((a, i) => (
                            <div key={i} className={`flex items-center justify-between px-4 py-3 rounded-xl ${DS.bg.elevated}`}>
                                <span className={`text-xs ${DS.text.secondary}`}>{a}</span>
                                <div className="flex gap-2">
                                    <button className="px-3 py-1 rounded-lg bg-emerald-500/15 text-emerald-400 text-[10px] font-bold">Duyệt</button>
                                    <button className="px-3 py-1 rounded-lg bg-red-500/10 text-red-400 text-[10px] font-bold">Từ chối</button>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Reports */}
                <div className={`${DS.bg.card} rounded-2xl border ${DS.border.subtle} p-6`}>
                    <h3 className={`text-sm font-bold ${DS.text.primary} mb-4`}>Báo cáo vi phạm</h3>
                    <div className="space-y-3">
                        {[
                            { user: 'User X', reason: 'No-show 3 lần', s: 'high' },
                            { user: 'User Y', reason: 'Spam booking', s: 'medium' },
                            { user: 'Court Z', reason: 'Thông tin sai', s: 'low' },
                        ].map((r, i) => (
                            <div key={i} className={`flex items-center justify-between px-4 py-3 rounded-xl ${DS.bg.elevated}`}>
                                <div>
                                    <span className={`text-xs font-semibold ${DS.text.primary}`}>{r.user}</span>
                                    <span className={`text-[10px] ${DS.text.muted} ml-2`}>{r.reason}</span>
                                </div>
                                <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${r.s === 'high' ? 'bg-red-500/15 text-red-400' :
                                    r.s === 'medium' ? 'bg-amber-500/15 text-amber-400' : 'bg-blue-500/15 text-blue-400'
                                    }`}>
                                    {r.s === 'high' ? 'Nghiêm trọng' : r.s === 'medium' ? 'Trung bình' : 'Thấp'}
                                </span>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        </div>
    );
}