import { useAlertStore } from '../stores/useAlertStore';
import { X, CheckCircle2, AlertCircle, Info, AlertTriangle } from 'lucide-react';
import { useEffect } from 'react';

export default function GlobalAlert() {
    const { isOpen, title, message, type, isConfirm, onConfirm, closeAlert } = useAlertStore();

    // Khóa cuộn trang khi hiện Modal
    useEffect(() => {
        if (isOpen) document.body.style.overflow = 'hidden';
        else document.body.style.overflow = 'auto';
        return () => { document.body.style.overflow = 'auto'; };
    }, [isOpen]);

    if (!isOpen) return null;

    const ICONS = {
        success: <CheckCircle2 className="w-8 h-8 text-emerald-400" />,
        error: <AlertCircle className="w-8 h-8 text-red-400" />,
        warning: <AlertTriangle className="w-8 h-8 text-amber-400" />,
        info: <Info className="w-8 h-8 text-emerald-400" />,
    };

    const COLORS = {
        success: 'border-emerald-500/30 bg-emerald-500/10 shadow-glow',
        error: 'border-red-500/30 bg-red-500/10 shadow-[0_0_30px_rgba(239,68,68,0.15)]',
        warning: 'border-amber-500/30 bg-amber-500/10 shadow-[0_0_30px_rgba(245,158,11,0.15)]',
        info: 'border-emerald-500/30 bg-emerald-500/10 shadow-glow',
    };

    return (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 sm:p-6 bg-black/50 backdrop-blur-sm animate-in fade-in duration-200">
            <div className={`relative w-full max-w-sm rounded-3xl border border-border bg-card p-5 sm:p-6 shadow-2xl flex flex-col items-center text-center animate-in zoom-in-95 duration-300 mx-auto`}>
                
                {/* Nút Đóng (Góc trên phải) */}
                {!isConfirm && (
                    <button onClick={closeAlert} className="absolute top-4 right-4 p-1.5 rounded-full bg-card hover:bg-muted text-foreground/40 hover:text-foreground transition-colors">
                        <X className="w-5 h-5" />
                    </button>
                )}

                {/* Icon Center */}
                <div className={`w-16 h-16 rounded-full flex items-center justify-center border mb-4 ${COLORS[type]}`}>
                    {ICONS[type]}
                </div>

                {/* Content */}
                <h2 className="text-xl font-black text-foreground mb-2 break-words w-full">{title}</h2>
                <div className="text-foreground/60 text-sm leading-relaxed mb-6 break-words whitespace-pre-wrap w-full max-h-[50vh] overflow-y-auto overflow-x-hidden px-1 custom-scrollbar">
                    {message}
                </div>

                {/* Buttons */}
                <div className="w-full flex gap-3">
                    {isConfirm ? (
                        <>
                            <button onClick={closeAlert} className="flex-1 py-3 rounded-xl bg-card hover:bg-muted text-foreground font-bold transition-all">
                                Hủy
                            </button>
                            <button 
                                onClick={() => { onConfirm?.(); closeAlert(); }} 
                                className="flex-1 py-3 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-black font-bold shadow-glow-lg transition-all"
                            >
                                Đồng ý
                            </button>
                        </>
                    ) : (
                        <button 
                            onClick={closeAlert} 
                            className="w-full py-3 rounded-xl bg-emerald-500 hover:bg-emerald-400 active:scale-95 text-black font-bold shadow-glow-lg transition-all"
                        >
                            Đã hiểu
                        </button>
                    )}
                </div>
            </div>
        </div>
    );
}
