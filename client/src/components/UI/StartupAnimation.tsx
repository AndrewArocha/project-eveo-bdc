// src/components/StartupAnimation/StartupAnimation.tsx
import { useEffect } from 'react';
import { motion } from 'framer-motion';

import eveoSymbol from '../../images/logo/eveo-symbol.svg';
import eveoText from '../../images/logo/eveo-text.svg';

// Al estar fuera del componente, se calcula una sola vez en el ciclo de vida del módulo.
// No se necesita useMemo.
const particles = Array.from({ length: 60 }).map((_, index) => ({
    id: index,
    size: Math.random() * 2 + 1,
    x: Math.random() * 100,
    y: Math.random() * 100,
    opacity: Math.random() * 0.18 + 0.04,
    duration: Math.random() * 8 + 9,
    driftX: (Math.random() - 0.5) * 42,
    driftY: (Math.random() - 0.5) * 55,
}));

interface StartupAnimationProps {
    onComplete: () => void;
}

function StartupAnimation({ onComplete }: StartupAnimationProps) {
    useEffect(() => {
        const timer = setTimeout(() => {
            onComplete();
        }, 3400);
        return () => clearTimeout(timer);
    }, [onComplete]);

    return (
        // Cambiado de <main> a <div>. El rol "presentation" indica que es puramente decorativo.
        <div role="presentation" className="relative flex h-screen items-center justify-center overflow-hidden bg-[#05080c]">

{/* Shadowy "The Cloud" Background */}
            <div className="absolute inset-0 z-0 overflow-hidden pointer-events-none opacity-5 blur-[120px]">
                {/* Top Left Cloud */}
                <motion.div
                    className="absolute top-[10%] left-[10%] w-[60%] h-[60%] rounded-full bg-slate-300"
                    animate={{
                        x: [0, 100, 0],
                        y: [0, 50, 0],
                    }}
                    transition={{ duration: 25, repeat: Infinity, ease: 'linear' }}
                    style={{ willChange: 'transform' }}
                />

                {/* Right Side Cloud */}
                <motion.div
                    className="absolute top-[20%] right-[10%] w-[70%] h-[80%] rounded-full bg-gray-400"
                    animate={{
                        x: [0, -80, 0],
                        y: [0, -40, 0],
                    }}
                    transition={{ duration: 32, repeat: Infinity, ease: 'linear' }}
                    style={{ willChange: 'transform' }}
                />

                {/* Bottom Cloud */}
                <motion.div
                    className="absolute bottom-[20%] left-[10%] w-[80%] h-[60%] rounded-[100%] bg-zinc-400"
                    animate={{
                        x: [0, 60, -30, 0],
                        y: [0, -60, 0],
                    }}
                    transition={{ duration: 28, repeat: Infinity, ease: 'linear' }}
                    style={{ willChange: 'transform' }}
                />
            </div>

            {/* Ocultamos las partículas a los lectores de pantalla */}
            <div className="absolute inset-0 overflow-hidden" aria-hidden="true">
                {particles.map((particle) => (
                    <motion.div
                        key={particle.id}
                        className="absolute rounded-full bg-white"
                        style={{
                            width: particle.size,
                            height: particle.size,
                            left: `${particle.x}%`,
                            top: `${particle.y}%`,
                            opacity: particle.opacity,
                            filter: 'blur(0.5px)',
                            willChange: 'transform, opacity',
                        }}
                        animate={{
                            x: [0, particle.driftX, -particle.driftX * 0.6, 0],
                            y: [0, particle.driftY, -particle.driftY * 0.4, 0],
                            opacity: [particle.opacity * 0.65, particle.opacity, particle.opacity * 0.75],
                        }}
                        transition={{
                            duration: particle.duration,
                            repeat: Infinity,
                            ease: 'easeInOut',
                        }}
                    />
                ))}
            </div>

            <div className="relative flex flex-col items-center z-10">
                <motion.img
                    src={eveoSymbol}
                    alt="Eveo Logo Symbol"
                    // De vuelta a tus clases nativas de Tailwind v4 sin warnings
                    className="w-47 md:w-56 drop-shadow-2xl"
                    initial={{ y: 80, opacity: 0, scale: 0.8 }}
                    animate={{ y: -20, opacity: 1, scale: 1 }}
                    transition={{
                        y: { type: 'spring', stiffness: 100, damping: 20, mass: 1, delay: 0.2 },
                        opacity: { duration: 0.8, delay: 0.2, ease: 'easeOut' },
                        scale: { type: 'spring', stiffness: 120, damping: 15, delay: 0.2 },
                    }}
                    style={{ willChange: 'transform, opacity' }}
                />

                <motion.div
                    // Escala nativa de v4
                    className="relative mt-4 w-70 sm:w-100 md:w-125 overflow-visible"
                    initial={{ opacity: 0, y: 15, scale: 0.96, filter: 'blur(8px)' }}
                    animate={{ opacity: 1, y: 0, scale: 1, filter: 'blur(0px)' }}
                    transition={{
                        opacity: { duration: 0.8, delay: 1.2, ease: 'easeOut' },
                        y: { duration: 0.8, delay: 1.2, ease: [0.22, 1, 0.36, 1] },
                        filter: { duration: 0.7, delay: 1.2 },
                        scale: { duration: 0.7, delay: 1.2, ease: [0.34, 1.56, 0.64, 1] },
                    }}
                    style={{ willChange: 'transform, opacity, filter' }}
                >
                    <img src={eveoText} alt="Eveo Logo Text" className="relative z-10 w-full drop-shadow-lg" />

                    <motion.div
                        className="
                            absolute left-1/2 bottom-1 h-14 w-[78%]
                            -translate-x-1/2 rounded-full bg-orange-500/30
                            blur-3xl pointer-events-none z-[-1]
                        "
                        initial={{ opacity: 0, scaleX: 0.6 }}
                        animate={{ opacity: [0, 0.8, 0.3], scaleX: [0.6, 1.1, 1] }}
                        transition={{ duration: 1.2, delay: 1.5, ease: [0.22, 1, 0.36, 1] }}
                        style={{ willChange: 'transform, opacity' }}
                    />
                </motion.div>
            </div>
        </div>
    );
}

export default StartupAnimation;