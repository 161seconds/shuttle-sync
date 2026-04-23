import { useState, useEffect } from 'react';
import { Check, Clock, Copy, ChevronLeft, AlertCircle } from 'lucide-react';
import { theme as DS } from '../utils/theme';

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

    const copy = () => { navigator.clipboard.writeText(bookingCode); setCopied(true); setTimeout(() => setCopied(false), 2000); };

    if (status === 'success') {
        return (
            <Wrapper>
                <div className="w-20 h-20 rounded-full bg-emerald-500/20 flex items-center justify-center mx-auto mb-6">
                    <div className="w-14 h-14 rounded-full bg-emerald-500 flex items-center justify-center shadow-lg shadow-emerald-500/30">
                        <Check className="w-7 h-7 text-black" strokeWidth={3} />
                    </div>
                </div>
                <h2 className={`text-xl font-black ${DS.text.primary} mb-2`}>Đặt sân thành công!</h2>
                <p className={`text-sm ${DS.text.muted}`}>Mã đặt sân: <span className={DS.text.accent}>{bookingCode}</span></p>
            </Wrapper>
        );
    }

    if (status === 'expired') {
        return (
            <Wrapper>
                <div className="w-20 h-20 rounded-full bg-red-500/20 flex items-center justify-center mx-auto mb-6">
                    <AlertCircle className="w-10 h-10 text-red-400" />
                </div>
                <h2 className={`text-xl font-black ${DS.text.primary} mb-2`}>Hết thời gian thanh toán</h2>
                <p className={`text-sm ${DS.text.muted} mb-6`}>Đơn đã bị hủy tự động</p>
                <button onClick={onBack} className="px-6 py-3 rounded-xl bg-emerald-500 text-black font-bold text-sm">Đặt lại</button>
            </Wrapper>
        );
    }

    return (
        <Wrapper>
            <button onClick={onBack} className={`flex items-center gap-2 ${DS.text.muted} text-sm mb-6 hover:text-emerald-400 transition-colors self-start`}>
                <ChevronLeft className="w-4 h-4" /> Quay lại
            </button>

            <h2 className={`text-lg font-bold ${DS.text.primary} mb-1 text-center`}>Thanh toán</h2>
            <p className={`text-xs ${DS.text.muted} text-center mb-6`}>Quét mã QR để thanh toán</p>

            {/* Timer */}
            <div className={`flex items-center justify-center gap-2 mb-6 ${countdown < 120 ? 'text-red-400' : DS.text.accent}`}>
                <Clock className="w-4 h-4" />
                <span className="font-mono text-lg font-bold">{String(mm).padStart(2, '0')}:{String(ss).padStart(2, '0')}</span>
            </div>

            {/* QR */}
            <div className={`${DS.bg.card} rounded-2xl border ${DS.border.subtle} p-6 mb-4 w-full`}>
                <div className="w-48 h-48 mx-auto bg-white rounded-xl flex items-center justify-center mb-4">
                    <p className="text-black text-xs font-mono text-center">QR Code<br />Mock</p>
                </div>
                <div className="space-y-2 text-xs">
                    <div className="flex justify-between">
                        <span className={DS.text.muted}>Mã đơn</span>
                        <span className={`${DS.text.primary} flex items-center gap-1.5`}>
                            {bookingCode}
                            <button onClick={copy} className={`${DS.text.muted} hover:text-emerald-400 transition-colors`}>
                                {copied ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                            </button>
                        </span>
                    </div>
                    <div className="flex justify-between"><span className={DS.text.muted}>Sân</span><span className={DS.text.primary}>{courtName}</span></div>
                    <div className="flex justify-between"><span className={DS.text.muted}>Ngày</span><span className={DS.text.primary}>{date}</span></div>
                    <div className="flex justify-between"><span className={DS.text.muted}>Giờ</span><span className={DS.text.accent}>{slots.join(', ')}</span></div>
                    <div className={`h-px ${DS.bg.elevated} my-2`} />
                    <div className="flex justify-between text-sm">
                        <span className={`font-bold ${DS.text.primary}`}>Tổng cộng</span>
                        <span className={`font-black ${DS.text.accent}`}>{amount.toLocaleString()}đ</span>
                    </div>
                </div>
            </div>

            <button onClick={confirm} disabled={status === 'confirming'}
                className="w-full py-3.5 rounded-xl bg-emerald-500 text-black font-bold text-sm flex items-center justify-center gap-2 shadow-lg shadow-emerald-500/20 hover:bg-emerald-400 disabled:opacity-60 active:scale-[0.98]">
                {status === 'confirming'
                    ? <span className="w-5 h-5 border-2 border-black/30 border-t-black rounded-full animate-spin" />
                    : <><Check className="w-4 h-4" /> Tôi đã thanh toán</>
                }
            </button>
        </Wrapper>
    );
}

function Wrapper({ children }: { children: React.ReactNode }) {
    return (
        <div className={`min-h-screen ${DS.bg.base} flex flex-col items-center justify-center px-4 py-8`}>
            <div className="w-full max-w-sm flex flex-col items-center text-center">{children}</div>
        </div>
    );
}