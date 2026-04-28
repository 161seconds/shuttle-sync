import { useState, useEffect } from 'react';
import { ChevronLeft, Calendar, Clock, Loader2, Check, X, ChevronRight } from 'lucide-react';
import { theme as t } from '../../utils/theme';
import axiosClient from '../../api/axiosClient';
import type { Booking } from '../../types';

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

    useEffect(() => { fetchBookings(); }, [tab]);

    const handleCancel = async (bookingId: string) => {
        if (!confirm('Bạn chắc chắn muốn hủy đặt sân này?')) return;
        setCancelling(bookingId);
        try {
            await axiosClient.post(`/bookings/${bookingId}/cancel`, { reason: 'Người dùng hủy' });
            await fetchBookings();
        } catch (err) {
            console.error('Lỗi hủy:', err);
        } finally {
            setCancelling(null);
        }
    };

    const formatDate = (d: string) => new Date(d).toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit', year: 'numeric' });

    const TABS = [
        { id: 'all', label: 'Tất cả' },
        { id: 'confirmed', label: 'Đã xác nhận' },
        { id: 'completed', label: 'Hoàn thành' },
        { id: 'cancelled', label: 'Đã hủy' },
    ] as const;

    return (
        <div className={`min-h-screen ${t.bg.base} pb-24`}>
            <div className={`sticky top-0 z-30 ${t.bg.base}/95 backdrop-blur-xl border-b ${t.border.subtle}`}>
                <div className="flex items-center gap-3 px-4 h-14">
                    <button onClick={onBack} className={`w-9 h-9 rounded-xl ${t.bg.elevated} flex items-center justify-center ${t.text.muted}`}>
                        <ChevronLeft className="w-5 h-5" />
                    </button>
                    <h1 className={`font-bold ${t.text.primary}`}>Lịch sử đặt sân</h1>
                </div>
                {/* Tab bar */}
                <div className="flex gap-1 px-4 pb-3 overflow-x-auto scrollbar-none">
                    {TABS.map(tb => (
                        <button key={tb.id} onClick={() => setTab(tb.id)}
                            className={`shrink-0 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${tab === tb.id
                                ? 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/30'
                                : `${t.bg.elevated} ${t.text.muted} border ${t.border.subtle}`}`}>
                            {tb.label}
                        </button>
                    ))}
                </div>
            </div>

            <div className="max-w-lg mx-auto px-4 py-4 space-y-3">
                {loading ? (
                    Array.from({ length: 4 }).map((_, i) => (
                        <div key={i} className={`h-28 rounded-2xl ${t.bg.card} border ${t.border.subtle} animate-pulse`} />
                    ))
                ) : bookings.length === 0 ? (
                    <div className="flex flex-col items-center py-20">
                        <Calendar className={`w-12 h-12 ${t.text.muted} mb-4`} />
                        <p className={`${t.text.secondary} font-semibold mb-1`}>Chưa có đặt sân nào</p>
                        <p className={`text-xs ${t.text.muted}`}>Đặt sân đầu tiên của bạn ngay!</p>
                    </div>
                ) : (
                    bookings.map(b => {
                        const s = STATUS_MAP[b.status] || STATUS_MAP.confirmed;
                        const isExpanded = expanded === b._id;
                        const courtName = (b.court as any)?.name || 'Sân';

                        return (
                            <div key={b._id} className={`${t.bg.card} rounded-2xl border ${t.border.subtle} overflow-hidden`}>
                                <button onClick={() => setExpanded(isExpanded ? null : b._id)}
                                    className="w-full p-4 flex items-start gap-3 text-left">
                                    <div className={`w-10 h-10 rounded-xl ${s.bg} flex items-center justify-center shrink-0 mt-0.5`}>
                                        {b.status === 'confirmed' ? <Check className={`w-4 h-4 ${s.color}`} /> :
                                            b.status === 'cancelled' ? <X className={`w-4 h-4 ${s.color}`} /> :
                                                b.status === 'pending_payment' ? <Clock className={`w-4 h-4 ${s.color}`} /> :
                                                    <Calendar className={`w-4 h-4 ${s.color}`} />}
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <div className="flex items-center justify-between mb-1">
                                            <h3 className={`font-bold text-sm ${t.text.primary} truncate`}>{courtName}</h3>
                                            <span className={`px-2 py-0.5 rounded-md text-[10px] font-bold ${s.bg} ${s.color} shrink-0 ml-2`}>{s.label}</span>
                                        </div>
                                        <div className="flex items-center gap-3 flex-wrap">
                                            <span className={`text-xs ${t.text.muted} flex items-center gap-1`}>
                                                <Calendar className="w-3 h-3" /> {formatDate(b.date)}
                                            </span>
                                            <span className={`text-xs ${t.text.muted} flex items-center gap-1`}>
                                                <Clock className="w-3 h-3" /> {b.startTime} - {b.endTime}
                                            </span>
                                        </div>
                                        <div className="flex items-center justify-between mt-2">
                                            <span className={`text-xs font-mono ${t.text.muted}`}>#{b.bookingCode}</span>
                                            <span className="text-emerald-400 text-sm font-black">{b.finalAmount?.toLocaleString()}đ</span>
                                        </div>
                                    </div>
                                    <ChevronRight className={`w-4 h-4 ${t.text.muted} shrink-0 mt-3 transition-transform ${isExpanded ? 'rotate-90' : ''}`} />
                                </button>

                                {isExpanded && (
                                    <div className={`px-4 pb-4 border-t ${t.border.subtle} pt-3 space-y-2`}>
                                        <DetailRow label="Thanh toán" value={b.payment?.method === 'qr_code' ? 'QR Code' : b.payment?.method || '—'} />
                                        <DetailRow label="Tạm tính" value={`${b.totalAmount?.toLocaleString()}đ`} />
                                        {b.discount > 0 && <DetailRow label="Giảm giá" value={`-${b.discount?.toLocaleString()}đ`} accent />}
                                        {b.notes && <DetailRow label="Ghi chú" value={b.notes} />}
                                        {b.cancelReason && <DetailRow label="Lý do hủy" value={b.cancelReason} />}

                                        {(b.status === 'pending_payment' || b.status === 'confirmed') && (
                                            <button onClick={() => handleCancel(b._id)} disabled={cancelling === b._id}
                                                className="w-full mt-3 py-2.5 rounded-xl bg-red-500/10 text-red-400 text-xs font-bold flex items-center justify-center gap-2 hover:bg-red-500/15 transition-colors">
                                                {cancelling === b._id ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <X className="w-3.5 h-3.5" />}
                                                Hủy đặt sân
                                            </button>
                                        )}
                                    </div>
                                )}
                            </div>
                        );
                    })
                )}
            </div>
        </div>
    );
}

function DetailRow({ label, value, accent }: { label: string; value: string; accent?: boolean }) {
    return (
        <div className="flex justify-between text-xs">
            <span className="text-[#555]">{label}</span>
            <span className={accent ? 'text-emerald-400' : 'text-[#999]'}>{value}</span>
        </div>
    );
}