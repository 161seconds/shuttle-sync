import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAppStore } from '../../store';

export const WelcomeToast = () => {
    const { user } = useAppStore();
    const [show, setShow] = useState(false);

    useEffect(() => {
        // Only show if user is logged in and we haven't shown it in this session
        if (!user) return;
        
        const hasSeen = sessionStorage.getItem('global_welcome_shown');
        if (!hasSeen) {
            setShow(true);
            sessionStorage.setItem('global_welcome_shown', 'true');
            
            const timer = setTimeout(() => {
                setShow(false);
            }, 3000);
            return () => clearTimeout(timer);
        }
    }, [user]);

    return (
        <AnimatePresence>
            {show && (
                <motion.div
                    key="global-welcome"
                    initial={{ opacity: 0, y: -50 }}
                    animate={{ opacity: 1, y: 20 }}
                    exit={{ opacity: 0, scale: 0.9, filter: 'blur(10px)' }}
                    transition={{ type: 'spring', stiffness: 300, damping: 25 }}
                    className="fixed top-4 left-0 right-0 z-[9999] flex justify-center pointer-events-none px-4"
                >
                    <div className="bg-[#0a0f16]/90 backdrop-blur-xl border border-emerald-500/30 shadow-[0_0_40px_rgba(16,185,129,0.2)] px-4 sm:px-6 py-3 sm:py-4 rounded-full flex items-center gap-3 max-w-full">
                        <img 
                            src={user?.avatar || "https://api.dicebear.com/7.x/avataaars/svg?seed=" + user?.email} 
                            alt="Avatar" 
                            className="w-8 h-8 rounded-full border border-emerald-500/50"
                        />
                        <div>
                            <p className="text-white font-medium">Chào ngày mới, {user?.displayName || 'bạn'}!</p>
                            <p className="text-emerald-400 text-xs font-medium">Đang tổng hợp sự kiện hôm nay...</p>
                        </div>
                    </div>
                </motion.div>
            )}
        </AnimatePresence>
    );
};
