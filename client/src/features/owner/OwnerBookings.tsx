import { useState, useEffect } from 'react';
import { ownerApi } from '../../services/ownerApi';
import { Loader2, Calendar, User, Phone, Clock, CheckCircle, XCircle } from 'lucide-react';
import dayjs from 'dayjs';

export const OwnerBookings = () => {
    const [bookings, setBookings] = useState<any[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [currentPage, setCurrentPage] = useState(1);
    const pageSize = 10;

    useEffect(() => {
        ownerApi.getBookings()
            .then(data => setBookings(data))
            .catch(err => console.error(err))
            .finally(() => setIsLoading(false));
    }, []);

    const formatCurrency = (amount: number) => {
        return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(amount);
    };

    if (isLoading) {
        return (
            <div className="flex h-full items-center justify-center">
                <Loader2 className="w-8 h-8 animate-spin text-emerald-500" />
            </div>
        );
    }

    if (bookings.length === 0) {
        return (
            <div className="p-8">
                <h1 className="text-3xl font-bold text-white mb-2">Lịch Đặt Sân</h1>
                <p className="text-gray-400 mb-8">Chưa có lượt đặt sân nào.</p>
            </div>
        );
    }

    return (
        <div className="p-8">
            <h1 className="text-3xl font-bold text-white mb-2">Lịch Đặt Sân</h1>
            <p className="text-gray-400 mb-8">Quản lý và xem lịch sử đặt sân của khách hàng.</p>

            <div className="bg-[#0a0f16]/60 backdrop-blur-3xl border border-white/5 rounded-2xl overflow-hidden shadow-[0_8px_30px_rgb(0,0,0,0.4)]">
                <div className="overflow-x-auto">
                    <table className="w-full text-left text-sm text-gray-300">
                        <thead className="bg-white/5 text-[11px] font-bold uppercase tracking-wider text-gray-400 border-b border-white/5">
                            <tr>
                                <th className="px-6 py-4 font-medium">Khách hàng</th>
                                <th className="px-6 py-4 font-medium">Sân</th>
                                <th className="px-6 py-4 font-medium">Thời gian</th>
                                <th className="px-6 py-4 font-medium">Tổng tiền</th>
                                <th className="px-6 py-4 font-medium">Trạng thái</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-white/5">
                            {bookings.slice((currentPage - 1) * pageSize, currentPage * pageSize).map((booking: any) => (
                                <tr key={booking._id} className="hover:bg-white/5 transition-colors group">
                                    <td className="px-6 py-4">
                                        <div className="flex items-center gap-3">
                                            {booking.userId?.avatar ? (
                                                <img src={booking.userId.avatar} alt="Avatar" className="w-10 h-10 rounded-full border border-white/10 shadow-sm" />
                                            ) : (
                                                <div className="w-10 h-10 rounded-full bg-white/5 border border-white/10 flex items-center justify-center shadow-inner">
                                                    <User className="w-5 h-5 text-gray-400 group-hover:text-emerald-400 transition-colors" />
                                                </div>
                                            )}
                                            <div>
                                                <p className="text-white font-medium">
                                                    {booking.guestInfo?.name || booking.userId?.displayName || 'Khách vãng lai'}
                                                </p>
                                                <p className="text-gray-400 text-xs flex items-center gap-1 mt-0.5">
                                                    <Phone className="w-3 h-3" />
                                                    {booking.guestInfo?.phone || booking.userId?.phone || 'Chưa cập nhật'}
                                                </p>
                                            </div>
                                        </div>
                                    </td>
                                    <td className="px-6 py-4">
                                        <p className="text-white font-medium">{booking.subCourtId?.name || 'Sân trống'}</p>
                                        <p className="text-gray-400 text-xs mt-0.5">{booking.type}</p>
                                    </td>
                                    <td className="px-6 py-4">
                                        <div className="flex flex-col gap-1">
                                            <span className="flex items-center gap-1 text-white">
                                                <Calendar className="w-4 h-4 text-emerald-400" />
                                                {dayjs(booking.date).format('DD/MM/YYYY')}
                                            </span>
                                            <span className="flex items-center gap-1 text-gray-400">
                                                <Clock className="w-4 h-4" />
                                                {booking.startTime} - {booking.endTime}
                                            </span>
                                        </div>
                                    </td>
                                    <td className="px-6 py-4">
                                        <div className="flex flex-col gap-1">
                                            <span className="text-emerald-400 font-medium flex items-center gap-1">
                                                {formatCurrency(booking.finalAmount)}
                                            </span>
                                            {booking.payment?.status === 'paid' ? (
                                                <span className="text-[10px] font-bold uppercase tracking-wider text-gray-400 bg-white/10 px-2 py-0.5 rounded-full w-fit border border-white/5">Đã thanh toán</span>
                                            ) : (
                                                <span className="text-[10px] font-bold uppercase tracking-wider text-orange-400 bg-orange-500/10 px-2 py-0.5 rounded-full w-fit border border-orange-500/20 shadow-[0_0_10px_rgba(249,115,22,0.1)]">Chưa thanh toán</span>
                                            )}
                                        </div>
                                    </td>
                                    <td className="px-6 py-4">
                                        {booking.status === 'confirmed' ? (
                                            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                                                <CheckCircle className="w-3.5 h-3.5" /> Thành công
                                            </span>
                                        ) : booking.status === 'completed' ? (
                                            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium bg-blue-500/10 text-blue-400 border border-blue-500/20">
                                                <CheckCircle className="w-3.5 h-3.5" /> Hoàn thành
                                            </span>
                                        ) : booking.status === 'cancelled' ? (
                                            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium bg-red-500/10 text-red-400 border border-red-500/20">
                                                <XCircle className="w-3.5 h-3.5" /> Đã hủy
                                            </span>
                                        ) : (
                                            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                                                <Clock className="w-3.5 h-3.5" /> {booking.status}
                                            </span>
                                        )}
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
                {bookings.length > pageSize && (
                    <div className="p-4 border-t border-white/5 bg-black/20 flex items-center justify-between text-sm">
                        <span className="text-gray-400">
                            Hiển thị {(currentPage - 1) * pageSize + 1} - {Math.min(currentPage * pageSize, bookings.length)} trên tổng {bookings.length} lượt đặt
                        </span>
                        <div className="flex items-center gap-2">
                            <button 
                                onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                                disabled={currentPage === 1}
                                className="px-3 py-1.5 rounded-lg bg-white/5 text-white disabled:opacity-50 hover:bg-white/10 transition-colors border border-white/10 shadow-sm"
                            >
                                Trước
                            </button>
                            <span className="text-emerald-400 font-medium px-2 flex items-center gap-2">
                                Trang 
                                <input 
                                    type="number" 
                                    min={1} 
                                    max={Math.ceil(bookings.length / pageSize)}
                                    defaultValue={currentPage}
                                    key={currentPage} // Forces re-render when currentPage changes via buttons
                                    onBlur={(e) => {
                                        let val = parseInt(e.target.value);
                                        const maxPage = Math.ceil(bookings.length / pageSize);
                                        if (isNaN(val) || val < 1) val = 1;
                                        if (val > maxPage) val = maxPage;
                                        setCurrentPage(val);
                                        e.target.value = val.toString();
                                    }}
                                    onKeyDown={(e) => {
                                        if (e.key === 'Enter') {
                                            e.currentTarget.blur();
                                        }
                                    }}
                                    className="w-16 px-1 py-0.5 text-center bg-gray-900 border border-emerald-500/30 rounded text-emerald-400 focus:outline-none focus:border-emerald-500 [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                                />
                                / {Math.ceil(bookings.length / pageSize)}
                            </span>
                            <button 
                                onClick={() => setCurrentPage(p => Math.min(Math.ceil(bookings.length / pageSize), p + 1))}
                                disabled={currentPage === Math.ceil(bookings.length / pageSize)}
                                className="px-3 py-1.5 rounded-lg bg-white/5 text-white disabled:opacity-50 hover:bg-white/10 transition-colors border border-white/10 shadow-sm"
                            >
                                Sau
                            </button>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};
