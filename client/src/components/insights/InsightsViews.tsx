import { motion } from 'framer-motion';
import { Target, TrendingUp, AlertTriangle, Car, ArrowRight, UserCheck, Zap, Bot } from 'lucide-react';

const glassCardClasses = `
  backdrop-blur-xl bg-white/40 dark:bg-[#0a0f16]/40 
  border border-white/50 dark:border-white/10 
  shadow-[0_15px_30px_rgba(0,0,0,0.05),inset_0_1px_8px_rgba(255,255,255,0.6)] 
  dark:shadow-[0_15px_30px_rgba(0,0,0,0.2),inset_0_1px_8px_rgba(255,255,255,0.1)]
  rounded-3xl relative overflow-hidden
`;

// --- VIEW 1: THE WIDGET DASHBOARD ---
export function InsightsWidgets() {
  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 pb-32">
      
      {/* 1. Predictive Lead Scoring & Churn Risk */}
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className={`${glassCardClasses} p-6 md:p-8 group`}>
        <div className="absolute top-0 left-0 w-1 h-full bg-linear-to-b from-orange-500 to-red-500" />
        <div className="flex items-center gap-3 mb-6">
          <div className="p-2.5 bg-orange-500/10 text-orange-500 rounded-xl"><Target size={20} /></div>
          <h3 className="text-xl font-bold text-gray-900 dark:text-white">Predictive Lead Scoring</h3>
        </div>
        <p className="text-sm text-gray-600 dark:text-gray-400 mb-6">3 high-value deals are showing signs of going cold based on CRM inactivity.</p>
        
        <div className="space-y-3">
          {[
            { name: 'John Smith', car: '2024 F-150', risk: 'High', action: 'Send Video Walkaround' },
            { name: 'Maria Garcia', car: '2023 CR-V', risk: 'Med', action: 'Offer Trade Appraisal' }
          ].map((lead, i) => (
            <div key={i} className="flex items-center justify-between p-4 rounded-xl bg-white/50 dark:bg-black/20 border border-gray-200 dark:border-white/5">
              <div>
                <p className="font-bold text-gray-900 dark:text-white">{lead.name}</p>
                <p className="text-xs text-gray-500">{lead.car}</p>
              </div>
              <button className="text-xs font-bold text-orange-500 hover:text-orange-600 flex items-center gap-1 outline-none">
                {lead.action} <ArrowRight size={14} />
              </button>
            </div>
          ))}
        </div>
      </motion.div>

      {/* 2. The Inventory Matchmaker */}
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }} className={`${glassCardClasses} p-6 md:p-8 group`}>
        <div className="absolute top-0 left-0 w-1 h-full bg-linear-to-b from-blue-500 to-indigo-500" />
        <div className="flex items-center gap-3 mb-6">
          <div className="p-2.5 bg-blue-500/10 text-blue-500 rounded-xl"><Car size={20} /></div>
          <h3 className="text-xl font-bold text-gray-900 dark:text-white">Inventory Matchmaker</h3>
        </div>
        <p className="text-sm text-gray-600 dark:text-gray-400 mb-6">Cross-referencing aging inventory with archived leads from the past 90 days.</p>
        
        <div className="bg-blue-500/5 border border-blue-500/20 rounded-2xl p-5">
          <div className="flex justify-between items-start mb-4">
            <div>
              <p className="font-bold text-gray-900 dark:text-white mb-1">2024 Tacoma SR5</p>
              <span className="text-[10px] bg-red-500/10 text-red-500 px-2 py-0.5 rounded uppercase font-bold tracking-widest">Price Dropped &bull; 65 Days Old</span>
            </div>
            <span className="text-2xl font-black text-blue-500">8</span>
          </div>
          <p className="text-xs text-gray-600 dark:text-gray-400 mb-4">Archived leads who searched for Tacomas last month.</p>
          <button className="w-full py-2.5 bg-blue-500 hover:bg-blue-600 text-white text-xs font-bold rounded-xl transition-colors outline-none">
            Auto-Draft SMS Campaign
          </button>
        </div>
      </motion.div>

      {/* 3. Staff Performance Forecasting */}
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }} className={`${glassCardClasses} p-6 md:p-8 group`}>
        <div className="absolute top-0 left-0 w-1 h-full bg-linear-to-b from-emerald-500 to-teal-500" />
        <div className="flex items-center gap-3 mb-6">
          <div className="p-2.5 bg-emerald-500/10 text-emerald-500 rounded-xl"><TrendingUp size={20} /></div>
          <h3 className="text-xl font-bold text-gray-900 dark:text-white">Staff Forecasting</h3>
        </div>
        
        <div className="flex flex-col gap-4">
          <div className="flex items-center justify-between pb-4 border-b border-gray-200 dark:border-white/10">
            <div>
              <p className="font-bold text-gray-900 dark:text-white flex items-center gap-2"><UserCheck size={14} className="text-gray-400"/> Erick</p>
              <p className="text-xs text-red-500 mt-1">Pacing 20% behind target</p>
            </div>
            <div className="text-right">
              <p className="font-black text-gray-900 dark:text-white">12 / 20</p>
              <p className="text-[10px] text-gray-500 uppercase tracking-widest mt-1">Shows</p>
            </div>
          </div>
          <div className="flex items-center justify-between">
            <div>
              <p className="font-bold text-gray-900 dark:text-white flex items-center gap-2"><UserCheck size={14} className="text-gray-400"/> Sofia (BDC)</p>
              <p className="text-xs text-orange-500 mt-1">Queue overwhelmed 2PM - 4PM</p>
            </div>
            <button className="text-xs font-bold text-emerald-500 bg-emerald-500/10 px-3 py-1.5 rounded-lg hover:bg-emerald-500/20 transition-colors outline-none">
              Suggest Schedule
            </button>
          </div>
        </div>
      </motion.div>

      {/* 4. Anomaly Detection */}
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }} className={`${glassCardClasses} p-6 md:p-8 group`}>
        <div className="absolute top-0 left-0 w-1 h-full bg-linear-to-b from-purple-500 to-pink-500" />
        <div className="flex items-center gap-3 mb-6">
          <div className="p-2.5 bg-purple-500/10 text-purple-500 rounded-xl"><AlertTriangle size={20} /></div>
          <h3 className="text-xl font-bold text-gray-900 dark:text-white">Anomaly Detection</h3>
        </div>
        
        <div className="space-y-4">
          <div className="bg-white/50 dark:bg-black/20 p-4 rounded-xl border border-gray-200 dark:border-white/5">
            <h4 className="font-bold text-gray-900 dark:text-white text-sm mb-1 flex items-center gap-2"><Zap size={14} className="text-orange-500"/> SLA Breach Warning</h4>
            <p className="text-xs text-gray-600 dark:text-gray-400">Showroom wait times crept up to 8 minutes on Saturday. Target is &lt;4m.</p>
          </div>
          <div className="bg-white/50 dark:bg-black/20 p-4 rounded-xl border border-gray-200 dark:border-white/5">
             <h4 className="font-bold text-gray-900 dark:text-white text-sm mb-1 flex items-center gap-2"><TrendingUp size={14} className="text-red-500 rotate-180"/> Conversion Drop</h4>
             <p className="text-xs text-gray-600 dark:text-gray-400">Contact-to-show ratio dropped 12% this week on Facebook Ad leads.</p>
          </div>
        </div>
      </motion.div>

    </div>
  );
}

// --- VIEW 2: THE CHAT INTERFACE ---
export function InsightsChat() {
  return (
    <div className="flex flex-col h-[70vh] w-full max-w-4xl mx-auto">
      
      {/* Mock Chat History */}
      <div className="flex-1 overflow-y-auto custom-scrollbar p-4 flex flex-col gap-6">
        
        {/* User Prompt */}
        <div className="self-end max-w-[80%]">
          <div className="bg-orange-500 text-white p-4 rounded-2xl rounded-tr-sm shadow-md">
            <p className="text-sm">Find me all leads who were interested in SUVs but ghosted after receiving the quote last week.</p>
          </div>
          <span className="text-[10px] text-gray-500 font-bold uppercase tracking-widest mt-2 block text-right">You &bull; Just Now</span>
        </div>

        {/* AI Response */}
        <div className="self-start max-w-[85%]">
          <div className={`${glassCardClasses} p-5 rounded-tl-sm`}>
            <div className="flex items-center gap-2 mb-3 text-purple-500">
              <Bot size={18} />
              <span className="font-bold text-sm">EVEO Assistant</span>
            </div>
            <p className="text-sm text-gray-800 dark:text-gray-200 leading-relaxed mb-4">
              I found 14 leads matching that criteria. Their quotes averaged 5% above our current internet pricing for the 2024 CX-5 and RAV4 inventory. 
            </p>
            <div className="bg-white/50 dark:bg-black/20 p-4 rounded-xl border border-gray-200 dark:border-white/5 mb-4">
               <p className="text-xs text-gray-600 dark:text-gray-400 font-mono">
                 "Hi [Name], we just adjusted our internet pricing on the [Vehicle] you looked at last week. Let me know if you are still in the market and I'll send you the updated numbers."
               </p>
            </div>
            <div className="flex gap-3">
              <button className="px-4 py-2 bg-purple-500 hover:bg-purple-600 text-white text-xs font-bold rounded-lg transition-colors outline-none">Approve & Send SMS (14)</button>
              <button className="px-4 py-2 bg-gray-100 dark:bg-white/5 text-gray-700 dark:text-white text-xs font-bold rounded-lg transition-colors outline-none">Edit Draft</button>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}