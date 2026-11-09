import { useEffect, useRef, useState, type FormEvent } from 'react';
import { motion } from 'framer-motion';
import { ArrowUp, Check, RotateCcw, Sparkles } from 'lucide-react';
import Mascot from '../../components/insights/EveoMascot';
import { useStoreAppearance } from '../../contexts/StoreAppereanceContext';
import { useAuth } from '../../contexts/AuthContext';
import { useInsightsSuite, type InsightCardSchema } from '../../hooks/useInsightsSuite';

export default function Insights() {
  const { activeStoreId, activeStore } = useStoreAppearance();
  const { role, user } = useAuth();
  const { activeUser, cards, hubDigest, messages, isLoading, loadError, sendPrompt, markPreviewReviewed, clearThread } = useInsightsSuite(activeStoreId, role);
  const [chatInput, setChatInput] = useState('');
  const [flashKey, setFlashKey] = useState('');
  const [showDemoActions, setShowDemoActions] = useState(false);
  const isDemoWorkspace = !user || user.demoMode;
  const flashSequence = useRef(0);
  const endOfThreadRef = useRef<HTMLDivElement>(null);

  useEffect(() => { endOfThreadRef.current?.scrollIntoView({ behavior: 'smooth' }); }, [messages.length]);

  const askAbout = (card: InsightCardSchema) => {
    flashSequence.current += 1;
    setFlashKey(`${card.id}_${flashSequence.current}`);
    void sendPrompt(card.promptTemplate, card);
  };

  const submitChat = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!chatInput.trim()) return;
    void sendPrompt(chatInput);
    setChatInput('');
  };

  const priorityCard = cards.find((card) => card.hasWarningPoint) || cards[0];
  const demoActionCards = <div className="mx-auto grid w-full max-w-4xl grid-cols-1 gap-3 sm:grid-cols-3">
    {cards.map((card) => <button type="button" key={card.id} onClick={() => askAbout(card)} disabled={isLoading} className="group min-h-32 rounded-2xl border border-gray-200 bg-white/80 p-4 text-left shadow-sm transition hover:-translate-y-0.5 hover:border-orange-500/40 hover:shadow-md disabled:cursor-wait disabled:opacity-70 dark:border-white/10 dark:bg-white/[0.035] dark:hover:bg-white/[0.06]">
      <div className="flex items-center justify-between gap-2"><span className="text-xs font-semibold text-gray-900 dark:text-gray-100">{card.title}</span>{card.hasWarningPoint && <span className="h-2 w-2 rounded-full bg-orange-500" aria-label="Needs attention" />}</div>
      <div className="mt-3 flex items-baseline gap-2"><span className="text-2xl font-semibold tracking-tight text-gray-950 dark:text-white">{card.metricValue}</span><span className="text-[11px] text-gray-500 dark:text-gray-400">{card.metricSublabel}</span></div>
      <p className="mt-2 line-clamp-2 text-[11px] leading-relaxed text-gray-500 dark:text-gray-400">{card.summary}</p>
      <span className="mt-3 inline-flex text-[11px] font-semibold text-orange-600 transition group-hover:text-orange-500 dark:text-orange-400">{card.actionLabel} ↗</span>
    </button>)}
  </div>;
  const demoQuickActions = <div className="mx-auto grid w-full max-w-4xl grid-cols-2 gap-2 sm:grid-cols-4">
    {[
      { label: 'Search inventory', prompt: 'Search inventory' },
      { label: 'View reports', prompt: 'Show reports' },
      { label: 'Agent KPIs', prompt: 'Show agent KPIs' },
      { label: 'Recent activities', prompt: 'Show activities' },
    ].map((action) => <button key={action.label} type="button" onClick={() => void sendPrompt(action.prompt)} className="min-h-11 rounded-xl border border-gray-200 bg-white/90 px-3 py-2 text-xs font-semibold text-gray-800 shadow-sm transition hover:border-orange-500/50 hover:text-orange-700 dark:border-white/10 dark:bg-[#0d121a] dark:text-gray-100 dark:hover:text-orange-300">{action.label}</button>)}
  </div>;

  return (
    <main className="relative flex h-[calc(100dvh-4.5rem)] w-full flex-col overflow-hidden px-4 pb-4 pt-4 md:h-dvh md:pl-32 md:pr-8 md:pt-6">
      <header className="mx-auto flex w-full max-w-5xl shrink-0 items-center justify-between gap-4 pb-3">
        <div className="flex min-w-0 items-center gap-3">
          <div className="grid h-10 w-10 shrink-0 place-items-center rounded-2xl border border-orange-500/25 bg-orange-500/10 text-orange-500"><Sparkles size={18} /></div>
          <div className="min-w-0">
            <p className="truncate text-xs font-semibold text-gray-500 dark:text-gray-400">{activeStore.name || 'Dealership workspace'}</p>
            <h1 className="truncate text-lg font-semibold tracking-tight text-gray-950 dark:text-white">E.V.E. Insights</h1>
          </div>
        </div>
        {messages.length > 0 && (
          <button type="button" onClick={clearThread} className="inline-flex min-h-9 shrink-0 items-center gap-2 rounded-full border border-gray-200 bg-white/80 px-3.5 text-xs font-semibold text-gray-600 transition hover:bg-white dark:border-white/10 dark:bg-white/5 dark:text-gray-300 dark:hover:bg-white/10">
            <RotateCcw size={13} /> Reset chat
          </button>
        )}
      </header>

      <div className="mx-auto flex w-full max-w-5xl flex-1 min-h-0 flex-col overflow-hidden">
        <section className="flex min-h-0 flex-1 flex-col overflow-y-auto pb-4">
          <div className={`relative mx-auto flex w-full max-w-4xl flex-col items-center gap-2 py-3 sm:py-5 ${isDemoWorkspace ? 'justify-center' : ''}`}>
            {isDemoWorkspace ? <>
              <div className="relative z-20 w-full max-w-xl rounded-2xl border border-gray-200 bg-white/95 p-4 text-center shadow-lg dark:border-white/10 dark:bg-[#0d121a]/95 sm:p-5">
                <p className="text-sm font-semibold text-gray-900 dark:text-white">Hi! I’m E.V.E. {priorityCard ? `I recommend starting with ${priorityCard.actionLabel.toLowerCase()}.` : 'Choose a demo function to explore.'}</p>
              <p className="mt-1 text-xs leading-relaxed text-gray-600 dark:text-gray-300">Tap E.V.E. to explore the sample store, or choose a quick search below.</p>
              <button type="button" onClick={() => setShowDemoActions((visible) => !visible)} className="mt-3 min-h-9 rounded-lg bg-orange-500 px-3 text-xs font-semibold text-white">{showDemoActions ? 'Hide demo options' : 'Explore demo'} ↗</button>
              </div>
              <motion.div initial={{ opacity: 0, y: 8, scale: 0.96 }} animate={{ opacity: 1, y: 0, scale: 1 }} className="relative z-10 flex h-60 w-60 items-center justify-center sm:h-76 sm:w-76">
                <div className="absolute inset-6 rounded-full bg-orange-500/15 blur-3xl" />
                <Mascot mood={isLoading ? 'thinking' : 'idle'} allowSleep={false} flashAlertKey={flashKey} size="xl" onClick={() => setShowDemoActions((visible) => !visible)} className="relative !pt-0 cursor-pointer" />
              </motion.div>
              {showDemoActions && <div className="w-full space-y-3">{demoQuickActions}{demoActionCards}</div>}
            </> : <>
            <motion.div
              initial={{ opacity: 0, y: 8, scale: 0.96 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
                className="relative z-10 flex h-60 w-60 items-center justify-center sm:h-76 sm:w-76"
            >
              <div className="absolute inset-6 rounded-full bg-orange-500/15 blur-3xl" />
              <Mascot
                mood={hubDigest.mood === 'alert' ? 'concerned' : isLoading ? 'thinking' : 'idle'}
                allowSleep={false}
                flashAlertKey={flashKey}
                size="xl"
                className="relative !pt-0"
              />
            </motion.div>

            <div className="relative z-20 -mt-1 w-full max-w-2xl rounded-3xl border border-gray-200 bg-white/95 p-5 shadow-[0_18px_55px_rgba(15,23,42,0.09)] dark:border-white/10 dark:bg-[#0d121a]/95 dark:shadow-[0_18px_55px_rgba(0,0,0,0.35)] sm:px-7 sm:py-6">
              <div className="mb-2 flex flex-wrap items-center justify-center gap-2 sm:justify-start">
                <span className="text-[10px] font-bold uppercase tracking-[0.18em] text-orange-500">E.V.E.</span>
                <span className="rounded-full border border-emerald-500/20 bg-emerald-500/10 px-2.5 py-1 text-[9px] font-semibold uppercase tracking-wide text-emerald-700 dark:text-emerald-300">{user ? 'Live store data' : 'Sample workspace'}</span>
                <span className="text-[10px] text-gray-500 dark:text-gray-400">{activeUser.firstName} · {activeUser.roleBadge}</span>
              </div>
              <h2 className="text-center text-xl font-semibold tracking-tight text-gray-950 dark:text-white sm:text-left">{hubDigest.title}</h2>
              <p className="mt-2 text-center text-sm leading-relaxed text-gray-600 dark:text-gray-300 sm:text-left">{hubDigest.body}</p>
              <p className="mt-3 text-center text-[11px] leading-relaxed text-gray-500 dark:text-gray-400 sm:text-left">
                Store tools run on EVEO records. Optional AI wording is separate; no customer messages or record changes are sent by these suggestions.
              </p>
            </div>
            </>}
          </div>

          {loadError && <p role="alert" className="mx-auto mb-3 w-full max-w-2xl rounded-xl border border-amber-500/30 bg-amber-500/10 px-4 py-3 text-xs text-amber-800 dark:text-amber-200">{loadError}</p>}

          {!isDemoWorkspace && demoActionCards}

          {messages.length > 0 && (
            <div className="mx-auto mt-5 flex w-full max-w-4xl flex-col gap-3">
              {messages.map((message) => (
                <article key={message.id} className={`max-w-[92%] rounded-2xl px-4 py-3 text-sm leading-relaxed sm:max-w-[78%] ${message.role === 'user'
                  ? 'self-end border border-orange-500/20 bg-orange-500/10 text-gray-900 dark:text-gray-100'
                  : 'self-start border border-gray-200 bg-white text-gray-800 shadow-sm dark:border-white/10 dark:bg-[#0d121a] dark:text-gray-100'
                }`}>
                  <p className="whitespace-pre-wrap">{message.content}</p>
                  {message.role === 'assistant' && message.actionLabel && (
                    <button type="button" onClick={() => void markPreviewReviewed(message.id)} disabled={message.actionReviewed} className="mt-3 inline-flex items-center gap-1.5 rounded-lg border border-emerald-500/20 bg-emerald-500/10 px-2.5 py-1.5 text-[11px] font-semibold text-emerald-700 disabled:opacity-70 dark:text-emerald-300">
                      <Check size={13} /> {message.actionReviewed ? 'Reviewed' : 'Mark suggestion reviewed'}
                    </button>
                  )}
                </article>
              ))}
              {isLoading && <p className="text-xs text-gray-500" role="status">E.V.E. is checking the store records…</p>}
              <div ref={endOfThreadRef} />
            </div>
          )}
        </section>

        <form onSubmit={submitChat} className="mx-auto flex w-full max-w-4xl shrink-0 items-end gap-2 rounded-2xl border border-gray-200 bg-white p-2 shadow-lg focus-within:border-orange-500/50 dark:border-white/10 dark:bg-[#0d121a]">
          <textarea
            name="eveo_insights_prompt"
            rows={2}
            value={chatInput}
            onChange={(event) => setChatInput(event.target.value)}
            placeholder={activeUser.inputPlaceholder}
            aria-label="Ask E.V.E. about your dealership"
            className="max-h-28 min-h-11 flex-1 resize-y bg-transparent px-3 py-2 text-sm text-gray-900 outline-none placeholder:text-gray-400 dark:text-white dark:placeholder:text-gray-500"
          />
          <button type="submit" disabled={!chatInput.trim() || isLoading} aria-label="Send message" className="grid h-11 w-11 shrink-0 place-items-center rounded-xl bg-orange-500 text-white transition hover:bg-orange-600 disabled:cursor-not-allowed disabled:opacity-45">
            <ArrowUp size={18} />
          </button>
        </form>
        <p className="mx-auto mt-2 w-full max-w-4xl px-1 text-[10px] text-gray-500 dark:text-gray-400">
          {user ? 'Live dealership records · AI analysis is optional.' : 'Preview mode · sign in to use dealership records.'}
        </p>
      </div>
    </main>
  );
}
