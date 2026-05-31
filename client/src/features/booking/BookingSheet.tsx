import { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence, type Variants } from 'framer-motion';
import { X, ChevronLeft, Check, Loader2, MapPin, AlertTriangle, Fingerprint, Zap, Repeat } from 'lucide-react';
import { formatPrice } from '../../utils/theme';
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

const generateTimeOptions = () => {
    const times = [];
    for (let h = 6; h <= 22; h++) {
        times.push(`${String(h).padStart(2, '0')}:00`);
        if (h !== 22) times.push(`${String(h).padStart(2, '0')}:30`);
    }
    return times;
};
const ALL_TIME_OPTIONS = generateTimeOptions();
const SLOTS = ALL_TIME_OPTIONS.slice(0, -1);

const timeToMins = (timeStr: string) => {
    if (!timeStr) return 0;
    const [h, m] = timeStr.split(':').map(Number);
    return h * 60 + m;
};

const minsToTime = (mins: number) => {
    const h = Math.floor(mins / 60);
    const m = mins % 60;
    return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`;
};

const sheetVariants: Variants = {
    hidden: { scale: 0.95, opacity: 0, y: 20 },
    visible: { scale: 1, opacity: 1, y: 0, transition: { type: "spring", damping: 25, stiffness: 200 } },
    exit: { scale: 0.95, opacity: 0, y: 20, transition: { ease: "easeInOut", duration: 0.2 } }
};

const stepVariants: Variants = {
    enter: (direction: number) => ({ x: direction > 0 ? 30 : -30, opacity: 0, scale: 0.98 }),
    center: { x: 0, opacity: 1, scale: 1, transition: { duration: 0.4, ease: [0.16, 1, 0.3, 1] } },
    exit: (direction: number) => ({ x: direction < 0 ? 30 : -30, opacity: 0, scale: 0.98, transition: { duration: 0.3, ease: [0.16, 1, 0.3, 1] } })
};

export default function BookingSheet({ court, onClose }: BookingSheetProps) {
    const { user, setPage, setProfileSubPage } = useAppStore();
    const [step, setStep] = useState(1);
    const [direction, setDirection] = useState(1);
    const [selectedDate, setSelectedDate] = useState(0);

    const [rangeStart, setRangeStart] = useState<string | null>(null);
    const [rangeEnd, setRangeEnd] = useState<string | null>(null);

    const [bookingType, setBookingType] = useState<'casual' | 'fixed'>('casual');
    const [fixedMonths, setFixedMonths] = useState<number>(1);
    const [selectedDaysOfWeek, setSelectedDaysOfWeek] = useState<number[]>([new Date().getDay()]);

    const toggleDayOfWeek = (day: number) => {
        setSelectedDaysOfWeek(prev => 
            prev.includes(day) && prev.length > 1
                ? prev.filter(d => d !== day)
                : [...new Set([...prev, day])]
        );
    };

    const [isBooking, setIsBooking] = useState(false);
    const [bookingData, setBookingData] = useState<any>(null);

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

    useEffect(() => {
        const fetchBookedSlots = async () => {
            setIsLoadingSlots(true);
            try {
                const dateStr = dates[selectedDate].fullDate;
                const res = await axiosClient.get(`/bookings/court/${court._id}?date=${dateStr}`);

                const ranges: { start: number; end: number }[] = [];
                (res.data.data || []).forEach((b: any) => {
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
            setRangeStart(null);
            setRangeEnd(null);
        };

        fetchBookedSlots();
    }, [selectedDate, court._id]);

    const isSlotBooked = (slot: string) => {
        const startMins = timeToMins(slot);
        const endMins = startMins + 30;
        if (selectedDate === 0) {
            const currentMins = new Date().getHours() * 60 + new Date().getMinutes();
            if (startMins <= currentMins) return true;
        }
        return bookedRanges.some(r => startMins < r.end && endMins > r.start);
    };

    const hasBookedSlotsBetween = (startSlot: string, endSlot: string) => {
        const startMins = timeToMins(startSlot);
        const endMins = timeToMins(endSlot);
        return SLOTS.some(slot => {
            const m = timeToMins(slot);
            if (m > startMins && m < endMins) return isSlotBooked(slot);
            return false;
        });
    };

    const handleSlotClick = (slot: string) => {
        if (isSlotBooked(slot)) return;

        if (!rangeStart || (rangeStart && rangeEnd)) {
            setRangeStart(slot);
            setRangeEnd(null);
        } else {
            const startMins = timeToMins(rangeStart);
            const clickMins = timeToMins(slot);
            
            if (startMins === clickMins) {
                setRangeStart(null);
            } else {
                const minTime = startMins < clickMins ? rangeStart : slot;
                const maxTime = startMins < clickMins ? slot : rangeStart;
                
                if (hasBookedSlotsBetween(minTime, maxTime)) {
                    setRangeStart(slot);
                    setRangeEnd(null);
                } else {
                    setRangeStart(minTime);
                    setRangeEnd(maxTime);
                }
            }
        }
    };

    const finalStartTime = rangeStart;
    const finalEndTime = rangeEnd 
        ? minsToTime(timeToMins(rangeEnd) + 30) 
        : (rangeStart ? minsToTime(timeToMins(rangeStart) + 30) : null);

    const validation = useMemo(() => {
        if (!finalStartTime || !finalEndTime) {
            return { error: 'Vui lòng chọn khung giờ trên bảng!', durationHours: 0, total: 0 };
        }

        const startMins = timeToMins(finalStartTime);
        const endMins = timeToMins(finalEndTime);
        const durationHours = (endMins - startMins) / 60;

        let error = '';
        if (durationHours < 1) {
            error = 'Thời gian thuê sân tối thiểu là 1 giờ (2 block)!';
        }

        const basePrice = court.pricePerHour?.[0]?.timeSlots?.[0]?.pricePerHour || 100000;
        const totalSessions = bookingType === 'fixed' ? fixedMonths * 4 * selectedDaysOfWeek.length : 1;
        const total = error === '' ? basePrice * durationHours * totalSessions : 0;

        return { error, durationHours, total, totalSessions };
    }, [finalStartTime, finalEndTime, court, bookingType, fixedMonths, selectedDaysOfWeek]);

    const handleConfirm = async () => {
        if (!user) {
            useAlertStore.getState().showAlert('Bạn cần đăng nhập để có thể đặt sân nhé!', 'Thông báo', 'info');
            onClose();
            setPage('login');
            return;
        }
        setIsBooking(true);
        try {
            const res = await bookingApi.createBooking({
                courtId: court._id,
                subCourtId: court.courts?.[0]?._id || '663344556677889900112288',
                slotIds: [], 
                date: dates[selectedDate].fullDate,
                startTime: finalStartTime!,
                endTime: finalEndTime!,
                type: bookingType,
                months: bookingType === 'fixed' ? fixedMonths : undefined,
                daysOfWeek: bookingType === 'fixed' ? selectedDaysOfWeek : undefined
            });
            setBookingData(res.data.data || res.data);
            changeStep(3);
        } catch (err: any) {
            useAlertStore.getState().showAlert(err.response?.data?.message || 'Có lỗi xảy ra khi đặt sân!', 'Thông báo', 'error');
        } finally {
            setIsBooking(false);
        }
    };

    const changeStep = (newStep: number) => {
        setDirection(newStep > step ? 1 : -1);
        setStep(newStep);
    };

    const mainPhoto = court.photos?.find(p => p.isMain)?.url || court.photos?.[0]?.url || 'https://images.unsplash.com/photo-1626224583764-f87db24ac4ea?w=400&fit=crop';

    if (step === 3 && bookingData) {
        return (
            <div className="fixed inset-0 z-[9999] bg-[#06080a] overflow-y-auto">
                <Payment
                    bookingCode={bookingData.bookingCode}
                    amount={bookingData.finalAmount || validation.total}
                    courtName={court.name}
                    date={`${dates[selectedDate].date}/${dates[selectedDate].month}`}
                    slots={[`${finalStartTime} - ${finalEndTime}`]}
                    onComplete={() => {
                        onClose();
                        setPage('profile');
                        setProfileSubPage('history');
                    }}
                    onBack={() => changeStep(2)}
                />
            </div>
        );
    }

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            {/* FULLSCREEN BLURRED BACKGROUND */}
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="absolute inset-0 overflow-hidden" onClick={onClose}>
                <div className="absolute inset-[-10%] bg-cover bg-center bg-no-repeat blur-[40px] opacity-30" style={{ backgroundImage: `url(${mainPhoto})` }} />
                <div className="absolute inset-0 bg-[#06080a]/80 backdrop-blur-2xl" />
            </motion.div>

            {/* MAIN HUD CONTAINER */}
            <motion.div 
                variants={sheetVariants} initial="hidden" animate="visible" exit="exit"
                className="relative w-full max-w-2xl bg-[#0a0c10]/70 rounded-3xl border border-white/5 shadow-[0_0_100px_-20px_rgba(16,185,129,0.3)] overflow-hidden flex flex-col backdrop-blur-3xl"
            >
                {/* HUD Decorative Lines */}
                <div className="absolute top-0 left-0 w-full h-[2px] bg-gradient-to-r from-transparent via-emerald-500/50 to-transparent opacity-50 pointer-events-none z-20" />

                {/* Header HUD */}
                <div className="px-6 py-5 flex items-center justify-between relative z-10 border-b border-white/5">
                    <div className="flex items-center gap-4">
                        {step === 2 && (
                            <button onClick={() => changeStep(1)} className="w-10 h-10 rounded-full border border-white/10 bg-black/40 flex items-center justify-center text-emerald-400 hover:bg-emerald-500/20 hover:border-emerald-500/50 hover:shadow-[0_0_15px_rgba(16,185,129,0.4)] transition-all">
                                <ChevronLeft className="w-5 h-5" />
                            </button>
                        )}
                        <div>
                            <div className="flex items-center gap-2 mb-1">
                                <Zap className="w-4 h-4 text-emerald-500 animate-pulse" />
                                <h2 className="font-black text-xl text-white tracking-widest uppercase">
                                {step === 1 ? 'LỊCH & GIỜ CHƠI' : 'XÁC NHẬN & THANH TOÁN'}
                            </h2>
                            </div>
                            <p className="text-xs text-emerald-400/80 font-mono tracking-widest">{court.name.toUpperCase()}</p>
                        </div>
                    </div>
                    <button onClick={onClose} className="w-10 h-10 rounded-full bg-black/40 border border-white/10 flex items-center justify-center text-gray-400 hover:bg-red-500/20 hover:text-red-400 hover:border-red-500/50 transition-all">
                        <X className="w-5 h-5" />
                    </button>
                </div>

                <div className="flex-1 overflow-x-hidden overflow-y-auto px-6 py-6 relative z-10 scrollbar-thin scrollbar-thumb-white/10">
                    <AnimatePresence mode="wait" custom={direction}>
                        {step === 1 ? (
                            <motion.div key="step1" custom={direction} variants={stepVariants} initial="enter" animate="center" exit="exit" className="space-y-8">
                                
                                {/* HUD TYPE SELECTOR */}
                                <div className="flex bg-black/40 border border-white/5 rounded-xl p-1">
                                    <button 
                                        onClick={() => setBookingType('casual')}
                                        className={`flex-1 py-3 text-xs font-mono font-black uppercase tracking-widest rounded-lg flex items-center justify-center gap-2 transition-all ${bookingType === 'casual' ? 'bg-emerald-500 text-black shadow-[0_0_15px_rgba(16,185,129,0.3)]' : 'text-gray-400 hover:text-white hover:bg-white/5'}`}
                                    >
                                        <Zap className="w-4 h-4" /> Vãng Lai
                                    </button>
                                    <button 
                                        onClick={() => setBookingType('fixed')}
                                        className={`flex-1 py-3 text-xs font-mono font-black uppercase tracking-widest rounded-lg flex items-center justify-center gap-2 transition-all ${bookingType === 'fixed' ? 'bg-emerald-500 text-black shadow-[0_0_15px_rgba(16,185,129,0.3)]' : 'text-gray-400 hover:text-white hover:bg-white/5'}`}
                                    >
                                        <Repeat className="w-4 h-4" /> Cố Định
                                    </button>
                                </div>
                                <AnimatePresence>
                                    {bookingType === 'fixed' && (
                                        <motion.div 
                                            initial={{ opacity: 0, height: 0, marginTop: -32 }}
                                            animate={{ opacity: 1, height: 'auto', marginTop: -16 }}
                                            exit={{ opacity: 0, height: 0, marginTop: -32 }}
                                            className="overflow-hidden"
                                        >
                                            <div className="flex items-center justify-between p-4 bg-emerald-500/10 border border-emerald-500/30 rounded-xl">
                                                <div className="flex items-center gap-3">
                                                    <Repeat className="w-5 h-5 text-emerald-400" />
                                                    <div>
                                                        <p className="text-[10px] font-black font-mono text-emerald-500 tracking-widest">THỜI GIAN ĐẶT</p>
                                                    </div>
                                                </div>
                                                <div className="flex items-center gap-2 bg-black/40 rounded-lg p-1 border border-emerald-500/20">
                                                    <button onClick={() => setFixedMonths(Math.max(1, fixedMonths - 1))} className="w-8 h-8 flex items-center justify-center text-emerald-500 hover:bg-emerald-500/20 rounded-md font-bold">-</button>
                                                    <span className="font-mono text-white w-14 text-center text-sm font-bold">{fixedMonths} THÁNG</span>
                                                    <button onClick={() => setFixedMonths(Math.min(12, fixedMonths + 1))} className="w-8 h-8 flex items-center justify-center text-emerald-500 hover:bg-emerald-500/20 rounded-md font-bold">+</button>
                                                </div>
                                            </div>
                                        </motion.div>
                                    )}
                                </AnimatePresence>

                                {/* HUD DATE PICKER / DAYS OF WEEK */}
                                {bookingType === 'casual' ? (
                                    <div>
                                        <div className="flex items-center justify-between mb-4">
                                            <label className="text-[10px] font-black font-mono uppercase tracking-[0.2em] text-emerald-500/80 flex items-center gap-2">
                                                CHỌN NGÀY
                                            </label>
                                            <div className="font-mono text-xs text-emerald-400 bg-emerald-500/10 px-3 py-1 rounded border border-emerald-500/20">
                                                THÁNG_{String(dates[selectedDate].month).padStart(2, '0')}
                                            </div>
                                        </div>
                                        
                                        <div className="flex gap-3 overflow-x-auto pb-4 scrollbar-none snap-x snap-mandatory mask-fade-edges">
                                            {dates.map((d, i) => {
                                                const isActive = selectedDate === i;
                                                return (
                                                    <button
                                                        key={i}
                                                        onClick={() => setSelectedDate(i)}
                                                        className={`relative shrink-0 w-[5rem] py-4 rounded-xl flex flex-col items-center justify-center gap-2 snap-center transition-all duration-300 bg-black/40 border ${isActive ? 'border-emerald-500/50' : 'border-white/5 hover:border-white/20'}`}
                                                    >
                                                        {isActive && (
                                                            <motion.div
                                                                layoutId="hud-date"
                                                                className="absolute inset-0 bg-emerald-500/10 border border-emerald-400 shadow-[inset_0_0_20px_rgba(16,185,129,0.2)] rounded-xl"
                                                                initial={false}
                                                                transition={{ type: "spring", stiffness: 300, damping: 25 }}
                                                            />
                                                        )}
                                                        <span className={`relative z-10 text-[10px] font-black tracking-widest uppercase font-mono ${isActive ? 'text-emerald-400 drop-shadow-[0_0_5px_rgba(16,185,129,0.8)]' : 'text-gray-500'}`}>
                                                            {d.day}
                                                        </span>
                                                        <span className={`relative z-10 text-2xl font-black font-mono ${isActive ? 'text-white drop-shadow-[0_0_10px_rgba(255,255,255,0.5)]' : 'text-gray-400'}`}>
                                                            {d.date}
                                                        </span>
                                                    </button>
                                                )
                                            })}
                                        </div>
                                    </div>
                                ) : (
                                    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="mb-4">
                                        <div className="flex items-center justify-between mb-4">
                                            <label className="text-[10px] font-black font-mono uppercase tracking-[0.2em] text-emerald-500/80 flex items-center gap-2">
                                                CHỌN THỨ TRONG TUẦN
                                            </label>
                                            <span className="text-[10px] text-gray-500 font-mono tracking-widest uppercase">Có thể chọn nhiều</span>
                                        </div>
                                        <div className="flex gap-2">
                                            {[1, 2, 3, 4, 5, 6, 0].map(day => {
                                                const isActive = selectedDaysOfWeek.includes(day);
                                                const label = day === 0 ? 'CN' : `T${day + 1}`;
                                                return (
                                                    <button
                                                        key={day}
                                                        onClick={() => toggleDayOfWeek(day)}
                                                        className={`flex-1 py-3 rounded-xl border font-mono font-black text-sm transition-all ${
                                                            isActive 
                                                            ? 'bg-emerald-500/20 border-emerald-400 text-white shadow-[inset_0_0_15px_rgba(16,185,129,0.3)]'
                                                            : 'bg-black/40 border-white/5 text-gray-500 hover:border-white/20 hover:text-gray-300'
                                                        }`}
                                                    >
                                                        {label}
                                                    </button>
                                                )
                                            })}
                                        </div>
                                    </motion.div>
                                )}

                                {/* HUD ENERGY GRID */}
                                <div className="relative">
                                    <div className="flex items-center justify-between mb-4">
                                        <label className="text-[10px] font-black font-mono uppercase tracking-[0.2em] text-emerald-500/80 flex items-center gap-2">
                                            CHỌN KHUNG GIỜ
                                        </label>
                                        <div className="flex gap-3 text-[9px] font-mono font-bold tracking-widest text-gray-500 uppercase">
                                            <span className="flex items-center gap-1"><div className="w-2 h-2 bg-emerald-500 shadow-[0_0_5px_#10b981]" /> ĐANG CHỌN</span>
                                            <span className="flex items-center gap-1"><div className="w-2 h-2 bg-red-500/20 border border-red-500/50" /> HẾT CHỖ</span>
                                        </div>
                                    </div>
                                    
                                    <div className="relative p-1">
                                        {isLoadingSlots && (
                                            <div className="absolute inset-0 z-10 bg-[#0a0c10]/80 backdrop-blur-sm flex items-center justify-center border border-emerald-500/30 rounded-xl">
                                                <div className="flex flex-col items-center gap-3">
                                                    <Loader2 className="w-8 h-8 text-emerald-500 animate-spin" />
                                                    <p className="font-mono text-xs text-emerald-400 tracking-widest animate-pulse">ĐANG TẢI DỮ LIỆU...</p>
                                                </div>
                                            </div>
                                        )}
                                        
                                        <div className="grid grid-cols-4 sm:grid-cols-6 md:grid-cols-8 gap-2">
                                            {SLOTS.map(slot => {
                                                const booked = isSlotBooked(slot);
                                                
                                                let isSelected = false;
                                                let isEndpoint = false;

                                                if (rangeStart) {
                                                    const sMins = timeToMins(slot);
                                                    const rStartMins = timeToMins(rangeStart);
                                                    
                                                    if (!rangeEnd) {
                                                        isSelected = slot === rangeStart;
                                                        isEndpoint = isSelected;
                                                    } else {
                                                        const rEndMins = timeToMins(rangeEnd);
                                                        isSelected = sMins >= Math.min(rStartMins, rEndMins) && sMins <= Math.max(rStartMins, rEndMins);
                                                        isEndpoint = slot === rangeStart || slot === rangeEnd;
                                                    }
                                                }

                                                return (
                                                    <button
                                                        key={slot}
                                                        onClick={() => handleSlotClick(slot)}
                                                        disabled={booked}
                                                        className={`relative h-12 rounded-[8px] text-xs font-mono font-bold transition-all duration-300 flex items-center justify-center overflow-hidden group ${
                                                            booked 
                                                                ? 'bg-red-500/5 text-red-500/40 border border-red-500/20 cursor-not-allowed opacity-50'
                                                                : isSelected
                                                                    ? 'bg-emerald-500/20 text-emerald-50 border border-emerald-400 shadow-[inset_0_0_15px_rgba(16,185,129,0.5),0_0_15px_rgba(16,185,129,0.3)]'
                                                                    : 'bg-black/40 text-gray-400 border border-white/5 hover:border-emerald-500/50 hover:text-white'
                                                        }`}
                                                    >
                                                        {/* Scanning line effect on hover */}
                                                        {!booked && !isSelected && (
                                                            <div className="absolute inset-0 bg-gradient-to-b from-transparent via-emerald-500/10 to-transparent -translate-y-full group-hover:animate-shimmer" />
                                                        )}
                                                        
                                                        <span className="relative z-10">{slot}</span>
                                                        
                                                        {isEndpoint && (
                                                            <div className="absolute top-1 right-1 w-1.5 h-1.5 bg-white rounded-full shadow-[0_0_5px_white] animate-pulse" />
                                                        )}
                                                        
                                                        {booked && (
                                                            <div className="absolute inset-0 flex items-center justify-center overflow-hidden">
                                                                <div className="w-full h-px bg-red-500/50 rotate-45 scale-150" />
                                                            </div>
                                                        )}
                                                    </button>
                                                )
                                            })}
                                        </div>
                                    </div>

                                    {/* HUD Validator */}
                                    <div className="mt-6">
                                        <AnimatePresence mode="wait">
                                            {validation.error ? (
                                                <motion.div 
                                                    key="error"
                                                    initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }}
                                                    className="flex items-center gap-3 p-4 bg-red-500/10 border border-red-500/30 rounded-2xl font-mono text-xs text-red-400 shadow-[inset_0_0_20px_rgba(239,68,68,0.1)]"
                                                >
                                                    <AlertTriangle className="w-4 h-4 text-red-500 shrink-0" />
                                                    {validation.error}
                                                </motion.div>
                                            ) : (
                                                <motion.div 
                                                    key="success"
                                                    initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }}
                                                    className="flex justify-between items-center p-5 bg-emerald-500/10 border border-emerald-500/40 rounded-2xl relative overflow-hidden group shadow-[0_0_30px_rgba(16,185,129,0.1)]"
                                                >
                                                    <div className="absolute inset-0 bg-gradient-to-r from-transparent via-emerald-500/10 to-transparent -translate-x-full group-hover:animate-shimmer" />
                                                    
                                                    <div>
                                                        <p className="text-[10px] font-black uppercase font-mono tracking-[0.2em] text-emerald-500 mb-1">THỜI LƯỢNG</p>
                                                        <span className="text-white font-mono text-lg">{validation.durationHours.toFixed(1)} GIỜ</span>
                                                    </div>
                                                    <div className="text-right">
                                                        <p className="text-[10px] font-black uppercase font-mono tracking-[0.2em] text-emerald-500 mb-1">TẠM TÍNH</p>
                                                        <span className="text-emerald-400 font-black font-mono text-2xl drop-shadow-[0_0_10px_rgba(16,185,129,0.5)]">
                                                            {formatPrice(validation.total)}
                                                        </span>
                                                    </div>
                                                </motion.div>
                                            )}
                                        </AnimatePresence>
                                    </div>
                                </div>
                            </motion.div>
                        ) : (
                            <motion.div key="step2" custom={direction} variants={stepVariants} initial="enter" animate="center" exit="exit" className="flex justify-center">
                                {/* HOLOGRAPHIC E-TICKET */}
                                <div 
                                    className="relative w-full max-w-sm bg-gradient-to-b from-[#15171b]/90 to-[#0c0d10]/90 backdrop-blur-md rounded-3xl border border-emerald-500/30 p-8 shadow-[0_0_50px_rgba(16,185,129,0.15)] overflow-hidden"
                                >
                                    {/* Hologram Lines */}
                                    <div className="absolute inset-0 pointer-events-none opacity-20" style={{ backgroundImage: "repeating-linear-gradient(transparent, transparent 2px, rgba(16,185,129,0.2) 2px, rgba(16,185,129,0.2) 4px)" }} />
                                    
                                    <div className="flex flex-col items-center mb-8 relative z-10">
                                        <div className="w-20 h-20 rounded-2xl overflow-hidden border-2 border-emerald-500/50 p-1 mb-4 shadow-[0_0_20px_rgba(16,185,129,0.3)]">
                                            <div className="w-full h-full rounded-xl overflow-hidden relative">
                                                <img src={mainPhoto} alt="" className="w-full h-full object-cover" />
                                                <div className="absolute inset-0 bg-emerald-500/20 mix-blend-overlay" />
                                            </div>
                                        </div>
                                        <h3 className="font-black text-xl text-white text-center font-mono uppercase tracking-wider">{court.name}</h3>
                                        <p className="text-xs text-emerald-400/80 font-mono flex items-center gap-1 mt-2">
                                            <MapPin className="w-3.5 h-3.5" /> {court.address?.district}
                                        </p>
                                    </div>

                                    {/* Dashed cut line */}
                                    <div className="w-full border-b-2 border-dashed border-emerald-500/30 my-6 relative z-10" />

                                    <div className="space-y-5 relative z-10">
                                        <SummaryRow label={bookingType === 'fixed' ? 'GÓI CỐ ĐỊNH' : 'NGÀY CHƠI'} value={bookingType === 'fixed' ? `${fixedMonths} Tháng (${validation.totalSessions} buổi)` : `${dates[selectedDate].date}/${dates[selectedDate].month}/${new Date().getFullYear()}`} />
                                        <SummaryRow label="THỜI GIAN" value={`${finalStartTime} - ${finalEndTime}`} accent />
                                        <SummaryRow label="THỜI LƯỢNG" value={`${validation.durationHours} GIỜ`} />
                                        <SummaryRow label="PHƯƠNG THỨC" value="Thanh toán VNPay" />
                                    </div>

                                    <div className="mt-8 pt-6 border-t border-emerald-500/20 relative z-10">
                                        <div className="flex justify-between items-end">
                                            <span className="font-mono text-xs font-black text-gray-500 tracking-[0.2em]">TỔNG THANH TOÁN</span>
                                            <span className="text-3xl font-black font-mono text-emerald-400 drop-shadow-[0_0_15px_rgba(16,185,129,0.6)]">
                                                {formatPrice(validation.total)}
                                            </span>
                                        </div>
                                    </div>
                                    
                                </div>
                            </motion.div>
                        )}
                    </AnimatePresence>
                </div>

                {/* Footer HUD CTA */}
                <div className="px-6 py-6 bg-black/60 border-t border-white/5 relative z-10 backdrop-blur-md rounded-b-3xl">
                    {step === 1 ? (
                        <button
                            onClick={() => changeStep(2)}
                            disabled={validation.error !== '' || isLoadingSlots}
                            className="group relative w-full h-16 bg-emerald-500/10 text-emerald-400 rounded-2xl font-black font-mono text-lg uppercase tracking-widest flex items-center justify-center gap-3 overflow-hidden disabled:opacity-30 disabled:cursor-not-allowed transition-all border border-emerald-500/50"
                        >
                            <div className="absolute inset-0 bg-emerald-500 translate-y-full group-hover:translate-y-0 transition-transform duration-300 ease-out" />
                            <Fingerprint className="w-5 h-5 relative z-10 group-hover:text-black transition-colors duration-300" />
                            <span className="relative z-10 group-hover:text-black transition-colors duration-300">TIẾP TỤC THANH TOÁN</span>
                        </button>
                    ) : (
                        <button
                            onClick={handleConfirm}
                            disabled={isBooking}
                            className="group relative w-full h-16 bg-emerald-500 text-black rounded-2xl font-black font-mono text-lg uppercase tracking-widest flex items-center justify-center gap-3 overflow-hidden disabled:opacity-70 border border-emerald-400 shadow-[0_0_30px_rgba(16,185,129,0.3)] hover:shadow-[0_0_50px_rgba(16,185,129,0.5)] transition-all"
                        >
                            {isBooking && (
                                <div className="absolute inset-0 bg-black/20 flex items-center justify-center backdrop-blur-sm z-20">
                                    <Loader2 className="w-6 h-6 animate-spin text-black" />
                                </div>
                            )}
                            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/40 to-transparent -translate-x-full group-hover:animate-shimmer z-0" />
                            <Check className="w-6 h-6 relative z-10" />
                            <span className="relative z-10">{isBooking ? 'ĐANG TẠO MÃ...' : 'XÁC NHẬN ĐẶT SÂN'}</span>
                        </button>
                    )}
                </div>
            </motion.div>
        </div>
    );
}

function SummaryRow({ label, value, accent }: { label: string; value: string; accent?: boolean }) {
    return (
        <div className="flex justify-between items-center font-mono">
            <span className="text-[10px] text-emerald-500/70 font-black tracking-widest">{label}</span>
            <span className={`text-sm ${accent ? 'text-emerald-400 font-black drop-shadow-[0_0_8px_rgba(16,185,129,0.5)]' : 'text-gray-300 font-bold'}`}>{value}</span>
        </div>
    );
}