import { useState, useEffect, useMemo } from 'react';
import { X, ChevronLeft, ChevronRight, CreditCard, Check, Loader2, Clock, AlertTriangle } from 'lucide-react';
import { theme as t } from '../../utils/theme';
import type { Court } from '../../types';
import { bookingApi } from '../../api/booking.api';
import axiosClient from '../../api/axiosClient';
import { useAppStore } from '../../store';
import Payment from '../../pages/Payment';
import { useAlertStore } from '../../stores/useAlertStore';

interface BookingSheetProps {
    court: Court;
    onClose: () => void;
}

// HÀM TẠO DANH SÁCH GIỜ (Bước nhảy 30 phút, từ 06:00 đến 22:00)
const generateTimeOptions = () => {
    const times = [];
    for (let h = 6; h <= 22; h++) {
        times.push(`${String(h).padStart(2, '0')}:00`);
        if (h !== 22) times.push(`${String(h).padStart(2, '0')}:30`);
    }
    return times;
};
const TIME_OPTIONS = generateTimeOptions();

// HÀM ĐỔI GIỜ RA PHÚT ĐỂ SO SÁNH (VD: "01:30" -> 90)
const timeToMins = (timeStr: string) => {
    const [h, m] = timeStr.split(':').map(Number);
    return h * 60 + m;
};

export default function BookingSheet({ court, onClose }: BookingSheetProps) {
    const { user, setPage, setProfileSubPage } = useAppStore();
    const [step, setStep] = useState(1);
    const [selectedDate, setSelectedDate] = useState(0);

    const [startTime, setStartTime] = useState('17:00');
    const [endTime, setEndTime] = useState('19:00');

    const [isBooking, setIsBooking] = useState(false);
    const [bookingData, setBookingData] = useState<any>(null);

    // Lưu các dải giờ đã bị đặt từ Server: [{ start: 1020, end: 1140 }, ...]
    const [bookedRanges, setBookedRanges] = useState<{ start: number; end: number }[]>([]);
    const [isLoadingSlots, setIsLoadingSlots] = useState(false);

    useEffect(() => {
        document.body.style.overflow = 'hidden';
        return () => { document.body.style.overflow = ''; };
    }, []);

    const dates = Array.from({ length: 7 }).map((_, i) => {
        const d = new Date();
        d.setDate(d.getDate() + i);
        return {
            day: d.toLocaleDateString('vi-VN', { weekday: 'short' }),
            date: d.getDate(),
            month: d.getMonth() + 1,
            fullDate: d.toISOString().split('T')[0]
        };
    });

    // Tải danh sách các giờ đã bị đặt của sân trong ngày
    useEffect(() => {
        const fetchBookedSlots = async () => {
            setIsLoadingSlots(true);
            try {
                const dateStr = dates[selectedDate].fullDate;
                const res = await axiosClient.get(`/bookings/court/${court._id}?date=${dateStr}`);

                const ranges: { start: number; end: number }[] = [];
                (res.data.data || []).forEach((b: any) => {
                    // Tránh các đơn đã Hủy/Từ chối
                    if (b.startTime && b.endTime && b.status !== 'CANCELLED' && b.status !== 'REJECTED') {
                        ranges.push({
                            start: timeToMins(b.startTime),
                            end: timeToMins(b.endTime)
                        });
                    }
                });
                setBookedRanges(ranges);
            } catch (err) {
                console.error('Lỗi tải danh sách giờ đã đặt:', err);
                setBookedRanges([]);
            } finally {
                setIsLoadingSlots(false);
            }
        };

        fetchBookedSlots();
    }, [selectedDate, court._id]);

    // TÍNH TOÁN & KIỂM TRA TÍNH HỢP LỆ CỦA GIỜ
    const validation = useMemo(() => {
        const startMins = timeToMins(startTime);
        const endMins = timeToMins(endTime);
        const durationHours = (endMins - startMins) / 60;

        let error = '';
        if (startMins >= endMins) {
            error = 'Giờ kết thúc phải sau giờ bắt đầu!';
        } else if (durationHours < 1) {
            error = 'Thời gian thuê sân tối thiểu là 1 giờ!';
        } else {
            // Kiểm tra chống trùng lịch (Overlap Check)
            const isOverlap = bookedRanges.some(range =>
                // Hai đoạn thời gian giao nhau khi: Start này < End kia VÀ End này > Start kia
                startMins < range.end && endMins > range.start
            );

            // Kiểm tra quá khứ (nếu là hôm nay)
            const isToday = selectedDate === 0;
            const currentMins = new Date().getHours() * 60 + new Date().getMinutes();
            if (isToday && startMins <= currentMins) {
                error = 'Không thể đặt sân trong quá khứ!';
            } else if (isOverlap) {
                error = 'Khung giờ này đã có người đặt, vui lòng chọn giờ khác!';
            }
        }

        // Tính tiền: Lấy giá cơ bản * số giờ
        const basePrice = court.pricePerHour?.[0]?.timeSlots?.[0]?.pricePerHour || 100000;
        const total = error === '' ? basePrice * durationHours : 0;

        return { error, durationHours, total };
    }, [startTime, endTime, bookedRanges, selectedDate, court]);


    const handleConfirm = async () => {
        if (!user) {
            useAlertStore.getState().showAlert('Bạn cần đăng nhập để có thể đặt sân nhé!', 'Thông báo', 'info');
            onClose();
            setPage('login');
            return;
        }
        setIsBooking(true);
        try {
            // Gửi startTime, endTime (Bỏ mảng slotIds cứng nhắc đi)
            const res = await bookingApi.createBooking({
                courtId: court._id,
                subCourtId: court.courts?.[0]?._id || '663344556677889900112288',
                slotIds: [], // Để mảng rỗng để không bị lỗi Type nếu backend vẫn đang bắt
                date: dates[selectedDate].fullDate,
                startTime: startTime,
                endTime: endTime,
                type: 'casual'
            });
            setBookingData(res.data.data || res.data);
            setStep(3);
        } catch (err: any) {
            useAlertStore.getState().showAlert(err.response?.data?.message || 'Có lỗi xảy ra khi đặt sân!', 'Thông báo', 'error');
        } finally {
            setIsBooking(false);
        }
    };

    const mainPhoto = court.photos.find(p => p.isMain)?.url
        || court.photos[0]?.url
        || 'https://images.unsplash.com/photo-1626224583764-f87db24ac4ea?w=400&fit=crop';

    if (step === 3 && bookingData) {
        return (
            <div className="fixed inset-0 z-9999 bg-[#0a0a0a] overflow-y-auto">
                <Payment
                    bookingCode={bookingData.bookingCode}
                    amount={bookingData.finalAmount || validation.total}
                    courtName={court.name}
                    date={`${dates[selectedDate].date}/${dates[selectedDate].month}`}
                    slots={[`${startTime} - ${endTime}`]}
                    onComplete={() => {
                        onClose();
                        setPage('profile');
                        setProfileSubPage('history');
                    }}
                    onBack={() => setStep(2)}
                />
            </div>
        );
    }

    return (
        <div className="fixed inset-0 z-100 flex items-end sm:items-center justify-center">
            <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" onClick={onClose} />

            <div className={`relative w-full sm:max-w-lg max-h-[90vh] ${t.bg.card} rounded-t-3xl sm:rounded-3xl border-t sm:border ${t.border.subtle} overflow-hidden flex flex-col`}>
                <div className="flex justify-center pt-3 pb-2 sm:hidden">
                    <div className="w-10 h-1 rounded-full bg-white/10" />
                </div>

                <div className={`px-5 pb-4 pt-2 border-b ${t.border.subtle} flex items-center justify-between`}>
                    <div className="flex items-center gap-3">
                        {step === 2 && (
                            <button onClick={() => setStep(1)} className={`w-8 h-8 rounded-lg ${t.bg.elevated} flex items-center justify-center ${t.text.muted} hover:text-white`}>
                                <ChevronLeft className="w-4 h-4" />
                            </button>
                        )}
                        <div>
                            <h2 className={`font-bold text-base ${t.text.primary}`}>
                                {step === 1 ? 'Tùy chọn giờ chơi' : 'Xác nhận đặt sân'}
                            </h2>
                            <p className={`text-xs ${t.text.muted}`}>{court.name}</p>
                        </div>
                    </div>
                    <button onClick={onClose} className={`w-8 h-8 rounded-lg ${t.bg.elevated} flex items-center justify-center ${t.text.muted} hover:bg-red-500/20 hover:text-red-400 transition-colors`}>
                        <X className="w-4 h-4" />
                    </button>
                </div>

                <div className="flex-1 overflow-y-auto px-5 py-4 space-y-6">
                    {step === 1 ? (
                        <>
                            {/* Chọn Ngày */}
                            <div>
                                <label className={`text-xs font-mono uppercase tracking-widest ${t.text.muted} mb-3 block`}>1. Chọn ngày chơi</label>
                                <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-none">
                                    {dates.map((d, i) => (
                                        <button
                                            key={i}
                                            onClick={() => setSelectedDate(i)}
                                            className={`shrink-0 w-14 py-3 rounded-xl flex flex-col items-center gap-1 border-2 transition-all ${selectedDate === i
                                                ? `border-emerald-400 bg-emerald-500/10 ${t.glow.sm}`
                                                : `${t.border.subtle} ${t.bg.elevated}`
                                                }`}
                                        >
                                            <span className={`text-[10px] font-medium ${selectedDate === i ? 'text-emerald-400' : t.text.muted}`}>{d.day}</span>
                                            <span className={`text-lg font-black ${selectedDate === i ? t.text.primary : t.text.secondary}`}>{d.date}</span>
                                        </button>
                                    ))}
                                </div>
                            </div>

                            {/* Chọn Giờ (Flexible Pickers) */}
                            <div className="relative">
                                {isLoadingSlots && (
                                    <div className="absolute inset-0 z-10 bg-black/50 backdrop-blur-[2px] rounded-xl flex items-center justify-center">
                                        <Loader2 className="w-6 h-6 text-emerald-500 animate-spin" />
                                    </div>
                                )}

                                <label className={`text-xs font-mono uppercase tracking-widest ${t.text.muted} mb-3 block`}>2. Khung giờ dự kiến</label>
                                <div className="flex items-center gap-4">
                                    <div className="flex-1">
                                        <p className="text-xs text-gray-500 mb-1.5 ml-1">Bắt đầu lúc</p>
                                        <div className={`relative rounded-xl border ${t.border.subtle} ${t.bg.elevated} overflow-hidden`}>
                                            <Clock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-emerald-500" />
                                            <select
                                                value={startTime}
                                                onChange={e => setStartTime(e.target.value)}
                                                className="w-full h-12 pl-10 pr-4 bg-transparent text-white font-bold outline-none cursor-pointer appearance-none"
                                            >
                                                {TIME_OPTIONS.map(t => <option key={`start-${t}`} value={t} className="bg-gray-900">{t}</option>)}
                                            </select>
                                        </div>
                                    </div>

                                    <div className="w-4 h-px bg-white/20 mt-6" />

                                    <div className="flex-1">
                                        <p className="text-xs text-gray-500 mb-1.5 ml-1">Kết thúc lúc</p>
                                        <div className={`relative rounded-xl border ${t.border.subtle} ${t.bg.elevated} overflow-hidden`}>
                                            <select
                                                value={endTime}
                                                onChange={e => setEndTime(e.target.value)}
                                                className="w-full h-12 pl-4 pr-4 bg-transparent text-white font-bold outline-none cursor-pointer appearance-none"
                                            >
                                                {TIME_OPTIONS.map(t => <option key={`end-${t}`} value={t} className="bg-gray-900">{t}</option>)}
                                            </select>
                                        </div>
                                    </div>
                                </div>

                                {/* Thông báo lỗi hoặc hợp lệ */}
                                <div className="mt-4">
                                    {validation.error ? (
                                        <div className="flex items-start gap-2 p-3 rounded-lg bg-red-500/10 border border-red-500/20 text-red-400 text-xs font-medium leading-relaxed">
                                            <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" />
                                            {validation.error}
                                        </div>
                                    ) : (
                                        <div className="flex justify-between items-center p-3 rounded-lg bg-emerald-500/10 border border-emerald-500/20">
                                            <span className="text-xs text-emerald-400 font-medium">Thời gian thuê: {validation.durationHours} giờ</span>
                                            <span className="text-emerald-400 font-black">{validation.total.toLocaleString()}đ</span>
                                        </div>
                                    )}
                                </div>
                            </div>
                        </>
                    ) : (
                        <div className="space-y-4">
                            <div className={`p-4 rounded-xl ${t.bg.elevated} border ${t.border.subtle} space-y-3`}>
                                <div className="flex items-center gap-3">
                                    <img src={mainPhoto} alt="" className="w-14 h-14 rounded-xl object-cover" />
                                    <div>
                                        <h3 className={`font-bold text-sm ${t.text.primary}`}>{court.name}</h3>
                                        <p className={`text-xs ${t.text.muted}`}>{court.address.district}</p>
                                    </div>
                                </div>
                                <div className={`h-px ${t.bg.surface}`} />
                                <div className="space-y-2">
                                    <SummaryRow label="Ngày chơi" value={`${dates[selectedDate].date}/${dates[selectedDate].month}/${new Date().getFullYear()}`} />
                                    <SummaryRow label="Thời gian" value={`${startTime} - ${endTime}`} accent />
                                    <SummaryRow label="Thời lượng" value={`${validation.durationHours} giờ`} />
                                </div>
                            </div>

                            <div className={`p-4 rounded-xl ${t.bg.elevated} border ${t.border.subtle}`}>
                                <div className="flex items-center gap-2 mb-3">
                                    <CreditCard className={`w-4 h-4 ${t.text.accent}`} />
                                    <span className={`text-xs font-semibold ${t.text.secondary}`}>Thanh toán</span>
                                </div>
                                <div className="space-y-2">
                                    <SummaryRow label="Tạm tính" value={`${validation.total.toLocaleString()}đ`} />
                                    <div className={`h-px ${t.bg.surface}`} />
                                    <div className="flex justify-between text-sm">
                                        <span className={`font-bold ${t.text.primary}`}>Tổng cộng</span>
                                        <span className={`font-black ${t.text.accent}`}>{validation.total.toLocaleString()}đ</span>
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}
                </div>

                <div className={`px-5 py-4 border-t ${t.border.subtle} ${t.bg.card}`}>
                    {step === 1 ? (
                        <button
                            onClick={() => setStep(2)}
                            disabled={validation.error !== '' || isLoadingSlots}
                            className="w-full py-4 rounded-xl bg-emerald-500 text-black font-black flex items-center justify-center gap-2 shadow-lg shadow-emerald-500/20 hover:bg-emerald-400 disabled:opacity-30 disabled:hover:bg-emerald-500 transition-all active:scale-95"
                        >
                            Tiếp tục thanh toán <ChevronRight className="w-5 h-5" />
                        </button>
                    ) : (
                        <button
                            onClick={handleConfirm}
                            disabled={isBooking}
                            className="w-full py-4 rounded-xl bg-emerald-500 text-black font-black flex items-center justify-center gap-2 shadow-lg shadow-emerald-500/20 hover:bg-emerald-400 transition-colors active:scale-95 disabled:opacity-50"
                        >
                            {isBooking ? <Loader2 className="w-5 h-5 animate-spin" /> : <Check className="w-5 h-5" />}
                            {isBooking ? 'Đang xử lý...' : 'Xác nhận đặt sân'}
                        </button>
                    )}
                </div>
            </div>
        </div>
    );
}

function SummaryRow({ label, value, accent }: { label: string; value: string; accent?: boolean }) {
    return (
        <div className="flex justify-between text-xs items-center">
            <span className="text-[#666] font-medium">{label}</span>
            <span className={`font-bold ${accent ? 'text-emerald-400 text-sm' : 'text-[#eaeaea]'}`}>{value}</span>
        </div>
    );
}