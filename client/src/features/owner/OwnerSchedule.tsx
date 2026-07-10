import { useState, useEffect } from 'react';
import { ownerApi } from '../../services/ownerApi';
import { useAlertStore } from '../../stores/useAlertStore';
import { Calendar, ChevronLeft, ChevronRight, Loader2, Lock, User, X, Clock, Info } from 'lucide-react';
import dayjs from 'dayjs';

interface CourtData {
    _id: string;
    name: string;
    sportType: string;
    surfaceType: string;
    status: string;
}

interface BookingData {
    _id: string;
    bookingCode?: string;
    subCourtId: string;
    startTime: string;
    endTime: string;
    status: string;
    type: string;
    finalAmount?: number;
    payment?: {
        method: string;
        status: string;
    };
    userId?: {
        _id: string;
        displayName: string;
        phone?: string;
    };
    notes?: string;
}

export const OwnerSchedule = () => {
    const { showAlert } = useAlertStore();
    const [selectedDate, setSelectedDate] = useState(dayjs().format('YYYY-MM-DD'));
    const [isLoading, setIsLoading] = useState(true);
    const [courts, setCourts] = useState<CourtData[]>([]);
    const [bookings, setBookings] = useState<BookingData[]>([]);

    // Modal
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [selectedBooking, setSelectedBooking] = useState<BookingData | null>(null);
    const [isSaving, setIsSaving] = useState(false);
    const [blockData, setBlockData] = useState({
        subCourtId: '',
        startTime: '05:00',
        endTime: '06:00',
        notes: ''
    });

    const START_HOUR = 5;
    const END_HOUR = 23;
    const TOTAL_HOURS = END_HOUR - START_HOUR;
    const hours = Array.from({ length: TOTAL_HOURS }, (_, i) => i + START_HOUR);

    const fetchSchedule = async () => {
        setIsLoading(true);
        try {
            const data = await ownerApi.getSchedule(selectedDate);
            setCourts(data.courts || []);
            setBookings(data.bookings || []);
        } catch (error: any) {
            showAlert("Không thể tải lịch sân", "Lỗi", "error");
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        fetchSchedule();
    }, [selectedDate]);

    const handlePrevDay = () => setSelectedDate(dayjs(selectedDate).subtract(1, 'day').format('YYYY-MM-DD'));
    const handleNextDay = () => setSelectedDate(dayjs(selectedDate).add(1, 'day').format('YYYY-MM-DD'));
    const handleToday = () => setSelectedDate(dayjs().format('YYYY-MM-DD'));

    const timeToPosition = (timeStr: string) => {
        const [h, m] = timeStr.split(':').map(Number);
        const totalMinutes = (h - START_HOUR) * 60 + m;
        const percentage = (totalMinutes / (TOTAL_HOURS * 60)) * 100;
        return Math.max(0, Math.min(100, percentage));
    };

    const getBookingStyle = (startTime: string, endTime: string) => {
        const left = timeToPosition(startTime);
        const right = timeToPosition(endTime);
        const width = right - left;
        return {
            left: `${left}%`,
            width: `${width}%`,
        };
    };

    const openBlockModal = (courtId: string, hour: number) => {
        const start = `${hour.toString().padStart(2, '0')}:00`;
        const end = `${(hour + 1).toString().padStart(2, '0')}:00`;
        setBlockData({
            subCourtId: courtId,
            startTime: start,
            endTime: end,
            notes: ''
        });
        setIsModalOpen(true);
    };

    const handleBlockSlot = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsSaving(true);
        try {
            await ownerApi.blockSlot({
                ...blockData,
                date: selectedDate
            });
            showAlert("Đã thêm lịch Offline thành công", "Thành công", "success");
            setIsModalOpen(false);
            fetchSchedule();
        } catch (error: any) {
            showAlert(error.response?.data?.message || "Có lỗi xảy ra", "Lỗi", "error");
        } finally {
            setIsSaving(false);
        }
    };

    if (isLoading && courts.length === 0) {
        return (
            <div className="flex items-center justify-center h-full">
                <Loader2 className="h-8 w-8 animate-spin text-emerald-500" />
            </div>
        );
    }

    return (
        <div className="p-6 max-w-[1600px] mx-auto space-y-6 flex flex-col h-[calc(100vh-2rem)]">
            {/* Header & Controls */}
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 shrink-0">
                <div>
                    <h1 className="text-2xl font-bold text-white">Lưới Lịch (Schedule)</h1>
                    <p className="text-gray-400">Xem bao quát lịch đặt sân và chốt khách Offline</p>
                </div>
                
                <div className="flex items-center gap-2 bg-gray-800 p-1.5 rounded-xl border border-gray-700">
                    <button 
                        onClick={handlePrevDay}
                        className="p-2 hover:bg-gray-700 rounded-lg text-gray-400 hover:text-white transition-colors"
                    >
                        <ChevronLeft className="h-5 w-5" />
                    </button>
                    <button 
                        onClick={handleToday}
                        className="px-4 py-2 hover:bg-gray-700 rounded-lg text-white font-medium transition-colors flex items-center gap-2"
                    >
                        <Calendar className="h-4 w-4 text-emerald-400" />
                        {dayjs(selectedDate).format('DD/MM/YYYY')}
                    </button>
                    <button 
                        onClick={handleNextDay}
                        className="p-2 hover:bg-gray-700 rounded-lg text-gray-400 hover:text-white transition-colors"
                    >
                        <ChevronRight className="h-5 w-5" />
                    </button>
                </div>
            </div>

            {/* Grid Area */}
            <div className="bg-gray-800 rounded-2xl border border-gray-700 flex flex-col flex-1 min-h-0 overflow-hidden relative">
                {isLoading && (
                    <div className="absolute inset-0 z-50 bg-gray-900/50 backdrop-blur-sm flex items-center justify-center">
                        <Loader2 className="h-8 w-8 animate-spin text-emerald-500" />
                    </div>
                )}
                
                {/* Scrollable Container */}
                <div className="flex-1 overflow-auto bg-gray-900/50 scroll-smooth">
                    <div className="min-w-[1440px] flex flex-col min-h-full">
                        
                        {/* Fixed Header Row */}
                        <div className="flex border-b border-gray-700 bg-gray-800 sticky top-0 z-30 shrink-0 shadow-sm">
                            <div className="w-48 shrink-0 p-4 border-r border-gray-700 font-medium text-emerald-400 flex items-center justify-center bg-gray-800 sticky left-0 z-40">
                                Danh sách Sân
                            </div>
                            <div className="flex-1 flex">
                                {hours.map(hour => (
                                    <div key={`header-${hour}`} className="flex-1 border-r border-gray-700/50 p-2 text-center text-sm font-medium text-gray-400">
                                        {hour.toString().padStart(2, '0')}:00
                                    </div>
                                ))}
                            </div>
                        </div>

                        {/* Body */}
                        <div className="flex flex-col flex-1">
                            {courts.length === 0 ? (
                                <div className="p-12 text-center text-gray-400">
                                    Chưa có sân nào. Vui lòng vào mục "Cấu hình giá sân" để thêm sân trước.
                                </div>
                            ) : (
                                courts.map(court => {
                                    const courtBookings = bookings.filter(b => b.subCourtId === court._id);
                                    return (
                                        <div key={court._id} className="flex border-b border-gray-700/50 min-h-[80px] hover:bg-gray-700/20 transition-colors group">
                                            {/* Row Label */}
                                            <div className="w-48 shrink-0 p-4 border-r border-gray-700 bg-gray-800/90 flex flex-col justify-center sticky left-0 z-20 shadow-[2px_0_8px_-4px_rgba(0,0,0,0.5)]">
                                                <span className="font-semibold text-white truncate" title={court.name}>{court.name}</span>
                                                <span className="text-xs text-emerald-400/70 mt-0.5 font-medium">{court.sportType}</span>
                                            </div>

                                            {/* Row Timeline */}
                                            <div className="flex-1 relative cursor-crosshair">
                                                {/* Grid Lines & Clickable slots */}
                                                <div className="absolute inset-0 flex">
                                                    {hours.map(hour => (
                                                        <div 
                                                            key={`grid-${hour}`} 
                                                            className="flex-1 border-r border-gray-700/20 hover:bg-white/5 transition-colors"
                                                            onClick={() => openBlockModal(court._id, hour)}
                                                            title="Click để thêm lịch Offline"
                                                        />
                                                    ))}
                                                </div>

                                                {/* Booking Blocks */}
                                                {courtBookings.map(booking => {
                                                    const isOffline = booking.notes?.includes('Offline') || !booking.userId;
                                                    return (
                                                        <div 
                                                            key={booking._id}
                                                            onClick={(e) => {
                                                                e.stopPropagation();
                                                                setSelectedBooking(booking);
                                                            }}
                                                            className={`absolute top-1.5 bottom-1.5 rounded-md px-2.5 py-1 text-xs overflow-hidden border shadow-sm z-10 transition-all hover:scale-[1.01] hover:z-20 cursor-pointer flex flex-col justify-center
                                                                ${isOffline 
                                                                    ? 'bg-gradient-to-r from-gray-700/90 to-gray-800/90 border-gray-600 text-gray-300' 
                                                                    : 'bg-gradient-to-r from-emerald-500/20 to-teal-500/20 border-emerald-500/40 text-emerald-100 hover:border-emerald-400/70 hover:from-emerald-500/30 hover:to-teal-500/30 hover:shadow-emerald-500/20'
                                                                }
                                                            `}
                                                            style={getBookingStyle(booking.startTime, booking.endTime)}
                                                            title={`${booking.startTime} - ${booking.endTime}\n${isOffline ? 'Khách Offline / Bảo trì' : `Khách App: ${booking.userId?.displayName || 'Khách'}`}`}
                                                        >
                                                            <div className="font-medium truncate text-[10px] opacity-80 mb-0.5 tracking-wide">
                                                                {booking.startTime} - {booking.endTime}
                                                            </div>
                                                            <div className="flex items-center gap-1.5 truncate font-medium text-[11px]">
                                                                {isOffline ? (
                                                                    <><Lock className="h-3 w-3 shrink-0 opacity-70" /> <span className="truncate">Offline</span></>
                                                                ) : (
                                                                    <><User className="h-3 w-3 shrink-0 opacity-70 text-emerald-400" /> <span className="truncate">{booking.userId?.displayName?.split(' ')[0] || 'Khách'}</span></>
                                                                )}
                                                            </div>
                                                        </div>
                                                    );
                                                })}
                                            </div>
                                        </div>
                                    );
                                })
                            )}
                        </div>
                    </div>
                </div>
            </div>

            {/* Modal Thêm Lịch Offline */}
            {isModalOpen && (
                <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm" onClick={() => setIsModalOpen(false)}>
                    <div className="bg-gray-800 rounded-2xl border border-gray-700 w-full max-w-md overflow-hidden shadow-2xl" onClick={e => e.stopPropagation()}>
                        <div className="p-6 border-b border-gray-700">
                            <h2 className="text-xl font-semibold text-white flex items-center gap-2">
                                <Lock className="h-5 w-5 text-emerald-400" />
                                Khóa Slot / Lịch Offline
                            </h2>
                        </div>
                        <form onSubmit={handleBlockSlot} className="p-6 space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-400 mb-1.5">Sân</label>
                                <select 
                                    required
                                    className="w-full bg-gray-900 border border-gray-700 rounded-xl px-4 py-2.5 text-white focus:ring-2 focus:ring-emerald-500 outline-none"
                                    value={blockData.subCourtId}
                                    onChange={e => setBlockData({...blockData, subCourtId: e.target.value})}
                                >
                                    <option value="" disabled>-- Chọn sân --</option>
                                    {courts.map(c => (
                                        <option key={c._id} value={c._id}>{c.name}</option>
                                    ))}
                                </select>
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-400 mb-1.5">Giờ bắt đầu</label>
                                    <input 
                                        type="time" 
                                        required
                                        className="w-full bg-gray-900 border border-gray-700 rounded-xl px-4 py-2.5 text-white focus:ring-2 focus:ring-emerald-500 outline-none"
                                        value={blockData.startTime}
                                        onChange={e => setBlockData({...blockData, startTime: e.target.value})}
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-400 mb-1.5">Giờ kết thúc</label>
                                    <input 
                                        type="time" 
                                        required
                                        className="w-full bg-gray-900 border border-gray-700 rounded-xl px-4 py-2.5 text-white focus:ring-2 focus:ring-emerald-500 outline-none"
                                        value={blockData.endTime}
                                        onChange={e => setBlockData({...blockData, endTime: e.target.value})}
                                    />
                                </div>
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-400 mb-1.5">Ghi chú (Tùy chọn)</label>
                                <input 
                                    type="text" 
                                    className="w-full bg-gray-900 border border-gray-700 rounded-xl px-4 py-2.5 text-white focus:ring-2 focus:ring-emerald-500 outline-none"
                                    placeholder="VD: Khách lẻ vãng lai, Dọn vệ sinh..."
                                    value={blockData.notes}
                                    onChange={e => setBlockData({...blockData, notes: e.target.value})}
                                />
                            </div>

                            <div className="flex gap-3 pt-4">
                                <button 
                                    type="button"
                                    onClick={() => setIsModalOpen(false)}
                                    className="flex-1 bg-gray-700 hover:bg-gray-600 text-white py-2.5 rounded-xl font-medium transition-colors"
                                >
                                    Hủy
                                </button>
                                <button 
                                    type="submit"
                                    disabled={isSaving}
                                    className="flex-1 bg-emerald-500 hover:bg-emerald-600 text-white py-2.5 rounded-xl font-medium transition-colors flex items-center justify-center gap-2"
                                >
                                    {isSaving && <Loader2 className="h-4 w-4 animate-spin" />}
                                    Lưu lại
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
            {/* Modal Chi tiết Booking */}
            {selectedBooking && (
                <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm" onClick={() => setSelectedBooking(null)}>
                    <div className="bg-gray-800 rounded-2xl border border-gray-700 w-full max-w-md overflow-hidden shadow-2xl" onClick={e => e.stopPropagation()}>
                        <div className="p-6 border-b border-gray-700 flex justify-between items-center">
                            <h2 className="text-xl font-semibold text-white flex items-center gap-2">
                                <Info className="h-5 w-5 text-emerald-400" />
                                Chi tiết Lượt đặt
                            </h2>
                            <button onClick={() => setSelectedBooking(null)} className="text-gray-400 hover:text-white transition-colors">
                                <X className="h-5 w-5" />
                            </button>
                        </div>
                        <div className="p-6 space-y-4 text-sm">
                            <div className="flex justify-between border-b border-gray-700/50 pb-3">
                                <span className="text-gray-400 flex items-center gap-2"><User className="h-4 w-4" /> Khách hàng</span>
                                <span className="text-white font-medium">{selectedBooking.userId?.displayName || 'Khách vãng lai / Offline'}</span>
                            </div>
                            <div className="flex justify-between border-b border-gray-700/50 pb-3">
                                <span className="text-gray-400 flex items-center gap-2">Số điện thoại</span>
                                <span className="text-white font-medium">{selectedBooking.userId?.phone || 'Chưa cập nhật'}</span>
                            </div>
                            <div className="flex justify-between border-b border-gray-700/50 pb-3">
                                <span className="text-gray-400 flex items-center gap-2">Mã đơn</span>
                                <span className="text-emerald-400 font-medium tracking-wider">{selectedBooking.bookingCode || '---'}</span>
                            </div>
                            <div className="flex justify-between border-b border-gray-700/50 pb-3">
                                <span className="text-gray-400 flex items-center gap-2"><Clock className="h-4 w-4" /> Thời gian</span>
                                <span className="text-white font-medium">{selectedBooking.startTime} - {selectedBooking.endTime}</span>
                            </div>
                            <div className="flex justify-between border-b border-gray-700/50 pb-3">
                                <span className="text-gray-400 flex items-center gap-2">Loại đặt sân</span>
                                <span className="text-white font-medium capitalize">{selectedBooking.type === 'casual' ? 'Vãng lai' : selectedBooking.type}</span>
                            </div>
                            <div className="flex justify-between border-b border-gray-700/50 pb-3">
                                <span className="text-gray-400 flex items-center gap-2">Tổng tiền</span>
                                <span className="text-emerald-400 font-bold text-base">
                                    {selectedBooking.finalAmount != null ? new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(selectedBooking.finalAmount) : '0 đ'}
                                </span>
                            </div>
                            <div className="flex justify-between border-b border-gray-700/50 pb-3">
                                <span className="text-gray-400 flex items-center gap-2">Trạng thái thanh toán</span>
                                <span className={`font-medium px-2 py-0.5 rounded-full text-xs ${selectedBooking.payment?.status === 'paid' ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' : 'bg-orange-500/10 text-orange-400 border border-orange-500/20'}`}>
                                    {selectedBooking.payment?.status === 'paid' ? 'Đã thanh toán' : 'Chưa thanh toán'}
                                </span>
                            </div>
                            {selectedBooking.notes && (
                                <div className="flex justify-between pt-1">
                                    <span className="text-gray-400 flex items-center gap-2">Ghi chú</span>
                                    <span className="text-gray-300 font-medium max-w-[200px] text-right break-words">{selectedBooking.notes}</span>
                                </div>
                            )}
                        </div>
                        <div className="p-4 bg-gray-900/50 border-t border-gray-700 flex justify-end">
                            <button 
                                onClick={() => setSelectedBooking(null)}
                                className="px-5 py-2.5 bg-gray-700 hover:bg-gray-600 text-white rounded-xl transition-colors font-medium"
                            >
                                Đóng
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};
