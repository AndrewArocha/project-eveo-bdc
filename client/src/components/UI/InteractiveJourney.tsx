import { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronLeft, ChevronRight, ArrowLeft } from 'lucide-react';

interface JourneyNode {
    phase: string;
    title: string;
    img: string;
    desc: string;
}

interface InteractiveJourneyProps {
    data: JourneyNode[];
    onClose: () => void;
    title: string;
}

type AnimState = 'DOT_IN' | 'CARD_ENTER' | 'CARD_IDLE' | 'CARD_EXIT' | 'DOT_OUT' | 'LINE_OUT' | 'LINE_IN';

export default function InteractiveJourney({ data, onClose, title }: InteractiveJourneyProps) {
    const [index, setIndex] = useState(0);
    const [animState, setAnimState] = useState<AnimState>('DOT_IN');
    const [direction, setDirection] = useState<'NEXT' | 'PREV'>('NEXT');

    const [activePaths, setActivePaths] = useState({ out: "", in: "" });

    const [mousePos, setMousePos] = useState({ x: 0, y: 0 });
    const [hoverZone, setHoverZone] = useState<'LEFT' | 'RIGHT' | null>(null);

    useEffect(() => {
        document.body.style.overflow = 'hidden';
        const updateMouse = (e: MouseEvent) => setMousePos({ x: e.clientX, y: e.clientY });
        window.addEventListener('mousemove', updateMouse);
        return () => {
            document.body.style.overflow = 'unset';
            window.removeEventListener('mousemove', updateMouse);
        };
    }, []);

    const PATHS = useMemo(() => ({
        NEXT: [
            { out: "M 500 500 C 700 400, 900 600, 1200 500", in: "M -200 500 C 100 600, 300 400, 500 500" },
            { out: "M 500 500 C 400 700, 600 900, 500 1200", in: "M 500 -200 C 600 100, 400 300, 500 500" },
            { out: "M 500 500 C 700 600, 900 400, 1200 500", in: "M -200 500 C 100 400, 300 600, 500 500" },
            { out: "M 500 500 C 600 300, 400 100, 500 -200", in: "M 500 1200 C 400 900, 600 700, 500 500" }
        ],
        PREV: [
            { out: "M 500 500 C 300 400, 100 600, -200 500", in: "M 1200 500 C 900 600, 700 400, 500 500" },
            { out: "M 500 500 C 400 300, 600 100, 500 -200", in: "M 500 1200 C 600 900, 400 700, 500 500" },
            { out: "M 500 500 C 300 600, 100 400, -200 500", in: "M 1200 500 C 900 400, 700 600, 500 500" },
            { out: "M 500 500 C 600 700, 400 900, 500 1200", in: "M 500 -200 C 400 100, 600 300, 500 500" }
        ]
    }), []);

    useEffect(() => {
        let timer: ReturnType<typeof setTimeout>;
        switch (animState) {
            case 'CARD_EXIT':
                timer = setTimeout(() => setAnimState('DOT_OUT'), 500);
                break;
            case 'DOT_OUT':
                timer = setTimeout(() => setAnimState('LINE_OUT'), 300);
                break;
            case 'LINE_OUT':
                timer = setTimeout(() => {
                    setIndex(prev => direction === 'NEXT' ? prev + 1 : prev - 1);
                    setAnimState('LINE_IN');
                }, 800);
                break;
            case 'LINE_IN':
                timer = setTimeout(() => setAnimState('DOT_IN'), 800);
                break;
            case 'DOT_IN':

                timer = setTimeout(() => setAnimState('CARD_ENTER'), 650);
                break;
            case 'CARD_ENTER':
                timer = setTimeout(() => setAnimState('CARD_IDLE'), 600);
                break;
        }
        return () => clearTimeout(timer);
    }, [animState, direction]);

    const handleAction = (dir: 'NEXT' | 'PREV') => {
        if (animState !== 'CARD_IDLE') return;
        if (dir === 'NEXT' && index === data.length - 1) return onClose();
        if (dir === 'PREV' && index === 0) return onClose();

        const transitionIndex = dir === 'NEXT' ? index : index - 1;
        setActivePaths(dir === 'NEXT' ? PATHS.NEXT[transitionIndex] : PATHS.PREV[transitionIndex]);
        setDirection(dir);
        setAnimState('CARD_EXIT');
    };

    const node = data[index];

    // Helper variables to perfectly control the visibility overlap
    const showDot = ['CARD_EXIT', 'DOT_OUT', 'LINE_OUT', 'DOT_IN'].includes(animState);
    const showCard = ['CARD_ENTER', 'CARD_IDLE'].includes(animState);

    return (
        <div className="fixed pt-28 inset-0 z-40 bg-[#05080c] overflow-hidden cursor-none">

            <motion.div
                className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,rgba(255,255,255,0.03)_0%,transparent_100%)]"
                animate={{ x: index * -50, y: index * -30 }}
                transition={{ duration: 1.5, ease: "easeInOut" }}
            />

            <div className="absolute top-24 left-4 sm:left-8 z-50 pointer-events-none">
                <button
                    onClick={onClose}
                    className="w-12 h-12 rounded-full bg-[#0a0f16]/90 border border-white/10 hover:border-orange-500/50 backdrop-blur-xl flex items-center justify-center transition-colors shadow-[0_0_20px_rgba(0,0,0,0.8)] outline-none group cursor-none"
                >
                    <ArrowLeft size={20} className="text-gray-400 group-hover:text-orange-500 transition-colors" />
                </button>
            </div>

            <AnimatePresence>
                {index === 0 && (
                    <motion.div
                        initial={{ opacity: 0, y: -10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -20, transition: { duration: 0.3 } }}
                        className="absolute top-30 left-0 w-full text-center px-6 z-50 pointer-events-none"
                    >
                        <span className="text-orange-500 font-mono text-xs font-bold tracking-widest uppercase mb-2 block drop-shadow-md">
                            {title === 'eveo' ? 'Company History' : 'Manager / Developer'}
                        </span>
                        <h1 className="text-3xl md:text-5xl font-black drop-shadow-[0_0_20px_rgba(0,0,0,1)] text-white">
                            {title === 'eveo' ? 'The EVEO Story' : 'Andres Hernandez'}
                        </h1>
                    </motion.div>
                )}
            </AnimatePresence>

            <AnimatePresence>
                {animState === 'CARD_IDLE' && hoverZone !== null && (
                    <motion.div
                        initial={{ opacity: 0, scale: 0.8 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0, scale: 0.8 }}
                        className="fixed top-0 left-0 pointer-events-none z-100 flex items-center justify-center -translate-x-1/2 -translate-y-1/2"
                        style={{ x: mousePos.x, y: mousePos.y }}
                    >
                        {hoverZone === 'LEFT' && <ChevronLeft size={24} className="text-orange-500 drop-shadow-[0_0_15px_rgba(249,115,22,1)]" />}
                        {hoverZone === 'RIGHT' && <ChevronRight size={24} className="text-orange-500 drop-shadow-[0_0_15px_rgba(249,115,22,1)]" />}
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Default dot cursor when no zone is active */}
            {animState === 'CARD_IDLE' && hoverZone === null && (
                <div
                    className="fixed top-0 left-0 pointer-events-none z-100 w-4 h-4 rounded-full bg-white/30 shadow-[0_0_20px_10px_rgba(255,255,255,0.1)] -translate-x-1/2 -translate-y-1/2"
                    style={{ x: mousePos.x, y: mousePos.y }}
                />
            )}

            <div className="absolute inset-y-0 left-0 w-1/2 z-30" onMouseEnter={() => setHoverZone('LEFT')} onMouseLeave={() => setHoverZone(null)} onClick={() => handleAction('PREV')} />
            <div className="absolute inset-y-0 right-0 w-1/2 z-30" onMouseEnter={() => setHoverZone('RIGHT')} onMouseLeave={() => setHoverZone(null)} onClick={() => handleAction('NEXT')} />

            {/* --- CENTRAL ANIMATION CANVAS --- */}
            <div className="absolute inset-0 flex items-center justify-center pointer-events-none z-10">

                {/* 1. The SVG Paths */}
                <svg className="absolute inset-0 w-full h-full z-0" viewBox="0 0 1000 1000" preserveAspectRatio="xMidYMid slice">
                    <AnimatePresence mode="wait">
                        {animState === 'LINE_OUT' && (
                            <motion.path
                                key={`out-${index}`} d={activePaths.out}
                                fill="transparent" stroke="#f97316" strokeWidth="4" strokeLinecap="round"
                                initial={{ pathLength: 0, opacity: 1 }} animate={{ pathLength: 1 }} exit={{ opacity: 0, transition: { duration: 0 } }}
                                transition={{ duration: 0.8, ease: "easeInOut" }} className="drop-shadow-[0_0_15px_rgba(249,115,22,0.8)]"
                            />
                        )}
                        {animState === 'LINE_IN' && (
                            <motion.path
                                key={`in-${index}`} d={activePaths.in}
                                fill="transparent" stroke="#f97316" strokeWidth="4" strokeLinecap="round"
                                initial={{ pathLength: 0, opacity: 1 }} animate={{ pathLength: 1 }} exit={{ opacity: 0, transition: { duration: 0 } }}
                                transition={{ duration: 0.8, ease: "easeInOut" }} className="drop-shadow-[0_0_15px_rgba(249,115,22,0.8)]"
                            />
                        )}
                    </AnimatePresence>
                </svg>

                {/* 2. The Anchor Dot (Stays perfectly mounted while the line draws away/towards it) */}
                <AnimatePresence>
                    {showDot && (
                        <motion.div
                            key="anchor-dot"
                            initial={{ scale: 0, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            exit={{ scale: 0, opacity: 0 }}
                            transition={{ duration: 0.3, ease: "easeOut" }}
                            className="absolute z-20 flex flex-col items-center justify-center"
                        >
                            <div className="w-5 h-5 bg-orange-500 rounded-full shadow-[0_0_20px_rgba(249,115,22,1)]" />
                            {/* Only show the date for the new incoming scene */}
                            {['DOT_IN', 'CARD_ENTER'].includes(animState) && (
                                <motion.span
                                    initial={{ opacity: 0, y: 10 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    className="absolute top-8 text-orange-400 font-mono text-xs font-bold tracking-widest uppercase drop-shadow-[0_2px_10px_rgba(0,0,0,1)] whitespace-nowrap"
                                >
                                    {node.phase.split('/')[0].trim()}
                                </motion.span>
                            )}
                        </motion.div>
                    )}
                </AnimatePresence>

                {/* 3. The Cinematic Card Reveal (Clean fade in/out, zero layout shifting) */}
                <AnimatePresence>
                    {showCard && (
                        <motion.div
                            key={`card-${index}`}
                            initial={{ scale: 0.95, opacity: 0, filter: "blur(10px)", y: 20 }}
                            animate={{ scale: 1, opacity: 1, filter: "blur(0px)", y: 0 }}
                            exit={{ scale: 0.95, opacity: 0, filter: "blur(10px)", y: -20 }}
                            transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
                            className="absolute z-30 bg-[#0a0f16]/95 backdrop-blur-2xl border border-white/10 shadow-[0_20px_50px_rgba(0,0,0,0.8)] overflow-hidden flex flex-col w-[85vw] sm:w-96 md:w-100 h-115 rounded-3xl"
                        >
                            <div className="h-57 w-full relative shrink-0">
                                <img src={node.img} className="w-full h-full object-cover opacity-80 mix-blend-luminosity" />
                                <div className="absolute inset-0 bg-linear-to-t from-[#0a0f16] via-[#0a0f16]/40 to-transparent" />
                                <div className="absolute bottom-0 left-0 right-0 px-8 pb-4">
                                    <span className="text-orange-500 font-mono text-[10px] font-bold tracking-widest uppercase mb-1 block">
                                        {node.phase}
                                    </span>
                                    <h3 className="text-3xl font-black text-white leading-tight drop-shadow-md">
                                        {node.title}
                                    </h3>
                                </div>
                            </div>
                            <div className="flex-1 px-8 pt-4 pb-8 flex items-center bg-[#0a0f16]">
                                <p className="text-gray-300 text-sm md:text-base leading-relaxed">
                                    {node.desc}
                                </p>
                            </div>
                        </motion.div>
                    )}
                </AnimatePresence>

            </div>
        </div>
    );
}