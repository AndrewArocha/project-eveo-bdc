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

  // Helper variables to control the visibility overlap
  const showDot = ['CARD_EXIT', 'DOT_OUT', 'LINE_OUT', 'DOT_IN'].includes(animState);
  const showCard = ['CARD_ENTER', 'CARD_IDLE'].includes(animState);

  return (
    <div className="fixed inset-0 pt-20 sm:pt-28 z-40 bg-[#05080c] overflow-hidden md:cursor-none select-none">

      <motion.div
        className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,rgba(255,255,255,0.03)_0%,transparent_100%)]"
        animate={{ x: index * -50, y: index * -30 }}
        transition={{ duration: 1.5, ease: "easeInOut" }}
      />

      {/* Top Back Button - Fixed pointer-events so it is clickable on all devices */}
      <div className="absolute top-22 sm:top-24 left-4 sm:left-8 z-60">
        <button
          type="button"
          aria-label="Back to About selection"
          onClick={onClose}
          className="w-11 h-11 sm:w-12 sm:h-12 rounded-full bg-[#0a0f16]/90 border border-white/15 hover:border-orange-500/50 active:scale-95 backdrop-blur-xl flex items-center justify-center transition-all shadow-[0_0_20px_rgba(0,0,0,0.8)] outline-none group cursor-pointer md:cursor-none pointer-events-auto"
        >
          <ArrowLeft size={20} className="text-gray-300 group-hover:text-orange-500 transition-colors" />
        </button>
      </div>

      {/* Top Title Header */}
      <AnimatePresence>
        {index === 0 && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20, transition: { duration: 0.3 } }}
            className="absolute top-22 sm:top-28 left-0 w-full text-center px-16 sm:px-6 z-40 pointer-events-none"
          >
            <span className="text-orange-500 font-mono text-[10px] sm:text-xs font-bold tracking-widest uppercase mb-1 sm:mb-2 block drop-shadow-md">
              {title === 'eveo' ? 'Company History' : 'Manager / Developer'}
            </span>
            <h1 className="text-2xl sm:text-3xl md:text-5xl font-black drop-shadow-[0_0_20px_rgba(0,0,0,1)] text-white truncate">
              {title === 'eveo' ? 'The EVEO Story' : 'Andres Hernandez'}
            </h1>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Desktop Custom Hover Zone Cursor */}
      <AnimatePresence>
        {animState === 'CARD_IDLE' && hoverZone !== null && (
          <motion.div
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.8 }}
            className="hidden md:flex fixed top-0 left-0 pointer-events-none z-100 items-center justify-center -translate-x-1/2 -translate-y-1/2"
            style={{ x: mousePos.x, y: mousePos.y }}
          >
            {hoverZone === 'LEFT' && <ChevronLeft size={28} className="text-orange-500 drop-shadow-[0_0_15px_rgba(249,115,22,1)]" />}
            {hoverZone === 'RIGHT' && <ChevronRight size={28} className="text-orange-500 drop-shadow-[0_0_15px_rgba(249,115,22,1)]" />}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Desktop Default Dot Cursor */}
      {animState === 'CARD_IDLE' && hoverZone === null && (
        <motion.div
          className="hidden md:block fixed top-0 left-0 pointer-events-none z-100 w-4 h-4 rounded-full bg-white/30 shadow-[0_0_20px_10px_rgba(255,255,255,0.1)] -translate-x-1/2 -translate-y-1/2"
          style={{ x: mousePos.x, y: mousePos.y }}
        />
      )}

      {/* Desktop Split Screen Click Zones (Hidden on mobile so touch gestures & bottom controls feel native) */}
      <div className="hidden md:block absolute inset-y-0 left-0 w-1/2 z-30" onMouseEnter={() => setHoverZone('LEFT')} onMouseLeave={() => setHoverZone(null)} onClick={() => handleAction('PREV')} />
      <div className="hidden md:block absolute inset-y-0 right-0 w-1/2 z-30" onMouseEnter={() => setHoverZone('RIGHT')} onMouseLeave={() => setHoverZone(null)} onClick={() => handleAction('NEXT')} />

      {/* --- CENTRAL ANIMATION CANVAS --- */}
      <div className="absolute inset-0 flex items-center justify-center pointer-events-none z-10 pb-10 sm:pb-0">

        {/* 1. The SVG Paths */}
        <svg aria-hidden="true" className="absolute inset-0 w-full h-full z-0" viewBox="0 0 1000 1000" preserveAspectRatio="xMidYMid slice">
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

        {/* 2. The Anchor Dot */}
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

        {/* 3. The Cinematic Card Reveal (Supports horizontal swipe on mobile) */}
        <AnimatePresence>
          {showCard && (
            <motion.div
              key={`card-${index}`}
              initial={{ scale: 0.95, opacity: 0, filter: "blur(10px)", y: 20 }}
              animate={{ scale: 1, opacity: 1, filter: "blur(0px)", y: 0 }}
              exit={{ scale: 0.95, opacity: 0, filter: "blur(10px)", y: -20 }}
              transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
              drag="x"
              dragConstraints={{ left: 0, right: 0 }}
              dragElastic={0.25}
              onDragEnd={(_e, info) => {
                if (info.offset.x < -60 || info.velocity.x < -300) {
                  handleAction('NEXT');
                } else if (info.offset.x > 60 || info.velocity.x > 300) {
                  handleAction('PREV');
                }
              }}
              className="absolute z-30 pointer-events-auto md:pointer-events-none bg-[#0a0f16]/95 backdrop-blur-2xl border border-white/10 shadow-[0_20px_50px_rgba(0,0,0,0.8)] overflow-hidden flex flex-col w-[88vw] max-w-96 md:w-100 min-h-104 sm:h-115 rounded-3xl touch-pan-y"
            >
              <div className="h-48 sm:h-57 w-full relative shrink-0">
                <img
                  src={node.img}
                  alt={`${node.phase} - ${node.title}`}
                  className="w-full h-full object-cover opacity-80 mix-blend-luminosity pointer-events-none"
                />
                <div className="absolute inset-0 bg-linear-to-t from-[#0a0f16] via-[#0a0f16]/40 to-transparent" />
                <div className="absolute bottom-0 left-0 right-0 px-6 sm:px-8 pb-3 sm:pb-4">
                  <span className="text-orange-500 font-mono text-[10px] font-bold tracking-widest uppercase mb-1 block">
                    {node.phase}
                  </span>
                  <h3 className="text-2xl sm:text-3xl font-black text-white leading-tight drop-shadow-md">
                    {node.title}
                  </h3>
                </div>
              </div>
              <div className="flex-1 px-6 sm:px-8 pt-3 sm:pt-4 pb-6 sm:pb-8 flex items-center bg-[#0a0f16]">
                <p className="text-gray-300 text-sm md:text-base leading-relaxed">
                  {node.desc}
                </p>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

      </div>

      {/* --- NATIVE iOS BOTTOM CONTROL PILL (Mobile & Tablet Indicator) --- */}
      <div className="fixed bottom-6 inset-x-0 z-50 flex items-center justify-center px-6 pointer-events-none">
        <div className="pointer-events-auto md:pointer-events-none flex items-center gap-4 px-4 py-2.5 rounded-full bg-[#0a0f16]/85 border border-white/15 backdrop-blur-2xl shadow-[0_10px_30px_rgba(0,0,0,0.7)]">
          <button
            type="button"
            aria-label="Previous chapter"
            disabled={animState !== 'CARD_IDLE'}
            onClick={() => handleAction('PREV')}
            className="md:hidden w-9 h-9 rounded-full bg-white/10 active:scale-90 flex items-center justify-center text-white disabled:opacity-40 transition-all cursor-pointer"
          >
            <ChevronLeft size={18} />
          </button>

          {/* Progress Dots */}
          <div className="flex items-center gap-2 px-1">
            {data.map((_, idx) => (
              <div
                key={idx}
                className={`h-1.5 rounded-full transition-all duration-500 ${idx === index ? 'w-6 bg-orange-500 shadow-[0_0_8px_rgba(249,115,22,0.8)]' : idx < index ? 'w-2 bg-orange-500/40' : 'w-2 bg-white/20'}`}
              />
            ))}
          </div>

          <button
            type="button"
            aria-label="Next chapter"
            disabled={animState !== 'CARD_IDLE'}
            onClick={() => handleAction('NEXT')}
            className="md:hidden w-9 h-9 rounded-full bg-orange-500 active:scale-90 flex items-center justify-center text-white shadow-[0_0_12px_rgba(249,115,22,0.5)] disabled:opacity-40 transition-all cursor-pointer"
          >
            <ChevronRight size={18} />
          </button>
        </div>
      </div>

    </div>
  );
}