import { useState, useEffect } from 'react';
import { ownerApi, type OwnerStats } from '../../services/ownerApi';
import { Building2, DollarSign, Users, CalendarCheck, Loader2 } from 'lucide-react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

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
                <Loader2 className="w-8 h-8 animate-spin text-purple-500" />
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
                    <p className="text-gray-400 mt-1">Cơ sở: <span className="text-purple-400 font-medium">{stats.venueName}</span></p>
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
                    color="bg-blue-500/20 text-blue-500"
                />
                <StatCard 
                    title="Tổng Số Sân" 
                    value={stats.totalCourts}
                    icon={Building2}
                    color="bg-purple-500/20 text-purple-500"
                />
                <StatCard 
                    title="Khách Hàng (Tạm tính)" 
                    value={stats.recentBookings.length}
                    icon={Users}
                    color="bg-pink-500/20 text-pink-500"
                />
            </div>

            {/* Chart Area */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <div className="lg:col-span-2 bg-gray-800 border border-gray-700 rounded-2xl p-6">
                    <h3 className="text-xl font-bold text-white mb-6">Xu Hướng Doanh Thu (30 Ngày)</h3>
                    <div className="h-80 w-full">
                        <ResponsiveContainer width="100%" height="100%">
                            <AreaChart data={stats.bookingTrend}>
                                <defs>
                                    <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
                                        <stop offset="5%" stopColor="#8b5cf6" stopOpacity={0.8}/>
                                        <stop offset="95%" stopColor="#8b5cf6" stopOpacity={0}/>
                                    </linearGradient>
                                </defs>
                                <CartesianGrid strokeDasharray="3 3" stroke="#374151" vertical={false} />
                                <XAxis dataKey="date" stroke="#9ca3af" fontSize={12} tickLine={false} axisLine={false} />
                                <YAxis stroke="#9ca3af" fontSize={12} tickLine={false} axisLine={false} tickFormatter={(value) => `${value / 1000}k`} />
                                <Tooltip 
                                    contentStyle={{ backgroundColor: '#1f2937', border: 'none', borderRadius: '8px', color: '#fff' }}
                                    formatter={(value: number) => [`${value.toLocaleString()}đ`, 'Doanh thu']}
                                />
                                <Area type="monotone" dataKey="revenue" stroke="#8b5cf6" strokeWidth={3} fillOpacity={1} fill="url(#colorRevenue)" />
                            </AreaChart>
                        </ResponsiveContainer>
                    </div>
                </div>

                {/* Recent Bookings */}
                <div className="bg-gray-800 border border-gray-700 rounded-2xl p-6">
                    <h3 className="text-xl font-bold text-white mb-6">Đơn Đặt Mới Nhất</h3>
                    <div className="space-y-4">
                        {stats.recentBookings.map((booking: any) => (
                            <div key={booking._id} className="flex items-center gap-3 p-3 bg-gray-900/50 rounded-xl border border-gray-700/50">
                                <img src={booking.userId?.avatar || "https://api.dicebear.com/7.x/avataaars/svg?seed=user"} className="w-10 h-10 rounded-full" alt="avatar" />
                                <div className="flex-1">
                                    <p className="text-sm font-medium text-white">{booking.userId?.displayName || 'Khách Vãng Lai'}</p>
                                    <p className="text-xs text-gray-400">{booking.courtId?.name || 'Sân VIP'} • {new Date(booking.startTime).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</p>
                                </div>
                                <div className="text-right">
                                    <p className="text-sm font-bold text-emerald-400">{booking.finalAmount.toLocaleString()}đ</p>
                                </div>
                            </div>
                        ))}
                        {stats.recentBookings.length === 0 && (
                            <p className="text-gray-400 text-center py-4">Chưa có đơn đặt nào.</p>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};
