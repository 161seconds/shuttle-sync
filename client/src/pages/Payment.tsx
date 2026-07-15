import { useState, useEffect } from 'react';
import { Check, Clock, Copy, ChevronLeft, AlertCircle, ShieldCheck, Loader2 } from 'lucide-react';
import { theme as DS } from '../utils/theme';
import { motion } from 'framer-motion';
import { useAlertStore } from '../stores/useAlertStore';
import axiosClient from '../api/axiosClient';

interface Props {
    bookingCode: string;
    amount: number;
    courtName: string;
    date: string;
    slots: string[];
    onComplete: () => void;
    onBack: () => void;
}

export default function Payment({ bookingCode, amount, courtName, date, slots, onComplete, onBack, expiresAt }: Props & { expiresAt?: string }) {
    const [status, setStatus] = useState<'pending' | 'confirming' | 'success' | 'expired'>('pending');
    const [countdown, setCountdown] = useState(() => {
        if (expiresAt) {
            const left = Math.floor((new Date(expiresAt).getTime() - Date.now()) / 1000);
            return Math.max(0, left);
        }
        return 15 * 60;
    });
    const [copied, setCopied] = useState(false);

    // Cấu hình ngân hàng SePay (có thể đưa vào .env)
    const BANK_ID = import.meta.env.VITE_SEPAY_BANK_ID;
    const BANK_ACC = import.meta.env.VITE_SEPAY_BANK_ACC;
    const BANK_HOLDER = import.meta.env.VITE_SEPAY_BANK_HOLDER;
    const transferSyntax = `SHUTTLE ${bookingCode}`;
    const qrUrl = `https://vietqr.app/img?bank=${BANK_ID}&acc=${BANK_ACC}&amount=${amount}&des=${transferSyntax}&template=qronly&showinfo=true&fullacc=true&holder=${encodeURIComponent(BANK_HOLDER)}`;

    // Đếm ngược thời gian
    useEffect(() => {
        if (status !== 'pending' && status !== 'confirming') return;
        const iv = setInterval(() => {
            setCountdown(p => { if (p <= 0) { setStatus('expired'); return 0; } return p - 1; });
        }, 1000);
        return () => clearInterval(iv);
    }, [status]);

    // Polling API liên tục để kiểm tra trạng thái thanh toán từ SePay Webhook
    useEffect(() => {
        if (status !== 'pending' && status !== 'confirming') return;

        const checkStatus = async () => {
            try {
                const res = await axiosClient.get(`/payment/status/${bookingCode}`);
                if (res.data?.data?.status === 'confirmed' || res.data?.data?.status === 'completed') {
                    setStatus('success');
                    setTimeout(onComplete, 2000); // Tự động chuyển trang sau 2s
                }
            } catch (err) {
                console.error("Lỗi khi kiểm tra trạng thái thanh toán:", err);
            }
        };

        const pollInterval = setInterval(checkStatus, 10000); // 10 giây check 1 lần để tránh bị quá tải (rate limit 429)
        return () => clearInterval(pollInterval);
    }, [bookingCode, status]);

    const mm = Math.floor(countdown / 60);
    const ss = countdown % 60;

    const copy = (text: string) => {
        navigator.clipboard.writeText(text);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
        useAlertStore.getState().showAlert("Đã sao chép nội dung!", 'Thành công', 'success');
    };

    if (status === 'success') {
        return (
            <Wrapper>
                <motion.div initial={{ scale: 0.8, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="flex flex-col items-center">
                    <div className="w-24 h-24 rounded-full bg-emerald-500/20 flex items-center justify-center mb-6 relative">
                        <div className="absolute inset-0 rounded-full border-2 border-emerald-500/30 animate-ping" style={{ animationDuration: '2s' }} />
                        <div className="w-16 h-16 rounded-full bg-linear-to-br from-emerald-400 to-green-500 flex items-center justify-center shadow-glow-lg">
                            <Check className="w-8 h-8 text-black" strokeWidth={3} />
                        </div>
                    </div>
                    <h2 className={`text-2xl font-black ${DS.text.primary} mb-2 tracking-tight`}>Thanh toán thành công!</h2>
                    <p className={`text-sm ${DS.text.muted} mb-8`}>Mã đặt sân: <span className="text-emerald-400 font-mono font-bold tracking-wider">{bookingCode}</span></p>
                    <p className="text-xs text-muted-foreground flex items-center gap-1.5"><Loader2 className="w-3 h-3 animate-spin" /> Đang chuyển hướng...</p>
                </motion.div>
            </Wrapper>
        );
    }

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
                    <button onClick={onBack} className="w-full py-3.5 rounded-2xl bg-card hover:bg-surface border border-border text-foreground font-bold text-sm transition-all active:scale-95">
                        Quay lại đặt sân
                    </button>
                </motion.div>
            </Wrapper>
        );
    }

    return (
        <Wrapper>
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="w-full">
                <div className="flex items-center justify-between mb-8 relative">
                    <button onClick={onBack} className="w-10 h-10 rounded-xl bg-card hover:bg-muted flex items-center justify-center text-muted-foreground hover:text-foreground transition-colors border border-border absolute left-0">
                        <ChevronLeft className="w-5 h-5" />
                    </button>
                    <div className="w-full text-center">
                        <h2 className={`text-lg font-black ${DS.text.primary} tracking-wide`}>Thanh toán VietQR</h2>
                        <p className={`text-[11px] font-medium ${DS.text.muted} mt-1 uppercase tracking-widest`}>Quét mã bằng ứng dụng ngân hàng</p>
                    </div>
                </div>

                {/* QR Code Container */}
                <div className="relative w-64 h-64 mx-auto mb-6">
                    <div className="absolute inset-0 bg-emerald-500/20 blur-3xl rounded-full" />
                    <div className="relative w-full h-full bg-white p-2 rounded-3xl shadow-2xl flex flex-col items-center justify-center">
                        <img src={qrUrl} alt="VietQR" className="w-full h-full object-contain rounded-2xl" />
                    </div>
                </div>

                <div className="flex justify-center mb-6">
                    <div className={`flex items-center gap-2 px-4 py-2 rounded-full border backdrop-blur-md ${countdown < 120 ? 'bg-red-500/10 border-red-500/20 text-red-400' : 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400'}`}>
                        <Clock className="w-4 h-4" />
                        <span className="font-mono text-sm font-bold tracking-wider">
                            {String(mm).padStart(2, '0')}:{String(ss).padStart(2, '0')}
                        </span>
                    </div>
                </div>

                <div className="bg-card/80 backdrop-blur-xl rounded-2xl p-5 mb-6 border border-border shadow-xl relative overflow-hidden">
                    <ShieldCheck className="absolute -right-4 -bottom-4 w-24 h-24 text-foreground/2 -rotate-12 pointer-events-none" />
                    <div className="space-y-3.5 relative z-10">
                        <DetailRow label="Sân" value={courtName} />
                        <DetailRow label="Ngày" value={date} />
                        <DetailRow label="Giờ" value={slots.join(', ')} />
                        <div className="w-full h-px border-t border-dashed border-border my-2" />
                        <DetailRow label="Ngân hàng" value={BANK_ID} />
                        <DetailRow label="Số tài khoản" value={BANK_ACC} copyable onCopy={() => copy(BANK_ACC)} copied={copied} />
                        <DetailRow label="Số tiền" value={`${amount.toLocaleString()}đ`} copyable onCopy={() => copy(amount.toString())} copied={copied} accent />
                        <DetailRow label="Nội dung CK" value={transferSyntax} copyable onCopy={() => copy(transferSyntax)} copied={copied} />
                    </div>
                </div>

                <div className="bg-red-500/10 border border-red-500/20 rounded-xl p-4 mb-6 flex items-start gap-3">
                    <AlertCircle className="w-5 h-5 text-red-500 shrink-0 mt-0.5" />
                    <p className="text-sm text-red-500/90 leading-relaxed font-medium">
                        <span className="font-bold">Lưu ý:</span> Vui lòng không thay đổi số tiền và nội dung chuyển khoản.
                    </p>
                </div>

                <div className="text-center text-sm text-emerald-400/80 animate-pulse font-medium">
                    Đang đợi hệ thống ghi nhận thanh toán...
                </div>

            </motion.div>
        </Wrapper>
    );
}

function DetailRow({ label, value, accent, copyable, onCopy, copied }: { label: string; value: string; accent?: boolean; copyable?: boolean; onCopy?: () => void; copied?: boolean }) {
    return (
        <div className="flex justify-between items-center text-[13px]">
            <span className={DS.text.muted}>{label}</span>
            <span className={`font-semibold flex items-center gap-2 ${accent ? 'text-emerald-400 text-base font-bold' : 'text-foreground'}`}>
                {value}
                {copyable && (
                    <button onClick={onCopy} className="w-6 h-6 rounded-md bg-card hover:bg-muted flex items-center justify-center transition-colors">
                        {copied ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3 text-muted-foreground" />}
                    </button>
                )}
            </span>
        </div>
    );
}

function Wrapper({ children }: { children: React.ReactNode }) {
    return (
        <div className="min-h-screen bg-background flex flex-col items-center justify-center px-6 py-8 relative overflow-hidden">
            <div className="absolute top-0 right-0 w-96 h-96 bg-emerald-500/5 blur-[120px] rounded-full pointer-events-none" />
            <div className="absolute bottom-0 left-0 w-80 h-80 bg-blue-500/5 blur-[100px] rounded-full pointer-events-none" />
            <div className="w-full max-w-sm relative z-10 flex flex-col">
                {children}
            </div>
        </div>
    );
}