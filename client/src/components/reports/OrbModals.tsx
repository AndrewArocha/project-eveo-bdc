import { useState } from 'react';
import { motion } from 'framer-motion';
import { Phone, MessageSquare, User, ArrowLeft, ExternalLink, Smartphone, Mail, Activity, Clock } from 'lucide-react';

import { StatBox, ClickableStatBox, RatioBox } from './ReportStats';
import ReportActionToolbar from './ReportActionToolbar';

// --- Shared Types & Mock Data ---
const CURRENT_USER = 'Sarah J.';

const MOCK_SOLD = [
  { id: 401, name: 'Esther Howard', vehicle: '2024 Honda Accord', profit: '$2,400', date: 'Oct 2', rep: 'Sarah J.' },
  { id: 402, name: 'Guy Hawkins', vehicle: '2022 Ford F-150', profit: '$3,100', date: 'Oct 4', rep: 'Michael T.' },
];

const MOCK_PENDING = [
  { id: 501, name: 'Cody Fisher', vehicle: '2023 Tesla Model Y', stage: 'Financing', rep: 'Sarah J.' },
  { id: 502, name: 'Bessie Cooper', vehicle: '2021 Toyota RAV4', stage: 'Negotiation', rep: 'Sarah J.' },
];

const MOCK_AGENT_STATS = [
  { rep: 'Sarah J.', calls: 65, sms: 42, emails: 12, showroom: 5 },
  { rep: 'Erick', calls: 45, sms: 28, emails: 8, showroom: 4 },
  { rep: 'Michael T.', calls: 32, sms: 14, emails: 3, showroom: 3 }
];

interface ModalProps {
  triggerToast: (msg: string) => void;
}

// 1. Agent KPIs Modal
export function AgentKPIModal({ triggerToast }: ModalProps) {
  const [agentView, setAgentView] = useState<'overview' | 'calls' | 'sms' | 'emails' | 'showroom'>('overview');

  return (
    <div className="flex flex-col h-full">
      <div className="flex-1 p-6 md:p-8 overflow-y-auto custom-scrollbar">
        {agentView === 'overview' ? (
          <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <ClickableStatBox icon={<Phone className="text-blue-500"/>} label="Calls Made" value="142" onClick={() => setAgentView('calls')} />
            <ClickableStatBox icon={<MessageSquare className="text-emerald-500"/>} label="SMS Sent" value="84" onClick={() => setAgentView('sms')} />
            <ClickableStatBox icon={<Mail className="text-orange-500"/>} label="Emails" value="23" onClick={() => setAgentView('emails')} />
            <ClickableStatBox icon={<Smartphone className="text-purple-500"/>} label="Showroom" value="12" onClick={() => setAgentView('showroom')} />
          </motion.div>
        ) : (
          <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} className="flex flex-col h-full bg-[#0a0f16] border border-white/10 rounded-2xl overflow-hidden shadow-lg">
            <div className="p-4 border-b border-white/10 bg-white/5 flex items-center gap-4">
              <button onClick={() => setAgentView('overview')} className="p-2 bg-black border border-white/10 rounded-lg hover:bg-white/10 transition-colors"><ArrowLeft size={16}/></button>
              <h3 className="text-lg font-bold text-white uppercase tracking-widest">{agentView} Volume Breakdown</h3>
            </div>
            <table className="w-full text-left text-sm whitespace-nowrap">
              <thead className="bg-black/40 text-gray-400 font-bold uppercase tracking-wider text-[10px]">
                <tr><th className="px-6 py-4">Rep</th><th className="px-6 py-4 text-right">Volume Generated</th></tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {MOCK_AGENT_STATS.map(stat => (
                  <tr key={stat.rep} className="hover:bg-white/5 transition-colors">
                    <td className="px-6 py-4 font-bold text-white flex items-center gap-2"><User size={14} className="text-gray-500"/> {stat.rep}</td>
                    <td className="px-6 py-4 text-right font-black text-emerald-400 text-lg">{stat[agentView]}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </motion.div>
        )}
      </div>
      <ReportActionToolbar onGeneratePDF={() => triggerToast('AI Agent Activity PDF Generated.')} onShare={(method) => triggerToast(`Agent report sent via ${method}.`)} />
    </div>
  );
}

// 2. Lead Visibility Modal
export function LeadVisibilityModal({ triggerToast }: ModalProps) {
  const [leadView, setLeadView] = useState<'overview' | 'sources'>('overview');

  return (
    <div className="flex flex-col h-full">
      <div className="flex-1 p-6 md:p-8 overflow-y-auto custom-scrollbar">
        {leadView === 'overview' ? (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <ClickableStatBox icon={<Activity className="text-orange-500"/>} label="Total Leads (Month)" value="1,248" onClick={() => setLeadView('sources')} />
            <StatBox icon={<Clock className="text-blue-500"/>} label="Avg Response Time" value="4m 12s" />
            <div className="flex flex-col items-center justify-center p-6 bg-white/5 rounded-2xl shadow-inner border border-white/5">
              <div className="mb-2"><User className="text-emerald-500"/></div>
              <p className="text-xl font-black text-white text-center">Sarah Connor</p>
              <p className="text-xs font-bold uppercase tracking-widest text-gray-500 mt-1">Last Contacted (10m ago)</p>
            </div>
          </div>
        ) : (
          <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} className="flex flex-col bg-[#0a0f16] border border-white/10 rounded-2xl overflow-hidden shadow-lg">
            <div className="p-4 border-b border-white/10 bg-white/5 flex items-center gap-4">
              <button onClick={() => setLeadView('overview')} className="p-2 bg-black border border-white/10 rounded-lg hover:bg-white/10 transition-colors"><ArrowLeft size={16}/></button>
              <h3 className="text-lg font-bold text-white uppercase tracking-widest">Lead Breakdown by Source Tags</h3>
            </div>
            <table className="w-full text-left text-sm whitespace-nowrap">
              <thead className="bg-black/40 text-gray-400 font-bold uppercase tracking-wider text-[10px]">
                <tr><th className="px-6 py-4">Source Tag</th><th className="px-6 py-4">Volume</th><th className="px-6 py-4 text-right">Conversion Rate</th></tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {[
                  { tag: 'Instagram DM', count: '482 leads', rate: '14%' },
                  { tag: 'Facebook Ads', count: '390 leads', rate: '9%' },
                  { tag: 'Dealer Website', count: '246 leads', rate: '22%' },
                  { tag: 'Walk-in / QR', count: '130 leads', rate: '45%' },
                ].map((s, idx) => (
                  <tr key={idx} className="hover:bg-white/5 transition-colors">
                    <td className="px-6 py-4 font-bold text-white flex items-center gap-2"><span className="w-2 h-2 rounded-full bg-orange-500"/> {s.tag}</td>
                    <td className="px-6 py-4 text-gray-300 font-bold">{s.count}</td>
                    <td className="px-6 py-4 text-right font-black text-emerald-400">{s.rate}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </motion.div>
        )}
      </div>
      <ReportActionToolbar onGeneratePDF={() => triggerToast('AI Lead Visibility PDF Generated.')} onShare={(method) => triggerToast(`Lead visibility report sent via ${method}.`)} />
    </div>
  );
}

// 3. Conversion Ratios Modal
export function ConversionRatiosModal({ triggerToast }: ModalProps) {
  const [convView, setConvView] = useState<'overview' | 'tags'>('overview');

  return (
    <div className="flex flex-col h-full">
      <div className="flex-1 p-6 md:p-8 overflow-y-auto custom-scrollbar">
        {convView === 'overview' ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div onClick={() => setConvView('tags')} className="cursor-pointer hover:scale-[1.02] transition-transform"><RatioBox label="Contact Ratio" value="48%" sub="Leads tagged 'Contacted' (Click for details)" /></div>
            <div onClick={() => setConvView('tags')} className="cursor-pointer hover:scale-[1.02] transition-transform"><RatioBox label="Show Ratio" value="68%" sub="Appointments tagged 'Shown' (Click for details)" /></div>
            <div onClick={() => setConvView('tags')} className="cursor-pointer hover:scale-[1.02] transition-transform"><RatioBox label="Lead to Delivery" value="8%" sub="Total leads tagged 'Sold'" /></div>
            <div onClick={() => setConvView('tags')} className="cursor-pointer hover:scale-[1.02] transition-transform"><RatioBox label="Inventory Turnover" value="45%" sub="Total cars vs. Sold ratio" /></div>
          </div>
        ) : (
          <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} className="flex flex-col bg-[#0a0f16] border border-white/10 rounded-2xl overflow-hidden shadow-lg">
            <div className="p-4 border-b border-white/10 bg-white/5 flex items-center gap-4">
              <button onClick={() => setConvView('overview')} className="p-2 bg-black border border-white/10 rounded-lg hover:bg-white/10 transition-colors"><ArrowLeft size={16}/></button>
              <h3 className="text-lg font-bold text-white uppercase tracking-widest">In-Depth Conversion Tag Breakdown</h3>
            </div>
            <table className="w-full text-left text-sm whitespace-nowrap">
              <thead className="bg-black/40 text-gray-400 font-bold uppercase tracking-wider text-[10px]">
                <tr><th className="px-6 py-4">Metric Tag</th><th className="px-6 py-4">Evaluated Pool</th><th className="px-6 py-4 text-right">Percentage / Ratio</th></tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {[
                  { metric: 'Tag: Contacted', pool: '600 / 1,248 leads', val: '48%' },
                  { metric: 'Tag: Appt Shown', pool: '340 / 500 appts', val: '68%' },
                  { metric: 'Tag: Sold', pool: '100 / 1,248 leads', val: '8%' },
                  { metric: 'Inventory Turnover', pool: '45 / 100 total stock', val: '45%' },
                ].map((c, idx) => (
                  <tr key={idx} className="hover:bg-white/5 transition-colors">
                    <td className="px-6 py-4 font-bold text-white">{c.metric}</td>
                    <td className="px-6 py-4 text-gray-400">{c.pool}</td>
                    <td className="px-6 py-4 text-right font-black text-blue-400">{c.val}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </motion.div>
        )}
      </div>
      <ReportActionToolbar onGeneratePDF={() => triggerToast('AI Conversion Data PDF Generated.')} onShare={(method) => triggerToast(`Conversion stats sent via ${method}.`)} />
    </div>
  );
}

// 4. Sold Cars Modal
export function SoldVehiclesModal({ triggerToast }: ModalProps) {
  return (
    <div className="flex flex-col h-full">
      <div className="flex-1 p-6 md:p-8 overflow-y-auto custom-scrollbar">
        <div className="bg-white/5 border border-white/10 rounded-2xl overflow-hidden">
          <table className="w-full text-left text-sm whitespace-nowrap">
            <thead className="bg-black/40 text-gray-400 font-bold uppercase tracking-wider text-[10px]">
              <tr><th className="px-6 py-4">Customer</th><th className="px-6 py-4">Vehicle</th><th className="px-6 py-4">Gross / Date</th><th className="px-6 py-4 text-right">Rep</th></tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {MOCK_SOLD.map(deal => (
                <tr key={deal.id} className="hover:bg-white/5 transition-colors">
                  <td className="px-6 py-4 font-bold text-white">{deal.name}</td>
                  <td className="px-6 py-4 text-gray-400">{deal.vehicle}</td>
                  <td className="px-6 py-4 font-bold text-emerald-400">{deal.profit} <span className="text-xs text-gray-500 ml-2 font-normal">{deal.date}</span></td>
                  <td className="px-6 py-4 text-right text-gray-300 font-medium">{deal.rep || CURRENT_USER}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
      <ReportActionToolbar onGeneratePDF={() => triggerToast('AI Sold Roster PDF Generated.')} onShare={(method) => triggerToast(`Sold roster sent via ${method}.`)} />
    </div>
  );
}

// 5. Pending Deals & Next Appointment Modal (Shared Profile Logic & Instagram Linking)
export function CustomerDeepDiveModal({ type, triggerToast }: { type: 'pending' | 'next', triggerToast: (msg: string) => void }) {
  const [selectedCustomer, setSelectedCustomer] = useState<{ name: string; vehicle: string; stage: string; rep: string } | null>(null);
  
  // Instagram Integration State
  const [isInstagramLinked, setIsInstagramLinked] = useState(false);

  const handleInstagramClick = (customerName: string) => {
    if (isInstagramLinked) {
      triggerToast(`Opening Instagram Direct Messages with ${customerName}...`);
    } else {
      // Simulate linking flow
      triggerToast('Connecting to Meta Business Suite...');
      setTimeout(() => {
        setIsInstagramLinked(true);
        triggerToast('Instagram Professional Account successfully linked!');
      }, 2000);
    }
  };

  const renderProfile = (customer: { name: string; vehicle: string; stage?: string; rep: string }) => (
    <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} className="flex flex-col bg-[#0a0f16] border border-white/10 rounded-2xl p-6 shadow-sm">
      <div className="flex justify-between items-start mb-6">
        <div className="flex items-center gap-4">
          {type === 'pending' && <button onClick={() => setSelectedCustomer(null)} className="p-2 bg-black border border-white/10 rounded-lg hover:bg-white/10 transition-colors"><ArrowLeft size={16}/></button>}
          <div>
            <h1 className="text-3xl font-black text-white mb-1">{customer.name}</h1>
            <span className={`px-3 py-1 text-xs font-bold uppercase tracking-widest rounded-lg ${type === 'next' ? 'bg-emerald-500/20 text-emerald-400' : 'bg-blue-500/20 text-blue-400'}`}>
              {type === 'next' ? 'Confirmed Arrival' : customer.stage}
            </span>
          </div>
        </div>
        {type === 'next' && (
          <div className="text-right">
            <p className="text-3xl font-black text-orange-500">2:30 PM</p>
            <p className="text-sm font-bold text-gray-400 mt-1">Today</p>
          </div>
        )}
      </div>
      
      <div className="grid grid-cols-2 gap-4 mb-6">
        <div className="bg-white/5 p-4 rounded-xl border border-white/5"><span className="text-[10px] uppercase tracking-widest text-gray-500 block mb-1">Vehicle of Interest</span><span className="font-bold text-white text-lg">{customer.vehicle}</span></div>
        <div className="bg-white/5 p-4 rounded-xl border border-white/5"><span className="text-[10px] uppercase tracking-widest text-gray-500 block mb-1">Assigned Rep</span><span className="font-bold text-white text-lg">{customer.rep}</span></div>
      </div>
      
      <div className="flex gap-3">
        <button onClick={() => triggerToast(`Calling ${customer.name}...`)} className="flex-1 py-3 bg-emerald-500/20 text-emerald-400 font-bold rounded-xl border border-emerald-500/30 flex items-center justify-center gap-2 transition-colors hover:bg-emerald-500/30"><Phone size={16}/> Call Customer</button>
        
        {/* Dynamic Instagram Button */}
        <button 
          onClick={() => handleInstagramClick(customer.name)} 
          className={`flex-1 py-3 font-bold rounded-xl flex items-center justify-center gap-2 transition-all ${isInstagramLinked ? 'bg-pink-500/20 text-pink-400 border border-pink-500/30 hover:bg-pink-500/30' : 'bg-linear-to-r from-purple-600 to-pink-600 text-white shadow-lg hover:shadow-pink-500/25'}`}
        >
          <Smartphone size={16}/> {isInstagramLinked ? 'Instagram DM' : 'Link Instagram Account'}
        </button>
        
        <button onClick={() => triggerToast('Opening CRM profile...')} className="flex-1 py-3 bg-white/10 hover:bg-white/20 text-white font-bold rounded-xl transition-colors flex items-center justify-center gap-2"><ExternalLink size={16}/> CRM</button>
      </div>
    </motion.div>
  );

  return (
    <div className="flex flex-col h-full">
      <div className="flex-1 p-6 md:p-8 overflow-y-auto custom-scrollbar">
        {type === 'next' ? (
          renderProfile({ name: 'Alex Mercer', vehicle: '2024 Mazda CX-5', rep: 'Erick' })
        ) : (
          selectedCustomer ? renderProfile(selectedCustomer) : (
            <div className="bg-white/5 border border-white/10 rounded-2xl overflow-hidden">
              <table className="w-full text-left text-sm whitespace-nowrap">
                <thead className="bg-black/40 text-gray-400 font-bold uppercase tracking-wider text-[10px]">
                  <tr><th className="px-6 py-4">Customer</th><th className="px-6 py-4">Vehicle</th><th className="px-6 py-4">Stage</th><th className="px-6 py-4 text-right">Rep</th></tr>
                </thead>
                <tbody className="divide-y divide-white/5">
                  {MOCK_PENDING.map(deal => (
                    <tr key={deal.id} onClick={() => setSelectedCustomer(deal)} className="hover:bg-white/5 transition-colors cursor-pointer group">
                      <td className="px-6 py-4 font-bold text-white group-hover:text-orange-400 transition-colors">{deal.name} &rarr;</td>
                      <td className="px-6 py-4 text-gray-400">{deal.vehicle}</td>
                      <td className="px-6 py-4"><span className="px-2.5 py-1 rounded-md text-[10px] font-bold uppercase tracking-widest bg-blue-500/20 text-blue-400">{deal.stage}</span></td>
                      <td className="px-6 py-4 text-right text-gray-300 font-medium">{deal.rep || CURRENT_USER}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )
        )}
      </div>
      <ReportActionToolbar 
        onGeneratePDF={() => triggerToast(`AI ${type === 'next' ? 'Appointment' : 'Pipeline'} PDF Generated.`)} 
        onShare={(method) => triggerToast(`Report sent via ${method}.`)} 
      />
    </div>
  );
}