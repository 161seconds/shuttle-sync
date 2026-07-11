import { useState, useEffect } from 'react';
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

        setStep('greeting');
        
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

    return (
        <AnimatePresence mode="wait">
            {step === 'greeting' && (
                <motion.div
                    key="greeting"
                    initial={{ opacity: 0, y: -50 }}
                    animate={{ opacity: 1, y: 20 }}
                    exit={{ opacity: 0, scale: 0.9, filter: 'blur(10px)' }}
                    transition={{ type: 'spring', stiffness: 300, damping: 25 }}
                    className="fixed top-4 left-0 right-0 z-[100] flex justify-center pointer-events-none px-4"
                >
                    <div className="bg-[#0a0f16]/90 backdrop-blur-xl border border-emerald-500/30 shadow-[0_0_40px_rgba(16,185,129,0.2)] px-4 sm:px-6 py-3 sm:py-4 rounded-full flex items-center gap-3 max-w-full">
                        <img 
                            src={user?.avatar || "https://api.dicebear.com/7.x/avataaars/svg?seed=owner"} 
                            alt="Avatar" 
                            className="w-8 h-8 rounded-full border border-emerald-500/50"
                        />
                        <div>
                            <p className="text-white font-medium">Chào mừng trở lại, {user?.displayName}!</p>
                            <p className="text-emerald-400 text-xs font-medium">Đang tổng hợp sự kiện hôm nay...</p>
                        </div>
                    </div>
                </motion.div>
            )}

            {step === 'events' && (
                <motion.div
                    key="events"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-md"
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
                                    todayBookings.map((booking, idx) => (
                                        <div key={idx} className="flex flex-col sm:flex-row sm:items-center gap-3 sm:gap-4 bg-white/5 border border-white/10 rounded-xl p-3 sm:p-4 hover:border-emerald-500/30 transition-colors">
                                            <div className="flex items-center gap-3 flex-1 min-w-0">
                                                <div className="flex-shrink-0 bg-emerald-500/10 text-emerald-400 p-2 rounded-lg">
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
                                                <p className="text-emerald-400 font-bold text-sm sm:text-base">{(booking.finalAmount || 0).toLocaleString()}đ</p>
                                                <span className={`inline-block px-2 py-0.5 sm:mt-1 rounded text-[10px] sm:text-xs font-medium border uppercase ${
                                                    booking.status === 'confirmed' ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' :
                                                    booking.status === 'completed' ? 'bg-blue-500/10 text-blue-400 border-blue-500/20' :
                                                    'bg-yellow-500/10 text-yellow-500 border-yellow-500/20'
                                                }`}>
                                                    {booking.status === 'confirmed' ? 'Đã chốt' : booking.status === 'completed' ? 'Hoàn thành' : booking.status}
                                                </span>
                                            </div>
                                        </div>
                                    ))
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
};
