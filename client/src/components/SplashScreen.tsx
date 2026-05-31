import { motion } from 'framer-motion';
import { useEffect } from 'react';
import { Zap } from 'lucide-react';

interface SplashScreenProps {
  onComplete: () => void;
}

export default function SplashScreen({ onComplete }: SplashScreenProps) {
  useEffect(() => {
    // 3.5 seconds total animation before triggering complete
    const timer = setTimeout(() => {
      onComplete();
    }, 3500);
    return () => clearTimeout(timer);
  }, [onComplete]);

  return (
    <motion.div
      key="splash-screen"
      initial={{ opacity: 1 }}
      exit={{ opacity: 0, scale: 1.1, filter: "blur(10px)" }}
      transition={{ duration: 0.8, ease: "easeInOut" }}
      className="fixed inset-0 z-[9999] bg-[#000000] flex items-center justify-center overflow-hidden"
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
          transition={{ duration: 0.8, delay: 1, type: "spring", bounce: 0.5 }}
          className="relative mb-6"
        >
          <div className="w-24 h-24 bg-gradient-to-br from-emerald-400/20 to-emerald-900/40 rounded-[2rem] border border-emerald-500/30 flex items-center justify-center shadow-[0_0_50px_rgba(16,185,129,0.3)] backdrop-blur-xl relative overflow-hidden">
            {/* Shimmer sweep effect */}
            <motion.div
              initial={{ x: '-100%' }}
              animate={{ x: '200%' }}
              transition={{ duration: 1.5, delay: 1.5, ease: "easeInOut" }}
              className="absolute inset-0 w-1/2 bg-gradient-to-r from-transparent via-white/40 to-transparent skew-x-[-20deg]"
            />
            <Zap className="w-12 h-12 text-emerald-400 drop-shadow-[0_0_10px_rgba(52,211,153,0.8)] fill-emerald-400" />
          </div>
        </motion.div>

        {/* Logo Text */}
        <motion.div
          initial={{ opacity: 0, clipPath: 'inset(0 100% 0 0)' }}
          animate={{ opacity: 1, clipPath: 'inset(0 0% 0 0)' }}
          transition={{ duration: 1, delay: 1.2, ease: "circOut" }}
          className="flex flex-col items-center"
        >
          <h1 className="text-5xl font-black tracking-tight text-white mb-2 flex items-center">
            Shuttle<span className="text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 to-cyan-400">Sync</span>
          </h1>
          <motion.div 
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 1.8 }}
            className="flex items-center gap-2"
          >
            <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
            <span className="text-emerald-500/80 uppercase tracking-[0.2em] text-xs font-bold">Premium Sport Booking</span>
            <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
          </motion.div>
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
