// src/pages/Admin/StorePortal.tsx
import { useState } from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, CheckCircle2, Shield, Users, X } from 'lucide-react';
import SwipeableModal from '../../components/UI/SwipeableModal';

export default function StorePage() {
  const navigate = useNavigate();
  const [isAuditModalOpen, setIsAuditModalOpen] = useState(false);

  return (
    <div className="min-h-screen w-full bg-[#05080c] text-white pt-22 sm:pt-24 pb-16 px-4 sm:px-6 relative overflow-x-hidden">

      {/* Background Glows */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none z-0 flex justify-center">
        <div className="absolute top-[10%] left-[-10%] w-100 sm:w-125 h-100 sm:h-125 bg-blue-500/5 blur-[120px] rounded-full mix-blend-screen" />
        <div className="absolute top-[30%] right-[-10%] w-120 sm:w-150 h-120 sm:h-150 bg-orange-500/5 blur-[120px] rounded-full mix-blend-screen" />
      </div>

      <div className="max-w-5xl mx-auto relative z-10">

        <button
          type="button"
          onClick={() => navigate('/admin/portal')}
          className="inline-flex items-center gap-2 px-3.5 py-2 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-xs font-bold text-gray-300 hover:text-white active:scale-95 transition-all mb-6 sm:mb-8 outline-none cursor-pointer"
        >
          <ArrowLeft size={15} /> Back to Admin Portal
        </button>

        <div className="mb-8 sm:mb-12">
          <h1 className="text-3xl md:text-5xl font-black tracking-tight text-white mb-3 sm:mb-4">
            Select your operating tier.
          </h1>
          <p className="text-gray-400 font-medium text-sm sm:text-lg max-w-2xl leading-relaxed">
            Choose whether to run the EVEO OS with your own internal team, or outsource your entire pipeline to our elite remote agents.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 sm:gap-8">

          {/* Software Only - Hub Card */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="p-6 sm:p-8 rounded-2xl bg-[#0a0f16] border border-white/10 flex flex-col h-full shadow-lg relative"
          >
            <div className="flex-1">
              <div className="flex items-center justify-between mb-5">
                <span className="flex items-center gap-2 text-[11px] font-bold uppercase tracking-widest text-blue-400">
                  <Shield size={14} /> Internal BDC
                </span>
                <span className="w-2 h-2 rounded-full bg-blue-500 shadow-[0_0_8px_rgba(59,130,246,0.9)]" />
              </div>

              <h3 className="text-xl sm:text-2xl font-black text-white mb-2">Software Only</h3>
              <p className="text-gray-400 text-xs sm:text-sm min-h-10 leading-relaxed">
                Equip your in-house BDC team with enterprise-grade tracking, CRM integration, and SLAs.
              </p>

              <div className="my-6 py-5 border-y border-white/10 flex items-end gap-1">
                <span className="text-4xl sm:text-5xl font-black text-white">$499</span>
                <span className="text-gray-400 text-sm sm:text-base font-medium mb-1">/mo</span>
              </div>

              <ul className="space-y-3.5 mb-8">
                <li className="flex items-start gap-3 text-xs sm:text-sm text-gray-300">
                  <CheckCircle2 className="text-blue-500 shrink-0 mt-0.5" size={16} /> Unlimited internal agent seats
                </li>
                <li className="flex items-start gap-3 text-xs sm:text-sm text-gray-300">
                  <CheckCircle2 className="text-blue-500 shrink-0 mt-0.5" size={16} /> Live Showroom Timer Dashboard
                </li>
                <li className="flex items-start gap-3 text-xs sm:text-sm text-gray-300">
                  <CheckCircle2 className="text-blue-500 shrink-0 mt-0.5" size={16} /> Automated Lead Mining
                </li>
              </ul>
            </div>

            <button
              type="button"
              onClick={() => navigate('/admin/checkout')}
              className="w-full min-h-11 py-3 rounded-xl bg-white/10 hover:bg-white/15 active:scale-[0.98] text-white text-xs sm:text-sm font-bold transition-all border border-white/10 outline-none cursor-pointer"
            >
              Proceed to Payment
            </button>
          </motion.div>

          {/* Full Service - Warm Orange Hub Card */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.1 }}
            className="p-6 sm:p-8 rounded-2xl bg-linear-to-br from-orange-500/15 via-[#140f0d] to-[#0a0f16] border border-orange-500/35 flex flex-col h-full shadow-lg relative"
          >
            <div className="flex-1">
              <div className="flex items-center justify-between mb-5">
                <span className="flex items-center gap-2 text-[11px] font-bold uppercase tracking-widest text-orange-500">
                  <Users size={14} /> Managed Floor
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

              <ul className="space-y-3.5 mb-8">
                <li className="flex items-start gap-3 text-xs sm:text-sm text-gray-300">
                  <CheckCircle2 className="text-orange-500 shrink-0 mt-0.5" size={16} /> <strong>Everything in Software</strong>
                </li>
                <li className="flex items-start gap-3 text-xs sm:text-sm text-gray-300">
                  <CheckCircle2 className="text-orange-500 shrink-0 mt-0.5" size={16} /> Dedicated Elite Remote BDC Agents
                </li>
                <li className="flex items-start gap-3 text-xs sm:text-sm text-gray-300">
                  <CheckCircle2 className="text-orange-500 shrink-0 mt-0.5" size={16} /> Guaranteed 3-minute response SLAs
                </li>
              </ul>
            </div>

            <div className="flex flex-col gap-3 mt-auto">
              <p className="text-xs text-orange-400/80 font-medium text-center px-2">
                *Because we assign real, elite human agents to your floor, this tier is subject to strict capacity availability.
              </p>
              <button
                type="button"
                onClick={() => setIsAuditModalOpen(true)}
                className="w-full min-h-11 py-3 rounded-xl bg-orange-500 hover:bg-orange-600 active:scale-[0.98] text-white text-xs sm:text-sm font-bold transition-all shadow-md shadow-orange-500/20 outline-none cursor-pointer"
              >
                Request Capacity Review
              </button>
            </div>
          </motion.div>
        </div>
      </div>

      {/* --- CAPACITY AUDIT MODAL (Using SwipeableModal + HubModals Layout) --- */}
      <SwipeableModal
        isOpen={isAuditModalOpen}
        onClose={() => setIsAuditModalOpen(false)}
        maxWidthClass="md:max-w-lg"
      >
        <div className="flex flex-col h-full min-h-0 select-none sm:select-auto">
          {/* HubModals Header */}
          <div className="relative z-10 flex items-center justify-between gap-3 px-5 py-4 sm:p-6 border-b border-white/10 shrink-0">
            <div className="min-w-0">
              <span className="text-[10px] font-bold uppercase tracking-widest text-orange-500 block mb-0.5">
                Full Service + AI
              </span>
              <h2 className="text-lg sm:text-2xl font-black text-white flex items-center gap-2.5 truncate">
                <Users className="text-orange-500 shrink-0" size={22} />
                <span className="truncate">Capacity Audit Request</span>
              </h2>
            </div>

            <button
              type="button"
              aria-label="Close modal"
              onClick={() => setIsAuditModalOpen(false)}
              className="w-9 h-9 sm:w-10 sm:h-10 flex items-center justify-center rounded-full bg-white/10 text-gray-400 hover:bg-white/20 hover:text-white active:scale-95 transition-all cursor-pointer"
            >
              <X size={18} />
            </button>
          </div>

          {/* HubModals Body */}
          <div className="relative z-10 flex-1 min-h-0 overflow-y-auto p-4 sm:p-6 bg-black/20">
            <form
              className="p-4 sm:p-5 rounded-2xl bg-[#0a0f16] border border-white/10 space-y-4"
              onSubmit={(e) => {
                e.preventDefault();
                setIsAuditModalOpen(false);
              }}
            >
              <p className="text-xs text-gray-400 leading-relaxed">
                To ensure we can provide the personnel required to handle your volume, please provide your current floor metrics.
              </p>

              <div>
                <label htmlFor="audit-volume" className="block text-xs font-bold text-gray-400 ml-1 mb-1.5">
                  Average Monthly Lead Volume
                </label>
                <select
                  id="audit-volume"
                  className="w-full min-h-11 px-3.5 py-2.5 rounded-xl bg-black/40 border border-white/15 focus:border-orange-500 outline-none text-xs sm:text-sm text-white appearance-none cursor-pointer"
                >
                  <option className="bg-[#0a0f16]">Less than 500</option>
                  <option className="bg-[#0a0f16]">500 - 1,500</option>
                  <option className="bg-[#0a0f16]">1,500 - 3,000</option>
                  <option className="bg-[#0a0f16]">3,000+</option>
                </select>
              </div>

              <div>
                <label htmlFor="audit-reps" className="block text-xs font-bold text-gray-400 ml-1 mb-1.5">
                  Current Sales Reps on Floor
                </label>
                <input
                  id="audit-reps"
                  type="number"
                  inputMode="numeric"
                  placeholder="e.g. 12"
                  className="w-full min-h-11 px-3.5 py-2.5 rounded-xl bg-black/40 border border-white/15 focus:border-orange-500 outline-none text-xs sm:text-sm text-white"
                />
              </div>

              <div>
                <label htmlFor="audit-crm" className="block text-xs font-bold text-gray-400 ml-1 mb-1.5">
                  Primary CRM
                </label>
                <select
                  id="audit-crm"
                  className="w-full min-h-11 px-3.5 py-2.5 rounded-xl bg-black/40 border border-white/15 focus:border-orange-500 outline-none text-xs sm:text-sm text-white appearance-none cursor-pointer"
                >
                  <option className="bg-[#0a0f16]">Elead</option>
                  <option className="bg-[#0a0f16]">VinSolutions</option>
                  <option className="bg-[#0a0f16]">DealerSocket</option>
                  <option className="bg-[#0a0f16]">Other</option>
                </select>
              </div>

              <button
                type="submit"
                className="w-full min-h-11 py-2.5 mt-2 rounded-xl bg-orange-500 hover:bg-orange-600 active:scale-[0.98] text-white font-bold text-xs sm:text-sm transition-all shadow-md shadow-orange-500/20 outline-none cursor-pointer"
              >
                Submit Request
              </button>
            </form>
          </div>
        </div>
      </SwipeableModal>
    </div>
  );
}