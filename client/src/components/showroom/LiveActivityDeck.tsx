// src/components/showroom/LiveActivityDeck.tsx
import { useState, useEffect, useMemo, type FormEvent } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ArrowRight, CalendarDays, CarFront, CornerDownRight,
  MessageSquare, Plus, ScanBarcode, Sparkles, Users, Radio
} from 'lucide-react';
import {
  sortFeedForDisplay,
  addCommentToActivity,
  isValidUploadedAvatar,
  type LiveFeedPost,
} from '../../services/liveActivity/liveActivityStore';
import { SleekPillButton, SleekIconButton } from '../UI/SleekButtons';

const glassCardClasses = `
  backdrop-blur-2xl bg-white/5 dark:bg-[#0a0f16]/40
  border border-white/20 dark:border-white/10
  shadow-[0_15px_30px_rgba(0,0,0,0.1),inset_0_1px_8px_rgba(255,255,255,0.2)]
  dark:shadow-[0_15px_30px_rgba(0,0,0,0.3),inset_0_1px_8px_rgba(255,255,255,0.1)]
  rounded-3xl relative overflow-hidden
`;

function formatTime(value: string | number) {
  return new Intl.DateTimeFormat(undefined, { hour: 'numeric', minute: '2-digit' }).format(new Date(value));
}

interface LiveActivityDeckProps {
  storeId: string;
  actorName: string;
  feedPosts: LiveFeedPost[];
  setFeedPosts: React.Dispatch<React.SetStateAction<LiveFeedPost[]>>;
  activeVisitCount: number;
  onSwitchToShowroom: () => void;
  onOpenNewActivity: () => void;
  onOpenVinScanner: () => void;
  allowComments?: boolean;
}

export default function LiveActivityDeck({
  storeId,
  actorName,
  feedPosts,
  setFeedPosts,
  activeVisitCount,
  onSwitchToShowroom,
  onOpenNewActivity,
  onOpenVinScanner,
  allowComments = true,
}: LiveActivityDeckProps) {
  const [centralHeroIdx, setCentralHeroIdx] = useState(0);
  const [isHeroHovered, setIsHeroHovered] = useState(false);
  const [showCommentInput, setShowCommentInput] = useState(false);
  const [heroCommentText, setHeroCommentText] = useState('');
  const [flippedCards, setFlippedCards] = useState<Record<string, boolean>>({});

  const centralPriorityPool = useMemo(() => {
    const sorted = sortFeedForDisplay(feedPosts);
    const p1 = sorted.filter((p) => p.priority === 1);
    return p1.length > 0 ? p1 : sorted.slice(0, 5);
  }, [feedPosts]);

  useEffect(() => {
    if (centralPriorityPool.length <= 1 || isHeroHovered || showCommentInput) return;
    const timer = window.setInterval(() => {
      setCentralHeroIdx((prev) => (prev + 1) % centralPriorityPool.length);
    }, 5000);
    return () => window.clearInterval(timer);
  }, [centralPriorityPool.length, isHeroHovered, showCommentInput]);

  const priorityDecks = useMemo(() => {
    const sorted = sortFeedForDisplay(feedPosts);
    return [
      {
        key: 'showroom',
        label: 'Showroom',
        accent: 'text-orange-500',
        dot: 'bg-orange-500',
        icon: <Users size={12} />,
        items: sorted.filter((p) => p.category === 'showroom'),
      },
      {
        key: 'inventory',
        label: 'Inventory',
        accent: 'text-emerald-500',
        dot: 'bg-emerald-500',
        icon: <CarFront size={12} />,
        items: sorted.filter((p) => p.category === 'inventory'),
      },
      {
        key: 'appointments',
        label: 'Pipeline',
        accent: 'text-blue-400',
        dot: 'bg-blue-500',
        icon: <CalendarDays size={12} />,
        items: sorted.filter(
          (p) =>
            p.category === 'appointment' ||
            p.category === 'lead' ||
            p.category === 'contact' ||
            p.category === 'account'
        ),
      },
      {
        key: 'ai',
        label: 'EVEO AI',
        accent: 'text-purple-400',
        dot: 'bg-purple-500',
        icon: <Sparkles size={12} />,
        items: sorted.filter((p) => p.isAiAgent || p.category === 'ai_high_intent' || p.category === 'ai_scan'),
      },
    ];
  }, [feedPosts]);

  const summaryCounts = useMemo(() => {
    let showroomCount = activeVisitCount;
    let inventoryCount = 0;
    let apptLeadCount = 0;
    let aiCount = 0;

    feedPosts.forEach((p) => {
      const weight = p.coalescedCount || 1;
      if (p.category === 'showroom') showroomCount += weight;
      else if (p.category === 'inventory') inventoryCount += weight;
      else if (p.isAiAgent || p.category === 'ai_high_intent' || p.category === 'ai_scan') aiCount += weight;
      else apptLeadCount += weight;
    });

    return {
      total: showroomCount + inventoryCount + apptLeadCount + aiCount,
      showroom: showroomCount,
      inventory: inventoryCount,
      apptLead: apptLeadCount,
      ai: aiCount,
    };
  }, [feedPosts, activeVisitCount]);

  const currentHeroPost = centralPriorityPool[centralHeroIdx % Math.max(1, centralPriorityPool.length)] || null;

  const handleAddHeroComment = (e: FormEvent) => {
    e.preventDefault();
    if (!currentHeroPost || !heroCommentText.trim()) return;
    setFeedPosts(addCommentToActivity(storeId, currentHeroPost.id, actorName, heroCommentText));
    setHeroCommentText('');
    setShowCommentInput(false);
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -8 }}
      transition={{ duration: 0.25 }}
      className="space-y-3.5 sm:space-y-6"
    >
      {/* --- TOP COMMAND ROW: Ultra-Compact on Mobile, 3-Column Deck on Desktop --- */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-3.5 sm:gap-5 items-stretch">

        {/* 1. Left Column: Compact 1-Line Pills on Mobile / Stacked Cards on Desktop */}
        <div className="lg:col-span-3 flex flex-row lg:flex-col justify-between gap-2.5 sm:gap-4">
          <button
            type="button"
            onClick={onOpenNewActivity}
            className={`${glassCardClasses} flex-1 px-3.5 py-2.5 lg:p-5 flex items-center justify-between gap-2 text-left outline-none transition-transform duration-300 hover:-translate-y-0.5 cursor-pointer group`}
          >
            <div className="absolute top-0 left-0 w-full h-[45%] bg-linear-to-b from-white/10 to-transparent pointer-events-none" />
            <div className="relative z-10 flex items-center gap-2.5 min-w-0">
              <div className="p-2 lg:p-3 bg-orange-500/20 border border-orange-500/30 rounded-xl text-orange-500 shrink-0">
                <Plus size={16} />
              </div>
              <div className="min-w-0">
                <h3 className="text-xs sm:text-sm font-bold text-white truncate">New Activity</h3>
                <p className="hidden lg:block text-[10px] font-bold uppercase tracking-widest text-gray-500">Log Action</p>
              </div>
            </div>
            <ArrowRight size={14} className="relative z-10 text-orange-500 shrink-0" />
          </button>

          <button
            type="button"
            onClick={onSwitchToShowroom}
            className={`${glassCardClasses} flex-1 px-3.5 py-2.5 lg:p-5 flex items-center justify-between gap-2 text-left outline-none transition-transform duration-300 hover:-translate-y-0.5 cursor-pointer group`}
          >
            <div className="absolute top-0 left-0 w-full h-[45%] bg-linear-to-b from-white/10 to-transparent pointer-events-none" />
            <div className="relative z-10 flex items-center gap-2.5 min-w-0">
              <div className="p-2 lg:p-3 bg-blue-500/20 border border-blue-500/30 rounded-xl text-blue-400 shrink-0">
                <Users size={16} />
              </div>
              <div className="min-w-0">
                <h3 className="text-xs sm:text-sm font-bold text-white truncate">Showroom ({activeVisitCount})</h3>
                <p className="hidden lg:block text-[10px] font-bold uppercase tracking-widest text-gray-500">Activity</p>
              </div>
            </div>
            <ArrowRight size={14} className="relative z-10 text-blue-400 shrink-0" />
          </button>
        </div>

        {/* 2. Center Hero Card: Compact on Mobile, Full Hero on Desktop */}
        <div
          className="lg:col-span-6 flex"
          onMouseEnter={() => setIsHeroHovered(true)}
          onMouseLeave={() => setIsHeroHovered(false)}
        >
          {currentHeroPost && (
            <div
              onClick={() => setCentralHeroIdx((prev) => (prev + 1) % centralPriorityPool.length)}
              title="Tap to cycle to next Priority 1 activity"
              className={`${glassCardClasses} w-full p-4 sm:p-6 flex flex-col justify-between cursor-pointer group`}
            >
              <div className="absolute top-0 left-0 w-full h-[40%] bg-linear-to-b from-white/10 to-transparent pointer-events-none" />
              <div className="absolute top-4 right-4 sm:top-6 sm:right-6 h-2 w-2 rounded-full bg-red-500 animate-pulse shadow-[0_0_10px_rgba(239,68,68,0.8)]" />

              <AnimatePresence mode="wait">
                <motion.div
                  key={currentHeroPost.id}
                  initial={{ opacity: 0, y: 4 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -4 }}
                  transition={{ duration: 0.18 }}
                  className="relative z-10"
                >
                  <h4 className="text-[9px] sm:text-[10px] font-bold uppercase tracking-widest text-orange-500 mb-1.5 sm:mb-3 flex items-center gap-1.5 pr-6">
                    <Radio size={11} /> {currentHeroPost.agentName} &bull; P{currentHeroPost.priority} &bull; {formatTime(currentHeroPost.timestamp)}
                  </h4>

                  <h2 className="text-lg sm:text-2xl font-black text-white drop-shadow-xs truncate">
                    {currentHeroPost.title}
                  </h2>
                  <p className="text-xs text-gray-400 font-medium mt-0.5 line-clamp-1 sm:line-clamp-2">
                    {currentHeroPost.detail || 'Live floor telemetry event.'}
                  </p>
                </motion.div>
              </AnimatePresence>

              <div
                onClick={(e) => e.stopPropagation()}
                className="relative z-10 flex items-center justify-between gap-2 pt-3 mt-3 border-t border-white/10"
              >
                <div className="flex items-center gap-1.5">
                  {centralPriorityPool.slice(0, 6).map((item, idx) => (
                    <button
                      type="button"
                      key={item.id}
                      aria-label={`Priority item ${idx + 1}`}
                      onClick={() => setCentralHeroIdx(idx)}
                      className={`h-1.5 rounded-full transition-all cursor-pointer ${
                        idx === centralHeroIdx % centralPriorityPool.length
                          ? 'w-5 bg-orange-500'
                          : 'w-1.5 bg-white/20'
                      }`}
                    />
                  ))}
                </div>

                <div className="flex items-center gap-1.5">
                  <SleekPillButton
                    tone="neutral"
                    onClick={() => setCentralHeroIdx((prev) => (prev + 1) % centralPriorityPool.length)}
                  >
                    Next &rarr;
                  </SleekPillButton>
                  {allowComments && (
                    <SleekPillButton
                      tone="orange"
                      icon={<MessageSquare size={11} />}
                      onClick={() => setShowCommentInput((prev) => !prev)}
                    >
                      {currentHeroPost.comments?.length || 'Note'}
                    </SleekPillButton>
                  )}
                </div>
              </div>

              {allowComments && showCommentInput && (
                <div onClick={(e) => e.stopPropagation()} className="relative z-10 mt-3 pt-2.5 border-t border-white/10 space-y-2">
                  <form onSubmit={handleAddHeroComment} className="flex gap-2">
                    <input
                      name="hero_activity_comment"
                      value={heroCommentText}
                      onChange={(e) => setHeroCommentText(e.target.value)}
                      placeholder="Add team note..."
                      className="flex-1 min-h-8 px-3 py-1 rounded-xl bg-black/50 border border-white/10 text-xs text-white outline-none focus:border-orange-500"
                    />
                    <SleekPillButton type="submit" tone="orange">Post</SleekPillButton>
                  </form>
                </div>
              )}
            </div>
          )}
        </div>

        {/* 3. Far-Right Counter++ Summary: 1-Line Horizontal Bar on Mobile / Square Card on Desktop */}
        <div className="lg:col-span-3 flex">
          <div className={`${glassCardClasses} w-full px-4 py-3 lg:p-5 flex flex-row lg:flex-col items-center lg:items-stretch justify-between gap-3`}>
            <div className="absolute top-0 left-0 w-full h-[40%] bg-linear-to-b from-white/10 to-transparent pointer-events-none" />

            <div className="relative z-10 flex items-center lg:justify-between gap-2 shrink-0">
              <span className="text-[10px] font-bold uppercase tracking-widest text-orange-500">
                Summary
              </span>
              <span className="text-lg lg:text-2xl font-black tabular-nums text-white">
                {summaryCounts.total}
              </span>
            </div>

            {/* Compact inline badges on mobile, vertical list on lg desktop */}
            <div className="relative z-10 flex lg:flex-col items-center lg:items-stretch gap-3 lg:gap-2 text-xs">
              <div className="flex items-center justify-between gap-1">
                <Users size={12} className="text-orange-500" />
                <span className="hidden lg:inline text-gray-400 flex-1 ml-1">Showroom</span>
                <span className="font-mono font-black text-white">{summaryCounts.showroom}</span>
              </div>
              <div className="flex items-center justify-between gap-1">
                <CarFront size={12} className="text-emerald-500" />
                <span className="hidden lg:inline text-gray-400 flex-1 ml-1">Inventory</span>
                <span className="font-mono font-black text-white">{summaryCounts.inventory}</span>
              </div>
              <div className="flex items-center justify-between gap-1">
                <CalendarDays size={12} className="text-blue-400" />
                <span className="hidden lg:inline text-gray-400 flex-1 ml-1">Pipeline</span>
                <span className="font-mono font-black text-white">{summaryCounts.apptLead}</span>
              </div>
              <div className="flex items-center justify-between gap-1">
                <Sparkles size={12} className="text-purple-400" />
                <span className="hidden lg:inline text-gray-400 flex-1 ml-1">EVEO AI</span>
                <span className="font-mono font-black text-white">{summaryCounts.ai}</span>
              </div>
            </div>

            <div className="relative z-10 shrink-0">
              <div className="lg:hidden">
                <SleekIconButton icon={<ScanBarcode size={15} />} label="Scan VIN" tone="orange" onClick={onOpenVinScanner} />
              </div>
              <div className="hidden lg:block mt-2">
                <SleekPillButton icon={<ScanBarcode size={13} />} tone="neutral" onClick={onOpenVinScanner} className="w-full">
                  Scan VIN
                </SleekPillButton>
              </div>
            </div>
          </div>
        </div>

      </div>

      {/* --- BOTTOM ROW: 2x2 Grid on Mobile (`grid-cols-2 lg:grid-cols-4`) so zero vertical bloat! --- */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-5 pt-1 pb-2">
        {priorityDecks.map((deck) => {
          const isFlipped = Boolean(flippedCards[deck.key]);
          const latestItem = deck.items[0] || null;
          const pastFiveItems = deck.items.slice(0, 5);

          return (
            <div key={deck.key} className="relative h-44 sm:h-52 group">
              <div
                onClick={() => setFlippedCards((prev) => ({ ...prev, [deck.key]: !prev[deck.key] }))}
                className={`absolute inset-0 translate-x-1.5 translate-y-1.5 sm:translate-x-2 sm:translate-y-2 rounded-2xl sm:rounded-3xl bg-linear-to-br from-sky-400/35 via-blue-500/25 to-blue-900/50 border border-sky-300/40 backdrop-blur-xl shadow-[0_8px_20px_rgba(14,165,233,0.18)] transition-transform duration-300 cursor-pointer ${
                  isFlipped ? 'translate-x-0.5 translate-y-0.5 ring-1 ring-sky-300/60' : ''
                }`}
              />

              <div className="relative z-10 w-full h-full rounded-2xl sm:rounded-3xl p-3.5 sm:p-4 backdrop-blur-2xl bg-[#0a0f16]/90 border border-white/15 shadow-[0_12px_25px_rgba(0,0,0,0.4),inset_0_1px_6px_rgba(255,255,255,0.1)] flex flex-col justify-between overflow-hidden">
                <div className="absolute top-0 left-0 w-full h-[40%] bg-linear-to-b from-white/10 to-transparent pointer-events-none" />

                <div className="relative z-10 flex items-center justify-between gap-1">
                  <span className={`text-[9px] sm:text-[10px] font-bold uppercase tracking-widest flex items-center gap-1 truncate ${deck.accent}`}>
                    {deck.icon} <span className="truncate">{deck.label}</span>
                  </span>
                  <span className={`h-1.5 w-1.5 rounded-full shrink-0 ${deck.dot}`} />
                </div>

                <AnimatePresence mode="wait">
                  {!isFlipped ? (
                    <motion.div
                      key="front-latest"
                      initial={{ opacity: 0, y: 4 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -4 }}
                      transition={{ duration: 0.15 }}
                      className="relative z-10 my-auto space-y-1.5"
                    >
                      {latestItem ? (
                        <>
                          <div className="flex items-center gap-2">
                            <div className="relative w-7 h-7 sm:w-8 sm:h-8 rounded-full bg-linear-to-b from-white/15 to-black/80 border border-white/20 flex items-center justify-center font-black text-[10px] text-white shrink-0 overflow-hidden">
                              {latestItem.isAiAgent ? (
                                <Sparkles size={12} className="text-purple-400" />
                              ) : isValidUploadedAvatar(latestItem.avatarUrl) ? (
                                <img src={latestItem.avatarUrl} alt={latestItem.agentName} className="w-full h-full object-cover" />
                              ) : (
                                <span>{latestItem.initials}</span>
                              )}
                            </div>
                            <div className="min-w-0">
                              <p className="text-[11px] sm:text-xs font-black text-white truncate">
                                {latestItem.agentName}
                              </p>
                              <p className="text-[9px] text-gray-400">
                                {formatTime(latestItem.timestamp)}
                              </p>
                            </div>
                          </div>
                          <p className="text-[11px] sm:text-xs font-bold text-white line-clamp-1">
                            {latestItem.title}
                          </p>
                          {latestItem.detail && (
                            <p className="text-[10px] text-gray-400 line-clamp-1 sm:line-clamp-2 leading-snug">
                              {latestItem.detail}
                            </p>
                          )}
                        </>
                      ) : (
                        <p className="text-[11px] text-gray-500">No activity yet.</p>
                      )}
                    </motion.div>
                  ) : (
                    <motion.div
                      key="back-history"
                      initial={{ opacity: 0, y: 4 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -4 }}
                      transition={{ duration: 0.15 }}
                      className="relative z-10 my-1.5 flex-1 overflow-y-auto pr-0.5 space-y-1 custom-scrollbar"
                    >
                      {pastFiveItems.map((item) => (
                        <div
                          key={item.id}
                          className="px-2 py-1 rounded-lg bg-white/5 border border-white/10 flex items-center gap-1.5 text-[10px]"
                        >
                          <span className="font-black text-orange-400 shrink-0">{item.initials}</span>
                          <span className="font-bold text-gray-200 truncate flex-1">{item.title}</span>
                        </div>
                      ))}
                    </motion.div>
                  )}
                </AnimatePresence>

                <div className="relative z-10 flex items-center justify-between pt-1.5 border-t border-white/10">
                  <span className="text-[9px] font-bold text-gray-500">
                    {deck.items.length} logs
                  </span>
                  <button
                    type="button"
                    onClick={() =>
                      setFlippedCards((prev) => ({ ...prev, [deck.key]: !prev[deck.key] }))
                    }
                    className="inline-flex items-center gap-1 px-2 py-0.5 rounded-lg bg-white/5 hover:bg-white/10 border border-white/10 text-[10px] font-bold text-gray-300 transition-colors cursor-pointer"
                  >
                    <span>{isFlipped ? 'Latest' : 'Past 5'}</span>
                    <CornerDownRight size={10} className="text-sky-400" />
                  </button>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </motion.div>
  );
}
