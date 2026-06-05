import { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence, type Variants } from 'framer-motion';
import { X, ChevronLeft, Check, Loader2, MapPin, AlertTriangle, ChevronRight, Zap, Repeat } from 'lucide-react';
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
                <div className="absolute inset-[-10%] bg-cover bg-center bg-no-repeat blur-[60px] opacity-40" style={{ backgroundImage: `url(${mainPhoto})` }} />
                <div className="absolute inset-0 bg-[#06080a]/60 backdrop-blur-3xl" />
            </motion.div>

            {/* MAIN GLASS CONTAINER */}
            <motion.div 
                variants={sheetVariants} initial="hidden" animate="visible" exit="exit"
                className="relative w-full max-w-2xl bg-white/5 rounded-[2rem] border border-white/10 shadow-2xl overflow-hidden flex flex-col backdrop-blur-xl"
            >
                {/* Header */}
                <div className="px-6 py-5 flex items-center justify-between relative z-10 border-b border-white/5 bg-white/5">
                    <div className="flex items-center gap-4">
                        {step === 2 && (
                            <button onClick={() => changeStep(1)} className="w-10 h-10 rounded-full bg-white/5 hover:bg-white/10 flex items-center justify-center text-gray-300 hover:text-white transition-all">
                                <ChevronLeft className="w-5 h-5" />
                            </button>
                        )}
                        <div>
                            <div className="flex items-center gap-2 mb-0.5">
                                <div className="w-6 h-6 rounded-full bg-emerald-500/20 flex items-center justify-center">
                                    <Zap className="w-3.5 h-3.5 text-emerald-400" />
                                </div>
                                <h2 className="font-bold text-xl text-white tracking-wide">
                                {step === 1 ? 'Lịch & Giờ chơi' : 'Xác nhận & Thanh toán'}
                            </h2>
                            </div>
                            <p className="text-[13px] text-gray-400 font-medium ml-8">{court.name}</p>
                        </div>
                    </div>
                    <button onClick={onClose} className="w-10 h-10 rounded-full bg-white/5 hover:bg-white/10 flex items-center justify-center text-gray-400 hover:text-white transition-all">
                        <X className="w-5 h-5" />
                    </button>
                </div>

                <div className="flex-1 overflow-x-hidden overflow-y-auto px-6 py-6 relative z-10 scrollbar-thin scrollbar-thumb-white/10">
                    <AnimatePresence mode="wait" custom={direction}>
                        {step === 1 ? (
                            <motion.div key="step1" custom={direction} variants={stepVariants} initial="enter" animate="center" exit="exit" className="space-y-8">
                                
                                {/* TYPE SELECTOR */}
                                <div className="flex bg-white/5 p-1 rounded-2xl">
                                    <button 
                                        onClick={() => setBookingType('casual')}
                                        className={`flex-1 py-3 text-sm font-semibold rounded-xl flex items-center justify-center gap-2 transition-all duration-300 ${bookingType === 'casual' ? 'bg-emerald-500 text-white shadow-lg shadow-emerald-500/25' : 'text-gray-400 hover:text-gray-200 hover:bg-white/5'}`}
                                    >
                                        <Zap className="w-4 h-4" /> Vãng Lai
                                    </button>
                                    <button 
                                        onClick={() => setBookingType('fixed')}
                                        className={`flex-1 py-3 text-sm font-semibold rounded-xl flex items-center justify-center gap-2 transition-all duration-300 ${bookingType === 'fixed' ? 'bg-emerald-500 text-white shadow-lg shadow-emerald-500/25' : 'text-gray-400 hover:text-gray-200 hover:bg-white/5'}`}
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
                                            <div className="flex items-center justify-between p-4 bg-emerald-500/5 border border-emerald-500/10 rounded-2xl">
                                                <div className="flex items-center gap-3">
                                                    <div className="w-8 h-8 rounded-full bg-emerald-500/20 flex items-center justify-center">
                                                        <Repeat className="w-4 h-4 text-emerald-400" />
                                                    </div>
                                                    <p className="text-[13px] font-bold text-gray-300">Thời gian đặt</p>
                                                </div>
                                                <div className="flex items-center gap-2 bg-white/5 rounded-xl p-1">
                                                    <button onClick={() => setFixedMonths(Math.max(1, fixedMonths - 1))} className="w-8 h-8 flex items-center justify-center text-gray-400 hover:text-white hover:bg-white/10 rounded-lg transition-colors">-</button>
                                                    <span className="text-white w-16 text-center text-sm font-bold">{fixedMonths} tháng</span>
                                                    <button onClick={() => setFixedMonths(Math.min(12, fixedMonths + 1))} className="w-8 h-8 flex items-center justify-center text-gray-400 hover:text-white hover:bg-white/10 rounded-lg transition-colors">+</button>
                                                </div>
                                            </div>
                                        </motion.div>
                                    )}
                                </AnimatePresence>

                                {/* DATE PICKER / DAYS OF WEEK */}
                                {bookingType === 'casual' ? (
                                    <div>
                                        <div className="flex items-center justify-between mb-4">
                                            <label className="text-sm font-bold text-gray-300">
                                                Chọn ngày
                                            </label>
                                            <div className="text-[13px] font-medium text-emerald-400 bg-emerald-500/10 px-3 py-1 rounded-full">
                                                Tháng {dates[selectedDate].month}
                                            </div>
                                        </div>
                                        
                                        <div className="flex gap-3 overflow-x-auto pb-4 scrollbar-none snap-x snap-mandatory">
                                            {dates.map((d, i) => {
                                                const isActive = selectedDate === i;
                                                return (
                                                    <button
                                                        key={i}
                                                        onClick={() => setSelectedDate(i)}
                                                        className={`relative shrink-0 w-[4.5rem] py-3 rounded-2xl flex flex-col items-center justify-center gap-1 snap-center transition-all duration-300 ${isActive ? 'bg-emerald-500 shadow-lg shadow-emerald-500/25' : 'bg-white/5 hover:bg-white/10'}`}
                                                    >
                                                        <span className={`relative z-10 text-[11px] font-bold uppercase ${isActive ? 'text-emerald-50' : 'text-gray-400'}`}>
                                                            {d.day}
                                                        </span>
                                                        <span className={`relative z-10 text-xl font-bold ${isActive ? 'text-white' : 'text-gray-300'}`}>
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
                                            <label className="text-sm font-bold text-gray-300">
                                                Thứ trong tuần
                                            </label>
                                            <span className="text-[11px] text-gray-500 uppercase tracking-wide font-semibold">Có thể chọn nhiều</span>
                                        </div>
                                        <div className="flex gap-2">
                                            {[1, 2, 3, 4, 5, 6, 0].map(day => {
                                                const isActive = selectedDaysOfWeek.includes(day);
                                                const label = day === 0 ? 'CN' : `T${day + 1}`;
                                                return (
                                                    <button
                                                        key={day}
                                                        onClick={() => toggleDayOfWeek(day)}
                                                        className={`flex-1 py-3 rounded-2xl text-sm font-bold transition-all duration-300 ${
                                                            isActive 
                                                            ? 'bg-emerald-500 text-white shadow-lg shadow-emerald-500/25'
                                                            : 'bg-white/5 text-gray-400 hover:bg-white/10 hover:text-gray-200'
                                                        }`}
                                                    >
                                                        {label}
                                                    </button>
                                                )
                                            })}
                                        </div>
                                    </motion.div>
                                )}

                                {/* TIME GRID */}
                                <div className="relative">
                                    <div className="flex items-center justify-between mb-4">
                                        <label className="text-sm font-bold text-gray-300">
                                            Khung giờ
                                        </label>
                                        <div className="flex gap-4 text-[12px] font-semibold text-gray-400">
                                            <span className="flex items-center gap-1.5"><div className="w-2.5 h-2.5 rounded-full bg-emerald-500 shadow-lg shadow-emerald-500/50" /> Đang chọn</span>
                                            <span className="flex items-center gap-1.5"><div className="w-2.5 h-2.5 rounded-full bg-white/5 border border-white/10" /> Hết chỗ</span>
                                        </div>
                                    </div>
                                    
                                    <div className="relative p-1">
                                        {isLoadingSlots && (
                                            <div className="absolute inset-0 z-10 bg-[#0a0c10]/50 backdrop-blur-md flex items-center justify-center rounded-2xl">
                                                <div className="flex flex-col items-center gap-3">
                                                    <Loader2 className="w-8 h-8 text-emerald-500 animate-spin" />
                                                    <p className="text-sm text-emerald-400 font-medium">Đang tải dữ liệu...</p>
                                                </div>
                                            </div>
                                        )}
                                        
                                        <div className="grid grid-cols-4 sm:grid-cols-6 md:grid-cols-8 gap-2.5">
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
                                                        className={`relative h-11 rounded-xl text-[13px] font-semibold transition-all duration-300 flex items-center justify-center overflow-hidden ${
                                                            booked 
                                                                ? 'bg-white/5 text-gray-500/50 cursor-not-allowed'
                                                                : isSelected
                                                                    ? 'bg-emerald-500 text-white shadow-lg shadow-emerald-500/30'
                                                                    : 'bg-white/5 text-gray-300 hover:bg-white/10 hover:text-white'
                                                        }`}
                                                    >
                                                        <span className="relative z-10">{slot}</span>
                                                        
                                                        {isEndpoint && (
                                                            <div className="absolute top-1.5 right-1.5 w-1.5 h-1.5 bg-white rounded-full shadow-[0_0_5px_white]" />
                                                        )}
                                                    </button>
                                                )
                                            })}
                                        </div>
                                    </div>

                                    {/* Validator */}
                                    <div className="mt-8 h-[88px] relative">
                                        <AnimatePresence mode="wait">
                                            {validation.error ? (
                                                <motion.div 
                                                    key="error"
                                                    initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 10 }}
                                                    className="absolute inset-0 w-full flex items-center justify-center gap-3 px-5 bg-red-500/10 border border-red-500/20 rounded-2xl text-sm font-medium text-red-400 text-center"
                                                >
                                                    <AlertTriangle className="w-5 h-5 text-red-500 shrink-0" />
                                                    {validation.error}
                                                </motion.div>
                                            ) : (
                                                <motion.div 
                                                    key="success"
                                                    initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 10 }}
                                                    className="absolute inset-0 w-full flex justify-between items-center px-6 bg-gradient-to-r from-emerald-500/10 to-teal-500/10 border border-emerald-500/20 rounded-2xl overflow-hidden group shadow-lg"
                                                >
                                                    <div>
                                                        <p className="text-[12px] font-semibold text-emerald-500/80 mb-1 uppercase tracking-wider">Thời lượng</p>
                                                        <span className="text-white text-lg font-bold">{validation.durationHours.toFixed(1)} Giờ</span>
                                                    </div>
                                                    <div className="text-right">
                                                        <p className="text-[12px] font-semibold text-emerald-500/80 mb-1 uppercase tracking-wider">Tạm tính</p>
                                                        <span className="text-emerald-400 font-black text-2xl drop-shadow-md">
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
                                {/* MODERN E-TICKET */}
                                <div 
                                    className="relative w-full max-w-sm bg-white/5 backdrop-blur-xl rounded-[2rem] border border-white/10 p-8 shadow-2xl overflow-hidden"
                                >
                                    <div className="flex flex-col items-center mb-8 relative z-10">
                                        <div className="w-20 h-20 rounded-2xl overflow-hidden mb-4 shadow-xl border border-white/10">
                                            <img src={mainPhoto} alt="" className="w-full h-full object-cover" />
                                        </div>
                                        <h3 className="font-bold text-xl text-white text-center">{court.name}</h3>
                                        <p className="text-sm text-gray-400 flex items-center gap-1.5 mt-2 font-medium">
                                            <MapPin className="w-4 h-4" /> {court.address?.district}
                                        </p>
                                    </div>

                                    {/* Separator */}
                                    <div className="w-full border-b border-white/10 my-6 relative z-10" />

                                    <div className="space-y-4 relative z-10">
                                        <SummaryRow label={bookingType === 'fixed' ? 'Gói cố định' : 'Ngày chơi'} value={bookingType === 'fixed' ? `${fixedMonths} Tháng (${validation.totalSessions} buổi)` : `${dates[selectedDate].date}/${dates[selectedDate].month}/${new Date().getFullYear()}`} />
                                        <SummaryRow label="Thời gian" value={`${finalStartTime} - ${finalEndTime}`} accent />
                                        <SummaryRow label="Thời lượng" value={`${validation.durationHours} Giờ`} />
                                        <SummaryRow label="Phương thức" value="Thanh toán VNPay" />
                                    </div>

                                    <div className="mt-8 pt-6 border-t border-white/10 relative z-10">
                                        <div className="flex justify-between items-end">
                                            <span className="text-[13px] font-semibold text-gray-400">Tổng thanh toán</span>
                                            <span className="text-3xl font-black bg-gradient-to-r from-emerald-400 to-teal-400 bg-clip-text text-transparent drop-shadow-sm">
                                                {formatPrice(validation.total)}
                                            </span>
                                        </div>
                                    </div>
                                    
                                </div>
                            </motion.div>
                        )}
                    </AnimatePresence>
                </div>

                {/* Footer CTA */}
                <div className="px-6 py-6 border-t border-white/5 relative z-10 bg-white/5 backdrop-blur-xl">
                    {step === 1 ? (
                        <button
                            onClick={() => changeStep(2)}
                            disabled={validation.error !== '' || isLoadingSlots}
                            className="group relative w-full h-14 bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 text-white rounded-2xl font-bold text-lg flex items-center justify-center gap-3 overflow-hidden disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-lg shadow-emerald-500/20"
                        >
                            <span className="relative z-10">Tiếp tục thanh toán</span>
                            <ChevronRight className="w-5 h-5 relative z-10 group-hover:translate-x-1 transition-transform" />
                        </button>
                    ) : (
                        <button
                            onClick={handleConfirm}
                            disabled={isBooking}
                            className="group relative w-full h-14 bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 text-white rounded-2xl font-bold text-lg flex items-center justify-center gap-3 overflow-hidden disabled:opacity-70 transition-all shadow-lg shadow-emerald-500/20"
                        >
                            {isBooking && (
                                <div className="absolute inset-0 bg-black/10 flex items-center justify-center z-20">
                                    <Loader2 className="w-6 h-6 animate-spin" />
                                </div>
                            )}
                            <Check className="w-5 h-5 relative z-10" />
                            <span className="relative z-10">{isBooking ? 'Đang tạo mã...' : 'Xác nhận đặt sân'}</span>
                        </button>
                    )}
                </div>
            </motion.div>
        </div>
    );
}

function SummaryRow({ label, value, accent }: { label: string; value: string; accent?: boolean }) {
    return (
        <div className="flex justify-between items-center">
            <span className="text-[14px] text-gray-400 font-medium">{label}</span>
            <span className={`text-[15px] font-semibold ${accent ? 'text-emerald-400' : 'text-gray-200'}`}>{value}</span>
        </div>
    );
}