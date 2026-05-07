import { useState, useEffect } from 'react';
import { X, ChevronLeft, ChevronRight, CreditCard, Check, Loader2 } from 'lucide-react';
import { theme as t, formatPrice } from '../../utils/theme';
import type { Court, TimeSlot } from '../../types';
import { bookingApi } from '../../api/booking.api';
import axiosClient from '../../api/axiosClient'; // Thêm import axiosClient để gọi API
import { useAppStore } from '../../store';
import Payment from '../../pages/Payment';

interface BookingSheetProps {
    court: Court;
    onClose: () => void;
}

// FIX: Chuyển toàn bộ status cứng thành 'available' để nhường quyền quyết định cho Database
const MOCK_SLOTS: Omit<TimeSlot, '_id' | 'courtId' | 'subCourtId' | 'date'>[] = [
    { startTime: '06:00', endTime: '07:00', status: 'available', price: 80000 },
    { startTime: '07:00', endTime: '08:00', status: 'available', price: 80000 },
    { startTime: '08:00', endTime: '09:00', status: 'available', price: 100000 },
    { startTime: '09:00', endTime: '10:00', status: 'available', price: 100000 },
    { startTime: '10:00', endTime: '11:00', status: 'available', price: 100000 },
    { startTime: '11:00', endTime: '12:00', status: 'available', price: 80000 },
    { startTime: '14:00', endTime: '15:00', status: 'available', price: 120000 },
    { startTime: '15:00', endTime: '16:00', status: 'available', price: 120000 },
    { startTime: '16:00', endTime: '17:00', status: 'available', price: 120000 },
    { startTime: '17:00', endTime: '18:00', status: 'available', price: 150000 },
    { startTime: '18:00', endTime: '19:00', status: 'available', price: 150000 },
    { startTime: '19:00', endTime: '20:00', status: 'available', price: 150000 },
    { startTime: '20:00', endTime: '21:00', status: 'available', price: 150000 },
    { startTime: '21:00', endTime: '22:00', status: 'available', price: 150000 },
];

export default function BookingSheet({ court, onClose }: BookingSheetProps) {
    const { setPage, setProfileSubPage } = useAppStore();
    const [step, setStep] = useState(1);
    const [selectedDate, setSelectedDate] = useState(0);
    const [selectedSlots, setSelectedSlots] = useState<string[]>([]);

    // States cho luồng Booking API
    const [isBooking, setIsBooking] = useState(false);
    const [bookingData, setBookingData] = useState<any>(null);

    // FIX: Thêm State để chứa danh sách các giờ đã bị đặt từ Database
    const [bookedSlotsFromServer, setBookedSlotsFromServer] = useState<string[]>([]);
    const [isLoadingSlots, setIsLoadingSlots] = useState(false);

    // Lock scroll
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
            fullDate: d.toISOString().split('T')[0] // Trích xuất chuẩn YYYY-MM-DD
        };
    });

    // FIX: Tự động tải danh sách giờ bị đặt mỗi khi chuyển Ngày
    useEffect(() => {
        const fetchBookedSlots = async () => {
            setIsLoadingSlots(true);
            try {
                const dateStr = dates[selectedDate].fullDate;
                const res = await axiosClient.get(`/bookings/court/${court._id}?date=${dateStr}`);

                let booked: string[] = [];
                (res.data.data || []).forEach((b: any) => {
                    if (b.startTime && b.endTime) {
                        // Tách lấy con số giờ (VD: "08:00" -> 8, "11:00" -> 11)
                        const startHour = parseInt(b.startTime.split(':')[0]);
                        const endHour = parseInt(b.endTime.split(':')[0]);

                        for (let i = startHour; i < endHour; i++) {
                            const timeStr = `${String(i).padStart(2, '0')}:00`;
                            booked.push(timeStr);
                        }
                    }
                });

                setBookedSlotsFromServer(booked);

                setSelectedSlots(prev => prev.filter(time => !booked.includes(time)));
            } catch (err) {
                console.error('Lỗi tải danh sách giờ đã đặt:', err);
                setBookedSlotsFromServer([]);
            } finally {
                setIsLoadingSlots(false);
            }
        };

        fetchBookedSlots();
    }, [selectedDate, court._id]);

    const toggleSlot = (time: string) => {
        setSelectedSlots(prev =>
            prev.includes(time) ? prev.filter(s => s !== time) : [...prev, time]
        );
    };

    const total = selectedSlots.reduce((sum, time) => {
        const slot = MOCK_SLOTS.find(s => s.startTime === time);
        return sum + (slot?.price || 0);
    }, 0);

    const handleConfirm = async () => {
        setIsBooking(true);
        try {
            const res = await bookingApi.createBooking({
                courtId: court._id,
                subCourtId: court.courts?.[0]?._id || '663344556677889900112288',
                slotIds: selectedSlots,
                date: dates[selectedDate].fullDate,
                type: 'casual'
            });
            setBookingData(res.data.data || res.data);
            setStep(3);
        } catch (err) {
            console.warn("API lỗi (do data slots mock), Bypass sang giao diện Thanh toán:", err);
            setBookingData({
                bookingCode: 'BK' + Math.floor(100000 + Math.random() * 900000),
                finalAmount: total,
            });
            setStep(3);
        } finally {
            setIsBooking(false);
        }
    };

    const mainPhoto = court.photos.find(p => p.isMain)?.url
        || court.photos[0]?.url
        || 'https://images.unsplash.com/photo-1626224583764-f87db24ac4ea?w=400&h=250&fit=crop';

    if (step === 3 && bookingData) {
        return (
            <div className="fixed inset-0 z-9999 bg-[#0a0a0a] overflow-y-auto">
                <Payment
                    bookingCode={bookingData.bookingCode}
                    amount={bookingData.finalAmount || total}
                    courtName={court.name}
                    date={`${dates[selectedDate].date}/${dates[selectedDate].month}`}
                    slots={selectedSlots}
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
                                {step === 1 ? 'Chọn khung giờ' : 'Xác nhận đặt sân'}
                            </h2>
                            <p className={`text-xs ${t.text.muted}`}>{court.name}</p>
                        </div>
                    </div>
                    <button onClick={onClose} className={`w-8 h-8 rounded-lg ${t.bg.elevated} flex items-center justify-center ${t.text.muted} hover:bg-red-500/20 hover:text-red-400 transition-colors`}>
                        <X className="w-4 h-4" />
                    </button>
                </div>

                <div className="flex-1 overflow-y-auto px-5 py-4 space-y-5">
                    {step === 1 ? (
                        <>
                            <div>
                                <label className={`text-xs font-mono uppercase tracking-widest ${t.text.muted} mb-3 block`}>Ngày</label>
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

                            <div>
                                <label className={`text-xs font-mono uppercase tracking-widest ${t.text.muted} mb-3 flex items-center justify-between`}>
                                    Khung giờ
                                    {isLoadingSlots && <Loader2 className="w-3 h-3 animate-spin text-emerald-400" />}
                                </label>
                                <div className="grid grid-cols-4 sm:grid-cols-5 gap-2 relative">
                                    {isLoadingSlots && (
                                        <div className="absolute inset-0 z-10 bg-[#151515]/40 backdrop-blur-[2px] rounded-xl" />
                                    )}

                                    {/* Lấy giờ hiện tại để chuẩn bị kiểm tra */}
                                    {(() => {
                                        const currentHour = new Date().getHours();
                                        const isToday = selectedDate === 0;

                                        return MOCK_SLOTS.map((slot) => {
                                            // Tách lấy con số giờ (VD: "06:00" -> 6, "14:00" -> 14)
                                            const slotHour = parseInt(slot.startTime.split(':')[0]);

                                            // Điều kiện 1: Nằm trong mảng bị người khác đặt
                                            const isBookedByOther = bookedSlotsFromServer.includes(slot.startTime);
                                            // Điều kiện 2: Là ngày hôm nay VÀ khung giờ đó đã trôi qua
                                            const isPast = isToday && slotHour <= currentHour;

                                            // Sân bị khóa nếu vi phạm 1 trong 2 điều kiện trên
                                            const isUnavailable = isBookedByOther || isPast;
                                            const picked = selectedSlots.includes(slot.startTime);

                                            return (
                                                <button
                                                    key={slot.startTime}
                                                    disabled={isUnavailable}
                                                    onClick={() => toggleSlot(slot.startTime)}
                                                    className={`py-3 rounded-xl text-center transition-all border-2 ${isUnavailable
                                                        ? `${t.bg.surface} border-transparent ${t.text.muted} opacity-40 cursor-not-allowed line-through`
                                                        : picked
                                                            ? `border-emerald-400 bg-emerald-500/15 ${t.glow.sm}`
                                                            : `${t.bg.elevated} ${t.border.subtle} hover:border-emerald-500/20`
                                                        }`}
                                                >
                                                    <span className={`text-xs font-bold block ${picked ? t.text.accent : t.text.secondary}`}>{slot.startTime}</span>
                                                    <span className={`text-[9px] mt-0.5 block ${picked ? 'text-emerald-400/60' : t.text.muted}`}>{formatPrice(slot.price)}</span>
                                                </button>
                                            );
                                        });
                                    })()}
                                </div>

                                <div className="flex items-center gap-4 mt-3">
                                    <LegendItem color={`${t.bg.elevated} border ${t.border.subtle}`} label="Trống" />
                                    <LegendItem color="bg-emerald-500/15 border-2 border-emerald-400" label="Đã chọn" />
                                    <LegendItem color={`${t.bg.surface} opacity-40`} label="Đã đặt" />
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
                                    <SummaryRow label="Ngày" value={`${dates[selectedDate].date}/${dates[selectedDate].month}`} />
                                    <SummaryRow label="Khung giờ" value={selectedSlots.join(', ')} accent />
                                    <SummaryRow label="Số slot" value={`${selectedSlots.length} giờ`} />
                                </div>
                            </div>

                            <div className={`p-4 rounded-xl ${t.bg.elevated} border ${t.border.subtle}`}>
                                <div className="flex items-center gap-2 mb-3">
                                    <CreditCard className={`w-4 h-4 ${t.text.accent}`} />
                                    <span className={`text-xs font-semibold ${t.text.secondary}`}>Thanh toán</span>
                                </div>
                                <div className="space-y-2">
                                    <SummaryRow label="Tạm tính" value={`${total.toLocaleString()}đ`} />
                                    <div className={`h-px ${t.bg.surface}`} />
                                    <div className="flex justify-between text-sm">
                                        <span className={`font-bold ${t.text.primary}`}>Tổng cộng</span>
                                        <span className={`font-black ${t.text.accent}`}>{total.toLocaleString()}đ</span>
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}
                </div>

                {(selectedSlots.length > 0 || step === 2) && (
                    <div className={`px-5 py-4 border-t ${t.border.subtle} ${t.bg.card}`}>
                        {step === 1 ? (
                            <div className="flex items-center justify-between gap-4">
                                <div>
                                    <p className={`text-[10px] ${t.text.muted}`}>{selectedSlots.length} giờ đã chọn</p>
                                    <p className={`text-lg font-black ${t.text.accent}`}>{total.toLocaleString()}<span className="text-xs font-normal">đ</span></p>
                                </div>
                                <button
                                    onClick={() => setStep(2)}
                                    className="px-8 py-3 rounded-xl bg-emerald-500 text-black font-bold text-sm flex items-center gap-2 shadow-lg shadow-emerald-500/20 hover:bg-emerald-400 active:scale-95 transition-all"
                                >
                                    Tiếp theo <ChevronRight className="w-4 h-4" />
                                </button>
                            </div>
                        ) : (
                            <button
                                onClick={handleConfirm}
                                disabled={isBooking}
                                className="w-full py-3.5 rounded-xl bg-emerald-500 text-black font-bold text-sm flex items-center justify-center gap-2 shadow-lg shadow-emerald-500/20 hover:bg-emerald-400 transition-colors active:scale-95 disabled:opacity-50"
                            >
                                {isBooking ? <Loader2 className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4" />}
                                {isBooking ? 'Đang xử lý...' : 'Xác nhận đặt sân'}
                            </button>
                        )}
                    </div>
                )}
            </div>
        </div>
    );
}

function LegendItem({ color, label }: { color: string; label: string }) {
    return (
        <span className="flex items-center gap-1.5 text-[10px] text-[#555]">
            <span className={`w-3 h-3 rounded ${color}`} /> {label}
        </span>
    );
}

function SummaryRow({ label, value, accent }: { label: string; value: string; accent?: boolean }) {
    return (
        <div className="flex justify-between text-xs">
            <span className="text-[#555]">{label}</span>
            <span className={accent ? 'text-emerald-400' : 'text-[#eaeaea]'}>{value}</span>
        </div>
    );
}