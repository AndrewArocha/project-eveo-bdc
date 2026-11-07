// src/pages/Pricing.tsx
import { motion, type Variants } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { CheckCircle2, Zap, Shield, HelpCircle } from 'lucide-react';

export default function Pricing() {
  const navigate = useNavigate();

  const fadeUp: Variants = {
    hidden: { opacity: 0, y: 24 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.7, ease: 'easeOut' } }
  };

  return (
    <div className="w-full flex-1 flex flex-col bg-[#05080c] text-white relative overflow-x-hidden pt-24 md:pt-32 pb-20 md:pb-24">

      {/* Ambient Background Glows */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none z-0 flex justify-center">
        <div className="absolute top-0 w-150 sm:w-200 h-80 sm:h-100 bg-orange-500/10 blur-[130px] sm:blur-[150px] rounded-full mix-blend-screen" />
        <div className="absolute top-[20%] right-[-10%] w-100 sm:w-125 h-100 sm:h-125 bg-blue-500/10 blur-[130px] sm:blur-[150px] rounded-full mix-blend-screen" />
      </div>

      <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 w-full">

        {/* Header Section */}
        <motion.div
          initial="hidden"
          animate="visible"
          variants={{ visible: { transition: { staggerChildren: 0.1 } } }}
          className="text-center max-w-3xl mx-auto mb-12 sm:mb-20"
        >
          <motion.span variants={fadeUp} className="text-orange-500 font-mono text-[11px] sm:text-xs font-bold tracking-widest uppercase mb-3 sm:mb-4 block">
            Simple, Transparent Pricing
          </motion.span>
          <motion.h1 variants={fadeUp} className="text-3xl sm:text-5xl md:text-6xl font-black text-white mb-4 sm:mb-6 tracking-tight leading-[1.15]">
            Scale your floor. <br /> Without the overhead.
          </motion.h1>
          <motion.p variants={fadeUp} className="text-sm sm:text-lg text-gray-400 font-medium px-2">
            Choose the plan that fits your dealership&apos;s volume. All plans include a 14-day free trial. Cancel or upgrade at any time.
          </motion.p>
        </motion.div>

        {/* Pricing Cards - Hub Card Design */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 sm:gap-8 max-w-5xl mx-auto">

          {/* Software Only Tier */}
          <motion.div
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.15 }}
            className="p-6 sm:p-8 rounded-2xl bg-[#0a0f16] border border-white/10 flex flex-col h-full shadow-lg relative overflow-hidden"
          >
            <div className="flex items-center justify-between mb-5">
              <span className="flex items-center gap-2 text-[11px] font-bold uppercase tracking-widest text-blue-400">
                <Shield size={14} /> Internal BDC
              </span>
              <span className="w-2 h-2 rounded-full bg-blue-500 shadow-[0_0_8px_rgba(59,130,246,0.9)]" />
            </div>

            <h3 className="text-xl sm:text-2xl font-black text-white mb-2">Software Only</h3>
            <p className="text-gray-400 text-xs sm:text-sm min-h-10 leading-relaxed">
              Equip your in-house BDC team with enterprise-grade tracking and SLAs.
            </p>

            <div className="my-6 py-5 border-y border-white/10 flex items-end gap-1">
              <span className="text-4xl sm:text-5xl font-black text-white">$499</span>
              <span className="text-gray-400 text-sm sm:text-base font-medium mb-1">/mo</span>
            </div>

            <ul className="space-y-3.5 mb-8 flex-1">
              <li className="flex items-start gap-3 text-xs sm:text-sm text-gray-300">
                <CheckCircle2 className="text-blue-500 shrink-0 mt-0.5" size={16} /> Unlimited internal agent seats
              </li>
              <li className="flex items-start gap-3 text-xs sm:text-sm text-gray-300">
                <CheckCircle2 className="text-blue-500 shrink-0 mt-0.5" size={16} /> Live Showroom Timer Dashboard
              </li>
              <li className="flex items-start gap-3 text-xs sm:text-sm text-gray-300">
                <CheckCircle2 className="text-blue-500 shrink-0 mt-0.5" size={16} /> Full CRM API Integration (Elead/Vin)
              </li>
              <li className="flex items-start gap-3 text-xs sm:text-sm text-gray-300">
                <CheckCircle2 className="text-blue-500 shrink-0 mt-0.5" size={16} /> Advanced Predictive Matchmaking
              </li>
            </ul>

            <button
              type="button"
              onClick={() => navigate('/register')}
              className="w-full min-h-11 py-3 rounded-xl bg-white/10 hover:bg-white/15 active:scale-[0.98] text-white text-xs sm:text-sm font-bold transition-all border border-white/10 outline-none cursor-pointer"
            >
              Start 14-Day Free Trial
            </button>
          </motion.div>

          {/* Full Service + AI Tier (Warm Orange Hub Variant) */}
          <motion.div
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.25 }}
            className="p-6 sm:p-8 rounded-2xl bg-linear-to-br from-orange-500/15 via-[#140f0d] to-[#0a0f16] border border-orange-500/35 flex flex-col h-full shadow-lg relative overflow-hidden"
          >
            <div className="flex items-center justify-between mb-5">
              <span className="flex items-center gap-2 text-[11px] font-bold uppercase tracking-widest text-orange-500">
                <Zap size={14} /> Most Popular
              </span>
              <span className="w-2 h-2 rounded-full bg-orange-500 shadow-[0_0_8px_rgba(249,115,22,0.9)]" />
            </div>

            <h3 className="text-xl sm:text-2xl font-black text-white mb-2">Full Service + AI</h3>
            <p className="text-gray-400 text-xs sm:text-sm min-h-10 leading-relaxed">
              Outsource your pipeline. We provide the software, the AI, and the human elite agents.
            </p>

            <div className="my-6 py-5 border-y border-white/10 flex items-end gap-1">
              <span className="text-4xl sm:text-5xl font-black text-white">$1,899</span>
              <span className="text-gray-400 text-sm sm:text-base font-medium mb-1">/mo</span>
            </div>

            <ul className="space-y-3.5 mb-8 flex-1">
              <li className="flex items-start gap-3 text-xs sm:text-sm text-gray-300">
                <CheckCircle2 className="text-orange-500 shrink-0 mt-0.5" size={16} /> <strong>Everything in Software</strong>
              </li>
              <li className="flex items-start gap-3 text-xs sm:text-sm text-gray-300">
                <CheckCircle2 className="text-orange-500 shrink-0 mt-0.5" size={16} /> Dedicated Elite Remote BDC Agents
              </li>
              <li className="flex items-start gap-3 text-xs sm:text-sm text-gray-300">
                <CheckCircle2 className="text-orange-500 shrink-0 mt-0.5" size={16} /> 24/7 Rapid Lead Follow-up Execution
              </li>
              <li className="flex items-start gap-3 text-xs sm:text-sm text-gray-300">
                <CheckCircle2 className="text-orange-500 shrink-0 mt-0.5" size={16} /> Pre-qualified, verified appointments
              </li>
            </ul>

            <button
              type="button"
              onClick={() => navigate('/register')}
              className="w-full min-h-11 py-3 rounded-xl bg-orange-500 hover:bg-orange-600 active:scale-[0.98] text-white text-xs sm:text-sm font-bold transition-all shadow-md shadow-orange-500/20 outline-none cursor-pointer"
            >
              Start 14-Day Free Trial
            </button>
          </motion.div>

        </div>

        {/* FAQ Section - Hub Card Design */}
        <motion.div
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          transition={{ duration: 0.8 }}
          className="mt-20 sm:mt-32 max-w-5xl mx-auto border-t border-white/10 pt-12 sm:pt-16"
        >
          <div className="text-center mb-8 sm:mb-12">
            <h2 className="text-2xl sm:text-3xl font-black text-white">Frequently Asked Questions</h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6">
            <div className="bg-[#0a0f16] p-5 sm:p-6 rounded-2xl border border-white/10 shadow-xs">
              <div className="flex items-center justify-between mb-3">
                <span className="flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-widest text-orange-500">
                  <HelpCircle size={13} /> Billing
                </span>
                <span className="w-1.5 h-1.5 rounded-full bg-orange-500" />
              </div>
              <h4 className="text-base sm:text-lg font-bold text-white mb-2">How does billing work?</h4>
              <p className="text-xs sm:text-sm text-gray-400 leading-relaxed">
                Your 14-day trial is completely free. We securely process payments via Stripe or PayPal. If you cancel before the trial ends, you will not be charged.
              </p>
            </div>

            <div className="bg-[#0a0f16] p-5 sm:p-6 rounded-2xl border border-white/10 shadow-xs">
              <div className="flex items-center justify-between mb-3">
                <span className="flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-widest text-orange-500">
                  <HelpCircle size={13} /> Subscriptions
                </span>
                <span className="w-1.5 h-1.5 rounded-full bg-orange-500" />
              </div>
              <h4 className="text-base sm:text-lg font-bold text-white mb-2">Can I change plans later?</h4>
              <p className="text-xs sm:text-sm text-gray-400 leading-relaxed">
                Yes. You can upgrade from Software Only to Full Service directly from your Store Portal at any time. Prorated charges will apply automatically.
              </p>
            </div>
          </div>
        </motion.div>

      </div>
    </div>
  );
}