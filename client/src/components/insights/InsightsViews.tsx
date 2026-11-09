// src/components/insights/InsightsViews.tsx
import { motion } from 'framer-motion';
import { Target, TrendingUp, AlertTriangle, Car, ArrowUpRight, Bot, CheckCircle2, Sparkles } from 'lucide-react';
import type { InsightCardSchema, InsightChatMessage, InsightCategory } from '../../hooks/useInsightsSuite';
import { SleekPillButton } from '../UI/SleekButtons';

// Canonical Enterprise Glass Formula (Matches ScheduleCards.tsx / DashboardCard.tsx)
const glassCardClasses = `
  backdrop-blur-2xl bg-white/5 dark:bg-[#0a0f16]/40
  border border-white/20 dark:border-white/10
  shadow-[0_15px_30px_rgba(0,0,0,0.1),inset_0_1px_8px_rgba(255,255,255,0.2)]
  dark:shadow-[0_15px_30px_rgba(0,0,0,0.3),inset_0_1px_8px_rgba(255,255,255,0.1)]
  rounded-3xl relative overflow-hidden
`;

const CATEGORY_ICON: Record<InsightCategory, React.ReactNode> = {
  churn: <Target size={15} className="text-sky-400" />,
  inventory: <Car size={15} className="text-emerald-400" />,
  staff: <TrendingUp size={15} className="text-blue-400" />,
  sla: <AlertTriangle size={15} className="text-amber-400" />,
};

// --- VIEW 1: COMPACT 2x2 GEMINI/CHATGPT EXECUTIVE CONSOLE CARDS ---
export function InsightsWidgets({
  cards,
  onSelectCard,
}: {
  cards: InsightCardSchema[];
  onSelectCard: (card: InsightCardSchema) => void;
}) {
  return (
    <div className="grid grid-cols-2 gap-3 sm:gap-5">
      {cards.map((card, idx) => (
        <motion.button
          type="button"
          key={card.id}
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: idx * 0.06 }}
          onClick={() => onSelectCard(card)}
          className={`${glassCardClasses} p-4 sm:p-6 text-left flex flex-col justify-between min-h-34 sm:min-h-44 hover:-translate-y-0.5 active:scale-[0.98] transition-all cursor-pointer group`}
        >
          <div className="absolute top-0 left-0 w-full h-[40%] bg-linear-to-b from-white/10 to-transparent pointer-events-none" />

          <div className="relative z-10 flex items-center justify-between gap-2 mb-2">
            <div className="flex items-center gap-2 min-w-0">
              <div className="p-2 rounded-xl bg-white/6 border border-white/10 shrink-0">
                {CATEGORY_ICON[card.category]}
              </div>
              <h3 className="text-xs sm:text-base font-bold text-white truncate">
                {card.title}
              </h3>
            </div>
            <span className="hidden sm:inline-block px-2.5 py-0.5 rounded-full bg-white/6 border border-white/10 text-[10px] font-bold text-gray-300 shrink-0">
              {card.metricBadge}
            </span>
          </div>

          <p className="relative z-10 text-[11px] sm:text-xs text-gray-400 line-clamp-2 leading-relaxed my-auto">
            {card.summary}
          </p>

          <div className="relative z-10 flex items-center justify-between gap-2 pt-2.5 mt-2 border-t border-white/8 text-[10px] sm:text-xs font-bold text-gray-300 group-hover:text-white transition-colors">
            <span className="truncate">{card.actionLabel}</span>
            <ArrowUpRight size={14} className="text-sky-400 shrink-0 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform" />
          </div>
        </motion.button>
      ))}
    </div>
  );
}

// --- VIEW 2: ENTERPRISE GLASS CHAT THREAD (Zero Halloween Orange/Purple Clutter!) ---
export function InsightsChat({
  messages,
  onExecuteAction,
}: {
  messages: InsightChatMessage[];
  onExecuteAction: (messageId: string) => void;
}) {
  return (
    <div className="flex-1 overflow-y-auto custom-scrollbar px-1 sm:px-2 py-2 flex flex-col gap-4">
      {messages.map((msg) =>
        msg.role === 'user' ? (
          /* Enterprise Glass User Bubble (Replaces bright Halloween orange!) */
          <motion.div
            key={msg.id}
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            className="self-end max-w-[85%] sm:max-w-[75%]"
          >
            <div className="backdrop-blur-2xl bg-white/10 border border-white/20 text-white px-4 py-3 rounded-2xl rounded-tr-xs shadow-[0_10px_25px_rgba(0,0,0,0.3),inset_0_1px_6px_rgba(255,255,255,0.15)]">
              <p className="text-xs sm:text-sm leading-relaxed">{msg.content}</p>
            </div>
            <span className="text-[9px] text-gray-500 font-bold uppercase tracking-widest mt-1 block text-right">
              You &bull; {msg.timestamp}
            </span>
          </motion.div>
        ) : (
          /* Enterprise Glass Assistant Response (Replaces neon purple buttons!) */
          <motion.div
            key={msg.id}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            className="self-start w-full max-w-[95%] sm:max-w-[85%]"
          >
            <div className={`${glassCardClasses} p-4 sm:p-5 rounded-tl-xs`}>
              <div className="absolute top-0 left-0 w-full h-[35%] bg-linear-to-b from-white/8 to-transparent pointer-events-none" />

              <div className="relative z-10 flex items-center gap-2 mb-2.5 text-sky-400">
                <div className="w-6 h-6 rounded-lg bg-sky-500/15 border border-sky-500/30 flex items-center justify-center">
                  <Bot size={14} />
                </div>
                <span className="font-bold text-xs uppercase tracking-widest text-gray-200">
                  EVEO Chief of Staff
                </span>
              </div>

              <p className="relative z-10 text-xs sm:text-sm text-gray-200 leading-relaxed mb-3.5">
                {msg.content}
              </p>

              {msg.draftSnippet && (
                <div className="relative z-10 bg-black/45 p-3.5 rounded-2xl border border-white/10 mb-3.5">
                  <span className="text-[9px] font-bold uppercase tracking-widest text-sky-400 block mb-1">
                    Draft Preview · Not Sent
                  </span>
                  <p className="text-xs text-gray-300 font-mono leading-relaxed">
                    &ldquo;{msg.draftSnippet}&rdquo;
                  </p>
                </div>
              )}

              {msg.actionLabel && (
                <div className="relative z-10 flex flex-wrap items-center gap-2">
                  {msg.actionReviewed || msg.actionExecuted ? (
                    <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-emerald-500/15 border border-emerald-500/30 text-emerald-400 text-xs font-bold">
                      <CheckCircle2 size={13} /> Draft reviewed · nothing sent
                    </span>
                  ) : (
                    <SleekPillButton
                      tone="blue"
                      icon={<Sparkles size={12} />}
                      onClick={() => onExecuteAction(msg.id)}
                    >
                      {msg.actionLabel}
                    </SleekPillButton>
                  )}
                </div>
              )}
            </div>
          </motion.div>
        )
      )}
    </div>
  );
}