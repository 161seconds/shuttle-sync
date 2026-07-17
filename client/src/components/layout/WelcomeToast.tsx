import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAppStore } from '../../store';
import { getGreetingByTime } from '../../utils/theme';

const MOCK_MESSAGES = [
    "Chúc bạn một ngày mới tràn đầy năng lượng! ⚡️",
    "Rất vui được gặp lại bạn ngày hôm nay! 🥰",
    "Hãy cùng tạo nên một ngày tuyệt vời nhé! 🌟",
    "Cảm ơn bạn đã luôn đồng hành cùng ShuttleSync! 💚",
    "Mỗi ngày là một cơ hội mới để vươn xa hơn! 🚀",
    "Đừng quên dành chút thời gian thư giãn nhé! ☕",
    "Niềm vui luôn bắt đầu từ những điều nhỏ nhất! ✨",
    "Chúc bạn vạn sự hanh thông, mọi việc thuận lợi! 🍀",
    "Khởi động ngày mới với nụ cười thật tươi nào! 😊"
];

export const WelcomeToast = () => {
    const { user, justLoggedIn, setJustLoggedIn } = useAppStore();
    const [show, setShow] = useState(false);
    const [messageIndex, setMessageIndex] = useState(0);

    useEffect(() => {
        if (justLoggedIn) {
            setShow(true);
            setJustLoggedIn(false);
        }
    }, [justLoggedIn, setJustLoggedIn]);

    useEffect(() => {
        if (show) {
            const timer = setTimeout(() => {
                setShow(false);
            }, 5000);
            
            const messageTimer = setInterval(() => {
                setMessageIndex(prev => (prev + 1) % MOCK_MESSAGES.length);
            }, 1200);

            return () => {
                clearTimeout(timer);
                clearInterval(messageTimer);
            };
        }
    }, [show]);

    return (
        <AnimatePresence>
            {show && (
                <motion.div
                    key="global-welcome"
                    initial={{ opacity: 0, y: -50 }}
                    animate={{ opacity: 1, y: 20 }}
                    exit={{ opacity: 0, y: -50 }}
                    transition={{ type: 'spring', stiffness: 300, damping: 25 }}
                    className="fixed top-4 left-0 right-0 z-[9999] flex justify-center pointer-events-none px-4"
                >
                    <div className="bg-[#0a0f16]/90 backdrop-blur-xl border border-emerald-500/30 shadow-[0_0_40px_rgba(16,185,129,0.2)] px-4 sm:px-6 py-3 sm:py-4 rounded-full flex items-center gap-3 max-w-full">
                        <img 
                            src={user?.avatar || "https://api.dicebear.com/7.x/avataaars/svg?seed=" + user?.email} 
                            alt="Avatar" 
                            className="w-8 h-8 rounded-full border border-emerald-500/50"
                        />
                        <div className="flex flex-col min-w-[280px] sm:min-w-[320px]">
                            <p className="text-white font-medium">{getGreetingByTime()}, {user?.displayName || 'bạn'}!</p>
                            <div className="relative h-4 overflow-hidden mt-0.5">
                                <AnimatePresence mode="popLayout">
                                    <motion.p
                                        key={messageIndex}
                                        initial={{ opacity: 0, y: 15 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        exit={{ opacity: 0, y: -15 }}
                                        transition={{ duration: 0.3 }}
                                        className="text-emerald-400 text-xs font-medium absolute inset-0 truncate pr-2"
                                    >
                                        {MOCK_MESSAGES[messageIndex]}
                                    </motion.p>
                                </AnimatePresence>
                            </div>
                        </div>
                    </div>
                </motion.div>
            )}
        </AnimatePresence>
    );
};
