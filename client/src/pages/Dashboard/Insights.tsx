// src/pages/Dashboard/Insights.tsx
import { useState, useRef, useEffect, type ChangeEvent, type FormEvent } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Sparkles,
  Send,
  Plus,
  Mic,
  CheckCircle2,
  X,
  RotateCcw,
  Target,
  Car,
  TrendingUp,
  AlertTriangle,
  ChevronLeft,
  ArrowRight,
} from 'lucide-react';
import Mascot, { type MascotMood } from '../../components/insights/EveoMascot';
import { useStoreAppearance } from '../../contexts/StoreAppereanceContext';
import { useAuth } from '../../contexts/AuthContext';
import {
  useInsightsSuite,
  type InsightCardSchema,
  type InsightCategory,
} from '../../hooks/useInsightsSuite';
import { setAgentLiveActivity } from '../../components/reports/OrbModals';
import { playGalleryClick, playModalOpen, playBack } from '../../utils/soundEngine';

const CATEGORY_META: Record<
  InsightCategory,
  {
    eyebrowColor: string;
    icon: React.ReactNode;
    dotColor: string;
    postAlertMood: MascotMood;
  }
> = {
  churn: {
    eyebrowColor: 'text-emerald-400',
    icon: <Target size={14} className="text-emerald-400" />,
    dotColor: 'bg-emerald-500',
    postAlertMood: 'concerned',
  },
  inventory: {
    eyebrowColor: 'text-orange-400',
    icon: <Car size={14} className="text-orange-400" />,
    dotColor: 'bg-orange-500',
    postAlertMood: 'happy',
  },
  staff: {
    eyebrowColor: 'text-purple-400',
    icon: <TrendingUp size={14} className="text-purple-400" />,
    dotColor: 'bg-purple-500',
    postAlertMood: 'concerned',
  },
  sla: {
    eyebrowColor: 'text-amber-400',
    icon: <AlertTriangle size={14} className="text-amber-400" />,
    dotColor: 'bg-red-500',
    postAlertMood: 'concerned',
  },
};

export default function Insights() {
  const { activeStoreId } = useStoreAppearance();
  const { role } = useAuth();
  const {
    activeUser,
    cards,
    messages,
    isLoading,
    sendPrompt,
    markPreviewReviewed,
    clearThread,
  } = useInsightsSuite(activeStoreId, role);

  const [expandedCardId, setExpandedCardId] = useState<string | null>(null);
  const [mobileCardsOpen, setMobileCardsOpen] = useState(false);
  const [flashKey, setFlashKey] = useState<string>('');
  const [chatInput, setChatInput] = useState('');
  const [isListening, setIsListening] = useState(false);
  const [attachedPreview, setAttachedPreview] = useState<string | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const chatEndRef = useRef<HTMLDivElement>(null);
  const flashSequenceRef = useRef(0);

  const expandedCard = cards.find((c) => c.id === expandedCardId) || null;

  const eveMood: MascotMood | 'thinking' = (() => {
    if (isLoading) return 'thinking';
    if (messages.some((m) => m.actionReviewed || m.actionExecuted)) return 'happy';
    if (expandedCard) {
      return CATEGORY_META[expandedCard.category].postAlertMood;
    }
    return 'idle';
  })();

  const handleOpenCard = (card: InsightCardSchema) => {
    playGalleryClick();
    setExpandedCardId(card.id);
    setAgentLiveActivity(activeStoreId, activeUser.fullName, `Reviewing ${card.title} with E.V.E.`);
    if (card.hasWarningPoint) {
      flashSequenceRef.current += 1;
      setFlashKey(`${card.id}_${flashSequenceRef.current}`);
    } else {
      setFlashKey('');
    }
  };

  const handleMobileStepBack = () => {
    playBack();
    if (expandedCardId) {
      setExpandedCardId(null);
    } else {
      setMobileCardsOpen(false);
    }
  };

  useEffect(() => {
    setExpandedCardId(null);
    setMobileCardsOpen(false);
  }, [activeStoreId, role]);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages.length]);

  const handleFileChange = (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file) return;
    setAttachedPreview(file.name);
  };

  const handleVoiceToggle = () => {
    playGalleryClick();
    setIsListening((prev) => !prev);
  };

  const handleChatSubmit = (e: FormEvent) => {
    e.preventDefault();
    if (!chatInput.trim() && !attachedPreview) return;
    playModalOpen();
    const promptPayload = attachedPreview
      ? `${chatInput.trim()} [Attached:${attachedPreview}]`.trim()
      : chatInput.trim();

    if (/sla|discrepancy|warn|behind|drop|miss|low|audit/i.test(promptPayload)) {
      setFlashKey(`prompt_${Date.now()}`);
    }

    setAgentLiveActivity(activeStoreId, activeUser.fullName, 'Consulting E.V.E. (store-scoped tools)');
    setMobileCardsOpen(false);
    setExpandedCardId(null);
    void sendPrompt(promptPayload, expandedCard || undefined);
    setChatInput('');
    setAttachedPreview(null);
  };

  return (
    <div className="relative h-[calc(100dvh-5rem)] md:h-dvh w-full px-4 sm:px-8 md:pl-32 md:pr-10 pt-4 pb-4 sm:py-6 flex flex-col overflow-hidden select-none sm:select-auto">
      <div className="w-full max-w-5xl mx-auto flex-1 min-h-0 flex flex-col justify-between gap-3">
        {/* Header Bar */}
        <header className="relative z-20 flex items-center justify-between gap-3 shrink-0 w-full">
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-2xl bg-orange-500/10 border border-orange-500/25 flex items-center justify-center shrink-0">
              <Sparkles size={17} className="text-orange-400" />
            </div>
            <h1 className="text-lg sm:text-2xl font-black text-white truncate">
              EVEO Insights
            </h1>
          </div>

          <div className="flex items-center gap-2">
            {messages.length === 0 && mobileCardsOpen && (
              <button
                type="button"
                onClick={handleMobileStepBack}
                className="lg:hidden px-3 py-1.5 rounded-full bg-white/6 hover:bg-white/12 border border-white/12 text-xs font-bold text-gray-200 flex items-center gap-1 cursor-pointer"
              >
                <ChevronLeft size={14} /> Back
              </button>
            )}

            {messages.length > 0 && (
              <button
                type="button"
                onClick={() => {
                  playGalleryClick();
                  clearThread();
                  setMobileCardsOpen(false);
                  setExpandedCardId(null);
                }}
                className="px-3 py-1.5 rounded-full bg-white/6 hover:bg-white/12 border border-white/12 text-xs font-bold text-gray-200 flex items-center gap-1.5 cursor-pointer"
              >
                <RotateCcw size={12} /> Reset Chat
              </button>
            )}
          </div>
        </header>

        {/* MAIN STAGE */}
        <div className="relative z-10 flex-1 min-h-0 flex flex-col w-full overflow-visible">
          {/* MOBILE VIEW (< lg) */}
          <div className="flex lg:hidden flex-1 min-h-0 flex-col justify-center overflow-visible">
            <AnimatePresence mode="wait">
              {messages.length === 0 && !mobileCardsOpen ? (
                <motion.div
                  key="mobile-greeting"
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  className="flex flex-col items-center justify-center max-w-sm mx-auto w-full gap-4 px-1 overflow-visible"
                >
                  <Mascot
                    mood={eveMood}
                    allowSleep={false}
                    flashAlertKey={flashKey}
                    size="lg"
                    onClick={() => {
                      playModalOpen();
                      setMobileCardsOpen(true);
                    }}
                  />

                  <button
                    type="button"
                    onClick={() => {
                      playModalOpen();
                      setMobileCardsOpen(true);
                    }}
                    className="w-full text-left p-5 rounded-3xl bg-linear-to-b from-[#141a23]/95 via-[#0a0f16] to-[#070a0f] border border-white/10 shadow-[inset_0_1px_1px_rgba(255,255,255,0.12),0_15px_35px_rgba(0,0,0,0.65)] active:scale-[0.98] transition-all cursor-pointer"
                  >
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-[10px] font-black uppercase tracking-widest text-orange-400 flex items-center gap-1.5">
                        <Sparkles size={11} /> E.V.E.
                      </span>
                      <span className="text-[10px] font-bold text-gray-400">
                        Tap for {activeUser.role.toUpperCase()} cards &rarr;
                      </span>
                    </div>
                    <p className="text-xs sm:text-sm text-gray-200 font-medium leading-relaxed">
                      {activeUser.greetingText}
                    </p>
                  </button>

                  <div className="w-full flex flex-col gap-1.5 pt-1">
                    {activeUser.faqs.slice(0, 2).map((faq, i) => (
                      <button
                        key={i}
                        type="button"
                        onClick={() => {
                          playModalOpen();
                          void sendPrompt(faq, cards[i]);
                        }}
                        className="w-full text-left px-3.5 py-2.5 rounded-2xl bg-[#0a0f16]/90 hover:bg-white/8 border border-white/10 text-[11px] font-semibold text-gray-300 flex items-center justify-between gap-2 cursor-pointer"
                      >
                        <span className="truncate">{faq}</span>
                        <ArrowRight size={12} className="text-orange-400 shrink-0" />
                      </button>
                    ))}
                  </div>
                </motion.div>
              ) : messages.length === 0 && mobileCardsOpen ? (
                /* Mobile Cards View with Horizontal Swipe-to-Go-Back Gesture! */
                <motion.div
                  key="mobile-cards"
                  initial={{ opacity: 0, x: 24 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -24 }}
                  onPanEnd={(_, info) => {
                    // Swipe Left or Right (>50px) to go back comfortably with one thumb
                    if (
                      Math.abs(info.offset.x) > 50 &&
                      Math.abs(info.offset.x) > Math.abs(info.offset.y)
                    ) {
                      handleMobileStepBack();
                    }
                  }}
                  className="flex flex-col items-center justify-center gap-3 w-full my-auto overflow-y-auto py-1 touch-pan-y"
                >
                  <Mascot
                    mood={eveMood}
                    allowSleep={false}
                    flashAlertKey={flashKey}
                    size="sm"
                    onClick={handleMobileStepBack}
                  />

                  {!expandedCard ? (
                    <div className="flex flex-col gap-2.5 w-full">
                      {cards.map((card) => (
                        <HubStyleInsightCard
                          key={card.id}
                          card={card}
                          isSelected={false}
                          onSelect={() => handleOpenCard(card)}
                        />
                      ))}
                    </div>
                  ) : (
                    <ExpandedHubInsightCard
                      card={expandedCard}
                      onClose={() => setExpandedCardId(null)}
                      onExecute={() => {
                        playModalOpen();
                        setMobileCardsOpen(false);
                        setExpandedCardId(null);
                        void sendPrompt(expandedCard.promptTemplate, expandedCard);
                      }}
                    />
                  )}

                  <span className="text-[10px] font-semibold text-gray-500 pt-1">
                    &larr; Swipe horizontally to go back
                  </span>
                </motion.div>
              ) : (
                /* Mobile Chat Thread (Also supports horizontal swipe to reset back to E.V.E.) */
                <motion.div
                  key="mobile-chat"
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  onPanEnd={(_, info) => {
                    if (
                      Math.abs(info.offset.x) > 65 &&
                      Math.abs(info.offset.x) > Math.abs(info.offset.y)
                    ) {
                      playBack();
                      clearThread();
                    }
                  }}
                  className="flex-1 min-h-0 overflow-y-auto custom-scrollbar px-1 py-2 flex flex-col gap-3 touch-pan-y"
                >
                  <div className="flex items-center justify-center pb-1 shrink-0 overflow-visible">
                    <Mascot
                      mood={eveMood}
                      allowSleep={false}
                      flashAlertKey={flashKey}
                      size="sm"
                    />
                  </div>
                  <ChatThreadList
                    messages={messages}
                    isLoading={isLoading}
                    onExecuteAction={(id) => void markPreviewReviewed(id)}
                  />
                  <div ref={chatEndRef} />
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* DESKTOP VIEW (lg:grid-cols-12) */}
          <div className="hidden lg:grid lg:grid-cols-12 gap-4 flex-1 min-h-0 w-full items-stretch">
            <div className="lg:col-span-8 flex flex-col min-h-0 rounded-3xl bg-linear-to-b from-[#11161f]/90 to-[#080c12]/95 border border-white/10 p-5 overflow-hidden shadow-[0_15px_35px_rgba(0,0,0,0.6)]">
              <div className="flex items-center gap-4 pb-4 border-b border-white/10 shrink-0 overflow-visible">
                <div className="relative shrink-0">
                  <div className="absolute inset-2 rounded-full bg-orange-400/15 blur-xl pointer-events-none" />
                  <Mascot
                    mood={eveMood}
                    allowSleep={false}
                    flashAlertKey={flashKey}
                    size="md"
                    className="relative !pt-0"
                    onClick={() => inputRef.current?.focus()}
                  />
                </div>
                <div className="min-w-0 flex-1 py-1">
                  <div className="flex flex-wrap items-center gap-2 mb-1.5">
                    <span className="text-xs font-black uppercase tracking-[0.2em] text-orange-400">
                      E.V.E.
                    </span>
                    <span className="text-[9px] font-bold uppercase tracking-[0.16em] text-sky-300 rounded-full bg-sky-400/10 px-2 py-1">
                      Executive Vision Entity
                    </span>
                  </div>
                  <div className="flex flex-wrap items-center gap-2 mb-2">
                    <span className="px-2 py-0.5 rounded-md bg-white/6 border border-white/10 text-[10px] font-bold text-gray-300">
                      {activeUser.firstName} &bull; {activeUser.roleBadge}
                    </span>
                    <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-md bg-amber-400/8 border border-amber-300/15 text-[9px] font-black uppercase tracking-wider text-amber-200/80">
                      <span className="h-1.5 w-1.5 rounded-full bg-emerald-300" /> Store data connected
                    </span>
                  </div>
                  <p className="text-xs text-gray-300 leading-relaxed">
                    {activeUser.greetingText}
                  </p>
                  <p className="mt-2 text-[10px] text-gray-500 leading-relaxed">
                    Recommendations use the current client-side demo data. Live AI reasoning and dealership actions are not connected yet.
                  </p>
                </div>
              </div>

              <div className="flex-1 min-h-0 overflow-y-auto custom-scrollbar py-4 pr-1 flex flex-col gap-3">
                {messages.length === 0 ? (
                  <div className="my-auto space-y-2.5">
                    <span className="text-[10px] font-black uppercase tracking-widest text-gray-500 block px-1">
                      Recommended starting points for {activeUser.firstName}
                    </span>
                    {activeUser.faqs.map((faq, idx) => (
                      <button
                        key={idx}
                        type="button"
                        onClick={() => {
                          playModalOpen();
                          void sendPrompt(faq, cards[idx]);
                        }}
                        className="w-full text-left p-3.5 rounded-2xl bg-white/4 hover:bg-white/8 border border-white/8 hover:border-orange-500/30 transition-all flex items-center justify-between gap-3 text-xs font-semibold text-gray-200 cursor-pointer group"
                      >
                        <span>{faq}</span>
                        <ArrowRight
                          size={14}
                          className="text-orange-400 shrink-0 group-hover:translate-x-0.5 transition-transform"
                        />
                      </button>
                    ))}
                  </div>
                ) : (
                  <>
                    <div className="flex items-center gap-2 px-1">
                      <span className="text-[9px] font-black uppercase tracking-[0.16em] text-amber-200/80">Preview conversation</span>
                      <span className="h-px flex-1 bg-white/8" />
                      {isLoading && <span className="text-[10px] text-sky-300 animate-pulse">E.V.E. is thinking…</span>}
                    </div>
                    <ChatThreadList
                      messages={messages}
                      isLoading={isLoading}
                      onExecuteAction={(id) => void markPreviewReviewed(id)}
                    />
                    <div ref={chatEndRef} />
                  </>
                )}
              </div>
            </div>

            <div className="lg:col-span-4 flex flex-col justify-between min-h-0 h-full">
              <AnimatePresence mode="wait">
                {expandedCard ? (
                  <ExpandedHubInsightCard
                    key={`expanded-${expandedCard.id}`}
                    card={expandedCard}
                    onClose={() => setExpandedCardId(null)}
                    onExecute={() => {
                      playModalOpen();
                      void sendPrompt(expandedCard.promptTemplate, expandedCard);
                    }}
                  />
                ) : (
                  <motion.div
                    key="vertical-hub-card-stack"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="flex flex-col justify-between gap-3 h-full"
                  >
                    {cards.map((card) => (
                      <HubStyleInsightCard
                        key={card.id}
                        card={card}
                        isSelected={false}
                        onSelect={() => handleOpenCard(card)}
                      />
                    ))}
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </div>
        </div>

        {/* Bottom Docked Command Composer */}
        <div className="relative z-20 shrink-0 w-full">
          <div className="flex items-center justify-between gap-3 px-1 pb-2">
            <span className="text-[9px] font-semibold tracking-wide text-gray-500">Answers use role-scoped store counts. OpenAI analysis requires a server key; no customer messages or record changes are sent.</span>
            <span className="shrink-0 text-[9px] font-black uppercase tracking-widest text-emerald-200/70">Server tools</span>
          </div>
          {attachedPreview && (
            <div className="w-full mb-2 px-3 py-1.5 rounded-xl bg-white/8 border border-white/15 flex items-center justify-between text-xs text-gray-300">
              <span className="truncate">Attached: {attachedPreview}</span>
              <button
                type="button"
                onClick={() => setAttachedPreview(null)}
                className="text-gray-400 hover:text-white ml-2 cursor-pointer"
              >
                <X size={14} />
              </button>
            </div>
          )}

          <form onSubmit={handleChatSubmit} className="w-full">
            <div className="relative flex items-center gap-1.5 bg-[#0a0f16] border border-white/12 focus-within:border-orange-500/50 rounded-2xl p-1.5 pl-3 shadow-xl w-full">
              <input
                ref={fileInputRef}
                type="file"
                onChange={handleFileChange}
                className="hidden"
              />
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                aria-label="Attach file"
                className="h-8 w-8 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 flex items-center justify-center text-gray-300 hover:text-white shrink-0 cursor-pointer"
              >
                <Plus size={15} />
              </button>

              <input
                ref={inputRef}
                name="eveo_insights_prompt"
                type="text"
                value={chatInput}
                onChange={(e) => setChatInput(e.target.value)}
                placeholder={activeUser.inputPlaceholder}
                className="w-full bg-transparent text-base sm:text-sm text-white placeholder:text-gray-500 focus:outline-none h-9 px-1.5"
              />

              <button
                type="button"
                onClick={handleVoiceToggle}
                aria-label="Voice input"
                className={`h-8 w-8 rounded-xl border flex items-center justify-center shrink-0 cursor-pointer transition-colors ${
                  isListening
                    ? 'bg-red-500/20 border-red-500 text-red-400 animate-pulse'
                    : 'bg-white/5 hover:bg-white/10 border-white/10 text-gray-300'
                }`}
              >
                <Mic size={14} />
              </button>

              <button
                type="submit"
                aria-label="Send prompt"
                disabled={!chatInput.trim() && !attachedPreview}
                className="h-8 w-8 rounded-xl bg-orange-500 hover:bg-orange-600 text-white disabled:opacity-30 flex items-center justify-center shrink-0 cursor-pointer transition-all"
              >
                <Send size={14} />
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}

function HubStyleInsightCard({
  card,
  isSelected,
  onSelect,
}: {
  card: InsightCardSchema;
  isSelected: boolean;
  onSelect: () => void;
}) {
  const meta = CATEGORY_META[card.category];

  return (
    <button
      type="button"
      onClick={onSelect}
      className={`w-full flex-1 text-left px-5 py-3.5 rounded-3xl transition-all duration-200 cursor-pointer active:scale-[0.98] relative overflow-hidden border flex flex-col justify-between min-h-24 ${
        isSelected
          ? 'bg-linear-to-br from-orange-500/18 via-[#191210] to-[#0a0f16] border-orange-500/40'
          : 'bg-linear-to-b from-[#141a23]/95 via-[#0a0f16] to-[#070a0f] border-white/10 hover:border-white/20 shadow-[inset_0_1px_1px_rgba(255,255,255,0.12),0_12px_28px_rgba(0,0,0,0.6)]'
      }`}
    >
      <div className="flex items-center justify-between gap-2 w-full">
        <span
          className={`flex items-center gap-2 text-[10px] font-black uppercase tracking-widest truncate ${meta.eyebrowColor}`}
        >
          <span className="shrink-0">{meta.icon}</span>
          <span className="truncate">{card.title}</span>
        </span>
        <span className={`w-2 h-2 rounded-full shrink-0 ${meta.dotColor}`} />
      </div>

      <div className="flex items-baseline justify-between gap-3 my-0.5">
        <span className="text-2xl font-black text-white tabular-nums tracking-tight">
          {card.metricValue}
        </span>
        <span className="text-[11px] font-bold text-gray-400 truncate">
          {card.metricSublabel}
        </span>
      </div>
    </button>
  );
}

function ExpandedHubInsightCard({
  card,
  onClose,
  onExecute,
}: {
  card: InsightCardSchema;
  onClose: () => void;
  onExecute: () => void;
}) {
  const meta = CATEGORY_META[card.category];

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.97 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.97 }}
      className="w-full h-full p-6 rounded-3xl bg-linear-to-b from-[#141a23]/95 via-[#0a0f16] to-[#070a0f] border border-white/10 shadow-[inset_0_1px_1px_rgba(255,255,255,0.12),0_20px_45px_rgba(0,0,0,0.75)] flex flex-col justify-between gap-4"
    >
      <div className="flex items-center justify-between gap-3">
        <span
          className={`flex items-center gap-2 text-xs font-black uppercase tracking-widest ${meta.eyebrowColor}`}
        >
          {meta.icon}
          <span>{card.title}</span>
        </span>
        <button
          type="button"
          onClick={onClose}
          aria-label="Close card"
          className="w-8 h-8 rounded-full bg-white/6 hover:bg-white/12 flex items-center justify-center text-gray-400 hover:text-white cursor-pointer"
        >
          <X size={15} />
        </button>
      </div>

      <div>
        <div className="text-4xl font-black text-white tabular-nums tracking-tight">
          {card.metricValue}
        </div>
        <div className="text-xs font-bold text-gray-400 mt-1">
          {card.metricSublabel}
        </div>
      </div>

      <p className="text-xs sm:text-sm text-gray-200 leading-relaxed my-auto">
        {card.summary}
      </p>

      <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-white/8">
        <button
          type="button"
          onClick={onClose}
          className="px-4 py-2 rounded-full bg-white/5 hover:bg-white/10 text-xs font-semibold text-gray-300 hover:text-white cursor-pointer"
        >
          Back
        </button>
        <button
          type="button"
          onClick={onExecute}
          className="px-4 py-2 rounded-full bg-linear-to-b from-white/16 to-white/6 border border-white/20 text-xs font-bold text-white flex items-center gap-1.5 cursor-pointer"
        >
          <Sparkles size={13} className="text-orange-400" /> Prepare with E.V.E.
        </button>
      </div>
    </motion.div>
  );
}

function ChatThreadList({
  messages,
  isLoading = false,
  onExecuteAction,
}: {
  messages: ReturnType<typeof useInsightsSuite>['messages'];
  isLoading?: boolean;
  onExecuteAction: (id: string) => void;
}) {
  return (
    <>
      {messages.map((msg) =>
        msg.role === 'user' ? (
          <div key={msg.id} className="self-end max-w-[82%] sm:max-w-[75%]">
            <div className="bg-orange-500/20 border border-orange-500/35 text-white px-4 py-2.5 rounded-2xl rounded-tr-xs">
              <p className="text-xs sm:text-sm leading-relaxed">{msg.content}</p>
              <span className="block text-[9px] text-orange-300/70 text-right mt-1 font-semibold">
                {msg.timestamp}
              </span>
            </div>
          </div>
        ) : (
          <div key={msg.id} className="self-start max-w-[88%] sm:max-w-[82%]">
            <div className="bg-linear-to-b from-[#141a23] to-[#0a0f16] border border-white/10 p-4 rounded-2xl rounded-tl-xs space-y-2.5">
              <div className="flex items-center justify-between gap-2">
                <div className="flex items-center gap-2">
                  <span className="text-[10px] font-black uppercase tracking-widest text-orange-400">E.V.E.</span>
                  {msg.mode === 'preview' && <span className="text-[8px] font-black uppercase tracking-wider text-amber-200/75 bg-amber-300/8 px-1.5 py-0.5 rounded">Preview</span>}
                </div>
                <span className="text-[9px] text-gray-500 font-semibold">{msg.timestamp}</span>
              </div>

              <p className="text-xs sm:text-sm text-gray-200 leading-relaxed">
                {msg.content}
              </p>

              {msg.draftSnippet && (
                <div className="rounded-xl bg-black/25 p-3 border border-white/8 space-y-1.5">
                  <span className="block text-[9px] font-black uppercase tracking-widest text-sky-300">Draft preview · not sent</span>
                  <p className="text-xs text-orange-100/90 italic pl-3 border-l-2 border-orange-500/40">&ldquo;{msg.draftSnippet}&rdquo;</p>
                </div>
              )}

              {msg.actionLabel && (
                <div className="pt-1">
                  {msg.actionReviewed || msg.actionExecuted ? (
                    <span className="inline-flex items-center gap-1.5 text-emerald-300 text-xs font-bold">
                      <CheckCircle2 size={13} /> Draft reviewed · nothing sent
                    </span>
                  ) : (
                    <button
                      type="button"
                      onClick={() => onExecuteAction(msg.id)}
                      className="px-3.5 py-1.5 rounded-full bg-white/8 hover:bg-white/[0.14] border border-white/15 text-white text-xs font-bold flex items-center gap-1.5 cursor-pointer"
                    >
                      <Sparkles size={12} className="text-orange-400" /> {msg.actionLabel}
                    </button>
                  )}
                </div>
              )}
            </div>
          </div>
        )
      )}
      {isLoading && (
        <div className="self-start max-w-[88%] sm:max-w-[82%] rounded-2xl rounded-tl-xs border border-sky-300/15 bg-sky-400/5 px-4 py-3 flex items-center gap-2.5">
          <span className="h-1.5 w-1.5 rounded-full bg-sky-300 animate-pulse" />
          <span className="h-1.5 w-1.5 rounded-full bg-sky-300 animate-pulse [animation-delay:150ms]" />
          <span className="h-1.5 w-1.5 rounded-full bg-sky-300 animate-pulse [animation-delay:300ms]" />
          <span className="text-[10px] font-semibold text-sky-200/80">E.V.E. is preparing a preview…</span>
        </div>
      )}
    </>
  );
}
