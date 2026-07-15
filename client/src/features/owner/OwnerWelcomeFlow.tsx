import { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { useAppStore } from '../../store';
import { ownerApi } from '../../services/ownerApi';
import { X, Calendar, Clock, DollarSign, Activity } from 'lucide-react';
import dayjs from 'dayjs';

export const OwnerWelcomeFlow = () => {
    const { user } = useAppStore();
    const [step, setStep] = useState<'idle' | 'greeting' | 'events' | 'done'>('idle');
    const [todayBookings, setTodayBookings] = useState<any[]>([]);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        const hasSeen = sessionStorage.getItem('owner_welcome_shown');
        if (hasSeen) {
            setStep('done');
            return;
        }

        // Wait for global WelcomeToast to finish before showing events
        setStep('waiting' as any);
        
        // Fetch today's schedule
        const today = dayjs().format('YYYY-MM-DD');
        ownerApi.getSchedule(today)
            .then(data => {
                setTodayBookings(data.bookings || []);
            })
            .catch(err => console.error(err))
            .finally(() => {
                setIsLoading(false);
            });

        // After 2.5 seconds, move to events
        const timer = setTimeout(() => {
            setStep('events');
        }, 2500);

        return () => clearTimeout(timer);
    }, []);

    const handleClose = () => {
        sessionStorage.setItem('owner_welcome_shown', 'true');
        setStep('done');
    };

    if (step === 'idle' || step === 'done') return null;

    const totalRevenue = todayBookings.reduce((sum, b) => sum + (b.finalAmount || 0), 0);

    const content = (
        <AnimatePresence mode="wait">


            {step === 'events' && (
                <motion.div
                    key="events"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-black/60 backdrop-blur-md"
                    onClick={handleClose}
                >
                    <motion.div
                        initial={{ scale: 0.9, y: 20, opacity: 0 }}
                        animate={{ scale: 1, y: 0, opacity: 1 }}
                        exit={{ scale: 0.9, y: 20, opacity: 0 }}
                        transition={{ type: 'spring', damping: 25, stiffness: 300 }}
                        className="bg-[#0a0f16]/95 backdrop-blur-3xl rounded-3xl border border-white/10 w-full max-w-lg shadow-[0_20px_60px_rgba(0,0,0,0.6)] overflow-hidden flex flex-col max-h-full"
                        onClick={e => e.stopPropagation()}
                    >
                        <div className="p-6 border-b border-white/5 relative bg-gradient-to-br from-emerald-500/10 to-transparent">
                            <button 
                                onClick={handleClose}
                                className="absolute top-4 right-4 p-2 text-gray-400 hover:text-white bg-white/5 hover:bg-white/10 rounded-full transition-colors"
                            >
                                <X className="w-5 h-5" />
                            </button>
                            <div className="flex items-center gap-3 mb-2 pr-8">
                                <div className="p-2 bg-emerald-500/20 text-emerald-400 rounded-xl shrink-0">
                                    <Activity className="w-5 h-5 sm:w-6 sm:h-6" />
                                </div>
                                <div>
                                    <h2 className="text-xl sm:text-2xl font-bold text-white leading-tight">Tổng Quan Hôm Nay</h2>
                                    <p className="text-emerald-400 font-medium text-sm sm:text-base">{dayjs().format('DD/MM/YYYY')}</p>
                                </div>
                            </div>
                        </div>
                        
                        <div className="p-4 sm:p-6 overflow-y-auto custom-scrollbar flex-1">
                            <div className="grid grid-cols-2 gap-3 sm:gap-4 mb-6">
                                <div className="bg-white/5 border border-white/5 rounded-2xl p-3 sm:p-4">
                                    <div className="flex items-center gap-2 text-gray-400 mb-1 sm:mb-2">
                                        <Calendar className="w-4 h-4 shrink-0" />
                                        <span className="text-xs sm:text-sm font-medium truncate">Lượt đặt</span>
                                    </div>
                                    <p className="text-xl sm:text-2xl font-bold text-white">{todayBookings.length}</p>
                                </div>
                                <div className="bg-white/5 border border-white/5 rounded-2xl p-3 sm:p-4">
                                    <div className="flex items-center gap-2 text-gray-400 mb-1 sm:mb-2">
                                        <DollarSign className="w-4 h-4 shrink-0" />
                                        <span className="text-xs sm:text-sm font-medium truncate">Doanh thu dự kiến</span>
                                    </div>
                                    <p className="text-xl sm:text-2xl font-bold text-emerald-400">{totalRevenue.toLocaleString()}đ</p>
                                </div>
                            </div>

                            <h3 className="text-xs sm:text-sm font-semibold text-gray-400 uppercase tracking-wider mb-3 sm:mb-4">Các Đơn Đặt Trong Ngày</h3>
                            <div className="space-y-3">
                                {isLoading ? (
                                    <div className="text-center text-gray-400 py-4">Đang tải dữ liệu...</div>
                                ) : todayBookings.length > 0 ? (
                                    todayBookings.map((booking, idx) => {
                                        const statusKey = String(booking.status).toLowerCase();
                                        const statusConfig = (() => {
                                            switch (statusKey) {
                                                case 'confirmed':
                                                    return { text: 'Đã chốt', className: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20', theme: 'emerald' };
                                                case 'completed':
                                                    return { text: 'Hoàn thành', className: 'bg-blue-500/10 text-blue-400 border-blue-500/20', theme: 'blue' };
                                                case 'pending_payment':
                                                    return { text: 'Chờ thanh toán', className: 'bg-yellow-500/10 text-yellow-500 border-yellow-500/20', theme: 'yellow' };
                                                case 'cancelled':
                                                    return { text: 'Đã hủy', className: 'bg-red-500/10 text-red-400 border-red-500/20', theme: 'red' };
                                                case 'no_show':
                                                    return { text: 'Bỏ cọc', className: 'bg-gray-500/10 text-gray-400 border-gray-500/20', theme: 'gray' };
                                                default:
                                                    return { text: booking.status, className: 'bg-yellow-500/10 text-yellow-500 border-yellow-500/20', theme: 'yellow' };
                                            }
                                        })();

                                        const getThemeClasses = (theme: string, type: 'icon' | 'amount') => {
                                            if (type === 'amount') {
                                                if (theme === 'emerald') return 'text-emerald-400';
                                                if (theme === 'blue') return 'text-blue-400';
                                                if (theme === 'red') return 'text-red-400 line-through opacity-70';
                                                if (theme === 'gray') return 'text-gray-400 line-through opacity-70';
                                                return 'text-yellow-500';
                                            }
                                            // icon
                                            if (theme === 'emerald') return 'bg-emerald-500/10 text-emerald-400';
                                            if (theme === 'blue') return 'bg-blue-500/10 text-blue-400';
                                            if (theme === 'red') return 'bg-red-500/10 text-red-400';
                                            if (theme === 'gray') return 'bg-gray-500/10 text-gray-400';
                                            return 'bg-yellow-500/10 text-yellow-500';
                                        };

                                        return (
                                            <div key={idx} className={`flex flex-col sm:flex-row sm:items-center gap-3 sm:gap-4 bg-white/5 border border-white/10 rounded-xl p-3 sm:p-4 hover:border-${statusConfig.theme}-500/30 transition-colors`}>
                                                <div className="flex items-center gap-3 flex-1 min-w-0">
                                                    <div className={`flex-shrink-0 p-2 rounded-lg ${getThemeClasses(statusConfig.theme, 'icon')}`}>
                                                        <Clock className="w-4 h-4 sm:w-5 sm:h-5" />
                                                    </div>
                                                    <div className="flex-1 min-w-0">
                                                        <p className="text-white font-medium text-sm sm:text-base truncate">
                                                            {booking.userId?.displayName || 'Khách vãng lai'}
                                                        </p>
                                                        <p className="text-xs sm:text-sm text-gray-400 truncate">
                                                            {booking.subCourtId?.name} • {booking.startTime} - {booking.endTime}
                                                        </p>
                                                    </div>
                                                </div>
                                                <div className="flex sm:flex-col justify-between items-center sm:items-end sm:text-right mt-2 sm:mt-0 pt-2 sm:pt-0 border-t sm:border-0 border-white/5 shrink-0">
                                                    <p className={`font-bold text-sm sm:text-base ${getThemeClasses(statusConfig.theme, 'amount')}`}>
                                                        {(booking.finalAmount || 0).toLocaleString()}đ
                                                    </p>
                                                    <span className={`inline-block px-2 py-0.5 sm:mt-1 rounded text-[10px] sm:text-xs font-medium border uppercase ${statusConfig.className}`}>
                                                        {statusConfig.text}
                                                    </span>
                                                </div>
                                            </div>
                                        );
                                    })
                                ) : (
                                    <div className="text-center bg-white/5 border border-white/10 rounded-xl p-8">
                                        <Calendar className="w-10 h-10 text-gray-500 mx-auto mb-3" />
                                        <p className="text-gray-400 font-medium">Hôm nay chưa có đơn đặt nào.</p>
                                    </div>
                                )}
                            </div>

                            <button 
                                onClick={handleClose}
                                className="w-full mt-6 bg-emerald-500 hover:bg-emerald-600 text-white font-bold py-3 rounded-xl transition-all shadow-[0_0_20px_rgba(16,185,129,0.3)] hover:shadow-[0_0_30px_rgba(16,185,129,0.5)]"
                            >
                                Bắt Đầu Ngày Mới
                            </button>
                        </div>
                    </motion.div>
                </motion.div>
            )}
        </AnimatePresence>
    );

    return createPortal(content, document.body);
};
