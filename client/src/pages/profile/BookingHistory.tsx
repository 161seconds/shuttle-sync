import { useState, useEffect } from 'react';
import { ChevronLeft, Calendar, Clock, Loader2, Check, X, ChevronRight, Users } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { theme as t } from '../../utils/theme';
import axiosClient from '../../api/axiosClient';
import type { Booking } from '../../types';
import { useAlertStore } from '../../stores/useAlertStore';

const STATUS_MAP: Record<string, { label: string; color: string; bg: string }> = {
    pending_payment: { label: 'Chờ thanh toán', color: 'text-amber-400', bg: 'bg-amber-500/10' },
    confirmed: { label: 'Đã xác nhận', color: 'text-emerald-400', bg: 'bg-emerald-500/10' },
    completed: { label: 'Hoàn thành', color: 'text-blue-400', bg: 'bg-blue-500/10' },
    cancelled: { label: 'Đã hủy', color: 'text-red-400', bg: 'bg-red-500/10' },
    no_show: { label: 'Vắng mặt', color: 'text-orange-400', bg: 'bg-orange-500/10' },
};

interface Props {
    onBack: () => void;
}

export default function BookingHistory({ onBack }: Props) {
    const [bookings, setBookings] = useState<Booking[]>([]);
    const [loading, setLoading] = useState(true);
    const [tab, setTab] = useState<'all' | 'confirmed' | 'completed' | 'cancelled'>('all');
    const [cancelling, setCancelling] = useState<string | null>(null);
    const [expanded, setExpanded] = useState<string | null>(null);
    const [pageIndex, setPageIndex] = useState(1);
    const ITEMS_PER_PAGE = 12;

    const fetchBookings = async () => {
        setLoading(true);
        try {
            const params: any = {};
            if (tab !== 'all') params.status = tab;

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
    }, [tab]);

    useEffect(() => {
        if (expanded) {
            document.body.style.overflow = 'hidden';
        } else {
            document.body.style.overflow = 'unset';
        }
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
                await fetchBookings(); // Tải lại danh sách sau khi hủy
                setTab('cancelled'); // Chuyển sang tab Đã hủy
                showAlert('Hủy đặt sân thành công!', 'Thành công', 'success');
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
        <div className={`min-h-screen w-full${t.bg.base} pb-24`}>
            <div className={`sticky top-16 z-30 ${t.bg.base}/80 backdrop-blur-2xl border-b border-border`}>
                <div className="flex items-center gap-3 px-4 h-16">
                    <button onClick={onBack} className={`w-10 h-10 rounded-full bg-card hover:bg-muted flex items-center justify-center ${t.text.muted} hover:text-foreground transition-all`}>
                        <ChevronLeft className="w-6 h-6" />
                    </button>
                    <h1 className={`font-black text-lg text-foreground tracking-wide`}>Lịch sử đặt sân</h1>
                </div>

                {/* THANH TABS */}
                <div className="flex gap-2 px-5 pb-4 mt-2 overflow-x-auto custom-scrollbar">
                    {TABS.map(tb => (
                        <button key={tb.id} onClick={() => setTab(tb.id)}
                            className={`shrink-0 px-4 py-2 rounded-full text-sm font-bold transition-all duration-300 ${tab === tb.id
                                ? 'bg-emerald-500 text-black shadow-glow-lg scale-105'
                                : `bg-card text-muted-foreground border border-border hover:bg-muted hover:text-foreground`}`}>
                            {tb.label}
                        </button>
                    ))}
                </div>
            </div>

            <div className="w-full max-w-7xl mx-auto px-4 lg:px-8 py-6">
                {loading ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                        {Array.from({ length: 8 }).map((_, i) => (
                            <div key={i} className={`h-32 rounded-3xl bg-card border border-border animate-pulse`} />
                        ))}
                    </div>
                ) : bookings.length === 0 ? (
                    <div className="flex flex-col items-center py-20 col-span-full">
                        <div className="w-20 h-20 rounded-full bg-card flex items-center justify-center mb-5">
                            <Calendar className={`w-10 h-10 text-muted-foreground`} />
                        </div>
                        <p className={`text-foreground font-bold mb-1.5 text-lg`}>Chưa có đơn đặt sân nào</p>
                    </div>
                ) : (
                    <>
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 items-start">
                            {displayedBookings.map(b => {
                                const statusKey = b.status?.toLowerCase() || 'pending_payment';
                                const s = STATUS_MAP[statusKey] || STATUS_MAP.confirmed;

                                const courtObj = (b as any).courtId || (b as any).court;
                                const courtName = typeof courtObj === 'object' ? courtObj?.name : 'Sân (Không xác định)';

                                return (
                                    <div key={b._id} className={`relative flex flex-col h-full bg-card rounded-3xl border border-border overflow-hidden transition-all duration-300 hover:border-emerald-500/30 hover:shadow-[0_0_30px_rgba(16,185,129,0.05)] group`}>
                                        <button onClick={() => setExpanded(b._id)} className="w-full flex flex-col h-full text-left relative z-0">
                                            
                                            {/* TOP SECTION */}
                                            <div className="p-5 pb-4 w-full">
                                                <div className="flex items-start gap-4 mb-1">
                                                    <div className={`w-12 h-12 rounded-2xl ${s.bg} flex items-center justify-center shrink-0 border border-border shadow-inner group-hover:scale-105 transition-transform`}>
                                                        {statusKey === 'confirmed' ? <Check className={`w-6 h-6 ${s.color}`} strokeWidth={3} /> :
                                                            statusKey === 'cancelled' ? <X className={`w-6 h-6 ${s.color}`} strokeWidth={3} /> :
                                                                statusKey === 'pending_payment' ? <Clock className={`w-6 h-6 ${s.color}`} strokeWidth={3} /> :
                                                                    <Calendar className={`w-6 h-6 ${s.color}`} strokeWidth={3} />}
                                                    </div>
                                                    <div>
                                                        <h3 className={`font-black text-xl text-foreground leading-tight line-clamp-2 mb-2`}>{courtName}</h3>
                                                        <span className={`px-2.5 py-1 rounded-md text-[10px] font-black uppercase tracking-wider ${s.bg} ${s.color} border border-border inline-block`}>
                                                            {s.label}
                                                        </span>
                                                    </div>
                                                </div>
                                            </div>

                                            {/* DIVIDER WITH CUTOUTS */}
                                            <div className="w-full relative flex items-center h-6">
                                                <div className="absolute -left-3 w-6 h-6 bg-background rounded-full border-r border-border z-10"></div>
                                                <div className="h-px border-b-2 border-dashed border-border w-full mx-4"></div>
                                                <div className="absolute -right-3 w-6 h-6 bg-background rounded-full border-l border-border z-10"></div>
                                            </div>

                                            {/* BOTTOM SECTION */}
                                            <div className="p-5 pt-3 mt-auto w-full">
                                                <div className="bg-card rounded-2xl p-4 border border-border mb-4">
                                                    <div className={`text-[13px] font-medium text-muted-foreground flex items-center gap-3 mb-2.5`}>
                                                        <div className="w-6 h-6 rounded-full bg-emerald-500/10 flex items-center justify-center shrink-0">
                                                            <Calendar className="w-3.5 h-3.5 text-emerald-400" /> 
                                                        </div>
                                                        {formatDate(b.date)}
                                                    </div>
                                                    <div className={`text-[13px] font-medium text-muted-foreground flex items-center gap-3`}>
                                                        <div className="w-6 h-6 rounded-full bg-blue-500/10 flex items-center justify-center shrink-0">
                                                            <Clock className="w-3.5 h-3.5 text-blue-400" />
                                                        </div>
                                                        {b.startTime} - {b.endTime}
                                                    </div>
                                                </div>
                                                <div className="flex items-center justify-between">
                                                    <span className={`text-[11px] font-mono text-muted-foreground bg-card px-2 py-1 rounded-md border border-border`}>#{b.bookingCode}</span>
                                                    <span className="text-emerald-400 text-xl font-black">{b.finalAmount?.toLocaleString()}đ</span>
                                                </div>
                                            </div>
                                        </button>
                            </div>
                        );
                    })}
                        </div>
                        
                        {/* Pagination Controls */}
                        {totalPages > 1 && (
                            <div className="mt-10 flex items-center justify-center gap-3">
                                <button 
                                    disabled={pageIndex === 1}
                                    onClick={() => setPageIndex(p => Math.max(1, p - 1))}
                                    className="w-10 h-10 rounded-full bg-card flex items-center justify-center disabled:opacity-30 hover:bg-muted transition-colors"
                                >
                                    <ChevronLeft className="w-5 h-5" />
                                </button>
                                <span className="text-sm font-bold text-muted-foreground">Trang {pageIndex} / {totalPages}</span>
                                <button 
                                    disabled={pageIndex === totalPages}
                                    onClick={() => setPageIndex(p => Math.min(totalPages, p + 1))}
                                    className="w-10 h-10 rounded-full bg-card flex items-center justify-center disabled:opacity-30 hover:bg-muted transition-colors"
                                >
                                    <ChevronRight className="w-5 h-5" />
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
                    const s = STATUS_MAP[statusKey] || STATUS_MAP.confirmed;
                    const courtObj = (b as any).courtId || (b as any).court;
                    const courtName = typeof courtObj === 'object' ? courtObj?.name : 'Sân (Không xác định)';

                    return (
                        <motion.div 
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-card backdrop-blur-sm"
                            onClick={() => setExpanded(null)}
                        >
                            <motion.div 
                                initial={{ scale: 0.9, opacity: 0, y: 20 }}
                                animate={{ scale: 1, opacity: 1, y: 0 }}
                                exit={{ scale: 0.9, opacity: 0, y: 20 }}
                                onClick={e => e.stopPropagation()}
                                className="bg-background border border-border rounded-[2rem] p-6 w-full max-w-md shadow-card relative"
                            >
                                <button onClick={() => setExpanded(null)} className="absolute top-5 right-5 text-muted-foreground hover:text-foreground bg-card hover:bg-muted p-2 rounded-full transition-colors">
                                    <X className="w-5 h-5" />
                                </button>

                                <div className="flex flex-col items-center mb-6 pt-2">
                                    <div className={`w-20 h-20 rounded-3xl ${s.bg} flex items-center justify-center border border-border shadow-lg mb-5`}>
                                        {statusKey === 'confirmed' ? <Check className={`w-10 h-10 ${s.color}`} strokeWidth={3} /> :
                                            statusKey === 'cancelled' ? <X className={`w-10 h-10 ${s.color}`} strokeWidth={3} /> :
                                                statusKey === 'pending_payment' ? <Clock className={`w-10 h-10 ${s.color}`} strokeWidth={3} /> :
                                                    <Calendar className={`w-10 h-10 ${s.color}`} strokeWidth={3} />}
                                    </div>
                                    <h2 className="text-2xl font-black text-foreground text-center mb-3 leading-tight px-4">{courtName}</h2>
                                    <span className={`px-4 py-1.5 rounded-xl text-[13px] font-black uppercase tracking-widest ${s.bg} ${s.color} border border-border`}>
                                        {s.label}
                                    </span>
                                </div>

                                <div className="space-y-4 bg-card p-6 rounded-[1.5rem] border border-border mb-6">
                                    <DetailRow label="Mã đơn" value={`#${b.bookingCode}`} />
                                    <DetailRow label="Ngày chơi" value={formatDate(b.date)} />
                                    <DetailRow label="Thời gian" value={`${b.startTime} - ${b.endTime}`} />
                                    <DetailRow label="Thanh toán" value={b.payment?.method === 'qr_code' ? 'QR Code' : b.payment?.method || '—'} />
                                    <div className="h-px bg-card my-4"></div>
                                    <div className="flex justify-between items-center">
                                        <span className="text-muted-foreground font-bold text-[15px]">Tổng thanh toán</span>
                                        <span className="text-3xl font-black text-emerald-400 drop-shadow-md">{b.totalAmount?.toLocaleString()}đ</span>
                                    </div>
                                </div>

                                <div className="space-y-3">
                                    {/* NÚT TẠO NHÓM CHƠI */}
                                    {statusKey === 'confirmed' && (
                                        <button
                                            onClick={() => {
                                                window.location.href = `/?tab=group-plays&openCreate=true`;
                                            }}
                                            className="w-full py-4 rounded-2xl bg-linear-to-r from-blue-600 to-indigo-500 text-foreground text-[15px] font-black flex items-center justify-center gap-2.5 hover:opacity-90 transition-opacity shadow-[0_0_30px_rgba(59,130,246,0.3)]">
                                            <Users className="w-5 h-5" />
                                            Tuyển người chơi (Tạo nhóm)
                                        </button>
                                    )}

                                    {/* NÚT HỦY SÂN */}
                                    {(statusKey === 'pending_payment' || statusKey === 'confirmed') && (
                                        <button onClick={() => handleCancel(b._id)} disabled={cancelling === b._id}
                                            className="w-full py-4 rounded-2xl bg-red-500/10 text-red-400 text-[15px] font-black flex items-center justify-center gap-2.5 hover:bg-red-500/20 border border-red-500/30 transition-all hover:shadow-[0_0_20px_rgba(239,68,68,0.2)]">
                                            {cancelling === b._id ? <Loader2 className="w-5 h-5 animate-spin" /> : <X className="w-5 h-5" strokeWidth={3} />}
                                            Hủy đặt sân
                                        </button>
                                    )}
                                </div>
                            </motion.div>
                        </motion.div>
                    );
                })()}
            </AnimatePresence>
        </div>
    );
}

function DetailRow({ label, value, accent }: { label: string; value: string; accent?: boolean }) {
    return (
        <div className="flex justify-between text-[13px] items-center py-1">
            <span className="text-muted-foreground font-medium">{label}</span>
            <span className={`font-black ${accent ? 'text-emerald-400' : 'text-foreground'}`}>{value}</span>
        </div>
    );
}