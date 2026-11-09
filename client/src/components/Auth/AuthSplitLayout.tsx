import { useEffect, useState, type ReactNode } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { Activity, ArrowUpRight, BarChart3, CarFront, ShieldCheck, Users, Zap } from 'lucide-react';
import { Link } from 'react-router-dom';
import eveoSymbol from '../../images/logo/eveo-symbol.svg';

const highlights = [
  { icon: Zap, eyebrow: 'LEAD RESPONSE', title: 'Every inquiry gets a clear next step.', body: 'Keep follow-up visible and organized across the team.' },
  { icon: Users, eyebrow: 'TEAM WORKFLOW', title: 'Bring the floor and the BDC together.', body: 'Share handoffs and customer context in one workspace.' },
  { icon: CarFront, eyebrow: 'INVENTORY SIGNALS', title: 'Connect customer interest to available units.', body: 'Give your team a faster way to find the right vehicle.' },
  { icon: Activity, eyebrow: 'SHOWROOM ACTIVITY', title: 'Make in-store visits easier to follow.', body: 'Capture visit progress and keep teammates in the loop.' },
  { icon: BarChart3, eyebrow: 'REPORTING', title: 'See the work behind the outcomes.', body: 'Review pipeline, response, and team activity together.' },
  { icon: ShieldCheck, eyebrow: 'STORE CONTROL', title: 'Keep dealership records under your control.', body: 'Role-based access keeps each workspace focused.' },
];

export function AuthSplitLayout({ children }: { children: ReactNode }) {
  const [active, setActive] = useState(0);
  useEffect(() => {
    const timer = window.setInterval(() => setActive((current) => (current + 1) % highlights.length), 5000);
    return () => window.clearInterval(timer);
  }, []);
  const item = highlights[active];
  const Icon = item.icon;

  return <main className="flex min-h-[calc(100dvh-5rem)] w-full pt-20">
    <section className="flex w-full items-center justify-center overflow-y-auto px-4 py-8 sm:px-8 lg:w-1/2 lg:px-12" aria-label="Account access">
      <div className="my-auto w-full max-w-lg">{children}</div>
    </section>
    <aside className="relative hidden min-h-[calc(100dvh-5rem)] flex-1 items-center justify-center overflow-hidden bg-[#11184a] px-12 text-white lg:flex" aria-label="EVEO product highlights">
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_25%_20%,rgba(112,94,255,0.5),transparent_42%),radial-gradient(ellipse_at_80%_85%,rgba(15,112,255,0.38),transparent_45%),linear-gradient(145deg,#11163c,#101b55_55%,#111343)]" />
      <div className="absolute -left-28 top-1/4 h-96 w-96 rounded-full bg-violet-500/20 blur-3xl" />
      <div className="absolute -right-24 bottom-0 h-96 w-96 rounded-full bg-blue-400/20 blur-3xl" />
      <div className="relative z-10 w-full max-w-xl text-center">
        <img src={eveoSymbol} alt="" className="mx-auto mb-10 h-14 w-14 object-contain" />
        <p className="text-xs font-bold uppercase tracking-[0.24em] text-blue-200">Workspace</p>
        <h2 className="mt-4 text-3xl font-bold tracking-tight">Designed for a more connected showroom.</h2>
        <div className="relative mt-12 min-h-56 rounded-3xl border border-white/15 bg-white/[0.08] p-8 text-left shadow-2xl backdrop-blur-xl">
          <AnimatePresence mode="wait">
            <motion.div key={active} initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} transition={{ duration: 0.35 }}>
              <div className="flex items-center gap-3 text-blue-200"><span className="grid h-10 w-10 place-items-center rounded-xl bg-white/10"><Icon size={19} /></span><span className="text-[10px] font-bold tracking-[0.18em]">{item.eyebrow}</span></div>
              <h3 className="mt-6 text-2xl font-semibold leading-snug">{item.title}</h3>
              <p className="mt-3 text-sm leading-relaxed text-blue-100/75">{item.body}</p>
            </motion.div>
          </AnimatePresence>
          <Link to="/?showcase=video" className="mt-5 inline-flex items-center gap-1 text-[10px] font-semibold uppercase tracking-wider text-blue-200 hover:text-white hover:underline">
            Video Preview <ArrowUpRight size={12} aria-hidden="true" />
          </Link>
        </div>
        <div className="mt-6 flex justify-center gap-2" aria-label={`Highlight ${active + 1} of ${highlights.length}`}>
          {highlights.map((highlight, index) => <button key={highlight.eyebrow} type="button" aria-label={`Show ${highlight.eyebrow.toLowerCase()} highlight`} aria-current={index === active ? 'true' : undefined} onClick={() => setActive(index)} className={`h-2 rounded-full transition-all ${index === active ? 'w-7 bg-white' : 'w-2 bg-white/35 hover:bg-white/65'}`} />)}
        </div>
      </div>
    </aside>
  </main>;
}

export function GoogleSignInButton() {
  return <button type="button" disabled aria-disabled="true" title="Google sign-in will be enabled after OAuth credentials are configured" className="flex min-h-11 w-full cursor-not-allowed items-center justify-center gap-2 rounded-xl border border-gray-200 bg-gray-100 px-4 text-sm font-semibold text-gray-400 opacity-70 dark:border-white/10 dark:bg-white/5 dark:text-gray-500">
    <span aria-hidden="true" className="grid h-5 w-5 place-items-center rounded-full bg-white font-bold text-gray-500">G</span>Continue with Google · Coming soon
  </button>;
}
