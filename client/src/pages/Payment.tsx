import { useState, useEffect } from 'react';
import { Check, Clock, Copy, ChevronLeft, AlertCircle } from 'lucide-react';
import { theme as t } from '../utils/theme';
//import { useAppStore } from '../store';

interface PaymentPageProps {
    bookingCode: string;
    amount: number;
    courtName: string;
    date: string;
    timeSlots: string[];
    onComplete: () => void;
    onBack: () => void;
}

export default function Payment({
    bookingCode, amount, courtName, date, timeSlots, onComplete, onBack,
}: PaymentPageProps) {
    const [status, setStatus] = useState<'pending' | 'confirming' | 'success' | 'expired'>('pending');
    const [countdown, setCountdown] = useState(15 * 60); // 15 minutes
    const [copied, setCopied] = useState(false);

    // Countdown timer
    useEffect(() => {
        if (status !== 'pending') return;
        const interval = setInterval(() => {
            setCountdown(prev => {
                if (prev <= 0) {
                    setStatus('expired');
                    return 0;
                }
                return prev - 1;
            });
        }, 1000);
        return () => clearInterval(interval);
    }, [status]);

    const minutes = Math.floor(countdown / 60);
    const seconds = countdown % 60;

    const handleConfirm = async () => {
        setStatus('confirming');
        // TODO: Replace with bookingApi.confirmPayment()
        await new Promise(r => setTimeout(r, 2000));
        setStatus('success');
        setTimeout(onComplete, 2000);
    };

    const handleCopy = () => {
        navigator.clipboard.writeText(bookingCode);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };

    return (
        <div className={`min-h-screen ${t.bg.base} flex items-center justify-center px-4 py-8`}>
            <div className="w-full max-w-sm">
                {/* Back */}
                {status === 'pending' && (
                    <button onClick={onBack} className={`flex items-center gap-2 ${t.text.muted} text-sm mb-6 hover:text-emerald-400 transition-colors`}>
                        <ChevronLeft className="w-4 h-4" /> Quay lại
                    </button>
                )}

                {status === 'success' ? (
                    /* Success state */
                    <div className="text-center">
                        <div className="w-20 h-20 rounded-full bg-emerald-500/20 flex items-center justify-center mx-auto mb-6">
                            <div className="w-14 h-14 rounded-full bg-emerald-500 flex items-center justify-center shadow-lg shadow-emerald-500/30">
                                <Check className="w-7 h-7 text-black" strokeWidth={3} />
                            </div>
                        </div>
                        <h2 className={`text-xl font-black ${t.text.primary} mb-2`}>Đặt sân thành công!</h2>
                        <p className={`text-sm ${t.text.muted}`}>Mã đặt sân: <span className={t.text.accent}>{bookingCode}</span></p>
                    </div>
                ) : status === 'expired' ? (
                    /* Expired state */
                    <div className="text-center">
                        <div className="w-20 h-20 rounded-full bg-red-500/20 flex items-center justify-center mx-auto mb-6">
                            <AlertCircle className="w-10 h-10 text-red-400" />
                        </div>
                        <h2 className={`text-xl font-black ${t.text.primary} mb-2`}>Hết thời gian thanh toán</h2>
                        <p className={`text-sm ${t.text.muted} mb-6`}>Đơn đặt sân đã bị hủy tự động</p>
                        <button onClick={onBack} className="px-6 py-3 rounded-xl bg-emerald-500 text-black font-bold text-sm">
                            Đặt lại
                        </button>
                    </div>
                ) : (
                    /* Pending payment */
                    <>
                        <h2 className={`text-lg font-bold ${t.text.primary} mb-1 text-center`}>Thanh toán</h2>
                        <p className={`text-xs ${t.text.muted} text-center mb-6`}>Quét mã QR để thanh toán</p>

                        {/* Timer */}
                        <div className={`flex items-center justify-center gap-2 mb-6 ${countdown < 120 ? 'text-red-400' : t.text.accent}`}>
                            <Clock className="w-4 h-4" />
                            <span className="font-mono text-lg font-bold">
                                {String(minutes).padStart(2, '0')}:{String(seconds).padStart(2, '0')}
                            </span>
                        </div>

                        {/* QR Mock */}
                        <div className={`${t.bg.card} rounded-2xl border ${t.border.subtle} p-6 mb-4`}>
                            <div className="w-48 h-48 mx-auto bg-white rounded-xl flex items-center justify-center mb-4">
                                <div className="text-center">
                                    <p className="text-black text-xs font-mono">QR Code</p>
                                    <p className="text-black text-[10px]">Mock Payment</p>
                                </div>
                            </div>

                            {/* Booking info */}
                            <div className="space-y-2">
                                <InfoRow label="Mã đơn" value={bookingCode} copyable onCopy={handleCopy} copied={copied} />
                                <InfoRow label="Sân" value={courtName} />
                                <InfoRow label="Ngày" value={date} />
                                <InfoRow label="Giờ" value={timeSlots.join(', ')} accent />
                                <div className={`h-px ${t.bg.surface} my-2`} />
                                <div className="flex justify-between text-sm">
                                    <span className={`font-bold ${t.text.primary}`}>Tổng cộng</span>
                                    <span className={`font-black ${t.text.accent}`}>{amount.toLocaleString()}đ</span>
                                </div>
                            </div>
                        </div>

                        {/* Confirm button */}
                        <button
                            onClick={handleConfirm}
                            disabled={status === 'confirming'}
                            className="w-full py-3.5 rounded-xl bg-emerald-500 text-black font-bold text-sm flex items-center justify-center gap-2 shadow-lg shadow-emerald-500/20 hover:bg-emerald-400 transition-colors disabled:opacity-60 active:scale-[0.98]"
                        >
                            {status === 'confirming' ? (
                                <span className="w-5 h-5 border-2 border-black/30 border-t-black rounded-full animate-spin" />
                            ) : (
                                <>
                                    <Check className="w-4 h-4" /> Tôi đã thanh toán
                                </>
                            )}
                        </button>
                    </>
                )}
            </div>
        </div>
    );
}

function InfoRow({ label, value, accent, copyable, onCopy, copied }: {
    label: string; value: string; accent?: boolean; copyable?: boolean; onCopy?: () => void; copied?: boolean;
}) {
    return (
        <div className="flex items-center justify-between text-xs">
            <span className="text-[#555]">{label}</span>
            <span className={`flex items-center gap-1.5 ${accent ? 'text-emerald-400' : 'text-[#eaeaea]'}`}>
                {value}
                {copyable && (
                    <button onClick={onCopy} className="text-[#555] hover:text-emerald-400 transition-colors">
                        {copied ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                    </button>
                )}
            </span>
        </div>
    );
}