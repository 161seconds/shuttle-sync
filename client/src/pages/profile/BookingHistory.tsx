import { useState, useEffect } from 'react';
import { ChevronLeft, Calendar, Clock, Loader2, Check, X, ChevronRight, Users } from 'lucide-react';
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
            <div className={`sticky top-16 z-30 ${t.bg.base}/80 backdrop-blur-2xl border-b border-white/5`}>
                <div className="flex items-center gap-3 px-4 h-16">
                    <button onClick={onBack} className={`w-10 h-10 rounded-full bg-white/5 hover:bg-white/10 flex items-center justify-center ${t.text.muted} hover:text-white transition-all`}>
                        <ChevronLeft className="w-6 h-6" />
                    </button>
                    <h1 className={`font-black text-lg text-white tracking-wide`}>Lịch sử đặt sân</h1>
                </div>

                {/* THANH TABS */}
                <div className="flex gap-2 px-5 pb-4 mt-2 overflow-x-auto custom-scrollbar">
                    {TABS.map(tb => (
                        <button key={tb.id} onClick={() => setTab(tb.id)}
                            className={`shrink-0 px-4 py-2 rounded-full text-sm font-bold transition-all duration-300 ${tab === tb.id
                                ? 'bg-emerald-500 text-black shadow-[0_0_15px_rgba(16,185,129,0.4)] scale-105'
                                : `bg-white/5 text-gray-400 border border-white/5 hover:bg-white/10 hover:text-white`}`}>
                            {tb.label}
                        </button>
                    ))}
                </div>
            </div>

            <div className="max-w-lg mx-auto px-5 py-6 space-y-5">
                {loading ? (
                    Array.from({ length: 4 }).map((_, i) => (
                        <div key={i} className={`h-32 rounded-3xl bg-white/5 border border-white/5 animate-pulse`} />
                    ))
                ) : bookings.length === 0 ? (
                    <div className="flex flex-col items-center py-20">
                        <div className="w-20 h-20 rounded-full bg-white/5 flex items-center justify-center mb-5">
                            <Calendar className={`w-10 h-10 text-gray-500`} />
                        </div>
                        <p className={`text-white font-bold mb-1.5 text-lg`}>Chưa có đơn đặt sân nào</p>
                    </div>
                ) : (
                    bookings.map(b => {
                        const statusKey = b.status?.toLowerCase() || 'pending_payment';
                        const s = STATUS_MAP[statusKey] || STATUS_MAP.confirmed;
                        const isExpanded = expanded === b._id;

                        const courtObj = (b as any).courtId || (b as any).court;
                        const courtName = typeof courtObj === 'object' ? courtObj?.name : 'Sân (Không xác định)';

                        return (
                            <div key={b._id} className={`relative bg-white/5 rounded-3xl border border-white/10 overflow-hidden transition-all duration-300 hover:border-emerald-500/30 hover:shadow-[0_0_30px_rgba(16,185,129,0.05)]`}>
                                {/* Ticket cutout effect */}
                                <div className="absolute top-1/2 -translate-y-1/2 -left-3 w-6 h-6 bg-[#09090b] rounded-full border-r border-white/10 z-10 hidden sm:block"></div>
                                <div className="absolute top-1/2 -translate-y-1/2 -right-3 w-6 h-6 bg-[#09090b] rounded-full border-l border-white/10 z-10 hidden sm:block"></div>

                                <button onClick={() => setExpanded(isExpanded ? null : b._id)}
                                    className="w-full p-5 flex items-start gap-4 text-left relative z-0">
                                    <div className={`w-12 h-12 rounded-2xl ${s.bg} flex items-center justify-center shrink-0 border border-white/10 shadow-lg`}>
                                        {statusKey === 'confirmed' ? <Check className={`w-6 h-6 ${s.color}`} strokeWidth={3} /> :
                                            statusKey === 'cancelled' ? <X className={`w-6 h-6 ${s.color}`} strokeWidth={3} /> :
                                                statusKey === 'pending_payment' ? <Clock className={`w-6 h-6 ${s.color}`} strokeWidth={3} /> :
                                                    <Calendar className={`w-6 h-6 ${s.color}`} strokeWidth={3} />}
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <div className="flex items-center justify-between mb-1.5">
                                            <h3 className={`font-black text-[15px] text-white truncate`}>{courtName}</h3>
                                            <span className={`px-2.5 py-1 rounded-md text-[10px] font-black uppercase tracking-wider ${s.bg} ${s.color} border border-white/10 shrink-0 ml-2`}>{s.label}</span>
                                        </div>
                                        <div className="flex items-center gap-4 flex-wrap">
                                            <span className={`text-[13px] font-medium text-gray-400 flex items-center gap-1.5`}>
                                                <Calendar className="w-3.5 h-3.5 text-emerald-500" /> {formatDate(b.date)}
                                            </span>
                                            <span className={`text-[13px] font-medium text-gray-400 flex items-center gap-1.5`}>
                                                <Clock className="w-3.5 h-3.5 text-emerald-500" /> {b.startTime} - {b.endTime}
                                            </span>
                                        </div>
                                        <div className="flex items-center justify-between mt-3">
                                            <span className={`text-[11px] font-mono text-gray-500 bg-black/50 px-2 py-1 rounded-md border border-white/5`}>#{b.bookingCode}</span>
                                            <span className="text-emerald-400 text-[15px] font-black">{b.finalAmount?.toLocaleString()}đ</span>
                                        </div>
                                    </div>
                                    <ChevronRight className={`w-5 h-5 text-gray-600 shrink-0 mt-3.5 transition-transform duration-300 ${isExpanded ? 'rotate-90 text-emerald-400' : ''}`} />
                                </button>

                                {/* Detailed Ticket Stub */}
                                {isExpanded && (
                                    <div className={`px-5 pb-5 bg-black/40 border-t-2 border-dashed border-white/10 relative z-0`}>
                                        <div className="space-y-2 mb-4">
                                            <DetailRow label="Phương thức thanh toán" value={b.payment?.method === 'qr_code' ? 'QR Code' : b.payment?.method || '—'} />
                                            <DetailRow label="Tổng tiền" value={`${b.totalAmount?.toLocaleString()}đ`} />
                                        </div>

                                        {/* NÚT TẠO NHÓM CHƠI */}
                                        {statusKey === 'confirmed' && (
                                            <button
                                                onClick={() => {
                                                    window.location.href = `/?tab=group-plays&openCreate=true`;
                                                }}
                                                className="w-full mt-2 py-3 rounded-2xl bg-linear-to-r from-blue-600 to-indigo-500 text-white text-[13px] font-black flex items-center justify-center gap-2 hover:opacity-90 transition-opacity shadow-[0_0_20px_rgba(59,130,246,0.3)]">
                                                <Users className="w-4 h-4" />
                                                Tuyển người chơi (Tạo nhóm)
                                            </button>
                                        )}

                                        {/* NÚT HỦY SÂN */}
                                        {(statusKey === 'pending_payment' || statusKey === 'confirmed') && (
                                            <button onClick={() => handleCancel(b._id)} disabled={cancelling === b._id}
                                                className="w-full mt-3 py-3 rounded-2xl bg-red-500/10 text-red-400 text-[13px] font-black flex items-center justify-center gap-2 hover:bg-red-500/20 border border-red-500/30 transition-all hover:shadow-[0_0_15px_rgba(239,68,68,0.2)]">
                                                {cancelling === b._id ? <Loader2 className="w-4 h-4 animate-spin" /> : <X className="w-4 h-4" strokeWidth={3} />}
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
        <div className="flex justify-between text-[13px] items-center py-1">
            <span className="text-gray-400 font-medium">{label}</span>
            <span className={`font-black ${accent ? 'text-emerald-400' : 'text-white'}`}>{value}</span>
        </div>
    );
}