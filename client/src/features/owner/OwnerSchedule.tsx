import { useState, useEffect } from 'react';
import { ownerApi } from '../../services/ownerApi';
import { useAlertStore } from '../../stores/useAlertStore';
import { Calendar, ChevronLeft, ChevronRight, Loader2, Lock, User } from 'lucide-react';
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
    subCourtId: string;
    startTime: string;
    endTime: string;
    status: string;
    type: string;
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
                <Loader2 className="h-8 w-8 animate-spin text-purple-500" />
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
                        <Calendar className="h-4 w-4 text-purple-400" />
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
                        <Loader2 className="h-8 w-8 animate-spin text-purple-500" />
                    </div>
                )}
                
                {/* Fixed Header Row */}
                <div className="flex border-b border-gray-700 bg-gray-800/80 sticky top-0 z-20 shrink-0">
                    <div className="w-48 shrink-0 p-4 border-r border-gray-700 font-medium text-gray-400 flex items-center justify-center bg-gray-800/80">
                        Danh sách Sân
                    </div>
                    <div className="flex-1 relative min-w-[800px] flex">
                        {hours.map(hour => (
                            <div key={`header-${hour}`} className="flex-1 border-r border-gray-700/50 p-2 text-center text-sm font-medium text-gray-400">
                                {hour.toString().padStart(2, '0')}:00
                            </div>
                        ))}
                    </div>
                </div>

                {/* Scrollable Body */}
                <div className="flex-1 overflow-auto">
                    <div className="min-w-[800px] flex flex-col">
                        {courts.length === 0 ? (
                            <div className="p-12 text-center text-gray-400">
                                Chưa có sân nào. Vui lòng vào mục "Sân bóng" để thêm sân trước.
                            </div>
                        ) : (
                            courts.map(court => {
                                const courtBookings = bookings.filter(b => b.subCourtId === court._id);
                                return (
                                    <div key={court._id} className="flex border-b border-gray-700/50 min-h-[80px] hover:bg-gray-700/20 transition-colors group">
                                        {/* Row Label */}
                                        <div className="w-48 shrink-0 p-4 border-r border-gray-700 bg-gray-800/50 flex flex-col justify-center sticky left-0 z-10">
                                            <span className="font-semibold text-white truncate" title={court.name}>{court.name}</span>
                                            <span className="text-xs text-gray-500">{court.sportType}</span>
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
                                                        className={`absolute top-2 bottom-2 rounded-lg p-2 text-xs overflow-hidden border shadow-lg z-10 transition-transform hover:scale-[1.02] cursor-default
                                                            ${isOffline 
                                                                ? 'bg-gray-700/90 border-gray-600 text-gray-300' 
                                                                : 'bg-purple-500/20 border-purple-500/50 text-purple-200'
                                                            }
                                                        `}
                                                        style={getBookingStyle(booking.startTime, booking.endTime)}
                                                        title={`${booking.startTime} - ${booking.endTime}\n${isOffline ? 'Khách Offline / Bảo trì' : `Khách App: ${booking.userId?.displayName || 'Khách'}`}`}
                                                    >
                                                        <div className="font-semibold truncate">
                                                            {booking.startTime} - {booking.endTime}
                                                        </div>
                                                        <div className="flex items-center gap-1 mt-1 truncate">
                                                            {isOffline ? (
                                                                <><Lock className="h-3 w-3" /> Offline</>
                                                            ) : (
                                                                <><User className="h-3 w-3" /> {booking.userId?.displayName}</>
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

            {/* Modal Thêm Lịch Offline */}
            {isModalOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
                    <div className="bg-gray-800 rounded-2xl border border-gray-700 w-full max-w-md overflow-hidden shadow-2xl">
                        <div className="p-6 border-b border-gray-700">
                            <h2 className="text-xl font-semibold text-white flex items-center gap-2">
                                <Lock className="h-5 w-5 text-purple-400" />
                                Khóa Slot / Lịch Offline
                            </h2>
                        </div>
                        <form onSubmit={handleBlockSlot} className="p-6 space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-400 mb-1.5">Sân</label>
                                <select 
                                    required
                                    className="w-full bg-gray-900 border border-gray-700 rounded-xl px-4 py-2.5 text-white focus:ring-2 focus:ring-purple-500 outline-none"
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
                                        className="w-full bg-gray-900 border border-gray-700 rounded-xl px-4 py-2.5 text-white focus:ring-2 focus:ring-purple-500 outline-none"
                                        value={blockData.startTime}
                                        onChange={e => setBlockData({...blockData, startTime: e.target.value})}
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-400 mb-1.5">Giờ kết thúc</label>
                                    <input 
                                        type="time" 
                                        required
                                        className="w-full bg-gray-900 border border-gray-700 rounded-xl px-4 py-2.5 text-white focus:ring-2 focus:ring-purple-500 outline-none"
                                        value={blockData.endTime}
                                        onChange={e => setBlockData({...blockData, endTime: e.target.value})}
                                    />
                                </div>
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-400 mb-1.5">Ghi chú (Tùy chọn)</label>
                                <input 
                                    type="text" 
                                    className="w-full bg-gray-900 border border-gray-700 rounded-xl px-4 py-2.5 text-white focus:ring-2 focus:ring-purple-500 outline-none"
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
                                    className="flex-1 bg-purple-500 hover:bg-purple-600 text-white py-2.5 rounded-xl font-medium transition-colors flex items-center justify-center gap-2"
                                >
                                    {isSaving && <Loader2 className="h-4 w-4 animate-spin" />}
                                    Lưu lại
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};
