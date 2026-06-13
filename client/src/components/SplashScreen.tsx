import { motion } from 'framer-motion';
import { useEffect, useState, useRef } from 'react';
import { Zap } from 'lucide-react';

interface SplashScreenProps {
  onComplete: () => void;
  isLoading?: boolean;
}

export default function SplashScreen({ onComplete, isLoading = true }: SplashScreenProps) {
  const [progress, setProgress] = useState(0);
  const startTime = useRef(Date.now());
  const onCompleteRef = useRef(onComplete);

  // Giữ reference mới nhất của onComplete
  useEffect(() => {
    onCompleteRef.current = onComplete;
  }, [onComplete]);

  useEffect(() => {
    let interval: any;
    let timeout: any;

    if (isLoading) {
      // Đang tải: bò siêu chậm đến 85% để người dùng không có cảm giác bị "nhảy"
      interval = setInterval(() => {
        setProgress(prev => {
          if (prev >= 85) return prev;
          return prev + Math.max(0.1, (85 - prev) * 0.015);
        });
      }, 50);
    } else {
      // Đã tải xong: mượt mà chạy từ % hiện tại lên 100% trong khoảng thời gian còn lại
      const elapsed = Date.now() - startTime.current;
      const minSplashTime = 2000; // Tổng thời gian splash tối thiểu 2s
      const remainingTime = Math.max(1000, minSplashTime - elapsed); // Ít nhất 1s để chạy mượt lên 100%
      
      const updateInterval = 20;
      const steps = remainingTime / updateInterval;
      let currentStep = 0;
      const startProgress = progress;
      const diff = 100 - startProgress;

      interval = setInterval(() => {
        currentStep++;
        if (currentStep >= steps) {
          clearInterval(interval);
          setProgress(100);
        } else {
          // Hiệu ứng Ease-Out: lúc đầu chạy nhanh, khúc cuối chậm dần cực mượt
          const ratio = currentStep / steps;
          const easeOutCubic = 1 - Math.pow(1 - ratio, 3);
          setProgress(startProgress + (diff * easeOutCubic));
        }
      }, updateInterval);

      timeout = setTimeout(() => {
        onCompleteRef.current();
      }, remainingTime + 200); // Thêm 200ms để người dùng kịp nhìn thấy số 100%
    }

    return () => {
      if (interval) clearInterval(interval);
      if (timeout) clearTimeout(timeout);
    };
  }, [isLoading]);

  return (
    <motion.div
      key="splash-screen"
      initial={{ opacity: 1 }}
      exit={{ opacity: 0, scale: 1.1, filter: "blur(10px)" }}
      transition={{ duration: 0.8, ease: "easeInOut" }}
      className="fixed inset-0 z-[9999] bg-background flex items-center justify-center overflow-hidden"
    >
      {/* Background Aurora / Glow */}
      <motion.div
        initial={{ opacity: 0, scale: 0.8 }}
        animate={{ opacity: 1, scale: 1.2 }}
        transition={{ duration: 2, ease: "easeOut" }}
        className="absolute w-[600px] h-[600px] bg-emerald-500/15 blur-[120px] rounded-full"
      />

      <motion.div
        initial={{ opacity: 0, scale: 0.8 }}
        animate={{ opacity: 1, scale: 1.5 }}
        transition={{ duration: 2.5, ease: "easeOut", delay: 0.2 }}
        className="absolute w-[400px] h-[400px] bg-cyan-500/10 blur-[80px] rounded-full"
      />

      {/* Trailing Comet / Shuttlecock effect */}
      <motion.div
        initial={{ x: '-150vw', y: '100vh', rotate: 45 }}
        animate={{ x: '150vw', y: '-100vh' }}
        transition={{ duration: 1.5, ease: "easeInOut" }}
        className="absolute w-1 h-48 bg-gradient-to-t from-transparent via-emerald-400 to-white blur-[2px]"
      />
      <motion.div
        initial={{ x: '-150vw', y: '100vh', rotate: 45 }}
        animate={{ x: '150vw', y: '-100vh' }}
        transition={{ duration: 1.5, ease: "easeInOut" }}
        className="absolute w-2 h-20 bg-white blur-[4px] rounded-full"
      />

      {/* Main Logo Container */}
      <div className="relative z-10 flex flex-col items-center">
        {/* Logo Icon */}
        <motion.div
          initial={{ opacity: 0, y: 30, scale: 0.8 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          transition={{ duration: 0.6, delay: 0.2, type: "spring", bounce: 0.5 }}
          className="relative mb-6"
        >
          <div className="w-24 h-24 bg-gradient-to-br from-emerald-400/20 to-emerald-900/40 rounded-[2rem] border border-emerald-500/30 flex items-center justify-center shadow-[0_0_50px_rgba(16,185,129,0.3)] backdrop-blur-xl relative overflow-hidden">
            {/* Shimmer sweep effect */}
            <motion.div
              initial={{ x: '-100%' }}
              animate={{ x: '200%' }}
              transition={{ duration: 1.5, delay: 1, ease: "easeInOut" }}
              className="absolute inset-0 w-1/2 bg-gradient-to-r from-transparent via-white/40 to-transparent skew-x-[-20deg]"
            />
            <Zap className="w-12 h-12 text-emerald-400 drop-shadow-[0_0_10px_rgba(52,211,153,0.8)] fill-emerald-400" />
          </div>
        </motion.div>

        {/* Logo Text */}
        <motion.div
          initial={{ opacity: 0, clipPath: 'inset(0 100% 0 0)' }}
          animate={{ opacity: 1, clipPath: 'inset(0 0% 0 0)' }}
          transition={{ duration: 0.8, delay: 0.4, ease: "circOut" }}
          className="flex flex-col items-center"
        >
          <h1 className="text-5xl font-black tracking-tight text-foreground mb-2 flex items-center">
            Shuttle<span className="text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 to-cyan-400">Sync</span>
          </h1>
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.6 }}
            className="flex items-center gap-2"
          >
            <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
            <span className="text-emerald-500/80 uppercase tracking-[0.2em] text-xs font-bold">Premium Sport Booking</span>
            <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
          </motion.div>
        </motion.div>

        {/* Progress Bar */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.3, delay: 0.3 }}
          className="mt-12 flex flex-col items-center w-64"
        >
          <div className="flex justify-between w-full text-[10px] font-mono text-emerald-500/80 mb-3 tracking-[0.2em] font-black uppercase">
            <span>Đang tải dữ liệu</span>
            <span>{Math.floor(progress)}%</span>
          </div>
          <div className="w-full h-1 bg-white/10 rounded-full overflow-hidden border border-border relative">
            <div
              className="absolute top-0 bottom-0 left-0 bg-gradient-to-r from-emerald-500 to-cyan-400 shadow-[0_0_15px_rgba(16,185,129,0.8)]"
              style={{ width: `${progress}%`, transition: 'width 0.1s linear' }}
            />
          </div>
        </motion.div>
      </div>

      {/* Grid Floor */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 0.15 }}
        transition={{ duration: 2, delay: 1 }}
        className="absolute bottom-0 left-0 right-0 h-[40vh] bg-[linear-gradient(to_right,#80808012_1px,transparent_1px),linear-gradient(to_bottom,#80808012_1px,transparent_1px)] bg-[size:40px_40px] [mask-image:linear-gradient(to_bottom,transparent,black)]"
        style={{ transform: 'perspective(1000px) rotateX(60deg) translateY(100px) scale(2.5)' }}
      />
    </motion.div>
  );
}
