import { useAlertStore } from '../stores/useAlertStore';
import { X, CheckCircle2, AlertCircle, Info, AlertTriangle } from 'lucide-react';
import { useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

export default function GlobalAlert() {
    const { isOpen, title, message, type, isConfirm, onConfirm, closeAlert } = useAlertStore();

    // Khóa cuộn trang khi hiện Modal Xác nhận
    useEffect(() => {
        if (isOpen && isConfirm) document.body.style.overflow = 'hidden';
        else document.body.style.overflow = 'auto';
        return () => { document.body.style.overflow = 'auto'; };
    }, [isOpen, isConfirm]);

    // Tự động đóng toast thường sau 4s
    useEffect(() => {
        if (isOpen && !isConfirm) {
            const timer = setTimeout(() => {
                closeAlert();
            }, 4000);
            return () => clearTimeout(timer);
        }
    }, [isOpen, isConfirm, closeAlert]);

    const ICONS_TOAST = {
        success: <CheckCircle2 className="w-6 h-6 text-emerald-400" />,
        error: <AlertCircle className="w-6 h-6 text-red-400" />,
        warning: <AlertTriangle className="w-6 h-6 text-amber-400" />,
        info: <Info className="w-6 h-6 text-blue-400" />,
    };

    const ICONS_MODAL = {
        success: <CheckCircle2 className="w-8 h-8 text-emerald-400" />,
        error: <AlertCircle className="w-8 h-8 text-red-400" />,
        warning: <AlertTriangle className="w-8 h-8 text-amber-400" />,
        info: <Info className="w-8 h-8 text-blue-400" />,
    };

    const THEME = {
        success: { border: 'border-emerald-500/30', shadow: 'shadow-[0_0_40px_rgba(16,185,129,0.2)]', iconBg: 'bg-emerald-500/10' },
        error: { border: 'border-red-500/30', shadow: 'shadow-[0_0_40px_rgba(239,68,68,0.2)]', iconBg: 'bg-red-500/10' },
        warning: { border: 'border-amber-500/30', shadow: 'shadow-[0_0_40px_rgba(245,158,11,0.2)]', iconBg: 'bg-amber-500/10' },
        info: { border: 'border-blue-500/30', shadow: 'shadow-[0_0_40px_rgba(59,130,246,0.2)]', iconBg: 'bg-blue-500/10' },
    };

    const currentTheme = THEME[type] || THEME.info;

    return (
        <AnimatePresence>
            {isOpen && (
                isConfirm ? (
                    // Hộp thoại Xác nhận (Giữ ở giữa)
                    <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 sm:p-6 bg-black/50 backdrop-blur-sm">
                        <motion.div 
                            initial={{ opacity: 0, scale: 0.95 }}
                            animate={{ opacity: 1, scale: 1 }}
                            exit={{ opacity: 0, scale: 0.95 }}
                            className={`relative w-full max-w-sm rounded-3xl bg-[#0a0f16]/90 backdrop-blur-xl border ${currentTheme.border} p-5 sm:p-6 ${currentTheme.shadow} flex flex-col items-center text-center mx-auto`}
                        >
                            <div className={`w-16 h-16 rounded-full flex items-center justify-center border ${currentTheme.border} mb-4 ${currentTheme.iconBg}`}>
                                {ICONS_MODAL[type]}
                            </div>
                            
                            <h2 className="text-xl font-black text-white mb-2 break-words w-full">{title}</h2>
                            <div className="text-white/70 text-sm leading-relaxed mb-6 break-words whitespace-pre-wrap w-full max-h-[50vh] overflow-y-auto overflow-x-hidden px-1 custom-scrollbar">
                                {message}
                            </div>
                            
                            <div className="w-full flex gap-3">
                                <button onClick={closeAlert} className="flex-1 py-3 rounded-xl bg-white/5 hover:bg-white/10 text-white font-bold transition-all border border-white/10">
                                    Hủy
                                </button>
                                <button 
                                    onClick={() => { onConfirm?.(); closeAlert(); }} 
                                    className="flex-1 py-3 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-black font-bold shadow-glow transition-all"
                                >
                                    Đồng ý
                                </button>
                            </div>
                        </motion.div>
                    </div>
                ) : (
                    // Toast thông thường (Nổi ở trên cùng)
                    <motion.div
                        key="global-alert-toast"
                        initial={{ opacity: 0, y: -50 }}
                        animate={{ opacity: 1, y: 20 }}
                        exit={{ opacity: 0, y: -50 }}
                        transition={{ type: 'spring', stiffness: 300, damping: 25 }}
                        className="fixed top-4 left-0 right-0 z-[9999] flex justify-center pointer-events-none px-4"
                    >
                        <div className={`pointer-events-auto cursor-pointer bg-[#0a0f16]/90 backdrop-blur-xl border ${currentTheme.border} ${currentTheme.shadow} px-4 sm:px-6 py-3 sm:py-4 rounded-3xl flex items-start sm:items-center gap-3 max-w-md w-full sm:w-auto relative`} onClick={closeAlert}>
                            <div className="shrink-0 mt-0.5 sm:mt-0">
                                {ICONS_TOAST[type]}
                            </div>
                            <div className="flex flex-col flex-1 min-w-0 pr-6">
                                <p className="text-white font-bold text-sm">{title}</p>
                                {message && <p className="text-white/70 text-xs font-medium mt-0.5 whitespace-pre-wrap">{message}</p>}
                            </div>
                            <button onClick={(e) => { e.stopPropagation(); closeAlert(); }} className="absolute right-3 top-3 sm:top-1/2 sm:-translate-y-1/2 p-1 rounded-full hover:bg-white/10 text-white/40 hover:text-white transition-colors shrink-0">
                                <X className="w-4 h-4" />
                            </button>
                        </div>
                    </motion.div>
                )
            )}
        </AnimatePresence>
    );
}
