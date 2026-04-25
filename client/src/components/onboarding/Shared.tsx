import { motion } from 'framer-motion';

export function ParticleField() {
    return (
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
            {Array.from({ length: 30 }).map((_, i) => (
                <motion.div
                    key={i}
                    className="absolute w-1 h-1 rounded-full bg-emerald-400/30"
                    initial={{
                        x: Math.random() * (typeof window !== 'undefined' ? window.innerWidth : 1000),
                        y: Math.random() * (typeof window !== 'undefined' ? window.innerHeight : 800),
                        scale: Math.random() * 0.5 + 0.5,
                    }}
                    animate={{ y: [null, Math.random() * -200 - 100], opacity: [0, 0.8, 0] }}
                    transition={{ duration: Math.random() * 4 + 3, repeat: Infinity, delay: Math.random() * 3, ease: 'easeOut' }}
                />
            ))}
            <motion.div
                className="absolute w-96 h-96 rounded-full blur-3xl opacity-10 bg-emerald-500"
                animate={{ x: [0, 100, -50, 0], y: [0, -80, 40, 0], scale: [1, 1.2, 0.9, 1] }}
                transition={{ duration: 20, repeat: Infinity, ease: 'easeInOut' }}
                style={{ top: '20%', left: '10%' }}
            />
            <motion.div
                className="absolute w-80 h-80 rounded-full blur-3xl opacity-[0.08] bg-green-400"
                animate={{ x: [0, -80, 60, 0], y: [0, 60, -40, 0], scale: [1, 0.8, 1.1, 1] }}
                transition={{ duration: 15, repeat: Infinity, ease: 'easeInOut' }}
                style={{ bottom: '10%', right: '15%' }}
            />
        </div>
    );
}

export function ProgressBar({ current, total }: { current: number; total: number }) {
    return (
        <div className="flex items-center gap-3 px-6 py-4">
            <span className="text-xs font-mono tracking-wider text-emerald-400/70">
                {String(current).padStart(2, '0')}/{String(total).padStart(2, '0')}
            </span>
            <div className="flex-1 h-1 bg-white/10 rounded-full overflow-hidden">
                <motion.div
                    className="h-full rounded-full bg-linear-to-r from-emerald-400 to-green-300"
                    initial={{ width: 0 }}
                    animate={{ width: `${(current / total) * 100}%` }}
                    transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
                />
            </div>
            <div className="flex gap-1">
                {Array.from({ length: total }).map((_, i) => (
                    <motion.div
                        key={i}
                        className={`w-1.5 h-1.5 rounded-full ${i < current ? 'bg-emerald-400' : 'bg-white/15'}`}
                        animate={i === current - 1 ? { scale: [1, 1.4, 1] } : {}}
                        transition={{ duration: 0.4 }}
                    />
                ))}
            </div>
        </div>
    );
}