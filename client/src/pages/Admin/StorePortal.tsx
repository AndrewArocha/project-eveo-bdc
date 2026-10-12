import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, CheckCircle2, Shield, Users, X } from 'lucide-react';

export default function StorePage() {
  const navigate = useNavigate();
  const [isAuditModalOpen, setIsAuditModalOpen] = useState(false);

  return (
    <div className="min-h-screen w-full bg-[#05080c] text-white pt-24 pb-12 px-4 sm:px-6 relative overflow-x-hidden">
      
      {/* Background Glows */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none z-0 flex justify-center">
        <div className="absolute top-[10%] left-[-10%] w-125 h-125 bg-blue-500/5 blur-[120px] rounded-full mix-blend-screen" />
        <div className="absolute top-[30%] right-[-10%] w-150 h-150 bg-orange-500/5 blur-[120px] rounded-full mix-blend-screen" />
      </div>

      <div className="max-w-5xl mx-auto relative z-10">
        
        <button onClick={() => navigate('/admin/portal')} className="flex items-center gap-2 text-sm font-bold text-gray-400 hover:text-white transition-colors mb-8 outline-none">
          <ArrowLeft size={16} /> Back to Admin Portal
        </button>

        <div className="mb-12">
          <h1 className="text-3xl md:text-5xl font-black drop-shadow-md tracking-tight text-white mb-4">Select your operating tier.</h1>
          <p className="text-gray-400 font-medium text-lg max-w-2xl">Choose whether to run the EVEO OS with your own internal team, or outsource your entire pipeline to our elite remote agents.</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          
          {/* Software Only */}
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }} className="p-8 rounded-3xl bg-[#0a0f16] border border-white/10 flex flex-col h-full shadow-2xl relative">
            <div className="flex-1">
              <Shield className="text-blue-500 mb-6" size={32} />
              <h3 className="text-2xl font-black text-white mb-2">Software Only</h3>
              <p className="text-gray-400 text-sm h-10">Equip your in-house BDC team with enterprise-grade tracking, CRM integration, and SLAs.</p>
              
              <div className="my-8 flex items-end gap-1">
                <span className="text-5xl font-black text-white">$499</span>
                <span className="text-gray-400 text-base font-medium mb-1">/mo</span>
              </div>
              
              <ul className="space-y-4 mb-10">
                <li className="flex items-start gap-3 text-sm text-gray-300"><CheckCircle2 className="text-blue-500 shrink-0" size={20} /> Unlimited internal agent seats</li>
                <li className="flex items-start gap-3 text-sm text-gray-300"><CheckCircle2 className="text-blue-500 shrink-0" size={20} /> Live Showroom Timer Dashboard</li>
                <li className="flex items-start gap-3 text-sm text-gray-300"><CheckCircle2 className="text-blue-500 shrink-0" size={20} /> Automated Lead Mining</li>
              </ul>
            </div>
            
            <button onClick={() => navigate('/admin/checkout')} className="w-full py-4 rounded-xl bg-white/10 hover:bg-white/20 text-white font-bold transition-colors border border-white/10 outline-none">
              Proceed to Payment
            </button>
          </motion.div>

          {/* Full Service */}
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5, delay: 0.1 }} className="p-8 rounded-3xl bg-linear-to-b from-orange-500/10 to-[#0a0f16] border border-orange-500/30 flex flex-col h-full shadow-[0_0_30px_rgba(249,115,22,0.1)] relative">
            <div className="flex-1">
              <Users className="text-orange-500 mb-6" size={32} />
              <h3 className="text-2xl font-black text-white mb-2">Full Service + AI</h3>
              <p className="text-gray-400 text-sm h-10">Outsource your pipeline. We provide the software, the AI, and the human elite agents.</p>
              
              <div className="my-8 flex items-end gap-1">
                <span className="text-5xl font-black text-white">$1,899</span>
                <span className="text-gray-400 text-base font-medium mb-1">/mo</span>
              </div>
              
              <ul className="space-y-4 mb-10">
                <li className="flex items-start gap-3 text-sm text-gray-300"><CheckCircle2 className="text-orange-500 shrink-0" size={20} /> <strong>Everything in Software</strong></li>
                <li className="flex items-start gap-3 text-sm text-gray-300"><CheckCircle2 className="text-orange-500 shrink-0" size={20} /> Dedicated Elite Remote BDC Agents</li>
                <li className="flex items-start gap-3 text-sm text-gray-300"><CheckCircle2 className="text-orange-500 shrink-0" size={20} /> Guaranteed 3-minute response SLAs</li>
              </ul>
            </div>
            
            <div className="flex flex-col gap-3 mt-auto">
              <p className="text-xs text-orange-400/80 font-medium text-center px-4">*Because we assign real, elite human agents to your floor, this tier is subject to strict capacity availability.</p>
              <button onClick={() => setIsAuditModalOpen(true)} className="w-full py-4 rounded-xl bg-orange-500 hover:bg-orange-600 text-white font-black transition-all shadow-[0_0_20px_rgba(249,115,22,0.4)] outline-none">
                Request Capacity Review
              </button>
            </div>
          </motion.div>
        </div>
      </div>

      {/* --- AUDIT MODAL --- */}
      <AnimatePresence>
        {isAuditModalOpen && (
          <div className="fixed inset-0 z-120 flex items-center justify-center p-4">
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setIsAuditModalOpen(false)} className="absolute inset-0 bg-black/80 backdrop-blur-sm cursor-pointer" />
            
            <motion.div initial={{ opacity: 0, scale: 0.95, y: 20 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.95, y: 20 }} className="relative w-full max-w-lg bg-[#0a0f16] border border-white/10 rounded-3xl shadow-2xl p-6 sm:p-8 z-10 overflow-hidden">
              <div className="absolute top-0 left-0 w-full h-1 bg-linear-to-r from-orange-500 to-orange-400" />
              
              <button onClick={() => setIsAuditModalOpen(false)} className="absolute top-4 right-4 text-gray-400 hover:text-white outline-none">
                <X size={24} />
              </button>

              <h2 className="text-2xl font-black text-white mb-2">Capacity Audit Request</h2>
              <p className="text-sm text-gray-400 mb-6">To ensure we can provide the personnel required to handle your volume, please provide your current floor metrics.</p>

              <form className="space-y-5" onSubmit={e => { e.preventDefault(); setIsAuditModalOpen(false); }}>
                <div>
                  <label className="block text-xs font-medium text-gray-400 ml-1 mb-1.5">Average Monthly Lead Volume</label>
                  <select className="w-full px-4 py-3 rounded-xl bg-black/50 border border-white/10 focus:border-orange-500 outline-none text-sm text-white appearance-none cursor-pointer">
                    <option className="bg-gray-900">Less than 500</option>
                    <option className="bg-gray-900">500 - 1,500</option>
                    <option className="bg-gray-900">1,500 - 3,000</option>
                    <option className="bg-gray-900">3,000+</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-400 ml-1 mb-1.5">Current Sales Reps on Floor</label>
                  <input type="number" placeholder="e.g. 12" className="w-full px-4 py-3 rounded-xl bg-black/50 border border-white/10 focus:border-orange-500 outline-none text-sm text-white" />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-400 ml-1 mb-1.5">Primary CRM</label>
                  <select className="w-full px-4 py-3 rounded-xl bg-black/50 border border-white/10 focus:border-orange-500 outline-none text-sm text-white appearance-none cursor-pointer">
                    <option className="bg-gray-900">Elead</option>
                    <option className="bg-gray-900">VinSolutions</option>
                    <option className="bg-gray-900">DealerSocket</option>
                    <option className="bg-gray-900">Other</option>
                  </select>
                </div>

                <button type="submit" className="w-full py-4 mt-4 rounded-xl bg-orange-500 hover:bg-orange-600 text-white font-bold transition-all shadow-lg outline-none">
                  Submit Request
                </button>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}