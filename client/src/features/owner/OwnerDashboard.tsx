import { useState, useEffect } from 'react';
import { ownerApi, type OwnerStats } from '../../services/ownerApi';
import { Building2, DollarSign, Users, CalendarCheck, Loader2, X } from 'lucide-react';
import { AreaChart, Area, LineChart, Line, BarChart, Bar, Cell, Legend, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

export const OwnerDashboard = () => {
    const [stats, setStats] = useState<OwnerStats | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [selectedDay, setSelectedDay] = useState<any>(null);
    const [daySchedule, setDaySchedule] = useState<{bookings: any[], isLoading: boolean} | null>(null);

    useEffect(() => {
        ownerApi.getStats()
            .then(data => setStats(data))
            .catch(err => console.error(err))
            .finally(() => setIsLoading(false));
    }, []);

    useEffect(() => {
        if (selectedDay) {
            setDaySchedule({ bookings: [], isLoading: true });
            ownerApi.getSchedule(selectedDay.date)
                .then(data => {
                    setDaySchedule({ bookings: data.bookings || [], isLoading: false });
                })
                .catch(err => {
                    console.error(err);
                    setDaySchedule({ bookings: [], isLoading: false });
                });
        } else {
            setDaySchedule(null);
        }
    }, [selectedDay]);

    if (isLoading || !stats) {
        return (
            <div className="flex h-full items-center justify-center">
                <Loader2 className="w-8 h-8 animate-spin text-emerald-500" />
            </div>
        );
    }

    const StatCard = ({ title, value, icon: Icon, color }: any) => (
        <div className="bg-[#0a0f16]/60 backdrop-blur-3xl border border-white/5 rounded-2xl p-6 flex items-center gap-4 shadow-[0_8px_30px_rgb(0,0,0,0.4)] transition-all duration-300 hover:-translate-y-1 hover:shadow-[0_8px_40px_rgba(16,185,129,0.15)] hover:border-emerald-500/30 group">
            <div className={`p-4 rounded-xl ${color}`}>
                <Icon className="w-6 h-6 text-white" />
            </div>
            <div>
                <p className="text-gray-400 text-sm font-medium">{title}</p>
                <h3 className="text-2xl font-bold text-white">{value}</h3>
            </div>
        </div>
    );

    const formatShortDate = (dateStr: string) => {
        try {
            const d = new Date(dateStr);
            if (isNaN(d.getTime())) return dateStr;
            return `${d.getDate().toString().padStart(2, '0')}/${(d.getMonth() + 1).toString().padStart(2, '0')}`;
        } catch {
            return dateStr;
        }
    };

    const CustomTooltip = ({ active, payload, label }: any) => {
        if (active && payload && payload.length) {
            return (
                <div className="bg-black/80 backdrop-blur-xl border border-white/10 p-4 rounded-xl shadow-[0_0_30px_rgba(0,0,0,0.5)] min-w-[160px]">
                    <p className="text-gray-300 font-medium mb-3 border-b border-white/10 pb-2">Ngày: <span className="text-white font-bold">{formatShortDate(label)}</span></p>
                    <div className="space-y-2">
                        {payload.map((entry: any, index: number) => {
                            const name = entry.name === 'revenue' ? 'Tổng Doanh Thu' : entry.name === 'count' ? 'Lượt đặt' : entry.name === 'BADMINTON' ? 'Cầu Lông' : entry.name === 'PICKLEBALL' ? 'Pickleball' : entry.name === 'TENNIS' ? 'Tennis' : entry.name;
                            return (
                                <div key={index} className="flex items-center gap-4 justify-between">
                                    <span style={{ color: entry.color }} className="text-sm font-medium">
                                        {name}
                                    </span>
                                    <span className="text-white font-bold text-sm">
                                        {entry.name === 'count' ? entry.value : `${entry.value.toLocaleString()}đ`}
                                    </span>
                                </div>
                            );
                        })}
                    </div>
                </div>
            );
        }
        return null;
    };

    return (
        <div className="p-8 space-y-8">
            <div className="flex justify-between items-center">
                <div>
                    <h1 className="text-3xl font-bold text-white">Dashboard Của Bạn</h1>
                    <p className="text-gray-400 mt-1">Cơ sở: <span className="text-emerald-400 font-medium">{stats.venueName}</span></p>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <StatCard 
                    title="Tổng Doanh Thu" 
                    value={`${stats.totalRevenue.toLocaleString()}đ`}
                    icon={DollarSign}
                    color="bg-emerald-500/20 text-emerald-500"
                />
                <StatCard 
                    title="Lượt Đặt Sân" 
                    value={stats.totalBookings}
                    icon={CalendarCheck}
                    color="bg-emerald-500/20 text-emerald-500"
                />
                <StatCard 
                    title="Tổng Số Sân" 
                    value={stats.totalCourts}
                    icon={Building2}
                    color="bg-emerald-500/20 text-emerald-500"
                />
                <StatCard 
                    title="Khách Hàng (Tạm tính)" 
                    value={stats.recentBookings.length}
                    icon={Users}
                    color="bg-teal-500/20 text-teal-500"
                />
            </div>

            {/* Chart Area */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <div className="lg:col-span-2 bg-[#0a0f16]/60 backdrop-blur-3xl border border-white/5 shadow-[0_8px_30px_rgb(0,0,0,0.4)] rounded-2xl p-6 transition-all hover:border-emerald-500/20">
                    <h3 className="text-xl font-bold text-white mb-6">Xu Hướng Doanh Thu (30 Ngày)</h3>
                    <div className="h-80 w-full">
                        {stats.venueSports && stats.venueSports.length > 1 ? (
                            <ResponsiveContainer width="100%" height="100%">
                                <LineChart 
                                    data={stats.bookingTrendBySport}
                                    onClick={(e: any) => {
                                        if (!e) return;
                                        if (e.activePayload && e.activePayload.length > 0) {
                                            setSelectedDay({
                                                date: e.activeLabel || e.activePayload[0].payload.date,
                                                payload: e.activePayload
                                            });
                                        } else if (e.activeLabel) {
                                            const item = stats.bookingTrendBySport.find(d => d.date === e.activeLabel);
                                            if (item) {
                                                const payload = [];
                                                if (item.PICKLEBALL !== undefined) payload.push({ name: 'PICKLEBALL', value: item.PICKLEBALL, color: '#10b981' });
                                                if (item.BADMINTON !== undefined) payload.push({ name: 'BADMINTON', value: item.BADMINTON, color: '#f59e0b' });
                                                if (item.TENNIS !== undefined) payload.push({ name: 'TENNIS', value: item.TENNIS, color: '#3b82f6' });
                                                setSelectedDay({ date: item.date, payload });
                                            }
                                        }
                                    }}
                                    style={{ cursor: 'pointer' }}
                                >
                                    <CartesianGrid strokeDasharray="3 3" stroke="#374151" vertical={false} />
                                    <XAxis dataKey="date" stroke="#9ca3af" fontSize={12} tickLine={false} axisLine={false} tickFormatter={formatShortDate} />
                                    <YAxis stroke="#9ca3af" fontSize={12} tickLine={false} axisLine={false} tickFormatter={(value) => `${value / 1000}k`} />
                                    <Tooltip content={<CustomTooltip />} cursor={{ stroke: '#374151', strokeWidth: 1, strokeDasharray: '4 4' }} />
                                    <Legend wrapperStyle={{ paddingTop: '20px' }}/>
                                    {stats.venueSports.includes('PICKLEBALL') && <Line type="monotone" dataKey="PICKLEBALL" name="Pickleball" stroke="#10b981" strokeWidth={3} dot={false} activeDot={{ r: 6, stroke: '#10b981', strokeWidth: 2, fill: '#1f2937' }} />}
                                    {stats.venueSports.includes('BADMINTON') && <Line type="monotone" dataKey="BADMINTON" name="Cầu Lông" stroke="#f59e0b" strokeWidth={3} dot={false} activeDot={{ r: 6, stroke: '#f59e0b', strokeWidth: 2, fill: '#1f2937' }} />}
                                    {stats.venueSports.includes('TENNIS') && <Line type="monotone" dataKey="TENNIS" name="Tennis" stroke="#3b82f6" strokeWidth={3} dot={false} activeDot={{ r: 6, stroke: '#3b82f6', strokeWidth: 2, fill: '#1f2937' }} />}
                                </LineChart>
                            </ResponsiveContainer>
                        ) : (
                            <ResponsiveContainer width="100%" height="100%">
                                <AreaChart 
                                    data={stats.bookingTrend}
                                    onClick={(e: any) => {
                                        if (!e) return;
                                        if (e.activePayload && e.activePayload.length > 0) {
                                            setSelectedDay({
                                                date: e.activeLabel || e.activePayload[0].payload.date,
                                                payload: e.activePayload
                                            });
                                        } else if (e.activeLabel) {
                                            const item = stats.bookingTrend.find(d => d.date === e.activeLabel);
                                            if (item) {
                                                setSelectedDay({
                                                    date: item.date,
                                                    payload: [{ name: 'revenue', value: item.revenue, color: '#10b981' }]
                                                });
                                            }
                                        }
                                    }}
                                    style={{ cursor: 'pointer' }}
                                >
                                    <defs>
                                        <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
                                            <stop offset="5%" stopColor="#10b981" stopOpacity={0.8}/>
                                            <stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
                                        </linearGradient>
                                    </defs>
                                    <CartesianGrid strokeDasharray="3 3" stroke="#374151" vertical={false} />
                                    <XAxis dataKey="date" stroke="#9ca3af" fontSize={12} tickLine={false} axisLine={false} tickFormatter={formatShortDate} />
                                    <YAxis stroke="#9ca3af" fontSize={12} tickLine={false} axisLine={false} tickFormatter={(value) => `${value / 1000}k`} />
                                    <Tooltip content={<CustomTooltip />} cursor={{ stroke: '#374151', strokeWidth: 1, strokeDasharray: '4 4' }} />
                                    <Area type="monotone" dataKey="revenue" name="revenue" stroke="#10b981" strokeWidth={3} fillOpacity={1} fill="url(#colorRevenue)" dot={false} activeDot={{ r: 6, stroke: '#10b981', strokeWidth: 2, fill: '#1f2937' }} />
                                </AreaChart>
                            </ResponsiveContainer>
                        )}
                    </div>
                </div>

                <div className="bg-[#0a0f16]/60 backdrop-blur-3xl border border-white/5 shadow-[0_8px_30px_rgb(0,0,0,0.4)] rounded-2xl p-6 transition-all hover:border-emerald-500/20">
                    <h3 className="text-xl font-bold text-white mb-6">Tình Trạng Lịch Đặt</h3>
                    <div className="h-80 w-full">
                        <ResponsiveContainer width="100%" height="100%">
                            <BarChart data={stats.bookingsByStatus} layout="vertical" margin={{ top: 0, right: 30, left: 10, bottom: 0 }}>
                                <CartesianGrid strokeDasharray="3 3" stroke="#374151" horizontal={true} vertical={false}/>
                                <XAxis type="number" stroke="#9ca3af" fontSize={12} />
                                <YAxis dataKey="name" type="category" stroke="#9ca3af" fontSize={12} tickFormatter={(val) => {
                                    if (val === 'confirmed') return 'Đã chốt';
                                    if (val === 'pending_payment') return 'Chờ TT';
                                    if (val === 'cancelled') return 'Đã hủy';
                                    if (val === 'completed') return 'Hoàn tất';
                                    return val;
                                }}/>
                                <Tooltip 
                                    contentStyle={{ backgroundColor: '#1f2937', border: 'none', borderRadius: '8px', color: '#fff' }}
                                    cursor={{fill: '#374151', opacity: 0.4}}
                                    formatter={(value: number) => [value, 'Số lượng']}
                                />
                                <Bar dataKey="value" radius={[0, 4, 4, 0]} barSize={30}>
                                    {
                                        stats.bookingsByStatus.map((entry, index) => {
                                            const colors: any = {
                                                'confirmed': '#10b981',
                                                'completed': '#3b82f6',
                                                'pending_payment': '#f59e0b',
                                                'cancelled': '#ef4444'
                                            };
                                            return <Cell key={`cell-${index}`} fill={colors[entry.name] || '#9ca3af'} />
                                        })
                                    }
                                </Bar>
                            </BarChart>
                        </ResponsiveContainer>
                    </div>
                </div>
            </div>

            {/* Recent Bookings */}
            <div className="bg-[#0a0f16]/60 backdrop-blur-3xl border border-white/5 shadow-[0_8px_30px_rgb(0,0,0,0.4)] rounded-2xl p-6 transition-all hover:border-emerald-500/20">
                <h3 className="text-xl font-bold text-white mb-6">Đơn Đặt Mới Nhất</h3>
                <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-4">
                    {stats.recentBookings.map((booking: any) => (
                        <div key={booking._id} className="flex items-center gap-3 p-4 bg-white/5 rounded-xl border border-white/10 hover:border-emerald-500/30 hover:bg-white/10 transition-colors shadow-inner">
                            <img src={booking.userId?.avatar || "https://api.dicebear.com/7.x/avataaars/svg?seed=user"} className="w-12 h-12 rounded-full border border-white/10 shadow-sm" alt="avatar" />
                            <div className="flex-1 min-w-0">
                                <p className="text-sm font-bold text-white truncate">{booking.userId?.displayName || 'Khách Vãng Lai'}</p>
                                <p className="text-xs text-gray-400 mt-0.5 truncate">{booking.subCourtId?.name || 'Sân VIP'} • {new Date(booking.date).toLocaleDateString('vi-VN')} {booking.startTime}</p>
                            </div>
                            <div className="text-right whitespace-nowrap">
                                <p className="text-sm font-bold text-emerald-400">{booking.finalAmount.toLocaleString()}đ</p>
                                <span className={`inline-block px-2 py-0.5 mt-1 rounded-full text-[10px] font-medium border uppercase ${
                                    booking.status === 'confirmed'
                                        ? 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20'
                                        : booking.status === 'completed'
                                            ? 'bg-blue-500/10 text-blue-400 border-blue-500/20'
                                        : booking.status === 'cancelled'
                                            ? 'bg-red-500/10 text-red-400 border-red-500/20'
                                            : 'bg-yellow-500/10 text-yellow-500 border-yellow-500/20'
                                }`}>
                                    {booking.status === 'confirmed' ? 'Đã chốt' : booking.status === 'completed' ? 'Hoàn thành' : booking.status === 'cancelled' ? 'Đã hủy' : booking.status}
                                </span>
                            </div>
                        </div>
                    ))}
                    {stats.recentBookings.length === 0 && (
                        <div className="col-span-full py-8 text-center text-gray-400">
                            Chưa có đơn đặt nào.
                        </div>
                    )}
                </div>
            </div>

            {/* Modal for Chart Details */}
            {selectedDay && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-md" onClick={() => setSelectedDay(null)}>
                    <div 
                        className="bg-[#0a0f16]/90 backdrop-blur-3xl rounded-3xl border border-white/10 w-full max-w-4xl max-h-[90vh] flex flex-col overflow-hidden shadow-[0_10px_50px_rgba(0,0,0,0.5)] animate-in fade-in zoom-in-95 duration-200"
                        onClick={e => e.stopPropagation()}
                    >
                        <div className="p-5 border-b border-white/5 flex justify-between items-center bg-white/5 shrink-0">
                            <h2 className="text-xl font-bold text-white">Báo cáo chi tiết ngày {new Date(selectedDay.date).toLocaleDateString('vi-VN')}</h2>
                            <button 
                                onClick={() => setSelectedDay(null)}
                                className="p-2 text-gray-400 hover:text-white bg-white/5 hover:bg-white/10 border border-transparent hover:border-white/10 rounded-lg transition-colors shadow-sm"
                            >
                                <X className="w-5 h-5" />
                            </button>
                        </div>
                        
                        <div className="flex flex-col md:flex-row flex-1 min-h-0 overflow-hidden">
                            {/* Left column: Stats */}
                            <div className="w-full md:w-1/3 p-5 border-b md:border-b-0 md:border-r border-white/5 bg-transparent overflow-y-auto custom-scrollbar space-y-6">
                                <div>
                                    <h3 className="text-sm font-semibold text-gray-400 uppercase tracking-wider mb-3">Tóm tắt Doanh Thu</h3>
                                    <div className="space-y-3">
                                        {selectedDay.payload.map((entry: any, index: number) => {
                                            const name = entry.name === 'revenue' ? 'Tổng Doanh Thu' : entry.name === 'count' ? 'Lượt đặt' : entry.name === 'BADMINTON' ? 'Cầu Lông' : entry.name === 'PICKLEBALL' ? 'Pickleball' : entry.name === 'TENNIS' ? 'Tennis' : entry.name;
                                            return (
                                                <div key={index} className="flex justify-between items-center p-3 rounded-xl bg-white/5 border border-white/10 shadow-inner">
                                                    <div className="flex items-center gap-3">
                                                        <div className="w-3 h-3 rounded-full" style={{ backgroundColor: entry.color }}></div>
                                                        <span className="text-gray-300 font-medium">{name}</span>
                                                    </div>
                                                    <span className="text-white font-bold text-lg">
                                                        {entry.name === 'count' ? entry.value : `${entry.value.toLocaleString()}đ`}
                                                    </span>
                                                </div>
                                            );
                                        })}
                                    </div>
                                </div>

                                {daySchedule && !daySchedule.isLoading && daySchedule.bookings.length > 0 && (
                                    <div>
                                        <h3 className="text-sm font-semibold text-gray-400 uppercase tracking-wider mb-3">Thông số Phụ</h3>
                                        <div className="space-y-3">
                                            <div className="p-4 rounded-xl bg-white/5 border border-white/10 shadow-inner">
                                                <p className="text-xs text-gray-400 mb-1">Trung bình chi tiêu / đơn</p>
                                                <p className="text-lg font-bold text-emerald-400">
                                                    {Math.round(daySchedule.bookings.reduce((sum: number, b: any) => sum + (b.finalAmount || 0), 0) / daySchedule.bookings.length).toLocaleString()}đ
                                                </p>
                                            </div>
                                            
                                            {(() => {
                                                const hourCounts: Record<string, number> = {};
                                                daySchedule.bookings.forEach((b: any) => {
                                                    const hour = b.startTime.split(':')[0];
                                                    hourCounts[hour] = (hourCounts[hour] || 0) + 1;
                                                });
                                                const peakHour = Object.keys(hourCounts).sort((a, b) => hourCounts[b] - hourCounts[a])[0];
                                                return peakHour ? (
                                                    <div className="p-4 rounded-xl bg-white/5 border border-white/10 shadow-inner">
                                                        <p className="text-xs text-gray-400 mb-1">Giờ cao điểm</p>
                                                        <p className="text-lg font-bold text-orange-400">
                                                            {peakHour}:00 - {parseInt(peakHour)+1}:00
                                                        </p>
                                                        <p className="text-xs text-gray-500 mt-1">{hourCounts[peakHour]} lượt đặt</p>
                                                    </div>
                                                ) : null;
                                            })()}
                                        </div>
                                    </div>
                                )}
                            </div>

                            {/* Right column: Bookings */}
                            <div className="w-full md:w-2/3 p-5 overflow-y-auto custom-scrollbar bg-transparent">
                                <h3 className="text-sm font-semibold text-gray-400 uppercase tracking-wider mb-4 flex items-center justify-between">
                                    <span>Danh sách Đơn Đặt ({daySchedule?.bookings.length || 0})</span>
                                </h3>
                                
                                {daySchedule?.isLoading ? (
                                    <div className="flex justify-center items-center h-40">
                                        <Loader2 className="w-8 h-8 text-emerald-500 animate-spin" />
                                    </div>
                                ) : daySchedule?.bookings.length === 0 ? (
                                    <div className="flex flex-col items-center justify-center h-40 text-gray-500">
                                        <CalendarCheck className="w-12 h-12 mb-2 opacity-20" />
                                        <p>Không có đơn đặt nào trong ngày này</p>
                                    </div>
                                ) : (
                                    <div className="space-y-3">
                                        {daySchedule?.bookings.map((booking: any) => (
                                            <div key={booking._id} className="flex items-center gap-4 p-4 bg-white/5 rounded-xl border border-white/10 hover:border-emerald-500/30 hover:bg-white/10 transition-colors shadow-inner group">
                                                <div className="flex flex-col items-center justify-center w-16 h-16 rounded-xl bg-black/40 border border-white/10 shrink-0 shadow-inner">
                                                    <span className="text-sm font-black text-emerald-400">{booking.startTime}</span>
                                                    <span className="text-[10px] text-gray-500 font-medium">{booking.endTime}</span>
                                                </div>
                                                
                                                <div className="flex-1 min-w-0">
                                                    <p className="text-base font-bold text-white truncate flex items-center gap-2">
                                                        {booking.userId?.displayName || 'Khách Vãng Lai'}
                                                    </p>
                                                    <p className="text-sm text-gray-400 mt-1 truncate flex items-center gap-2">
                                                        <span className="w-1.5 h-1.5 rounded-full bg-blue-500"></span> 
                                                        {booking.subCourtId?.name || 'Sân VIP'}
                                                    </p>
                                                </div>
                                                
                                                <div className="text-right shrink-0">
                                                    <p className="text-base font-bold text-emerald-400">{booking.finalAmount.toLocaleString()}đ</p>
                                                    <span className={`inline-block px-2.5 py-1 mt-1.5 rounded-full text-[10px] font-bold border uppercase tracking-wider ${
                                                        booking.status === 'confirmed'
                                                            ? 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20'
                                                            : booking.status === 'completed'
                                                                ? 'bg-blue-500/10 text-blue-400 border-blue-500/20'
                                                            : booking.status === 'cancelled'
                                                                ? 'bg-red-500/10 text-red-400 border-red-500/20'
                                                                : 'bg-yellow-500/10 text-yellow-500 border-yellow-500/20'
                                                    }`}>
                                                        {booking.status === 'confirmed' ? 'Đã chốt' : booking.status === 'completed' ? 'Hoàn thành' : booking.status === 'cancelled' ? 'Đã hủy' : booking.status}
                                                    </span>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};
