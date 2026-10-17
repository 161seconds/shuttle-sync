import { useState, useEffect, useRef } from 'react';
import { ChevronLeft, Calendar, Clock, Loader2, Check, X, ChevronRight, Users, Ticket, MapPin, ReceiptText } from 'lucide-react';
import ProfileHeader from '../../components/layout/ProfileHeader';
import { motion, AnimatePresence } from 'framer-motion';
import { theme as t } from '../../utils/theme';
import axiosClient from '../../api/axiosClient';
import type { Booking } from '../../types';
import { useAlertStore } from '../../stores/useAlertStore';
import { getBookingStatusConfig } from '../../utils/bookingStatus';
import ReviewModal from '../../components/courts/ReviewModal';

interface Props {
    onBack: () => void;
}

export default function BookingHistory({ onBack }: Props) {
    const [bookings, setBookings] = useState<Booking[]>([]);
    const [loading, setLoading] = useState(true);
    const [tab, setTab] = useState<'all' | 'confirmed' | 'completed' | 'cancelled'>('all');
    const [startDate, setStartDate] = useState('');
    const [endDate, setEndDate] = useState('');
    const [cancelling, setCancelling] = useState<string | null>(null);
    const [expanded, setExpanded] = useState<string | null>(null);
    const [reviewBooking, setReviewBooking] = useState<{ id: string, courtId: string } | null>(null);
    const [pageIndex, setPageIndex] = useState(1);
    const ITEMS_PER_PAGE = 8; // Reduce to 8 for better grid fit

    const fetchBookings = async () => {
        setLoading(true);
        try {
            const params: any = {};
            if (tab !== 'all') params.status = tab;
            if (startDate) params.startDate = startDate;
            if (endDate) params.endDate = endDate;

            const res = await axiosClient.get('/bookings/my', { params });
            setBookings(res.data.data || []);
        } catch (err) {
            console.error('Lỗi lấy lịch sử:', err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => { 
        setPageIndex(1);
        fetchBookings(); 
    }, [tab, startDate, endDate]);

    useEffect(() => {
        if (expanded) document.body.style.overflow = 'hidden';
        else document.body.style.overflow = 'unset';
        return () => { document.body.style.overflow = 'unset'; };
    }, [expanded]);

    const totalPages = Math.ceil(bookings.length / ITEMS_PER_PAGE);
    const displayedBookings = bookings.slice((pageIndex - 1) * ITEMS_PER_PAGE, pageIndex * ITEMS_PER_PAGE);
    const { showConfirm, showAlert } = useAlertStore();

    const handleCancel = (bookingId: string) => {
        showConfirm('Bạn chắc chắn muốn hủy đặt sân này?', async () => {
            setCancelling(bookingId);
            try {
                await axiosClient.post(`/bookings/${bookingId}/cancel`, { reason: 'Người dùng hủy' });
                await fetchBookings();
                setTab('cancelled');
                showAlert('Hủy đặt sân thành công!', 'Thành công', 'success');
                setExpanded(null);
            } catch (err) {
                console.error('Lỗi hủy:', err);
                showAlert('Không thể hủy đơn này!', 'Thông báo', 'error');
            } finally {
                setCancelling(null);
            }
        });
    };

    const formatDate = (d: string) => new Date(d).toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit', year: 'numeric' });

    const TABS = [
        { id: 'all', label: 'Tất cả' },
        { id: 'confirmed', label: 'Đã xác nhận' },
        { id: 'completed', label: 'Hoàn thành' },
        { id: 'cancelled', label: 'Đã hủy' },
    ] as const;

    return (
        <div className={`min-h-screen w-full${t.bg.base} pb-24 relative`}>
            <ProfileHeader title="Lịch sử đặt sân" onBack={onBack} />
            
            <div className="w-full max-w-7xl mx-auto px-4 lg:px-8 py-6">
                
                {/* Premium Animated Tabs & Date Filter */}
                <div className="flex flex-col xl:flex-row justify-between items-center mb-8 gap-4">
                    <div className="relative inline-flex p-1.5 bg-card backdrop-blur-xl border border-border rounded-2xl shadow-inner overflow-x-auto custom-scrollbar max-w-full">
                        {TABS.map(tb => (
                            <button
                                key={tb.id}
                                onClick={() => setTab(tb.id)}
                                className={`relative px-5 md:px-8 py-2.5 text-[14px] font-bold rounded-xl transition-all duration-300 z-10 whitespace-nowrap ${tab === tb.id ? 'text-black' : 'text-muted-foreground hover:text-foreground'}`}
                            >
                                {tab === tb.id && (
                                    <motion.div
                                        layoutId="active-tab-booking"
                                        className="absolute inset-0 bg-emerald-400 rounded-xl shadow-[0_0_20px_rgba(52,211,153,0.4)]"
                                        transition={{ type: 'spring', stiffness: 400, damping: 30 }}
                                        style={{ zIndex: -1 }}
                                    />
                                )}
                                <span className="relative z-10">{tb.label}</span>
                            </button>
                        ))}
                    </div>

                    {/* Date Filters */}
                    <div className="flex flex-wrap items-center justify-center gap-3 w-full xl:w-auto">
                        <WheelDatePicker label="Từ" value={startDate} onChange={setStartDate} />
                        <WheelDatePicker label="Đến" value={endDate} onChange={setEndDate} />
                        {(startDate || endDate) && (
                            <button 
                                onClick={() => { setStartDate(''); setEndDate(''); }}
                                className="w-10 h-10 rounded-2xl bg-card border border-border flex items-center justify-center hover:bg-red-500/10 hover:text-red-400 hover:border-red-500/30 transition-all shadow-inner group"
                                title="Xóa bộ lọc"
                            >
                                <X className="w-5 h-5 group-hover:scale-110 transition-transform" />
                            </button>
                        )}
                    </div>
                </div>

                {loading ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                        {Array.from({ length: 8 }).map((_, i) => (
                            <div key={i} className={`h-48 rounded-[2rem] bg-card border border-border animate-pulse`} />
                        ))}
                    </div>
                ) : bookings.length === 0 ? (
                    <motion.div 
                        initial={{ opacity: 0, scale: 0.95 }}
                        animate={{ opacity: 1, scale: 1 }}
                        className="flex flex-col items-center py-20 text-center col-span-full"
                    >
                        <div className="relative mb-10 group">
                            <div className="absolute inset-0 bg-emerald-500/20 blur-3xl rounded-full opacity-60 group-hover:opacity-100 transition-opacity duration-700 animate-pulse-slow"></div>
                            <div className="relative w-40 h-40 rounded-full bg-card flex items-center justify-center backdrop-blur-md border border-border shadow-card">
                                <Ticket className="w-20 h-20 text-emerald-500/50" />
                            </div>
                        </div>
                        <p className="text-foreground font-black text-2xl mb-3 tracking-tight">Chưa có đơn đặt sân nào</p>
                        <p className="text-[15px] text-muted-foreground max-w-[280px] leading-relaxed">
                            Hiện tại danh sách này đang trống. Hãy đặt một sân để xem lịch sử tại đây nhé!
                        </p>
                    </motion.div>
                ) : (
                    <>
                        <motion.div layout className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 items-start">
                            <AnimatePresence mode="popLayout">
                                {displayedBookings.map((b, i) => {
                                    const statusKey = b.status?.toLowerCase() || 'pending_payment';
                                    const s = getBookingStatusConfig(statusKey);
                                    const courtObj = (b as any).courtId || (b as any).court;
                                    const courtName = typeof courtObj === 'object' ? courtObj?.name : 'Sân (Không xác định)';
                                    const courtDistrict = typeof courtObj === 'object' ? courtObj?.address?.district : '';
                                    const isInactive = statusKey === 'cancelled' || statusKey === 'completed';

                                    return (
                                        <motion.div 
                                            layout
                                            initial={{ opacity: 0, y: 20 }}
                                            animate={{ opacity: 1, y: 0 }}
                                            exit={{ opacity: 0, scale: 0.9 }}
                                            transition={{ delay: i * 0.05 }}
                                            key={b._id} 
                                            className={`relative flex flex-col h-full bg-card rounded-[2rem] border border-border overflow-hidden transition-all duration-500 hover:-translate-y-1 hover:shadow-glow hover:border-emerald-500/30 group ${isInactive ? 'opacity-70 grayscale-[30%] hover:grayscale-0 hover:opacity-100' : ''}`}
                                        >
                                            <div className={`absolute inset-0 bg-gradient-to-br from-${s.color.split('-')[1]}-500/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500`} />
                                            
                                            <button onClick={() => setExpanded(b._id)} className="w-full flex flex-col h-full text-left relative z-10 p-6">
                                                
                                                <div className="flex justify-between items-start mb-5">
                                                    <div className={`w-14 h-14 rounded-2xl ${s.bg} flex items-center justify-center shrink-0 border shadow-inner group-hover:scale-105 transition-transform duration-500`}>
                                                        {statusKey === 'confirmed' ? <Check className={`w-7 h-7 ${s.color}`} strokeWidth={3} /> :
                                                            statusKey === 'cancelled' ? <X className={`w-7 h-7 ${s.color}`} strokeWidth={3} /> :
                                                                statusKey === 'pending_payment' ? <Clock className={`w-7 h-7 ${s.color}`} strokeWidth={3} /> :
                                                                    <Calendar className={`w-7 h-7 ${s.color}`} strokeWidth={3} />}
                                                    </div>
                                                    <div className="text-right flex flex-col items-end">
                                                        <span className={`px-3 py-1.5 rounded-xl text-[11px] font-black uppercase tracking-wider ${s.bg} ${s.color} border shadow-sm`}>
                                                            {s.label}
                                                        </span>
                                                        <span className="text-[11px] font-mono font-bold text-muted-foreground mt-2 bg-background px-2 py-0.5 rounded-md border border-border tracking-widest">
                                                            #{b.bookingCode}
                                                        </span>
                                                    </div>
                                                </div>

                                                <div className="mb-6 flex-1">
                                                    <h3 className="font-black text-lg text-foreground leading-tight line-clamp-2 mb-2 group-hover:text-emerald-400 transition-colors">{courtName}</h3>
                                                    {courtDistrict && (
                                                        <p className="text-[12px] text-muted-foreground flex items-center gap-1.5 mb-3">
                                                            <MapPin className="w-3.5 h-3.5" /> {courtDistrict}
                                                        </p>
                                                    )}
                                                    <div className="text-2xl font-black bg-gradient-to-r from-emerald-300 to-teal-400 bg-clip-text text-transparent drop-shadow-sm">
                                                        {b.finalAmount?.toLocaleString()}đ
                                                    </div>
                                                </div>

                                                <div className="grid grid-cols-2 gap-3 p-4 rounded-2xl bg-background/50 border border-border group-hover:bg-background/80 transition-colors">
                                                    <div className="flex flex-col gap-1.5">
                                                        <span className="text-[10px] uppercase font-black text-muted-foreground tracking-widest flex items-center gap-1.5"><Calendar className="w-3.5 h-3.5 text-emerald-500/70" /> Ngày chơi</span>
                                                        <span className="text-[13px] font-bold text-foreground">{formatDate(b.date)}</span>
                                                    </div>
                                                    <div className="flex flex-col gap-1.5">
                                                        <span className="text-[10px] uppercase font-black text-muted-foreground tracking-widest flex items-center gap-1.5"><Clock className="w-3.5 h-3.5 text-blue-500/70" /> Thời gian</span>
                                                        <span className="text-[13px] font-bold text-foreground">{b.startTime} - {b.endTime}</span>
                                                    </div>
                                                </div>
                                            </button>
                                        </motion.div>
                                    );
                                })}
                            </AnimatePresence>
                        </motion.div>
                        
                        {/* Premium Pagination */}
                        {totalPages > 1 && (
                            <div className="mt-12 flex items-center justify-center gap-4">
                                <button 
                                    disabled={pageIndex === 1}
                                    onClick={() => setPageIndex(p => Math.max(1, p - 1))}
                                    className="w-12 h-12 rounded-2xl bg-card border border-border flex items-center justify-center disabled:opacity-30 disabled:grayscale hover:border-emerald-500/30 hover:text-emerald-400 transition-all hover:shadow-glow-sm group"
                                >
                                    <ChevronLeft className="w-6 h-6 group-hover:-translate-x-0.5 transition-transform" />
                                </button>
                                <div className="px-6 py-3 rounded-2xl bg-card border border-border font-bold text-sm">
                                    <span className="text-foreground">{pageIndex}</span>
                                    <span className="text-muted-foreground mx-2">/</span>
                                    <span className="text-muted-foreground">{totalPages}</span>
                                </div>
                                <button 
                                    disabled={pageIndex === totalPages}
                                    onClick={() => setPageIndex(p => Math.min(totalPages, p + 1))}
                                    className="w-12 h-12 rounded-2xl bg-card border border-border flex items-center justify-center disabled:opacity-30 disabled:grayscale hover:border-emerald-500/30 hover:text-emerald-400 transition-all hover:shadow-glow-sm group"
                                >
                                    <ChevronRight className="w-6 h-6 group-hover:translate-x-0.5 transition-transform" />
                                </button>
                            </div>
                        )}
                    </>
                )}
            </div>

            {/* Modal Popup Chi tiết đơn hàng */}
            <AnimatePresence>
                {expanded && (() => {
                    const b = bookings.find(x => x._id === expanded);
                    if (!b) return null;
                    const statusKey = b.status?.toLowerCase() || 'pending_payment';
                    const s = getBookingStatusConfig(statusKey);
                    const courtObj = (b as any).courtId || (b as any).court;
                    const courtName = typeof courtObj === 'object' ? courtObj?.name : 'Sân (Không xác định)';
                    const courtDistrict = typeof courtObj === 'object' ? courtObj?.address?.district : '';

                    return (
                        <motion.div 
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-background/80 backdrop-blur-md"
                            onClick={() => setExpanded(null)}
                        >
                            <motion.div 
                                initial={{ scale: 0.9, opacity: 0, y: 20 }}
                                animate={{ scale: 1, opacity: 1, y: 0 }}
                                exit={{ scale: 0.9, opacity: 0, y: 20 }}
                                onClick={e => e.stopPropagation()}
                                className="bg-card border border-border rounded-[2.5rem] p-8 w-full max-w-md shadow-2xl relative overflow-y-auto overflow-x-hidden max-h-[90vh] custom-scrollbar"
                            >
                                {/* Decorative Glow */}
                                <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full h-32 bg-gradient-to-b from-emerald-500/10 to-transparent blur-3xl pointer-events-none" />

                                <div className="absolute top-6 right-6 z-20">
                                    <button onClick={() => setExpanded(null)} className="w-10 h-10 rounded-full bg-background border border-border flex items-center justify-center text-muted-foreground hover:text-foreground hover:rotate-90 hover:scale-110 transition-all duration-300">
                                        <X className="w-5 h-5" />
                                    </button>
                                </div>

                                <div className="flex flex-col items-center mb-8 pt-4 relative z-10">
                                    <div className={`w-24 h-24 rounded-[2rem] ${s.bg} flex items-center justify-center border shadow-lg mb-6 relative group`}>
                                        <div className="absolute inset-0 bg-foreground/20 rounded-[2rem] blur opacity-0 group-hover:opacity-100 transition-opacity" />
                                        {statusKey === 'confirmed' ? <Check className={`w-12 h-12 ${s.color}`} strokeWidth={3} /> :
                                            statusKey === 'cancelled' ? <X className={`w-12 h-12 ${s.color}`} strokeWidth={3} /> :
                                                statusKey === 'pending_payment' ? <Clock className={`w-12 h-12 ${s.color}`} strokeWidth={3} /> :
                                                    <Calendar className={`w-12 h-12 ${s.color}`} strokeWidth={3} />}
                                    </div>
                                    <h2 className="text-2xl font-black text-foreground text-center mb-2 leading-tight px-4 tracking-tight">{courtName}</h2>
                                    {courtDistrict && <p className="text-sm text-muted-foreground mb-4 flex items-center gap-1.5"><MapPin className="w-4 h-4" /> {courtDistrict}</p>}
                                    <span className={`px-4 py-1.5 rounded-xl text-[12px] font-black uppercase tracking-widest ${s.bg} ${s.color} border shadow-sm`}>
                                        {s.label}
                                    </span>
                                </div>

                                <div className="space-y-4 bg-background p-6 rounded-[1.5rem] border border-border mb-8 relative z-10">
                                    <div className="flex items-center gap-2 mb-4 text-emerald-400 pb-4 border-b border-border/50">
                                        <ReceiptText className="w-5 h-5" />
                                        <span className="font-black text-[13px] uppercase tracking-widest">Chi tiết giao dịch</span>
                                    </div>
                                    <DetailRow label="Mã đơn" value={`#${b.bookingCode}`} mono />
                                    <DetailRow label="Ngày chơi" value={formatDate(b.date)} />
                                    <DetailRow label="Thời gian" value={`${b.startTime} - ${b.endTime}`} />
                                    <DetailRow label="Thanh toán" value={b.payment?.method === 'qr_code' ? 'QR Code' : b.payment?.method || '—'} />
                                    
                                    <div className="pt-4 mt-2 border-t border-border border-dashed flex justify-between items-end">
                                        <span className="text-muted-foreground font-black text-[12px] uppercase tracking-widest mb-1">Tổng cộng</span>
                                        <span className="text-4xl font-black text-emerald-400 drop-shadow-md">{b.totalAmount?.toLocaleString()}đ</span>
                                    </div>
                                </div>

                                <div className="space-y-3 relative z-10">
                                    {statusKey === 'confirmed' && (
                                        <button
                                            onClick={() => window.location.href = `/?tab=group-plays&openCreate=true`}
                                            className="w-full py-4 rounded-2xl bg-gradient-to-r from-emerald-500 to-teal-400 text-black text-[15px] font-black flex items-center justify-center gap-2.5 hover:shadow-glow-lg transition-all active:scale-[0.98] group"
                                        >
                                            <Users className="w-5 h-5 group-hover:scale-110 transition-transform" />
                                            Tuyển người chơi (Tạo nhóm)
                                        </button>
                                    )}

                                    {(statusKey === 'pending_payment' || statusKey === 'confirmed') && (
                                        <button onClick={() => handleCancel(b._id)} disabled={cancelling === b._id}
                                            className="w-full py-4 rounded-2xl bg-red-500/10 text-red-400 text-[15px] font-black flex items-center justify-center gap-2.5 hover:bg-red-500/20 border border-red-500/30 transition-all hover:shadow-[0_0_20px_rgba(239,68,68,0.2)] active:scale-[0.98] group"
                                        >
                                            {cancelling === b._id ? <Loader2 className="w-5 h-5 animate-spin" /> : <X className="w-5 h-5 group-hover:scale-110 transition-transform" strokeWidth={3} />}
                                            Hủy đặt sân
                                        </button>
                                    )}

                                    {statusKey === 'completed' && (
                                        <button
                                            onClick={() => {
                                                const cId = typeof courtObj === 'object' ? courtObj?._id : courtObj;
                                                setReviewBooking({ id: b._id, courtId: cId });
                                            }}
                                            className="w-full py-4 rounded-2xl bg-amber-500/10 text-amber-400 text-[15px] font-black flex items-center justify-center gap-2.5 hover:bg-amber-500/20 border border-amber-500/30 transition-all active:scale-[0.98]"
                                        >
                                            <span className="text-xl -mt-1">⭐</span> Đánh giá sân
                                        </button>
                                    )}
                                </div>
                            </motion.div>
                        </motion.div>
                    );
                })()}
            </AnimatePresence>

            {/* Review Modal */}
            <AnimatePresence>
                {reviewBooking && (
                    <ReviewModal
                        bookingId={reviewBooking.id}
                        courtId={reviewBooking.courtId}
                        onClose={() => setReviewBooking(null)}
                        onSuccess={() => {
                            setReviewBooking(null);
                            setExpanded(null);
                        }}
                    />
                )}
            </AnimatePresence>
        </div>
    );
}

function DetailRow({ label, value, mono }: { label: string; value: string; mono?: boolean }) {
    return (
        <div className="flex justify-between text-[14px] items-center py-1">
            <span className="text-muted-foreground font-medium">{label}</span>
            <span className={`font-bold text-foreground ${mono ? 'font-mono tracking-wider' : ''}`}>{value}</span>
        </div>
    );
}

// --- NATIVE-LIKE WHEEL DATE PICKER ---

function WheelDatePicker({ label, value, onChange }: { label: string; value: string; onChange: (v: string) => void }) {
    const [isOpen, setIsOpen] = useState(false);
    
    const date = value ? new Date(value) : new Date();
    const [day, setDay] = useState(date.getDate());
    const [month, setMonth] = useState(date.getMonth() + 1);
    const [year, setYear] = useState(date.getFullYear());

    // Cập nhật lại số ngày khi đổi tháng/năm
    const daysInMonth = new Date(year, month, 0).getDate();
    useEffect(() => { if (day > daysInMonth) setDay(daysInMonth); }, [month, year]);

    const days = Array.from({ length: daysInMonth }, (_, i) => i + 1);
    const months = Array.from({ length: 12 }, (_, i) => i + 1);
    const years = Array.from({ length: 10 }, (_, i) => new Date().getFullYear() - 5 + i);

    const handleConfirm = () => {
        const newDate = `${year}-${month.toString().padStart(2, '0')}-${day.toString().padStart(2, '0')}`;
        onChange(newDate);
        setIsOpen(false);
    };

    return (
        <>
            <button onClick={() => setIsOpen(true)} className="flex items-center bg-card border border-border rounded-2xl px-4 py-2.5 shadow-inner flex-1 xl:flex-none hover:border-emerald-500/50 hover:shadow-glow-sm transition-all group">
                <span className="text-muted-foreground text-[13px] mr-2 font-black uppercase tracking-widest">{label}</span>
                <span className={`text-[14px] font-bold ${value ? 'text-emerald-400 group-hover:text-emerald-300' : 'text-muted-foreground group-hover:text-foreground'}`}>
                    {value ? new Date(value).toLocaleDateString('vi-VN') : 'Chọn ngày'}
                </span>
            </button>

            <AnimatePresence>
                {isOpen && (
                    <motion.div 
                        initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                        className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-background/80 backdrop-blur-md"
                        onClick={() => setIsOpen(false)}
                    >
                        <motion.div 
                            initial={{ scale: 0.9, y: 20 }} animate={{ scale: 1, y: 0 }} exit={{ scale: 0.9, y: 20 }}
                            onClick={e => e.stopPropagation()}
                            className="bg-card border border-border rounded-[2rem] p-6 w-full max-w-[320px] shadow-[0_0_50px_rgba(0,0,0,0.5)] relative overflow-hidden"
                        >
                            <h3 className="text-lg font-black text-center mb-6 tracking-tight text-foreground">Tra cứu <span className="text-emerald-400">{label.toLowerCase()} ngày</span></h3>
                            
                            <div className="flex justify-between relative h-[150px] bg-background/80 rounded-[1.5rem] overflow-hidden border border-border shadow-inner before:absolute before:inset-x-0 before:top-0 before:h-12 before:bg-gradient-to-b before:from-background before:to-transparent before:z-10 after:absolute after:inset-x-0 after:bottom-0 after:h-12 after:bg-gradient-to-t after:from-background after:to-transparent after:z-10">
                                {/* Highlight Bar */}
                                <div className="absolute top-1/2 -translate-y-1/2 inset-x-0 h-[50px] bg-emerald-500/10 border-y border-emerald-500/30 z-0 pointer-events-none shadow-[0_0_15px_rgba(16,185,129,0.1)]" />
                                
                                <ScrollColumn items={days.map(d => ({ value: d, label: d.toString().padStart(2, '0') }))} selectedValue={day} onChange={setDay} />
                                <ScrollColumn items={months.map(m => ({ value: m, label: m.toString().padStart(2, '0') }))} selectedValue={month} onChange={setMonth} />
                                <ScrollColumn items={years.map(y => ({ value: y, label: y.toString() }))} selectedValue={year} onChange={setYear} />
                            </div>

                            <button onClick={handleConfirm} className="w-full mt-6 py-4 bg-gradient-to-r from-emerald-500 to-teal-400 text-black font-black text-[15px] rounded-[1.25rem] hover:shadow-glow-lg transition-all active:scale-[0.98]">
                                Chọn ngày này
                            </button>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>
        </>
    );
}

function ScrollColumn({ items, selectedValue, onChange }: any) {
    const scrollRef = useRef<HTMLDivElement>(null);
    const itemHeight = 50;

    useEffect(() => {
        if (scrollRef.current) {
            const index = items.findIndex((i: any) => i.value === selectedValue);
            if (index !== -1) {
                scrollRef.current.scrollTop = index * itemHeight;
            }
        }
    }, [selectedValue, items]);

    const handleScroll = (e: any) => {
        const index = Math.round(e.target.scrollTop / itemHeight);
        if (items[index] && items[index].value !== selectedValue) {
            onChange(items[index].value);
        }
    };

    return (
        <div 
            ref={scrollRef}
            onScroll={handleScroll}
            className="flex-1 h-full overflow-y-auto snap-y snap-mandatory relative z-20 [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]"
            style={{ paddingBottom: `${itemHeight}px`, paddingTop: `${itemHeight}px` }}
        >
            {items.map((item: any) => (
                <div 
                    key={item.value} 
                    className={`h-[50px] flex items-center justify-center snap-center text-lg transition-colors duration-300 ${selectedValue === item.value ? 'text-emerald-400 font-black scale-110' : 'text-muted-foreground font-medium'}`}
                >
                    {item.label}
                </div>
            ))}
        </div>
    );
}