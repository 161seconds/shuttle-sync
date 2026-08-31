import { useState, useEffect } from 'react';
import {
    Check, Clock, Copy, ChevronLeft, AlertCircle, ShieldCheck,
    Loader2, QrCode, Building2, CreditCard, User, Sparkles, RefreshCw,
    Download
} from 'lucide-react';
import { motion } from 'framer-motion';
import { useAlertStore } from '../stores/useAlertStore';
import axiosClient from '../api/axiosClient';
import { BadmintonIcon, PickleballIcon } from '../components/EmojiIcon';

interface Props {
    bookingCode: string;
    amount: number;
    courtName: string;
    date: string;
    slots: string[];
    onComplete: () => void;
    onBack: () => void;
    expiresAt?: string;
}

export default function Payment({
    bookingCode,
    amount,
    courtName,
    date,
    slots,
    onComplete,
    onBack,
    expiresAt
}: Props) {
    const [status, setStatus] = useState<'pending' | 'confirming' | 'success' | 'expired'>('pending');
    const [countdown, setCountdown] = useState(() => {
        if (expiresAt) {
            const left = Math.floor((new Date(expiresAt).getTime() - Date.now()) / 1000);
            return Math.max(0, left);
        }
        return 15 * 60;
    });
    const [copiedField, setCopiedField] = useState<string | null>(null);
    const [isManualChecking, setIsManualChecking] = useState(false);

    // Cấu hình ngân hàng SePay (có fallback khi biến môi trường chưa gán trên production)
    const BANK_ID = import.meta.env.VITE_SEPAY_BANK_ID || 'MBBank';
    const BANK_ACC = import.meta.env.VITE_SEPAY_BANK_ACC || '08222216167810';
    const BANK_HOLDER = import.meta.env.VITE_SEPAY_BANK_HOLDER || 'NGUYEN VAN QUOC BAO';
    const transferSyntax = `SHUTTLE ${bookingCode}`;

    const [qrSourceIndex, setQrSourceIndex] = useState(0);
    const [isQrLoading, setIsQrLoading] = useState(true);

    const qrUrls = [
        `https://img.vietqr.io/image/${BANK_ID}-${BANK_ACC}-compact2.png?amount=${amount}&addInfo=${encodeURIComponent(transferSyntax)}&accountName=${encodeURIComponent(BANK_HOLDER)}`,
        `https://vietqr.app/img?bank=${BANK_ID}&acc=${BANK_ACC}&amount=${amount}&des=${encodeURIComponent(transferSyntax)}&template=qronly&showinfo=true&fullacc=true&holder=${encodeURIComponent(BANK_HOLDER)}`
    ];
    const qrUrl = qrUrls[qrSourceIndex] || qrUrls[0];

    // Đếm ngược thời gian
    useEffect(() => {
        if (status !== 'pending' && status !== 'confirming') return;
        const iv = setInterval(() => {
            setCountdown(p => {
                if (p <= 0) {
                    setStatus('expired');
                    return 0;
                }
                return p - 1;
            });
        }, 1000);
        return () => clearInterval(iv);
    }, [status]);

    // Kiểm tra trạng thái thanh toán từ API
    const checkPaymentStatus = async (isManual = false) => {
        if (isManual) setIsManualChecking(true);
        try {
            const res = await axiosClient.get(`/payment/status/${bookingCode}`);
            if (res.data?.data?.status === 'confirmed' || res.data?.data?.status === 'completed') {
                setStatus('success');
                useAlertStore.getState().showAlert("Thanh toán thành công!", 'Tuyệt vời', 'success');
                setTimeout(onComplete, 2200);
            } else if (isManual) {
                useAlertStore.getState().showAlert("Hệ thống chưa nhận được giao dịch. Vui lòng chờ trong giây lát!", 'Thông báo', 'info');
            }
        } catch (err) {
            console.error("Lỗi khi kiểm tra trạng thái thanh toán:", err);
            if (isManual) {
                useAlertStore.getState().showAlert("Chưa nhận được giao dịch, vui lòng thử lại sau vài giây!", 'Thông báo', 'info');
            }
        } finally {
            if (isManual) {
                setTimeout(() => setIsManualChecking(false), 800);
            }
        }
    };

    // Polling API liên tục mỗi 6 giây
    useEffect(() => {
        if (status !== 'pending' && status !== 'confirming') return;
        const pollInterval = setInterval(() => checkPaymentStatus(false), 6000);
        return () => clearInterval(pollInterval);
    }, [bookingCode, status]);

    const mm = Math.floor(countdown / 60);
    const ss = countdown % 60;
    const isUrgent = countdown < 180; // Dưới 3 phút đổi màu cảnh báo

    const copyToClipboard = (text: string, fieldName: string) => {
        navigator.clipboard.writeText(text);
        setCopiedField(fieldName);
        setTimeout(() => setCopiedField(null), 2000);
        useAlertStore.getState().showAlert(`Đã sao chép ${fieldName}!`, 'Thành công', 'success');
    };

    const handleDownloadQr = () => {
        const link = document.createElement('a');
        link.href = qrUrl;
        link.download = `VietQR_${bookingCode}.png`;
        link.target = '_blank';
        link.rel = 'noopener noreferrer';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    if (status === 'success') {
        return (
            <PaymentSuccessView bookingCode={bookingCode} courtName={courtName} date={date} slots={slots} amount={amount} />
        );
    }

    if (status === 'expired') {
        return (
            <PaymentExpiredView onBack={onBack} />
        );
    }

    return (
        <div className="min-h-screen bg-[#0a0f16] text-white flex flex-col justify-between relative overflow-hidden selection:bg-emerald-500 selection:text-black">
            {/* Ambient Background Lights & Grid Effects */}
            <div className="fixed inset-0 pointer-events-none z-0 overflow-hidden">
                {/* Glow Radial Orbs */}
                <div className="absolute top-[-10%] left-1/2 -translate-x-1/2 w-[800px] h-[450px] rounded-full bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-emerald-500/15 via-emerald-600/5 to-transparent blur-[120px]" />
                <div className="absolute -bottom-20 -left-20 w-[500px] h-[500px] rounded-full bg-[radial-gradient(circle,_var(--tw-gradient-stops))] from-indigo-500/15 via-indigo-600/5 to-transparent blur-[140px]" />
                <div className="absolute top-1/3 -right-20 w-[450px] h-[450px] rounded-full bg-[radial-gradient(circle,_var(--tw-gradient-stops))] from-teal-500/10 via-emerald-600/5 to-transparent blur-[120px]" />

                {/* Matrix Dot Grid */}
                <div
                    className="absolute inset-0 opacity-[0.04]"
                    style={{
                        backgroundImage: 'radial-gradient(circle at 1px 1px, white 1px, transparent 0)',
                        backgroundSize: '32px 32px'
                    }}
                />

                {/* Subtle Floating Decorative Icons */}
                <div className="absolute top-12 -left-16 opacity-[0.03] animate-[spin_120s_linear_infinite]">
                    <BadmintonIcon className="w-96 h-96 grayscale" />
                </div>
                <div className="absolute -bottom-20 -right-16 opacity-[0.03] animate-[spin_90s_linear_infinite_reverse]">
                    <PickleballIcon className="w-96 h-96 grayscale" />
                </div>
            </div>

            {/* Top Navigation & Status Bar */}
            <header className="relative z-10 w-full border-b border-white/5 bg-[#0a0f16]/60 backdrop-blur-xl sticky top-0">
                <div className="max-w-5xl mx-auto px-4 sm:px-6 py-4 flex items-center justify-between">
                    <button
                        onClick={onBack}
                        className="px-4 py-2 rounded-xl bg-white/5 hover:bg-white/10 text-gray-300 hover:text-white border border-white/10 transition-all duration-200 flex items-center gap-2 text-sm font-semibold active:scale-95 group"
                    >
                        <ChevronLeft className="w-4 h-4 transition-transform group-hover:-translate-x-0.5" />
                        <span>Quay lại</span>
                    </button>

                    <div className="flex items-center gap-3">
                        <span className="hidden sm:flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs font-semibold">
                            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                            Cổng thanh toán tự động SePay
                        </span>
                        <div className={`flex items-center gap-2 px-3.5 py-1.5 rounded-xl border backdrop-blur-md transition-colors ${isUrgent
                                ? 'bg-red-500/15 border-red-500/30 text-red-400 animate-pulse'
                                : 'bg-white/5 border-white/10 text-emerald-400'
                            }`}>
                            <Clock className="w-4 h-4" />
                            <div className="text-right">
                                <span className="font-mono text-sm sm:text-base font-black tracking-wider">
                                    {String(mm).padStart(2, '0')}:{String(ss).padStart(2, '0')}
                                </span>
                            </div>
                        </div>
                    </div>
                </div>
            </header>

            {/* Main Content Body */}
            <main className="relative z-10 flex-1 max-w-5xl mx-auto w-full px-4 sm:px-6 py-8 lg:py-10">
                <motion.div
                    initial={{ opacity: 0, y: 15 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.4 }}
                    className="grid grid-cols-1 lg:grid-cols-12 gap-6 lg:gap-8 items-start"
                >
                    {/* Left Column: QR Code Box */}
                    <div className="lg:col-span-5 flex flex-col gap-4">
                        <div className="bg-[#0d1522]/80 backdrop-blur-3xl border border-emerald-500/25 rounded-3xl p-6 sm:p-7 flex flex-col items-center text-center shadow-[0_12px_40px_rgba(0,0,0,0.5)] relative overflow-hidden group hover:border-emerald-500/40 transition-all duration-300">
                            {/* Decorative Top Banner */}
                            <div className="absolute top-0 inset-x-0 h-1 bg-linear-to-r from-transparent via-emerald-500 to-transparent" />

                            <div className="flex items-center gap-2 mb-2">
                                <div className="p-2 rounded-xl bg-emerald-500/15 border border-emerald-500/30 text-emerald-400">
                                    <QrCode className="w-5 h-5" />
                                </div>
                                <div className="text-left">
                                    <h3 className="font-black text-white text-base tracking-wide uppercase">Mã VietQR Pro</h3>
                                    <p className="text-[11px] text-gray-400">Quét tức thì • Khớp đơn tự động</p>
                                </div>
                            </div>

                            {/* QR Frame Container */}
                            <div className="relative w-64 h-64 sm:w-72 sm:h-72 bg-white p-3.5 rounded-3xl shadow-[0_15px_40px_rgba(0,0,0,0.45)] flex items-center justify-center my-4 ring-4 ring-emerald-500/20 group-hover:ring-emerald-500/40 transition-all overflow-hidden">
                                {isQrLoading && (
                                    <div className="absolute inset-0 flex flex-col items-center justify-center bg-white z-10">
                                        <Loader2 className="w-8 h-8 text-emerald-500 animate-spin mb-2" />
                                        <span className="text-xs font-semibold text-gray-600">Đang tạo mã QR...</span>
                                    </div>
                                )}

                                <img
                                    src={qrUrl}
                                    alt="VietQR Payment"
                                    className={`w-full h-full object-contain rounded-2xl transition-opacity duration-300 ${isQrLoading ? 'opacity-0' : 'opacity-100'}`}
                                    onLoad={() => setIsQrLoading(false)}
                                    onError={() => {
                                        if (qrSourceIndex < qrUrls.length - 1) {
                                            setQrSourceIndex(prev => prev + 1);
                                        } else {
                                            setIsQrLoading(false);
                                        }
                                    }}
                                />

                                {/* Subtle scanning beam effect */}
                                {!isQrLoading && (
                                    <div className="absolute inset-x-0 h-1 bg-emerald-500/40 blur-xs animate-[bounce_3s_infinite] pointer-events-none" />
                                )}
                            </div>

                            {/* Live Status Indicator */}
                            <div className="flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs font-medium mb-4">
                                <span className="relative flex h-2 w-2">
                                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
                                    <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500" />
                                </span>
                                <span>Đang chờ giao dịch ngân hàng...</span>
                            </div>

                            {/* Action Buttons under QR */}
                            <div className="w-full flex gap-2">
                                <button
                                    onClick={handleDownloadQr}
                                    className="flex-1 py-2.5 px-3 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-gray-300 hover:text-white text-xs font-bold transition-all flex items-center justify-center gap-1.5 active:scale-95"
                                >
                                    <Download className="w-3.5 h-3.5" />
                                    Tải ảnh QR
                                </button>
                                <button
                                    onClick={() => checkPaymentStatus(true)}
                                    disabled={isManualChecking}
                                    className="py-2.5 px-4 rounded-xl bg-emerald-500/20 hover:bg-emerald-500/30 border border-emerald-500/30 text-emerald-400 text-xs font-bold transition-all flex items-center justify-center gap-1.5 active:scale-95 disabled:opacity-50"
                                >
                                    <RefreshCw className={`w-3.5 h-3.5 ${isManualChecking ? 'animate-spin' : ''}`} />
                                    Kiểm tra
                                </button>
                            </div>
                        </div>

                        {/* Supported Banking Apps Banner */}
                        <div className="p-4 rounded-2xl bg-white/5 border border-white/5 text-center">
                            <p className="text-[11px] text-gray-400 leading-relaxed font-medium">
                                Hỗ trợ quét mã bằng hơn <span className="text-white font-bold">40+ ứng dụng ngân hàng</span> (MBBank, Vietcombank, Techcombank, VPBank,...) & Ví MoMo, ZaloPay.
                            </p>
                        </div>
                    </div>

                    {/* Right Column: Transfer & Booking Details */}
                    <div className="lg:col-span-7 flex flex-col gap-4">
                        <div className="bg-[#0d1522]/80 backdrop-blur-3xl border border-white/10 rounded-3xl p-6 sm:p-7 flex flex-col justify-between shadow-[0_12px_40px_rgba(0,0,0,0.5)] relative overflow-hidden group hover:border-white/20 transition-all duration-300">

                            {/* Card Header with Shield */}
                            <div className="flex items-center justify-between pb-4 border-b border-white/10 mb-5">
                                <div>
                                    <h2 className="text-lg sm:text-xl font-black text-white tracking-tight flex items-center gap-2">
                                        Chi Tiết Chuyển Khoản
                                        <Sparkles className="w-4 h-4 text-emerald-400" />
                                    </h2>
                                    <p className="text-xs text-gray-400 mt-0.5">Vui lòng kiểm tra và sao chép chính xác thông tin</p>
                                </div>
                                <div className="flex items-center gap-1.5 text-xs text-gray-400 font-medium px-2.5 py-1 rounded-lg bg-white/5 border border-white/10">
                                    <ShieldCheck className="w-4 h-4 text-emerald-400" />
                                    <span>Napas247</span>
                                </div>
                            </div>

                            {/* Total Amount Box */}
                            <div className="p-4 sm:p-5 rounded-2xl bg-linear-to-r from-emerald-500/15 via-emerald-500/5 to-transparent border border-emerald-500/30 mb-5 flex items-center justify-between relative overflow-hidden">
                                <div className="absolute right-0 top-0 bottom-0 w-32 bg-radial from-emerald-500/10 to-transparent pointer-events-none" />
                                <div>
                                    <p className="text-xs font-semibold text-emerald-400 uppercase tracking-wider mb-1">Số tiền thanh toán</p>
                                    <h1 className="text-2xl sm:text-3xl lg:text-4xl font-black text-emerald-400 font-mono tracking-tight">
                                        {amount.toLocaleString()}<span className="text-lg sm:text-xl ml-1 font-sans">VNĐ</span>
                                    </h1>
                                </div>
                                <button
                                    onClick={() => copyToClipboard(amount.toString(), 'Số tiền')}
                                    className="px-3 py-2 rounded-xl bg-emerald-500 text-black hover:bg-emerald-400 transition-all font-bold text-xs flex items-center gap-1.5 shadow-md active:scale-95"
                                >
                                    {copiedField === 'Số tiền' ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                                    <span>{copiedField === 'Số tiền' ? 'Đã chép' : 'Sao chép'}</span>
                                </button>
                            </div>

                            {/* Bank Details Rows */}
                            <div className="space-y-3.5">
                                {/* Ngân hàng */}
                                <div className="p-3.5 rounded-xl bg-white/5 border border-white/5 flex items-center justify-between">
                                    <div className="flex items-center gap-3">
                                        <div className="w-8 h-8 rounded-lg bg-blue-500/15 text-blue-400 flex items-center justify-center shrink-0">
                                            <Building2 className="w-4 h-4" />
                                        </div>
                                        <div>
                                            <span className="text-xs text-gray-400 block font-medium">Ngân hàng</span>
                                            <span className="text-sm font-bold text-white">{BANK_ID} (Ngân hàng TMCP Quân Đội)</span>
                                        </div>
                                    </div>
                                    <button
                                        onClick={() => copyToClipboard(BANK_ID, 'Tên ngân hàng')}
                                        className="p-2 rounded-lg bg-white/5 hover:bg-white/10 text-gray-400 hover:text-white transition-colors"
                                        title="Sao chép tên ngân hàng"
                                    >
                                        {copiedField === 'Tên ngân hàng' ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
                                    </button>
                                </div>

                                {/* Số tài khoản */}
                                <div className="p-3.5 rounded-xl bg-white/5 border border-white/5 flex items-center justify-between">
                                    <div className="flex items-center gap-3">
                                        <div className="w-8 h-8 rounded-lg bg-emerald-500/15 text-emerald-400 flex items-center justify-center shrink-0">
                                            <CreditCard className="w-4 h-4" />
                                        </div>
                                        <div>
                                            <span className="text-xs text-gray-400 block font-medium">Số tài khoản thụ hưởng</span>
                                            <span className="text-base sm:text-lg font-black text-white font-mono tracking-wider">{BANK_ACC}</span>
                                        </div>
                                    </div>
                                    <button
                                        onClick={() => copyToClipboard(BANK_ACC, 'Số tài khoản')}
                                        className="px-3 py-1.5 rounded-lg bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-400 border border-emerald-500/30 text-xs font-bold transition-all flex items-center gap-1.5 active:scale-95"
                                    >
                                        {copiedField === 'Số tài khoản' ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                                        <span>{copiedField === 'Số tài khoản' ? 'Đã chép' : 'Sao chép'}</span>
                                    </button>
                                </div>

                                {/* Chủ tài khoản */}
                                <div className="p-3.5 rounded-xl bg-white/5 border border-white/5 flex items-center justify-between">
                                    <div className="flex items-center gap-3">
                                        <div className="w-8 h-8 rounded-lg bg-purple-500/15 text-purple-400 flex items-center justify-center shrink-0">
                                            <User className="w-4 h-4" />
                                        </div>
                                        <div>
                                            <span className="text-xs text-gray-400 block font-medium">Chủ tài khoản</span>
                                            <span className="text-sm font-bold text-white uppercase tracking-wider">{BANK_HOLDER}</span>
                                        </div>
                                    </div>
                                    <button
                                        onClick={() => copyToClipboard(BANK_HOLDER, 'Chủ tài khoản')}
                                        className="p-2 rounded-lg bg-white/5 hover:bg-white/10 text-gray-400 hover:text-white transition-colors"
                                        title="Sao chép tên chủ tài khoản"
                                    >
                                        {copiedField === 'Chủ tài khoản' ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
                                    </button>
                                </div>

                                {/* Nội dung chuyển khoản (HIGHLIGHT CỰC KỲ QUAN TRỌNG) */}
                                <div className="p-4 rounded-2xl bg-amber-500/10 border-2 border-amber-500/40 flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-inner">
                                    <div>
                                        <div className="flex items-center gap-1.5 mb-1">
                                            <AlertCircle className="w-4 h-4 text-amber-400" />
                                            <span className="text-xs font-black text-amber-400 uppercase tracking-wider">Nội dung chuyển khoản (Bắt buộc)</span>
                                        </div>
                                        <span className="text-lg sm:text-xl font-black text-white font-mono tracking-widest bg-black/40 px-2.5 py-1 rounded-lg border border-amber-500/20 inline-block">
                                            {transferSyntax}
                                        </span>
                                    </div>
                                    <button
                                        onClick={() => copyToClipboard(transferSyntax, 'Nội dung chuyển khoản')}
                                        className="px-4 py-2.5 rounded-xl bg-amber-400 hover:bg-amber-300 text-black font-black text-xs transition-all flex items-center justify-center gap-1.5 shadow-md active:scale-95 shrink-0"
                                    >
                                        {copiedField === 'Nội dung chuyển khoản' ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                                        <span>{copiedField === 'Nội dung chuyển khoản' ? 'Đã chép mã' : 'Sao chép nội dung'}</span>
                                    </button>
                                </div>
                            </div>

                            {/* Booking Information Summary Accordion */}
                            <div className="mt-5 pt-4 border-t border-white/10">
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs text-gray-400">
                                    <div className="p-2.5 rounded-xl bg-white/5">
                                        <span className="block font-medium text-gray-500 mb-0.5">Sân thể thao</span>
                                        <span className="font-bold text-white line-clamp-1">{courtName}</span>
                                    </div>
                                    <div className="p-2.5 rounded-xl bg-white/5">
                                        <span className="block font-medium text-gray-500 mb-0.5">Lịch thi đấu</span>
                                        <span className="font-bold text-white">{date} • {slots.join(', ')}</span>
                                    </div>
                                </div>
                            </div>

                        </div>

                        {/* Security Notice */}
                        <div className="p-4 rounded-2xl bg-white/5 border border-white/5 flex items-start gap-3">
                            <ShieldCheck className="w-5 h-5 text-emerald-400 shrink-0 mt-0.5" />
                            <p className="text-xs text-gray-400 leading-relaxed">
                                <span className="text-white font-bold">Lưu ý quan trọng:</span> Sau khi bạn thực hiện chuyển khoản thành công, hệ thống sẽ tự động xác nhận đơn trong vòng <span className="text-emerald-400 font-bold">5 - 30 giây</span>. Bạn không cần gửi ảnh biên lai.
                            </p>
                        </div>
                    </div>
                </motion.div>
            </main>

            {/* Footer */}
            <footer className="relative z-10 w-full py-4 text-center text-xs text-gray-500 border-t border-white/5 bg-[#0a0f16]/80">
                <p>ShuttleSync Payment Gateway • Được bảo vệ bởi mã hóa SSL 256-bit</p>
            </footer>
        </div>
    );
}

// Sub-component: Success View
function PaymentSuccessView({
    bookingCode,
    courtName,
    date,
    slots,
    amount
}: {
    bookingCode: string;
    courtName: string;
    date: string;
    slots: string[];
    amount: number;
}) {
    return (
        <div className="min-h-screen bg-[#0a0f16] flex items-center justify-center p-6 relative overflow-hidden">
            {/* Ambient Background Glow */}
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] rounded-full bg-emerald-500/15 blur-[140px] pointer-events-none" />

            <motion.div
                initial={{ scale: 0.85, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ duration: 0.5, type: 'spring', damping: 20 }}
                className="max-w-md w-full bg-[#0d1522]/90 backdrop-blur-3xl border border-emerald-500/40 rounded-3xl p-8 text-center shadow-[0_20px_60px_rgba(0,0,0,0.8)] relative z-10"
            >
                <div className="relative w-20 h-20 mx-auto mb-6">
                    <div className="absolute inset-0 rounded-full border-2 border-emerald-500/40 animate-ping" style={{ animationDuration: '2s' }} />
                    <div className="w-20 h-20 rounded-full bg-linear-to-br from-emerald-400 to-green-500 flex items-center justify-center shadow-[0_0_40px_rgba(16,185,129,0.5)]">
                        <Check className="w-10 h-10 text-black stroke-[3]" />
                    </div>
                </div>

                <span className="px-3.5 py-1 rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 text-xs font-bold uppercase tracking-wider inline-block mb-3">
                    Giao dịch thành công
                </span>

                <h2 className="text-2xl sm:text-3xl font-black text-white mb-2 tracking-tight">Thanh toán hoàn tất!</h2>
                <p className="text-sm text-gray-400 mb-6">
                    Lịch đặt sân của bạn đã được xác nhận vào hệ thống.
                </p>

                <div className="p-4 rounded-2xl bg-white/5 border border-white/10 text-left space-y-2.5 mb-6 text-xs sm:text-sm">
                    <div className="flex justify-between">
                        <span className="text-gray-400">Mã đơn đặt</span>
                        <span className="text-emerald-400 font-mono font-bold">{bookingCode}</span>
                    </div>
                    <div className="flex justify-between">
                        <span className="text-gray-400">Sân đặt</span>
                        <span className="text-white font-bold line-clamp-1">{courtName}</span>
                    </div>
                    <div className="flex justify-between">
                        <span className="text-gray-400">Thời gian</span>
                        <span className="text-white font-medium">{date} ({slots.join(', ')})</span>
                    </div>
                    <div className="flex justify-between border-t border-white/10 pt-2 font-bold">
                        <span className="text-gray-300">Tổng thanh toán</span>
                        <span className="text-emerald-400">{amount.toLocaleString()} VNĐ</span>
                    </div>
                </div>

                <div className="flex items-center justify-center gap-2 text-xs text-gray-400 font-medium">
                    <Loader2 className="w-4 h-4 animate-spin text-emerald-400" />
                    <span>Đang chuyển về trang lịch sử đơn...</span>
                </div>
            </motion.div>
        </div>
    );
}

// Sub-component: Expired View
function PaymentExpiredView({ onBack }: { onBack: () => void }) {
    return (
        <div className="min-h-screen bg-[#0a0f16] flex items-center justify-center p-6 relative overflow-hidden">
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] rounded-full bg-red-500/10 blur-[140px] pointer-events-none" />

            <motion.div
                initial={{ scale: 0.85, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                className="max-w-md w-full bg-[#0d1522]/90 backdrop-blur-3xl border border-red-500/30 rounded-3xl p-8 text-center shadow-[0_20px_60px_rgba(0,0,0,0.8)] relative z-10"
            >
                <div className="w-20 h-20 rounded-full bg-red-500/15 border border-red-500/30 flex items-center justify-center mx-auto mb-6 text-red-400">
                    <AlertCircle className="w-10 h-10" />
                </div>

                <h2 className="text-2xl font-black text-white mb-2 tracking-tight">Hết hạn thanh toán</h2>
                <p className="text-sm text-gray-400 mb-8 leading-relaxed">
                    Khung giờ giữ sân đã hết thời hạn thanh toán (15 phút). Vui lòng thực hiện đặt lại lịch mới.
                </p>

                <button
                    onClick={onBack}
                    className="w-full py-3.5 rounded-2xl bg-white/10 hover:bg-white/20 border border-white/10 text-white font-bold text-sm transition-all active:scale-95 flex items-center justify-center gap-2"
                >
                    <ChevronLeft className="w-4 h-4" />
                    <span>Quay lại trang đặt sân</span>
                </button>
            </motion.div>
        </div>
    );
}