// src/components/insights/EveoMascot.tsx
import { useState, useEffect, useRef, useId } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowRight, MessageSquare, Sparkles } from 'lucide-react';

export type MascotMood =
  | 'idle'
  | 'happy'
  | 'sleep'
  | 'alert'
  | 'concerned'
  | 'curious'
  | 'chill';

export interface EveoMascotProps {
  mood?: MascotMood | 'thinking' | 'speaking' | string;
  /** Set to false inside Insights tab so E.V.E. never goes to sleep there */
  allowSleep?: boolean;
  /** Changing this key triggers a single '!' alert flash before settling into `mood` */
  flashAlertKey?: string | number;
  size?: 'sm' | 'md' | 'lg';
  bubblePosition?: 'top' | 'bottom' | 'left' | 'right' | string;
  speechTitle?: string;
  speechBody?: string;
  bulletActions?: Array<{
    label: string;
    onClick: () => void;
  }>;
  showAskAnythingBtn?: boolean;
  onAskAnything?: () => void;
  onOpenChat?: () => void;
  onDismiss?: () => void;
  onClick?: () => void;
  className?: string;
}

export default function EveoMascot({
  mood = 'idle',
  allowSleep = true,
  flashAlertKey,
  size = 'md',
  bubblePosition = 'bottom',
  speechTitle,
  speechBody,
  bulletActions,
  showAskAnythingBtn,
  onAskAnything,
  onOpenChat,
  onClick,
  className = '',
}: EveoMascotProps) {
  const mascotRef = useRef<HTMLButtonElement>(null);
  // Insights mounts mobile and desktop mascot instances together. Namespace every
  // SVG paint-server/filter ID so one (possibly display:none) instance cannot
  // steal another instance's gradients or filters.
  const svgId = useId().replace(/:/g, '');

  const resolvedBaseMood: MascotMood = (() => {
    if ((mood === 'sleep' || mood === 'chill') && !allowSleep) return 'idle';
    if (mood === 'chill') return 'sleep';
    if (mood === 'curious' || mood === 'thinking') return 'concerned';
    if (
      mood === 'idle' ||
      mood === 'happy' ||
      mood === 'sleep' ||
      mood === 'alert' ||
      mood === 'concerned'
    ) {
      return mood;
    }
    return 'idle';
  })();

  const [activeMood, setActiveMood] = useState<MascotMood>(resolvedBaseMood);
  const [isBlinking, setIsBlinking] = useState(false);
  const [wokenFromSleep, setWokenFromSleep] = useState(false);
  const [parallax, setParallax] = useState({ x: 0, y: 0 });

  useEffect(() => {
    if (flashAlertKey !== undefined && flashAlertKey !== '') {
      setActiveMood('alert');
      const timer = setTimeout(() => {
        setActiveMood(resolvedBaseMood === 'alert' ? 'concerned' : resolvedBaseMood);
      }, 850);
      return () => clearTimeout(timer);
    } else if (!wokenFromSleep) {
      setActiveMood(resolvedBaseMood);
    }
  }, [resolvedBaseMood, flashAlertKey, wokenFromSleep]);

  // Automatic natural blink loop during 'idle' & 'concerned'
  useEffect(() => {
    if (activeMood !== 'idle' && activeMood !== 'concerned') {
      setIsBlinking(false);
      return;
    }

    let blinkTimeout: ReturnType<typeof setTimeout>;
    let nextBlinkTimer: ReturnType<typeof setTimeout>;

    const scheduleBlink = () => {
      const delay = 3200 + Math.random() * 2400;
      nextBlinkTimer = setTimeout(() => {
        setIsBlinking(true);
        blinkTimeout = setTimeout(() => {
          setIsBlinking(false);
          scheduleBlink();
        }, 140);
      }, delay);
    };

    scheduleBlink();
    return () => {
      clearTimeout(blinkTimeout);
      clearTimeout(nextBlinkTimer);
    };
  }, [activeMood]);

  // Real-time 3D Cursor Tracking (Paused while sleeping)
  useEffect(() => {
    if (activeMood === 'sleep') {
      setParallax({ x: 0, y: 0 });
      return;
    }

    const handleMove = (clientX: number, clientY: number) => {
      if (!mascotRef.current) return;
      const rect = mascotRef.current.getBoundingClientRect();
      const centerX = rect.left + rect.width / 2;
      const centerY = rect.top + rect.height / 2;

      const dx = clientX - centerX;
      const dy = clientY - centerY;
      const dist = Math.hypot(dx, dy) || 1;
      const maxNorm = Math.min(1, dist / 260);

      setParallax({
        x: (dx / dist) * maxNorm,
        y: (dy / dist) * maxNorm,
      });
    };

    const onMouseMove = (e: MouseEvent) => handleMove(e.clientX, e.clientY);
    const onTouchMove = (e: TouchEvent) => {
      if (e.touches[0]) handleMove(e.touches[0].clientX, e.touches[0].clientY);
    };

    window.addEventListener('mousemove', onMouseMove);
    window.addEventListener('touchmove', onTouchMove, { passive: true });
    return () => {
      window.removeEventListener('mousemove', onMouseMove);
      window.removeEventListener('touchmove', onTouchMove);
    };
  }, [activeMood]);

  const handleMascotClick = () => {
    if (activeMood === 'sleep') {
      setWokenFromSleep(true);
      setActiveMood('alert');
      setTimeout(() => {
        setActiveMood('happy');
      }, 850);
    } else {
      const prev = activeMood;
      setActiveMood('alert');
      setTimeout(() => {
        setActiveMood(prev === 'alert' ? 'happy' : prev);
      }, 750);
    }

    const callback = onOpenChat || onAskAnything || onClick;
    if (callback) callback();
  };

  const sizeClasses =
    size === 'sm'
      ? 'w-20 h-20 sm:w-24 sm:h-24'
      : size === 'md'
        ? 'w-32 h-32 sm:w-36 sm:h-36'
        : 'w-40 h-40 sm:w-48 sm:h-48';

  const hasSpeechBubble = Boolean(
    speechTitle || speechBody || (bulletActions && bulletActions.length > 0)
  );

  const ringOffset = { x: parallax.x * 3.5, y: parallax.y * 3.5 };
  const browOffset = { x: parallax.x * 7.5, y: parallax.y * 6.5 };
  const eyeOffset = { x: parallax.x * 11, y: parallax.y * 9 };

  const showClosedEyes = activeMood === 'sleep' || activeMood === 'happy' || isBlinking;
  const isUpwardHappyArc = activeMood === 'happy';

  return (
    <div
      className={`flex ${
        bubblePosition === 'left' ? 'flex-col md:flex-row-reverse' : 'flex-col'
      } items-center justify-center gap-4 overflow-visible pt-4 ${className}`}
    >
      <motion.button
        ref={mascotRef}
        type="button"
        onClick={handleMascotClick}
        whileHover={{ scale: 1.04 }}
        whileTap={{ scale: 0.95 }}
        animate={{
          y: activeMood === 'sleep' ? [0, -2, 0] : [0, -4, 0],
          scale: activeMood === 'alert' ? [1, 1.05, 1.02] : 1,
        }}
        transition={{
          y: {
            duration: activeMood === 'sleep' ? 4.2 : 3,
            repeat: Infinity,
            ease: 'easeInOut',
          },
          scale: { duration: 0.3 },
        }}
        title="E.V.E. — Executive Vision Entity"
        aria-label="Open E.V.E. Executive Vision Entity assistant"
        aria-busy={mood === 'thinking'}
        className={`relative flex items-center justify-center outline-none select-none cursor-pointer group shrink-0 overflow-visible ${sizeClasses}`}
      >
        {/* Floating "!" Alert / Wake-Up Badge (Positioned with safe top clearance so it never clips) */}
        <AnimatePresence>
          {activeMood === 'alert' && (
            <motion.div
              key="eve-alert-bang"
              initial={{ opacity: 0, y: 8, scale: 0.5 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -6, scale: 0.6 }}
              transition={{ type: 'spring', stiffness: 420, damping: 18 }}
              className="absolute -top-2 right-1 z-30 pointer-events-none"
            >
              <div className="w-7 h-7 rounded-full bg-linear-to-b from-amber-300 via-orange-500 to-amber-700 border border-amber-200/80 shadow-[0_4px_12px_rgba(0,0,0,0.7),inset_0_1px_2px_rgba(255,255,255,0.8)] flex items-center justify-center">
                <span className="font-black text-sm text-white leading-none">!</span>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Floating "Zzz" in Sleep State */}
        <AnimatePresence>
          {activeMood === 'sleep' && (
            <motion.div
              key="eve-sleep-zzz"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute -top-1 right-1 z-30 pointer-events-none flex flex-col items-end"
            >
              <motion.span
                animate={{ y: [0, -6, -12], opacity: [0, 1, 0], x: [0, 3, 6] }}
                transition={{ duration: 2.6, repeat: Infinity, ease: 'easeOut' }}
                className="text-xs font-black text-amber-300/90"
              >
                Z
              </motion.span>
              <motion.span
                animate={{ y: [0, -5, -9], opacity: [0, 0.85, 0], x: [0, 2, 4] }}
                transition={{ duration: 2.6, delay: 0.8, repeat: Infinity, ease: 'easeOut' }}
                className="text-[10px] font-black text-amber-400/75 -mt-1 mr-2"
              >
                z
              </motion.span>
            </motion.div>
          )}
        </AnimatePresence>

        <svg viewBox="0 0 240 240" className="w-full h-full overflow-visible" aria-hidden="true">
          <defs>
            <linearGradient id={`${svgId}-goldRingGrad`} x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#fde68a" />
              <stop offset="22%" stopColor="#fbbf24" />
              <stop offset="55%" stopColor="#f97316" />
              <stop offset="85%" stopColor="#c2410c" />
              <stop offset="100%" stopColor="#7c2d12" />
            </linearGradient>

            <linearGradient id={`${svgId}-ringSpecular`} x1="0%" y1="0%" x2="0%" y2="100%">
              <stop offset="0%" stopColor="#ffffff" stopOpacity="0.85" />
              <stop offset="40%" stopColor="#fde047" stopOpacity="0.45" />
              <stop offset="100%" stopColor="#9a3412" stopOpacity="0.0" />
            </linearGradient>

            <linearGradient id={`${svgId}-pillEyeGrad`} x1="25%" y1="0%" x2="85%" y2="100%">
              <stop offset="0%" stopColor="#fffdf6" />
              <stop offset="28%" stopColor="#ffe9dc" />
              <stop offset="72%" stopColor="#f7c5b8" />
              <stop offset="100%" stopColor="#d99a91" />
            </linearGradient>

            <linearGradient id={`${svgId}-pillInnerHighlight`} x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#ffffff" stopOpacity="0.98" />
              <stop offset="35%" stopColor="#fff8f1" stopOpacity="0.82" />
              <stop offset="100%" stopColor="#f4b9b8" stopOpacity="0" />
            </linearGradient>

            <linearGradient id={`${svgId}-obsidian3D`} x1="0%" y1="0%" x2="0%" y2="100%">
              <stop offset="0%" stopColor="#4b5563" />
              <stop offset="28%" stopColor="#1f2937" />
              <stop offset="75%" stopColor="#090d16" />
              <stop offset="100%" stopColor="#000000" />
            </linearGradient>

            <radialGradient id={`${svgId}-glassCore`} cx="38%" cy="30%" r="70%">
              <stop offset="0%" stopColor="#161b22" stopOpacity="0.95" />
              <stop offset="60%" stopColor="#0a0f16" stopOpacity="0.98" />
              <stop offset="100%" stopColor="#05080c" stopOpacity="1" />
            </radialGradient>

            <filter id={`${svgId}-shadow3D`} x="-20%" y="-20%" width="140%" height="140%">
              <feDropShadow dx="0" dy="3" stdDeviation="2.5" floodColor="#000000" floodOpacity="0.6" />
            </filter>
          </defs>

          {/* LAYER 1: INNER CORE SPHERE (Clean Obsidian Surface, Zero Glow) */}
          <g
            style={{
              transform: `translate(${ringOffset.x * 0.6}px, ${ringOffset.y * 0.6}px)`,
              transition: 'transform 0.12s ease-out',
            }}
          >
            <circle
              cx="120"
              cy="120"
              r="84"
              fill={`url(#${svgId}-glassCore)`}
              stroke="rgba(255,255,255,0.06)"
              strokeWidth="1"
            />
            <path
              d="M 58 84 A 74 74 0 0 1 174 68 A 78 78 0 0 0 58 84 Z"
              fill="rgba(255,255,255,0.04)"
            />
          </g>

          {/* LAYER 2: 3D BEZIER EVEO OUTER RING + 6 SIDE DASHES */}
          <g
            filter={`url(#${svgId}-shadow3D)`}
            style={{
              transform: `translate(${ringOffset.x}px, ${ringOffset.y}px)`,
              transition: 'transform 0.1s ease-out',
            }}
          >
            <path
              d="M 41 68 A 96 96 0 0 1 199 68 L 184 68 A 82 82 0 0 0 56 68 Z"
              fill={`url(#${svgId}-goldRingGrad)`}
              stroke="#7c2d12"
              strokeWidth="1.5"
              strokeLinejoin="round"
            />
            <path
              d="M 46 65 A 93 93 0 0 1 194 65"
              fill="none"
              stroke={`url(#${svgId}-ringSpecular)`}
              strokeWidth="3.2"
              strokeLinecap="round"
            />

            <path
              d="M 56 172 A 82 82 0 0 0 184 172 L 199 172 A 96 96 0 0 1 41 172 Z"
              fill={`url(#${svgId}-goldRingGrad)`}
              stroke="#7c2d12"
              strokeWidth="1.5"
              strokeLinejoin="round"
            />
            <path
              d="M 58 175 A 84 84 0 0 0 182 175"
              fill="none"
              stroke={`url(#${svgId}-ringSpecular)`}
              strokeWidth="2.8"
              strokeLinecap="round"
            />

            {[
              'M 27 89 L 47 89 L 43 101 L 23 101 Z',
              'M 21 114 L 41 114 L 41 126 L 21 126 Z',
              'M 23 139 L 43 139 L 47 151 L 27 151 Z',
            ].map((d, i) => (
              <g key={`left-dash-${i}`}>
                <path
                  d={d}
                  fill={`url(#${svgId}-goldRingGrad)`}
                  stroke="#7c2d12"
                  strokeWidth="1.4"
                  strokeLinejoin="round"
                />
                <path d={d} fill="none" stroke="rgba(255,255,255,0.45)" strokeWidth="0.9" />
              </g>
            ))}

            {[
              'M 193 89 L 213 89 L 217 101 L 197 101 Z',
              'M 199 114 L 219 114 L 219 126 L 199 126 Z',
              'M 197 139 L 217 139 L 213 151 L 193 151 Z',
            ].map((d, i) => (
              <g key={`right-dash-${i}`}>
                <path
                  d={d}
                  fill={`url(#${svgId}-goldRingGrad)`}
                  stroke="#7c2d12"
                  strokeWidth="1.4"
                  strokeLinejoin="round"
                />
                <path d={d} fill="none" stroke="rgba(255,255,255,0.45)" strokeWidth="0.9" />
              </g>
            ))}
          </g>

          {/* LAYER 3: 3D BEZIER GLOSSY OBSIDIAN EYEBROWS */}
          <motion.g
            filter={`url(#${svgId}-shadow3D)`}
            animate={{
              y:
                activeMood === 'alert'
                  ? -8
                  : activeMood === 'happy'
                    ? -4
                    : activeMood === 'sleep'
                      ? 4
                      : 0,
            }}
            transition={{ type: 'spring', stiffness: 300, damping: 20 }}
            style={{
              transform: `translate(${browOffset.x}px, ${browOffset.y}px)`,
            }}
          >
            <g
              transform={
                activeMood === 'concerned'
                  ? 'rotate(-10 88 74)'
                  : activeMood === 'happy'
                    ? 'rotate(-3 88 74)'
                    : 'rotate(0 88 74)'
              }
            >
              <path
                d="M 72 78 C 77 66, 95 66, 102 75 C 104 78, 100 82, 96 80 C 90 76, 81 76, 76 81 C 72 83, 70 80, 72 78 Z"
                fill="#c9b7d8"
                opacity="0.92"
                stroke="#8e789f"
                strokeWidth="1"
              />
              <path
                d="M 75 75 C 80 68, 93 68, 99 74"
                fill="none"
                stroke="rgba(255,255,255,0.7)"
                strokeWidth="2.2"
                strokeLinecap="round"
              />
            </g>

            <g
              transform={
                activeMood === 'concerned'
                  ? 'rotate(10 152 74)'
                  : activeMood === 'happy'
                    ? 'rotate(3 152 74)'
                    : 'rotate(0 152 74)'
              }
            >
              <path
                d="M 168 78 C 163 66, 145 66, 138 75 C 136 78, 140 82, 144 80 C 150 76, 159 76, 164 81 C 168 83, 170 80, 168 78 Z"
                fill="#c9b7d8"
                opacity="0.92"
                stroke="#8e789f"
                strokeWidth="1"
              />
              <path
                d="M 165 75 C 160 68, 147 68, 141 74"
                fill="none"
                stroke="rgba(255,255,255,0.7)"
                strokeWidth="2.2"
                strokeLinecap="round"
              />
            </g>
          </motion.g>

          {/* LAYER 4: 3D BEZIER PILL EYES OR 3D CLOSED LASH ARCS */}
          <g
            filter={`url(#${svgId}-shadow3D)`}
            style={{
              transform: `translate(${eyeOffset.x}px, ${eyeOffset.y}px)`,
              transition: 'transform 0.07s ease-out',
            }}
          >
            {!showClosedEyes ? (
              <motion.g
                key="open-pill-eyes"
                initial={{ scaleY: 0.2 }}
                animate={{
                  scaleY: activeMood === 'alert' ? 1.12 : 1,
                  scaleX: activeMood === 'alert' ? 1.06 : 1,
                }}
                transition={{ duration: 0.14 }}
                style={{ transformOrigin: '120px 118px' }}
              >
                <g stroke="#ead9ed" strokeLinecap="round" fill="none" opacity="0.96">
                  <path d="M 81 95 Q 73 91 69 86" strokeWidth="2.4" />
                  <path d="M 84 92 Q 77 86 74 81" strokeWidth="2.1" />
                  <path d="M 88 90 Q 83 84 81 79" strokeWidth="1.7" />
                </g>

                <g stroke="#ead9ed" strokeLinecap="round" fill="none" opacity="0.96">
                  <path d="M 159 95 Q 167 91 171 86" strokeWidth="2.4" />
                  <path d="M 156 92 Q 163 86 166 81" strokeWidth="2.1" />
                  <path d="M 152 90 Q 157 84 159 79" strokeWidth="1.7" />
                </g>

                <g>
                  <rect x="79" y="89" width="22" height="56" rx="11" fill="#451a03" />
                  <rect
                    x="78"
                    y="87"
                    width="22"
                    height="55"
                    rx="11"
                    fill={`url(#${svgId}-pillEyeGrad)`}
                    stroke="#78350f"
                    strokeWidth="1.2"
                  />
                  <path
                    d="M 82 132 L 82 98 A 7 7 0 0 1 95 95"
                    fill="none"
                    stroke={`url(#${svgId}-pillInnerHighlight)`}
                    strokeWidth="4.2"
                    strokeLinecap="round"
                  />
                  <circle cx="85" cy="95" r="2.3" fill="#ffffff" opacity="0.9" />
                </g>

                <g>
                  <rect x="141" y="89" width="22" height="56" rx="11" fill="#451a03" />
                  <rect
                    x="140"
                    y="87"
                    width="22"
                    height="55"
                    rx="11"
                    fill={`url(#${svgId}-pillEyeGrad)`}
                    stroke="#78350f"
                    strokeWidth="1.2"
                  />
                  <path
                    d="M 144 132 L 144 98 A 7 7 0 0 1 157 95"
                    fill="none"
                    stroke={`url(#${svgId}-pillInnerHighlight)`}
                    strokeWidth="4.2"
                    strokeLinecap="round"
                  />
                  <circle cx="147" cy="95" r="2.3" fill="#ffffff" opacity="0.9" />
                </g>
              </motion.g>
            ) : isUpwardHappyArc ? (
              <motion.g
                key="happy-3d-eyes"
                initial={{ opacity: 0.8, scale: 0.96 }}
                animate={{ opacity: 1, scale: 1 }}
              >
                <path
                  d="M 64 114 C 74 96, 98 96, 108 114 C 98 104, 74 104, 64 114 Z"
                  fill={`url(#${svgId}-obsidian3D)`}
                  stroke="#090d16"
                  strokeWidth="2.5"
                  strokeLinejoin="round"
                />
                <path
                  d="M 67 111 Q 56 107 52 100"
                  fill="none"
                  stroke={`url(#${svgId}-obsidian3D)`}
                  strokeWidth="3.2"
                  strokeLinecap="round"
                />
                <path
                  d="M 72 106 Q 63 100 60 94"
                  fill="none"
                  stroke={`url(#${svgId}-obsidian3D)`}
                  strokeWidth="2.6"
                  strokeLinecap="round"
                />
                <path
                  d="M 70 107 Q 86 97 102 107"
                  fill="none"
                  stroke="rgba(255,255,255,0.75)"
                  strokeWidth="2"
                  strokeLinecap="round"
                />

                <path
                  d="M 132 114 C 142 96, 166 96, 176 114 C 166 104, 142 104, 132 114 Z"
                  fill={`url(#${svgId}-obsidian3D)`}
                  stroke="#090d16"
                  strokeWidth="2.5"
                  strokeLinejoin="round"
                />
                <path
                  d="M 173 111 Q 184 107 188 100"
                  fill="none"
                  stroke={`url(#${svgId}-obsidian3D)`}
                  strokeWidth="3.2"
                  strokeLinecap="round"
                />
                <path
                  d="M 168 106 Q 177 100 180 94"
                  fill="none"
                  stroke={`url(#${svgId}-obsidian3D)`}
                  strokeWidth="2.6"
                  strokeLinecap="round"
                />
                <path
                  d="M 138 107 Q 154 97 170 107"
                  fill="none"
                  stroke="rgba(255,255,255,0.75)"
                  strokeWidth="2"
                  strokeLinecap="round"
                />
              </motion.g>
            ) : (
              <motion.g key="sleep-3d-eyes" initial={{ opacity: 0.9 }} animate={{ opacity: 1 }}>
                <path
                  d="M 66 106 Q 86 122 106 106"
                  fill="none"
                  stroke={`url(#${svgId}-obsidian3D)`}
                  strokeWidth="7.5"
                  strokeLinecap="round"
                />
                <path
                  d="M 68 108 Q 59 112 55 117"
                  fill="none"
                  stroke={`url(#${svgId}-obsidian3D)`}
                  strokeWidth="2.8"
                  strokeLinecap="round"
                />
                <path
                  d="M 74 112 Q 67 117 64 122"
                  fill="none"
                  stroke={`url(#${svgId}-obsidian3D)`}
                  strokeWidth="2.2"
                  strokeLinecap="round"
                />
                <path
                  d="M 70 105 Q 86 119 102 105"
                  fill="none"
                  stroke="rgba(255,255,255,0.7)"
                  strokeWidth="2"
                  strokeLinecap="round"
                />

                <path
                  d="M 134 106 Q 154 122 174 106"
                  fill="none"
                  stroke={`url(#${svgId}-obsidian3D)`}
                  strokeWidth="7.5"
                  strokeLinecap="round"
                />
                <path
                  d="M 172 108 Q 181 112 185 117"
                  fill="none"
                  stroke={`url(#${svgId}-obsidian3D)`}
                  strokeWidth="2.8"
                  strokeLinecap="round"
                />
                <path
                  d="M 166 112 Q 173 117 176 122"
                  fill="none"
                  stroke={`url(#${svgId}-obsidian3D)`}
                  strokeWidth="2.2"
                  strokeLinecap="round"
                />
                <path
                  d="M 138 105 Q 154 119 170 105"
                  fill="none"
                  stroke="rgba(255,255,255,0.7)"
                  strokeWidth="2"
                  strokeLinecap="round"
                />
              </motion.g>
            )}
          </g>
        </svg>
      </motion.button>

      {/* Speech Bubble Window (When rendered inside Hub Insights Modal) */}
      {hasSpeechBubble && (
        <div className="w-full max-w-md rounded-3xl p-5 bg-linear-to-b from-[#141a23]/95 via-[#0a0f16] to-[#070a0f] border border-white/10 shadow-[inset_0_1px_1px_rgba(255,255,255,0.12),0_15px_35px_rgba(0,0,0,0.65)] space-y-3 text-left">
          <div className="flex items-center justify-between gap-2">
            <span className="text-[10px] font-black uppercase tracking-widest text-orange-400 flex items-center gap-1.5">
              <Sparkles size={12} /> E.V.E.
            </span>
            <span className="text-[10px] font-bold text-gray-500">
              {activeMood === 'sleep' ? 'Tap E.V.E. to Wake' : 'Online'}
            </span>
          </div>

          {speechTitle && (
            <h3 className="text-base sm:text-lg font-black text-white">{speechTitle}</h3>
          )}
          {speechBody && (
            <p className="text-xs sm:text-sm text-gray-300 leading-relaxed">{speechBody}</p>
          )}

          {bulletActions && bulletActions.length > 0 && (
            <div className="space-y-2 pt-1">
              {bulletActions.map((act, idx) => (
                <button
                  type="button"
                  key={idx}
                  onClick={act.onClick}
                  className="w-full p-3 rounded-2xl bg-white/5 hover:bg-white/10 border border-white/10 flex items-center justify-between gap-2 text-xs font-bold text-gray-200 hover:text-white transition-colors cursor-pointer"
                >
                  <span>{act.label}</span>
                  <ArrowRight size={14} className="text-orange-400 shrink-0" />
                </button>
              ))}
            </div>
          )}

          {showAskAnythingBtn && (onOpenChat || onAskAnything || onClick) && (
            <button
              type="button"
              onClick={handleMascotClick}
              className="w-full py-2.5 px-4 rounded-xl bg-orange-500/20 hover:bg-orange-500/30 border border-orange-400/40 text-xs font-bold text-orange-300 flex items-center justify-center gap-2 cursor-pointer"
            >
              <MessageSquare size={14} /> Ask E.V.E. Anything
            </button>
          )}
        </div>
      )}
    </div>
  );
}