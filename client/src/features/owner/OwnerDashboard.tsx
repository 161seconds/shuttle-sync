import { useState, useEffect } from 'react';
import { ownerApi, type OwnerStats } from '../../services/ownerApi';
import { Building2, DollarSign, Users, CalendarCheck, Loader2 } from 'lucide-react';
import { AreaChart, Area, LineChart, Line, BarChart, Bar, Cell, Legend, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

export const OwnerDashboard = () => {
    const [stats, setStats] = useState<OwnerStats | null>(null);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        ownerApi.getStats()
            .then(data => setStats(data))
            .catch(err => console.error(err))
            .finally(() => setIsLoading(false));
    }, []);

    if (isLoading || !stats) {
        return (
            <div className="flex h-full items-center justify-center">
                <Loader2 className="w-8 h-8 animate-spin text-emerald-500" />
            </div>
        );
    }

    const StatCard = ({ title, value, icon: Icon, color }: any) => (
        <div className="bg-gray-800 border border-gray-700 rounded-2xl p-6 flex items-center gap-4">
            <div className={`p-4 rounded-xl ${color}`}>
                <Icon className="w-6 h-6 text-white" />
            </div>
            <div>
                <p className="text-gray-400 text-sm font-medium">{title}</p>
                <h3 className="text-2xl font-bold text-white">{value}</h3>
            </div>
        </div>
    );

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
                <div className="lg:col-span-2 bg-gray-800 border border-gray-700 rounded-2xl p-6">
                    <h3 className="text-xl font-bold text-white mb-6">Xu Hướng Doanh Thu (30 Ngày)</h3>
                    <div className="h-80 w-full">
                        {stats.venueSports && stats.venueSports.length > 1 ? (
                            <ResponsiveContainer width="100%" height="100%">
                                <LineChart data={stats.bookingTrendBySport}>
                                    <CartesianGrid strokeDasharray="3 3" stroke="#374151" vertical={false} />
                                    <XAxis dataKey="date" stroke="#9ca3af" fontSize={12} tickLine={false} axisLine={false} />
                                    <YAxis stroke="#9ca3af" fontSize={12} tickLine={false} axisLine={false} tickFormatter={(value) => `${value / 1000}k`} />
                                    <Tooltip contentStyle={{ backgroundColor: '#1f2937', border: 'none', borderRadius: '8px', color: '#fff' }} />
                                    <Legend wrapperStyle={{ paddingTop: '20px' }}/>
                                    {stats.venueSports.includes('PICKLEBALL') && <Line type="monotone" dataKey="PICKLEBALL" name="Pickleball" stroke="#10b981" strokeWidth={3} dot={false} activeDot={{ r: 6 }} />}
                                    {stats.venueSports.includes('BADMINTON') && <Line type="monotone" dataKey="BADMINTON" name="Cầu Lông" stroke="#f59e0b" strokeWidth={3} dot={false} activeDot={{ r: 6 }} />}
                                    {stats.venueSports.includes('TENNIS') && <Line type="monotone" dataKey="TENNIS" name="Tennis" stroke="#3b82f6" strokeWidth={3} dot={false} activeDot={{ r: 6 }} />}
                                </LineChart>
                            </ResponsiveContainer>
                        ) : (
                            <ResponsiveContainer width="100%" height="100%">
                                <AreaChart data={stats.bookingTrend}>
                                    <defs>
                                        <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
                                            <stop offset="5%" stopColor="#10b981" stopOpacity={0.8}/>
                                            <stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
                                        </linearGradient>
                                    </defs>
                                    <CartesianGrid strokeDasharray="3 3" stroke="#374151" vertical={false} />
                                    <XAxis dataKey="date" stroke="#9ca3af" fontSize={12} tickLine={false} axisLine={false} />
                                    <YAxis stroke="#9ca3af" fontSize={12} tickLine={false} axisLine={false} tickFormatter={(value) => `${value / 1000}k`} />
                                    <Tooltip 
                                        contentStyle={{ backgroundColor: '#1f2937', border: 'none', borderRadius: '8px', color: '#fff' }}
                                        formatter={(value: number) => [`${value.toLocaleString()}đ`, 'Doanh thu']}
                                    />
                                    <Area type="monotone" dataKey="revenue" stroke="#10b981" strokeWidth={3} fillOpacity={1} fill="url(#colorRevenue)" />
                                </AreaChart>
                            </ResponsiveContainer>
                        )}
                    </div>
                </div>

                <div className="bg-gray-800 border border-gray-700 rounded-2xl p-6">
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
            <div className="bg-gray-800 border border-gray-700 rounded-2xl p-6">
                <h3 className="text-xl font-bold text-white mb-6">Đơn Đặt Mới Nhất</h3>
                <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-4">
                    {stats.recentBookings.map((booking: any) => (
                        <div key={booking._id} className="flex items-center gap-3 p-4 bg-gray-900/50 rounded-xl border border-gray-700/50 hover:border-emerald-500/30 transition-colors">
                            <img src={booking.userId?.avatar || "https://api.dicebear.com/7.x/avataaars/svg?seed=user"} className="w-12 h-12 rounded-full border border-gray-700" alt="avatar" />
                            <div className="flex-1 min-w-0">
                                <p className="text-sm font-bold text-white truncate">{booking.userId?.displayName || 'Khách Vãng Lai'}</p>
                                <p className="text-xs text-gray-400 mt-0.5 truncate">{booking.subCourtId?.name || 'Sân VIP'} • {new Date(booking.date).toLocaleDateString('vi-VN')} {booking.startTime}</p>
                            </div>
                            <div className="text-right whitespace-nowrap">
                                <p className="text-sm font-bold text-emerald-400">{booking.finalAmount.toLocaleString()}đ</p>
                                <span className="inline-block px-2 py-0.5 mt-1 rounded-full text-[10px] font-medium bg-emerald-500/10 text-emerald-500 border border-emerald-500/20 uppercase">
                                    {booking.status === 'confirmed' ? 'Đã chốt' : booking.status}
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
        </div>
    );
};
