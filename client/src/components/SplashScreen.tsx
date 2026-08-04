import { motion } from 'framer-motion';
import { useEffect, useState, useRef } from 'react';
import { Zap } from 'lucide-react';

const QUOTES = [
  "Nơi đam mê bùng cháy trên từng đường cầu.",
  "Kết nối cộng đồng yêu cầu lông.",
  "Trải nghiệm đặt sân mượt mà, nhanh chóng.",
  "Không ngừng nâng cao kỹ năng của bạn.",
  "Sức khỏe, niềm vui và những cú smash uy lực.",
  "Tìm kiếm, đặt lịch và tận hưởng trận đấu.",
];

interface SplashScreenProps {
  onComplete: () => void;
  isLoading?: boolean;
}

export default function SplashScreen({ onComplete, isLoading = true }: SplashScreenProps) {
  const [fakeProgress, setFakeProgress] = useState(0);
  const [mousePos, setMousePos] = useState({ x: 0, y: 0 });
  const [rawMouse, setRawMouse] = useState({ x: 0, y: 0 });
  const startTime = useRef(Date.now());
  const onCompleteRef = useRef(onComplete);

  const [quote] = useState(() => QUOTES[Math.floor(Math.random() * QUOTES.length)]);
  const [particles, setParticles] = useState<{id: number, x: number, y: number, size: number, duration: number, delay: number}[]>([]);

  useEffect(() => {
    const newParticles = Array.from({ length: 60 }).map((_, i) => ({
      id: i,
      x: Math.random() * 100,
      y: Math.random() * 100,
      size: Math.random() * 4 + 1,
      duration: Math.random() * 15 + 15,
      delay: Math.random() * 5,
    }));
    setParticles(newParticles);
  }, []);

  // Giữ reference mới nhất của onComplete
  useEffect(() => {
    onCompleteRef.current = onComplete;
  }, [onComplete]);

  const progress = fakeProgress;

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      setRawMouse({ x: e.clientX, y: e.clientY });
      setMousePos({
        x: (e.clientX / window.innerWidth) * 2 - 1,
        y: (e.clientY / window.innerHeight) * 2 - 1
      });
    };
    window.addEventListener('mousemove', handleMouseMove);
    return () => window.removeEventListener('mousemove', handleMouseMove);
  }, []);

  useEffect(() => {

    let animationFrame: number;
    const minSplashTime = 30000;

    const updateProgress = () => {
      const elapsed = Date.now() - startTime.current;
      const newProgress = Math.min(100, (elapsed / minSplashTime) * 100);

      setFakeProgress(newProgress);

      if (newProgress < 100) {
        animationFrame = requestAnimationFrame(updateProgress);
      } else {
        if (!isLoading) {
          onCompleteRef.current();
        }
      }
    };

    animationFrame = requestAnimationFrame(updateProgress);

    return () => cancelAnimationFrame(animationFrame);
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

      {/* Particles */}
      {particles.map((p) => (
        <motion.div
          key={p.id}
          className="absolute bg-emerald-500/30 rounded-full"
          style={{
            left: `${p.x}%`,
            top: `${p.y}%`,
            width: p.size,
            height: p.size,
          }}
          animate={{
            y: ["0%", "-50%", "0%"],
            x: ["0%", "20%", "0%"],
            opacity: [0.1, 0.6, 0.1],
          }}
          transition={{
            duration: p.duration,
            repeat: Infinity,
            delay: p.delay,
            ease: "linear"
          }}
        />
      ))}

      {/* Decorative Frame */}
      <div className="absolute top-8 left-8 w-16 h-16 border-l border-t border-emerald-500/20 rounded-tl-2xl hidden md:block" />
      <div className="absolute top-8 right-8 w-16 h-16 border-r border-t border-emerald-500/20 rounded-tr-2xl hidden md:block" />
      <div className="absolute bottom-8 left-8 w-16 h-16 border-l border-b border-emerald-500/20 rounded-bl-2xl hidden md:block" />
      <div className="absolute bottom-8 right-8 w-16 h-16 border-r border-b border-emerald-500/20 rounded-br-2xl hidden md:block" />


      {/* Tech Circles / Radar */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] border border-emerald-500/5 rounded-full flex items-center justify-center pointer-events-none">
        <motion.div 
          animate={{ rotate: 360 }}
          transition={{ duration: 40, repeat: Infinity, ease: "linear" }}
          className="w-[600px] h-[600px] border border-dashed border-cyan-500/10 rounded-full"
        />
        <motion.div 
          animate={{ rotate: -360 }}
          transition={{ duration: 30, repeat: Infinity, ease: "linear" }}
          className="absolute w-[400px] h-[400px] border border-emerald-500/10 rounded-full border-t-emerald-500/30 border-b-emerald-500/30"
        />
        <motion.div 
          animate={{ scale: [1, 1.1, 1], opacity: [0.1, 0.3, 0.1] }}
          transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
          className="absolute w-[300px] h-[300px] bg-emerald-500/5 rounded-full blur-2xl"
        />
      </div>

      {/* Fake Data Logs */}
      <div className="absolute top-32 left-12 hidden lg:flex flex-col gap-2 text-[10px] font-mono text-emerald-500/40 pointer-events-none tracking-widest">
        <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.2 }}>&gt; INITIALIZE_CORE_MODULES</motion.div>
        <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.5 }}>&gt; LOAD_USER_SESSION [OK]</motion.div>
        <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.8 }}>&gt; CONNECT_BOOKING_ENGINE...</motion.div>
        <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 1.2 }}>&gt; FETCH_LATEST_COURTS_DATA</motion.div>
        <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 1.5 }}>&gt; SYNC_REALTIME_STATE [OK]</motion.div>
        <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 1.8 }}>&gt; SYSTEM_READY.</motion.div>
      </div>

      <div className="absolute bottom-40 right-12 hidden lg:flex flex-col items-end gap-2 text-[10px] font-mono text-cyan-500/40 pointer-events-none text-right tracking-widest">
        <div>SYS_MEM_ALLOC: 2048MB</div>
        <div>NET_LATENCY: 12ms</div>
        <div>SEC_PROTO: TLS_1.3</div>
        <motion.div animate={{ opacity: [0.3, 0.9, 0.3] }} transition={{ duration: 2, repeat: Infinity }}>STATUS: OPTIMAL</motion.div>
      </div>

      {/* Floating Status Tags */}
      <motion.div 
        initial={{ opacity: 0, x: -50 }}
        animate={{ opacity: 1, x: 0, y: [0, -10, 0] }}
        transition={{ opacity: { duration: 1 }, x: { duration: 1 }, y: { duration: 4, repeat: Infinity, ease: "easeInOut" } }}
        className="absolute top-1/4 left-[10%] hidden lg:flex items-center gap-3 px-4 py-2 bg-emerald-950/20 border border-emerald-500/20 rounded-full backdrop-blur-md"
      >
        <div className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse shadow-[0_0_8px_rgba(52,211,153,0.8)]" />
        <span className="text-xs font-mono text-emerald-400/80 uppercase tracking-wider">System Online</span>
      </motion.div>
      
      <motion.div 
        initial={{ opacity: 0, x: 50 }}
        animate={{ opacity: 1, x: 0, y: [0, 10, 0] }}
        transition={{ opacity: { duration: 1, delay: 0.5 }, x: { duration: 1, delay: 0.5 }, y: { duration: 5, repeat: Infinity, ease: "easeInOut", delay: 0.5 } }}
        className="absolute bottom-1/3 right-[10%] hidden lg:flex items-center gap-3 px-4 py-2 bg-cyan-950/20 border border-cyan-500/20 rounded-full backdrop-blur-md"
      >
        <div className="w-2 h-2 rounded-full bg-cyan-400 animate-pulse shadow-[0_0_8px_rgba(34,211,238,0.8)]" />
        <span className="text-xs font-mono text-cyan-400/80 uppercase tracking-wider">Secure Sync</span>
      </motion.div>

      {/* Interactive Mouse Glow */}
      <motion.div
        animate={{
          x: rawMouse.x - 300,
          y: rawMouse.y - 300,
        }}
        transition={{ type: "tween", ease: "backOut", duration: 0.5 }}
        className="absolute top-0 left-0 w-[600px] h-[600px] bg-emerald-500/15 rounded-full blur-[100px] pointer-events-none mix-blend-screen"
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
          animate={{ 
            opacity: 1, 
            y: 0, 
            scale: 1,
            rotateX: mousePos.y * -20,
            rotateY: mousePos.x * 20
          }}
          transition={{ duration: 0.1, type: "tween", ease: "linear" }}
          whileHover={{ scale: 1.1 }}
          whileTap={{ scale: 0.95 }}
          className="relative mb-6 cursor-pointer"
          style={{ transformStyle: "preserve-3d" }}
        >
          <div className="w-24 h-24 bg-gradient-to-br from-emerald-400/20 to-emerald-900/40 rounded-[2rem] border border-emerald-500/30 flex items-center justify-center shadow-glow-lg backdrop-blur-xl relative overflow-hidden">
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
          <div className="w-full h-1.5 bg-card/40 rounded-full border border-emerald-500/20 relative backdrop-blur-md shadow-[inset_0_1px_3px_rgba(0,0,0,0.5)]">
            {/* Main colored track */}
            <div
              className="absolute top-0 bottom-0 left-0 bg-gradient-to-r from-emerald-500 via-emerald-400 to-cyan-400 overflow-hidden rounded-full"
              style={{ width: `${progress}%` }}
            >
              {/* Continuous shimmer effect inside the bar */}
              <motion.div
                animate={{ x: ["-100%", "200%"] }}
                transition={{ duration: 1.5, repeat: Infinity, ease: "linear" }}
                className="absolute inset-0 bg-gradient-to-r from-transparent via-white/60 to-transparent skew-x-[-20deg]"
              />
            </div>
            
            {/* Glowing tip at the end of the progress */}
            <div 
              className="absolute top-1/2 -translate-y-1/2 w-3 h-3 bg-white rounded-full shadow-[0_0_15px_4px_rgba(34,211,238,0.9)] z-10 transition-opacity duration-300 flex items-center justify-center"
              style={{ left: `calc(${progress}% - 6px)`, opacity: progress > 1 ? 1 : 0 }}
            >
              <div className="absolute inset-0 rounded-full bg-cyan-300 animate-ping opacity-80" />
              <div className="w-1.5 h-1.5 rounded-full bg-cyan-500" />
            </div>
          </div>
        </motion.div>
      </div>

      {/* Random Quote */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8, delay: 0.8 }}
        className="absolute bottom-12 left-0 right-0 flex justify-center px-6 pointer-events-none z-10"
      >
        <p className="text-sm md:text-base text-foreground/50 italic font-medium text-center max-w-md">
          "{quote}"
        </p>
      </motion.div>

      {/* Grid Floor */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ 
          opacity: 0.15,
          rotateX: 60 - mousePos.y * 15,
          rotateY: mousePos.x * 10,
          y: 100,
          scale: 2.5
        }}
        transition={{ duration: 0.2, type: "tween", ease: "linear" }}
        className="absolute bottom-0 left-0 right-0 h-[40vh] bg-[linear-gradient(to_right,#80808012_1px,transparent_1px),linear-gradient(to_bottom,#80808012_1px,transparent_1px)] bg-[size:40px_40px] [mask-image:linear-gradient(to_bottom,transparent,black)] pointer-events-none"
        style={{ transformPerspective: 1000 }}
      />
    </motion.div>
  );
}
