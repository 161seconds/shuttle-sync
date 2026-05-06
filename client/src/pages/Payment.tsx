import { useState, useEffect } from 'react';
import { Check, Clock, Copy, ChevronLeft, AlertCircle, QrCode, ShieldCheck, Loader2 } from 'lucide-react';
import { theme as DS } from '../utils/theme';
import { motion } from 'framer-motion';

interface Props {
    bookingCode: string;
    amount: number;
    courtName: string;
    date: string;
    slots: string[];
    onComplete: () => void;
    onBack: () => void;
}

export default function Payment({ bookingCode, amount, courtName, date, slots, onComplete, onBack }: Props) {
    const [status, setStatus] = useState<'pending' | 'confirming' | 'success' | 'expired'>('pending');
    const [countdown, setCountdown] = useState(15 * 60);
    const [copied, setCopied] = useState(false);

    useEffect(() => {
        if (status !== 'pending') return;
        const iv = setInterval(() => {
            setCountdown(p => { if (p <= 0) { setStatus('expired'); return 0; } return p - 1; });
        }, 1000);
        return () => clearInterval(iv);
    }, [status]);

    const mm = Math.floor(countdown / 60);
    const ss = countdown % 60;

    const confirm = async () => {
        setStatus('confirming');
        // TODO: bookingApi.confirmPayment()
        await new Promise(r => setTimeout(r, 2000));
        setStatus('success');
        setTimeout(onComplete, 2000);
    };

    const copy = () => {
        navigator.clipboard.writeText(bookingCode);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };

    // ═══ TRẠNG THÁI THÀNH CÔNG ═══
    if (status === 'success') {
        return (
            <Wrapper>
                <motion.div initial={{ scale: 0.8, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="flex flex-col items-center">
                    <div className="w-24 h-24 rounded-full bg-emerald-500/20 flex items-center justify-center mb-6 relative">
                        <div className="absolute inset-0 rounded-full border-2 border-emerald-500/30 animate-ping" style={{ animationDuration: '2s' }} />
                        <div className="w-16 h-16 rounded-full bg-linear-to-br from-emerald-400 to-green-500 flex items-center justify-center shadow-[0_0_30px_rgba(16,185,129,0.5)]">
                            <Check className="w-8 h-8 text-black" strokeWidth={3} />
                        </div>
                    </div>
                    <h2 className={`text-2xl font-black ${DS.text.primary} mb-2 tracking-tight`}>Thanh toán thành công!</h2>
                    <p className={`text-sm ${DS.text.muted} mb-8`}>Mã đặt sân: <span className="text-emerald-400 font-mono font-bold tracking-wider">{bookingCode}</span></p>
                    <p className="text-xs text-gray-500 flex items-center gap-1.5"><Loader2 className="w-3 h-3 animate-spin" /> Đang chuyển hướng...</p>
                </motion.div>
            </Wrapper>
        );
    }

    // ═══ TRẠNG THÁI HẾT HẠN ═══
    if (status === 'expired') {
        return (
            <Wrapper>
                <motion.div initial={{ scale: 0.8, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="flex flex-col items-center">
                    <div className="w-24 h-24 rounded-full bg-red-500/10 flex items-center justify-center mb-6">
                        <div className="w-16 h-16 rounded-full bg-red-500/20 flex items-center justify-center border border-red-500/30">
                            <AlertCircle className="w-8 h-8 text-red-400" />
                        </div>
                    </div>
                    <h2 className={`text-2xl font-black ${DS.text.primary} mb-2 tracking-tight`}>Hết hạn thanh toán</h2>
                    <p className={`text-sm ${DS.text.muted} mb-8 text-center max-w-62.5`}>Lịch đặt sân đã bị hủy do quá thời gian chờ thanh toán.</p>
                    <button onClick={onBack} className="w-full py-3.5 rounded-2xl bg-[#1e1e1e] hover:bg-[#2a2a2a] border border-[#333] text-white font-bold text-sm transition-all active:scale-95">
                        Quay lại đặt sân
                    </button>
                </motion.div>
            </Wrapper>
        );
    }

    // ═══ GIAO DIỆN THANH TOÁN CHÍNH ═══
    return (
        <Wrapper>
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="w-full">

                {/* Header */}
                <div className="flex items-center justify-between mb-8 relative">
                    <button onClick={onBack} className="w-10 h-10 rounded-xl bg-white/5 hover:bg-white/10 flex items-center justify-center text-gray-400 hover:text-white transition-colors border border-white/5 absolute left-0">
                        <ChevronLeft className="w-5 h-5" />
                    </button>
                    <div className="w-full text-center">
                        <h2 className={`text-lg font-black ${DS.text.primary} tracking-wide`}>Thanh toán</h2>
                        <p className={`text-[11px] font-medium ${DS.text.muted} mt-1 uppercase tracking-widest`}>Quét mã QR để hoàn tất</p>
                    </div>
                </div>

                {/* QR Code Box */}
                <div className="relative w-56 h-56 mx-auto mb-8">
                    {/* Ánh sáng tỏa phía sau QR */}
                    <div className="absolute inset-0 bg-emerald-500/20 blur-3xl rounded-full" />

                    {/* Khung quét mã */}
                    <div className="relative w-full h-full bg-white p-3.5 rounded-3xl shadow-2xl flex items-center justify-center">
                        {/* 4 góc Bracket */}
                        <div className="absolute -top-1 -left-1 w-8 h-8 border-t-4 border-l-4 border-emerald-500 rounded-tl-[20px]" />
                        <div className="absolute -top-1 -right-1 w-8 h-8 border-t-4 border-r-4 border-emerald-500 rounded-tr-[20px]" />
                        <div className="absolute -bottom-1 -left-1 w-8 h-8 border-b-4 border-l-4 border-emerald-500 rounded-bl-[20px]" />
                        <div className="absolute -bottom-1 -right-1 w-8 h-8 border-b-4 border-r-4 border-emerald-500 rounded-br-[20px]" />

                        <div className="w-full h-full border-2 border-dashed border-gray-200 rounded-2xl flex flex-col items-center justify-center bg-gray-50/50">
                            <QrCode className="w-14 h-14 text-gray-800 mb-2" strokeWidth={1.5} />
                            <p className="text-gray-800 text-[10px] font-mono font-bold text-center uppercase tracking-widest leading-relaxed">
                                Mã QR Demo<br />MoMo / VNPay
                            </p>
                        </div>
                    </div>
                </div>

                {/* Timer */}
                <div className="flex justify-center mb-6">
                    <div className={`flex items-center gap-2 px-4 py-2 rounded-full border backdrop-blur-md ${countdown < 120 ? 'bg-red-500/10 border-red-500/20 text-red-400' : 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400'}`}>
                        <Clock className="w-4 h-4" />
                        <span className="font-mono text-sm font-bold tracking-wider">
                            {String(mm).padStart(2, '0')}:{String(ss).padStart(2, '0')}
                        </span>
                    </div>
                </div>

                {/* Hóa đơn / Receipt */}
                <div className="bg-[#141617]/80 backdrop-blur-xl rounded-2xl p-5 mb-6 border border-white/10 shadow-xl relative overflow-hidden">
                    {/* Hình mờ trang trí */}
                    <ShieldCheck className="absolute -right-4 -bottom-4 w-24 h-24 text-white/2 -rotate-12 pointer-events-none" />

                    <div className="space-y-3.5 relative z-10">
                        <DetailRow label="Mã đơn" value={bookingCode} copyable onCopy={copy} copied={copied} />
                        <DetailRow label="Sân" value={courtName} />
                        <DetailRow label="Ngày" value={date} />
                        <DetailRow label="Giờ" value={slots.join(', ')} accent />

                        <div className="w-full h-px border-t border-dashed border-white/10 my-4" />

                        <div className="flex justify-between items-end">
                            <span className={`text-xs font-semibold ${DS.text.muted} uppercase tracking-wider`}>Tổng thanh toán</span>
                            <span className="text-2xl font-black text-emerald-400">{amount.toLocaleString()}<span className="text-sm font-bold text-emerald-400/60 ml-0.5">đ</span></span>
                        </div>
                    </div>
                </div>

                {/* Action Button */}
                <button onClick={confirm} disabled={status === 'confirming'}
                    className="w-full py-4 rounded-2xl bg-linear-to-r from-emerald-500 to-emerald-400 text-black font-black text-[15px] flex items-center justify-center gap-2 shadow-[0_10px_30px_rgba(16,185,129,0.25)] hover:scale-[1.02] active:scale-[0.98] transition-all duration-300 disabled:opacity-60 disabled:hover:scale-100 disabled:cursor-not-allowed relative overflow-hidden group">
                    {status === 'confirming' ? (
                        <><Loader2 className="w-5 h-5 animate-spin" /> Đang kiểm tra...</>
                    ) : (
                        <>
                            <Check className="w-5 h-5 transition-transform group-hover:scale-110" /> Tôi đã thanh toán
                            {/* Hiệu ứng chớp sáng khi hover */}
                            <div className="absolute inset-0 -translate-x-full bg-linear-to-r from-transparent via-white/30 to-transparent group-hover:animate-[shimmer_1.5s_infinite]" />
                        </>
                    )}
                </button>

                <div className="mt-5 text-center flex items-center justify-center gap-1.5 opacity-60">
                    <ShieldCheck className="w-3.5 h-3.5 text-gray-400" />
                    <span className="text-[10px] text-gray-400 uppercase tracking-widest font-semibold">Giao dịch được mã hóa an toàn</span>
                </div>

            </motion.div>
        </Wrapper>
    );
}

// ═══ COMPONENT HỖ TRỢ ═══

function DetailRow({ label, value, accent, copyable, onCopy, copied }: { label: string; value: string; accent?: boolean; copyable?: boolean; onCopy?: () => void; copied?: boolean }) {
    return (
        <div className="flex justify-between items-center text-[13px]">
            <span className={DS.text.muted}>{label}</span>
            <span className={`font-semibold flex items-center gap-2 ${accent ? 'text-emerald-400' : 'text-gray-200'}`}>
                {value}
                {copyable && (
                    <button onClick={onCopy} className="w-6 h-6 rounded-md bg-white/5 hover:bg-white/10 flex items-center justify-center transition-colors">
                        {copied ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3 text-gray-400" />}
                    </button>
                )}
            </span>
        </div>
    );
}

function Wrapper({ children }: { children: React.ReactNode }) {
    return (
        <div className="min-h-screen bg-[#0a0a0a] flex flex-col items-center justify-center px-6 py-8 relative overflow-hidden">
            {/* Background Orbs */}
            <div className="absolute top-0 right-0 w-96 h-96 bg-emerald-500/5 blur-[120px] rounded-full pointer-events-none" />
            <div className="absolute bottom-0 left-0 w-80 h-80 bg-blue-500/5 blur-[100px] rounded-full pointer-events-none" />

            <div className="w-full max-w-sm relative z-10 flex flex-col">
                {children}
            </div>
        </div>
    );
}