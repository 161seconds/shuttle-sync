import { useState, useEffect } from 'react';
import { ownerApi } from '../../services/ownerApi';
import { useAlertStore } from '../../stores/useAlertStore';
import { ChevronLeft, ChevronRight, Loader2, Lock, User, X, Clock, Info, Repeat } from 'lucide-react';
import dayjs from 'dayjs';
import { DatePicker } from '../../components/ui/DatePicker';

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

    const [currentTime, setCurrentTime] = useState(dayjs());
    
    useEffect(() => {
        const interval = setInterval(() => setCurrentTime(dayjs()), 60000);
        return () => clearInterval(interval);
    }, []);



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

    const isToday = selectedDate === dayjs().format('YYYY-MM-DD');
    const currentPos = isToday ? timeToPosition(currentTime.format('HH:mm')) : -1;

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
                    <div className="flex items-center gap-4 mt-2">
                        <div className="flex items-center gap-1.5 text-[11px] font-medium text-emerald-400 bg-emerald-500/10 px-2.5 py-1 rounded-full border border-emerald-500/20">
                            <div className="w-2 h-2 rounded-full bg-emerald-500"></div> Khách Vãng lai
                        </div>
                        <div className="flex items-center gap-1.5 text-[11px] font-medium text-purple-400 bg-purple-500/10 px-2.5 py-1 rounded-full border border-purple-500/20">
                            <div className="w-2 h-2 rounded-full bg-purple-500"></div> Khách Cố định
                        </div>
                        <div className="flex items-center gap-1.5 text-[11px] font-medium text-gray-400 bg-gray-500/10 px-2.5 py-1 rounded-full border border-gray-500/20">
                            <div className="w-2 h-2 rounded-full bg-gray-500"></div> Khóa sân / Offline
                        </div>
                    </div>
                </div>

                <div className="flex items-center gap-3">
                    <button
                        onClick={handleToday}
                        className="px-4 py-2 text-sm font-medium bg-white/5 border border-white/10 hover:bg-white/10 text-white rounded-xl transition-colors shadow-sm"
                    >
                        Hôm nay
                    </button>
                    <div className="flex items-center gap-1 bg-black/40 p-1.5 rounded-xl border border-white/10 shadow-inner backdrop-blur-md">
                        <button
                            onClick={handlePrevDay}
                            className="p-2 hover:bg-white/10 rounded-lg text-gray-400 hover:text-white transition-colors"
                        >
                            <ChevronLeft className="h-5 w-5" />
                        </button>

                        <DatePicker selectedDate={selectedDate} onDateSelect={setSelectedDate} />

                        <button
                            onClick={handleNextDay}
                            className="p-2 hover:bg-white/10 rounded-lg text-gray-400 hover:text-white transition-colors"
                        >
                            <ChevronRight className="h-5 w-5" />
                        </button>
                    </div>
                </div>
            </div>

            {/* Grid Area */}
            <div className="bg-[#0a0f16]/60 backdrop-blur-3xl rounded-2xl border border-white/5 flex flex-col flex-1 min-h-0 overflow-hidden relative shadow-[0_8px_30px_rgb(0,0,0,0.4)]">
                {isLoading && (
                    <div className="absolute inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center">
                        <Loader2 className="h-8 w-8 animate-spin text-emerald-500" />
                    </div>
                )}

                {/* Scrollable Container */}
                <div className="flex-1 overflow-auto bg-transparent scroll-smooth">
                    <div className="min-w-[1440px] flex flex-col min-h-full">

                        {/* Fixed Header Row */}
                        <div className="flex border-b border-white/5 bg-[#0a0f16]/95 sticky top-0 z-30 shrink-0 shadow-sm backdrop-blur-xl h-12">
                            <div className="w-48 shrink-0 px-4 border-r border-white/5 font-medium text-emerald-400 flex items-center justify-center bg-transparent sticky left-0 z-40 shadow-[2px_0_8px_-4px_rgba(0,0,0,0.5)]">
                                Danh sách Sân
                            </div>
                            <div className="flex-1 relative">
                                {Array.from({ length: TOTAL_HOURS + 1 }).map((_, i) => {
                                    const hour = START_HOUR + i;
                                    const left = (i / TOTAL_HOURS) * 100;
                                    return (
                                        <div 
                                            key={`tick-${hour}`} 
                                            className="absolute top-0 bottom-0 flex flex-col items-center justify-end pb-1"
                                            style={{ left: `${left}%`, transform: 'translateX(-50%)' }}
                                        >
                                            <span className="text-[11px] font-bold text-gray-400">
                                                {hour.toString().padStart(2, '0')}:00
                                            </span>
                                            <div className="w-px h-2 bg-white/20 mt-1" />
                                        </div>
                                    );
                                })}
                            </div>
                        </div>

                        {/* Body */}
                        <div className="flex flex-col flex-1 relative">
                            {/* Current Time Indicator */}
                            {isToday && currentPos >= 0 && currentPos <= 100 && (
                                <div 
                                    className="absolute top-0 bottom-0 w-px bg-red-500 z-30 pointer-events-none shadow-[0_0_8px_rgba(239,68,68,0.8)]"
                                    style={{ left: `calc(12rem + calc((100% - 12rem) * ${currentPos / 100}))` }}
                                >
                                    <div className="absolute top-0 -translate-x-1/2 w-2 h-2 rounded-full bg-red-500 shadow-[0_0_8px_rgba(239,68,68,1)] animate-pulse" />
                                </div>
                            )}

                            {courts.length === 0 ? (
                                <div className="p-12 text-center text-gray-400">
                                    Chưa có sân nào. Vui lòng vào mục "Cấu hình giá sân" để thêm sân trước.
                                </div>
                            ) : (
                                courts.map(court => {
                                    const courtBookings = bookings.filter(b => b.subCourtId === court._id);
                                    return (
                                        <div key={court._id} className="flex border-b border-white/5 min-h-[80px] hover:bg-white/5 transition-colors group">
                                            {/* Row Label */}
                                            <div className="w-48 shrink-0 p-4 border-r border-white/5 bg-[#0a0f16]/90 backdrop-blur-md flex flex-col justify-center sticky left-0 z-20 shadow-[2px_0_8px_-4px_rgba(0,0,0,0.5)]">
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
                                                            className="flex-1 border-r border-white/5 hover:bg-white/10 transition-colors cursor-crosshair relative group/grid"
                                                            onClick={() => openBlockModal(court._id, hour)}
                                                            title="Click để thêm lịch Offline"
                                                        >
                                                            {/* Half-hour dashed line */}
                                                            <div className="absolute top-0 bottom-0 left-1/2 border-l border-dashed border-white/5 pointer-events-none" />
                                                        </div>
                                                    ))}
                                                </div>

                                                {/* Booking Blocks */}
                                                {courtBookings.map(booking => {
                                                    const isOffline = booking.notes?.includes('Offline') || !booking.userId;
                                                    const isFixed = booking.type === 'fixed';
                                                    
                                                    let colorClasses = 'bg-gradient-to-r from-emerald-500/20 to-teal-500/20 border-emerald-500/40 text-emerald-100 hover:border-emerald-400/70 hover:from-emerald-500/30 hover:to-teal-500/30 hover:shadow-[0_0_15px_rgba(16,185,129,0.3)] backdrop-blur-md';
                                                    let icon = <User className="h-3 w-3 shrink-0 opacity-70 text-emerald-400" />;
                                                    
                                                    if (isOffline) {
                                                        colorClasses = 'bg-gradient-to-r from-gray-500/10 to-gray-500/5 border-gray-500/20 text-gray-300 hover:border-gray-400/50 hover:bg-gray-500/20 backdrop-blur-md shadow-inner';
                                                        icon = <Lock className="h-3 w-3 shrink-0 opacity-70 text-gray-400" />;
                                                    } else if (isFixed) {
                                                        colorClasses = 'bg-gradient-to-r from-purple-500/20 to-fuchsia-500/20 border-purple-500/40 text-purple-100 hover:border-purple-400/70 hover:from-purple-500/30 hover:to-fuchsia-500/30 hover:shadow-[0_0_15px_rgba(168,85,247,0.3)] backdrop-blur-md';
                                                        icon = <Repeat className="h-3 w-3 shrink-0 opacity-70 text-purple-400" />;
                                                    }

                                                    return (
                                                        <div
                                                            key={booking._id}
                                                            onClick={(e) => {
                                                                e.stopPropagation();
                                                                setSelectedBooking(booking);
                                                            }}
                                                            className={`absolute top-[2px] bottom-[2px] rounded-sm px-2.5 py-1 text-xs overflow-hidden border shadow-sm z-10 transition-all hover:z-20 cursor-pointer flex flex-col justify-center ${colorClasses}`}
                                                            style={getBookingStyle(booking.startTime, booking.endTime)}
                                                            title={`${booking.startTime} - ${booking.endTime}\n${isOffline ? 'Khách Offline / Bảo trì' : `Khách App: ${booking.userId?.displayName || 'Khách'}`}`}
                                                        >
                                                            <div className="font-medium truncate text-[10px] opacity-80 mb-0.5 tracking-wide">
                                                                {booking.startTime} - {booking.endTime}
                                                            </div>
                                                            <div className="flex items-center gap-1.5 truncate font-medium text-[11px]">
                                                                {icon} <span className="truncate">{isOffline ? 'Offline' : booking.userId?.displayName?.split(' ')[0] || 'Khách'}</span>
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
                <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/60 backdrop-blur-md" onClick={() => setIsModalOpen(false)}>
                    <div className="bg-[#0a0f16]/90 backdrop-blur-3xl rounded-3xl border border-white/10 w-full max-w-md overflow-hidden shadow-[0_10px_50px_rgba(0,0,0,0.5)] animate-in fade-in zoom-in-95 duration-200" onClick={e => e.stopPropagation()}>
                        <div className="p-6 border-b border-white/5 bg-white/5">
                            <h2 className="text-xl font-semibold text-white flex items-center gap-2">
                                <Lock className="h-5 w-5 text-emerald-400" />
                                Khóa Slot / Lịch Offline
                            </h2>
                        </div>
                        <form onSubmit={handleBlockSlot} className="p-6 space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-400 mb-1.5">Sân <span className="text-red-500">*</span></label>
                                <select
                                    required
                                    className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-2.5 text-white focus:ring-2 focus:ring-emerald-500 outline-none shadow-inner transition-all hover:border-white/20"
                                    value={blockData.subCourtId}
                                    onChange={e => setBlockData({ ...blockData, subCourtId: e.target.value })}
                                >
                                    <option value="" disabled>-- Chọn sân --</option>
                                    {courts.map(c => (
                                        <option key={c._id} value={c._id}>{c.name}</option>
                                    ))}
                                </select>
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-400 mb-1.5">Giờ bắt đầu <span className="text-red-500">*</span></label>
                                    <input
                                        type="time"
                                        required
                                        className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-2.5 text-white focus:ring-2 focus:ring-emerald-500 outline-none shadow-inner transition-all hover:border-white/20 [color-scheme:dark]"
                                        value={blockData.startTime}
                                        onChange={e => setBlockData({ ...blockData, startTime: e.target.value })}
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-400 mb-1.5">Giờ kết thúc <span className="text-red-500">*</span></label>
                                    <input
                                        type="time"
                                        required
                                        className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-2.5 text-white focus:ring-2 focus:ring-emerald-500 outline-none shadow-inner transition-all hover:border-white/20 [color-scheme:dark]"
                                        value={blockData.endTime}
                                        onChange={e => setBlockData({ ...blockData, endTime: e.target.value })}
                                    />
                                </div>
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-400 mb-1.5 flex items-center gap-1.5">
                                    Ghi chú <span className="text-gray-500 italic font-normal text-xs">(Không bắt buộc)</span>
                                </label>
                                <input
                                    type="text"
                                    className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-2.5 text-white focus:ring-2 focus:ring-emerald-500 outline-none shadow-inner transition-all hover:border-white/20"
                                    placeholder="VD: Khách lẻ vãng lai, Dọn vệ sinh..."
                                    value={blockData.notes}
                                    onChange={e => setBlockData({ ...blockData, notes: e.target.value })}
                                />
                            </div>

                            <div className="flex gap-3 pt-4">
                                <button
                                    type="button"
                                    onClick={() => setIsModalOpen(false)}
                                    className="flex-1 px-4 py-2.5 bg-white/5 border border-white/10 text-white rounded-xl hover:bg-white/10 transition-colors font-medium shadow-sm"
                                >
                                    Hủy
                                </button>
                                <button
                                    type="submit"
                                    disabled={isSaving}
                                    className="flex-1 px-4 py-2.5 bg-emerald-500 text-white rounded-xl hover:bg-emerald-600 transition-colors disabled:opacity-50 flex items-center justify-center font-bold shadow-[0_0_15px_rgba(16,185,129,0.3)] gap-2"
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
                <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/60 backdrop-blur-md" onClick={() => setSelectedBooking(null)}>
                    <div className="bg-[#0a0f16]/90 backdrop-blur-3xl rounded-3xl border border-white/10 w-full max-w-md overflow-hidden shadow-[0_10px_50px_rgba(0,0,0,0.5)] animate-in fade-in zoom-in-95 duration-200" onClick={e => e.stopPropagation()}>
                        <div className="p-6 border-b border-white/5 flex justify-between items-center bg-white/5">
                            <h2 className="text-xl font-semibold text-white flex items-center gap-2">
                                <Info className="h-5 w-5 text-emerald-400" />
                                Chi tiết Lượt đặt
                            </h2>
                            <button onClick={() => setSelectedBooking(null)} className="text-gray-400 hover:text-white transition-colors">
                                <X className="h-5 w-5" />
                            </button>
                        </div>
                        <div className="p-6 space-y-4 text-sm">
                            <div className="flex justify-between border-b border-white/5 pb-3">
                                <span className="text-gray-400 flex items-center gap-2"><User className="h-4 w-4" /> Khách hàng</span>
                                <span className="text-white font-medium">{selectedBooking.userId?.displayName || 'Khách vãng lai / Offline'}</span>
                            </div>
                            <div className="flex justify-between border-b border-white/5 pb-3">
                                <span className="text-gray-400 flex items-center gap-2">Số điện thoại</span>
                                <span className="text-white font-medium">{selectedBooking.userId?.phone || 'Chưa cập nhật'}</span>
                            </div>
                            <div className="flex justify-between border-b border-white/5 pb-3">
                                <span className="text-gray-400 flex items-center gap-2">Mã đơn</span>
                                <span className="text-emerald-400 font-medium tracking-wider">{selectedBooking.bookingCode || '---'}</span>
                            </div>
                            <div className="flex justify-between border-b border-white/5 pb-3">
                                <span className="text-gray-400 flex items-center gap-2"><Clock className="h-4 w-4" /> Thời gian</span>
                                <span className="text-white font-medium">{selectedBooking.startTime} - {selectedBooking.endTime}</span>
                            </div>
                            <div className="flex justify-between border-b border-white/5 pb-3">
                                <span className="text-gray-400 flex items-center gap-2">Loại đặt sân</span>
                                <span className="text-white font-medium capitalize">{selectedBooking.type === 'casual' ? 'Vãng lai' : selectedBooking.type}</span>
                            </div>
                            <div className="flex justify-between border-b border-white/5 pb-3">
                                <span className="text-gray-400 flex items-center gap-2">Tổng tiền</span>
                                <span className="text-emerald-400 font-bold text-base">
                                    {selectedBooking.finalAmount != null ? new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(selectedBooking.finalAmount) : '0 đ'}
                                </span>
                            </div>
                            <div className="flex justify-between border-b border-white/5 pb-3">
                                <span className="text-gray-400 flex items-center gap-2">Trạng thái thanh toán</span>
                                <span className={`font-medium px-2 py-0.5 rounded-full text-[10px] uppercase tracking-wider ${selectedBooking.payment?.status === 'paid' ? 'bg-white/10 text-gray-400 border border-white/5' : 'bg-orange-500/10 text-orange-400 border border-orange-500/20 shadow-[0_0_10px_rgba(249,115,22,0.1)]'}`}>
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
                        <div className="p-4 bg-white/5 border-t border-white/5 flex justify-end">
                            <button
                                onClick={() => setSelectedBooking(null)}
                                className="px-5 py-2.5 bg-white/5 hover:bg-white/10 text-white rounded-xl transition-colors font-medium border border-white/10 shadow-sm"
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
