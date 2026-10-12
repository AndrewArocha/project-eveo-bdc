import { motion, type Variants } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { CheckCircle2, Zap, Shield, HelpCircle } from 'lucide-react';

export default function Pricing() {
  const navigate = useNavigate();

  // FIX: Explicitly typing this as 'Variants' resolves the strict 'ease' string error
  const fadeUp: Variants = {
    hidden: { opacity: 0, y: 30 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.8, ease: 'easeOut' } }
  };

  return (
    <div className="w-full flex-1 flex flex-col bg-[#05080c] text-white relative overflow-x-hidden pt-32 pb-24">
      
      {/* Ambient Background Glows */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none z-0 flex justify-center">
        <div className="absolute top-0 w-200 h-100 bg-orange-500/10 blur-[150px] rounded-full mix-blend-screen" />
        <div className="absolute top-[20%] right-[-10%] w-125 h-125 bg-blue-500/10 blur-[150px] rounded-full mix-blend-screen" />
      </div>

      <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 w-full">
        
        {/* Header Section */}
        <motion.div 
          initial="hidden" animate="visible" variants={{ visible: { transition: { staggerChildren: 0.1 } } }}
          className="text-center max-w-3xl mx-auto mb-20"
        >
          <motion.span variants={fadeUp} className="text-orange-500 font-mono text-xs font-bold tracking-widest uppercase mb-4 block drop-shadow-md">
            Simple, Transparent Pricing
          </motion.span>
          <motion.h1 variants={fadeUp} className="text-5xl md:text-6xl font-black drop-shadow-[0_0_20px_rgba(0,0,0,1)] text-white mb-6 tracking-tight">
            Scale your floor. <br/> Without the overhead.
          </motion.h1>
          <motion.p variants={fadeUp} className="text-lg text-gray-400 font-medium">
            Choose the plan that fits your dealership's volume. All plans include a 14-day free trial. Cancel or upgrade at any time.
          </motion.p>
        </motion.div>

        {/* Pricing Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-5xl mx-auto">
          
          {/* Software Only Tier */}
          <motion.div 
            initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6, delay: 0.2 }}
            className="p-8 md:p-10 rounded-4xl bg-white/5 border border-white/10 flex flex-col h-full shadow-2xl relative overflow-hidden group backdrop-blur-xl"
          >
            <div className="absolute inset-0 bg-linear-to-b from-blue-500/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
            <div className="relative z-10 flex-1 flex flex-col">
              <Shield className="text-blue-500 mb-6" size={32} />
              <h3 className="text-2xl font-black text-white mb-2">Software Only</h3>
              <p className="text-gray-400 text-sm h-10">Equip your in-house BDC team with enterprise-grade tracking and SLAs.</p>
              
              <div className="my-8 flex items-end gap-1">
                <span className="text-5xl font-black text-white">$499</span>
                <span className="text-gray-400 text-base font-medium mb-1">/mo</span>
              </div>
              
              <ul className="space-y-4 mb-10 flex-1">
                <li className="flex items-start gap-3 text-sm text-gray-300"><CheckCircle2 className="text-blue-500 shrink-0" size={20} /> Unlimited internal agent seats</li>
                <li className="flex items-start gap-3 text-sm text-gray-300"><CheckCircle2 className="text-blue-500 shrink-0" size={20} /> Live Showroom Timer Dashboard</li>
                <li className="flex items-start gap-3 text-sm text-gray-300"><CheckCircle2 className="text-blue-500 shrink-0" size={20} /> Full CRM API Integration (Elead/Vin)</li>
                <li className="flex items-start gap-3 text-sm text-gray-300"><CheckCircle2 className="text-blue-500 shrink-0" size={20} /> Advanced Predictive Matchmaking</li>
              </ul>
              
              <button 
                onClick={() => navigate('/register')}
                className="w-full py-4 rounded-xl bg-white/10 hover:bg-white/20 text-white font-bold transition-colors border border-white/10 outline-none cursor-pointer"
              >
                Start 14-Day Free Trial
              </button>
            </div>
          </motion.div>

          {/* Full Service + AI Tier */}
          <motion.div 
            initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6, delay: 0.3 }}
            className="p-8 md:p-10 rounded-4xl bg-linear-to-b from-orange-500/10 to-[#0a0f16] border border-orange-500/30 flex flex-col h-full shadow-[0_0_50px_rgba(249,115,22,0.15)] relative backdrop-blur-xl"
          >
            <div className="absolute top-0 right-8 transform -translate-y-1/2">
              <span className="bg-orange-500 text-white text-xs font-black uppercase tracking-widest px-4 py-1.5 rounded-full shadow-[0_0_15px_rgba(249,115,22,0.5)]">
                Most Popular
              </span>
            </div>
            
            <div className="relative z-10 flex-1 flex flex-col">
              <Zap className="text-orange-500 mb-6" size={32} />
              <h3 className="text-2xl font-black text-white mb-2">Full Service + AI</h3>
              <p className="text-gray-400 text-sm h-10">Outsource your pipeline. We provide the software, the AI, and the human elite agents.</p>
              
              <div className="my-8 flex items-end gap-1">
                <span className="text-5xl font-black text-white">$1,899</span>
                <span className="text-gray-400 text-base font-medium mb-1">/mo</span>
              </div>
              
              <ul className="space-y-4 mb-10 flex-1">
                <li className="flex items-start gap-3 text-sm text-gray-300"><CheckCircle2 className="text-orange-500 shrink-0" size={20} /> <strong>Everything in Software</strong></li>
                <li className="flex items-start gap-3 text-sm text-gray-300"><CheckCircle2 className="text-orange-500 shrink-0" size={20} /> Dedicated Elite Remote BDC Agents</li>
                <li className="flex items-start gap-3 text-sm text-gray-300"><CheckCircle2 className="text-orange-500 shrink-0" size={20} /> 24/7 Rapid Lead Follow-up Execution</li>
                <li className="flex items-start gap-3 text-sm text-gray-300"><CheckCircle2 className="text-orange-500 shrink-0" size={20} /> Pre-qualified, verified appointments</li>
              </ul>
              
              <button 
                onClick={() => navigate('/register')}
                className="w-full py-4 rounded-xl bg-orange-500 hover:bg-orange-600 text-white font-black transition-all shadow-[0_0_20px_rgba(249,115,22,0.4)] outline-none cursor-pointer"
              >
                Start 14-Day Free Trial
              </button>
            </div>
          </motion.div>

        </div>

        {/* FAQ Section */}
        <motion.div 
          initial={{ opacity: 0 }} whileInView={{ opacity: 1 }} viewport={{ once: true }} transition={{ duration: 0.8 }}
          className="mt-32 max-w-4xl mx-auto border-t border-white/10 pt-16"
        >
          <div className="text-center mb-12">
            <h2 className="text-3xl font-black text-white mb-4">Frequently Asked Questions</h2>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div className="bg-[#0a0f16] p-6 rounded-2xl border border-white/5">
              <h4 className="flex items-center gap-2 text-lg font-bold text-white mb-3"><HelpCircle size={18} className="text-orange-500"/> How does billing work?</h4>
              <p className="text-sm text-gray-400 leading-relaxed">Your 14-day trial is completely free. We securely process payments via Stripe or PayPal. If you cancel before the trial ends, you will not be charged.</p>
            </div>
            <div className="bg-[#0a0f16] p-6 rounded-2xl border border-white/5">
              <h4 className="flex items-center gap-2 text-lg font-bold text-white mb-3"><HelpCircle size={18} className="text-orange-500"/> Can I change plans later?</h4>
              <p className="text-sm text-gray-400 leading-relaxed">Yes. You can upgrade from Software Only to Full Service directly from your Store Portal at any time. Prorated charges will apply automatically.</p>
            </div>
          </div>
        </motion.div>

      </div>
    </div>
  );
}