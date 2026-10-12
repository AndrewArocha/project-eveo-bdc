import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Phone, MessageSquare, User, ArrowLeft, ExternalLink, Smartphone, Mail, Activity, Clock, Camera, Globe, MessageCircle } from 'lucide-react';
import { MOCK_AGENT_STATS, STORE_DATA, CURRENT_USER } from '../../data/mockDatabase';
import { StatBox, ClickableStatBox, RatioBox } from './ReportStats';
import ReportActionToolbar from './ReportActionToolbar';
import { type DealRecord } from '../../types';
import { getNextAppointment } from '../../utils/appointmentManager';

// Derive the local store data dynamically
const MOCK_SOLD = STORE_DATA['njx'].sold;
const MOCK_PENDING = STORE_DATA['njx'].pending;

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

// 5. Pending Deals & Next Appointment Modal (Shared Profile Logic & Social Linking)
export function CustomerDeepDiveModal({ type, storeId, triggerToast }: { type: 'pending' | 'next', storeId?: string, triggerToast: (msg: string) => void }) {
  const [selectedCustomer, setSelectedCustomer] = useState<DealRecord | null>(null);
  const [nextApptRecord, setNextApptRecord] = useState<DealRecord | null>(null);
  
  const [isSocialLinked, setIsSocialLinked] = useState(false);
  const STORE_HAS_META_INTEGRATION = true; 
  
  type CommMethod = 'none' | 'instagram' | 'facebook' | 'whatsapp' | 'sms';
  const [activeComms, setActiveComms] = useState<CommMethod>('none');
  const [messageText, setMessageText] = useState('');

  // 🌟 FIXED: No more phantom variables!
  useEffect(() => {
    if (type !== 'next' || !storeId) return;

    const fetchNextAppointment = () => {
      const appt = getNextAppointment(storeId);
      if (appt) {
        setNextApptRecord({
          id: appt.id,
          name: appt.customer,
          vehicle: appt.vehicle,
          rep: appt.rep,
          stage: appt.status,
          socials: { facebook: appt.customer, whatsapp: '+57 300 123 4567' }
        });
      }
    };

    fetchNextAppointment();
    window.addEventListener('appointmentsUpdated', fetchNextAppointment);
    return () => window.removeEventListener('appointmentsUpdated', fetchNextAppointment);
  }, [type, storeId]);

  const handleSocialClick = (platform: CommMethod) => {
    if (isSocialLinked) {
      setActiveComms(activeComms === platform ? 'none' : platform);
    } else {
      triggerToast('Connecting to Meta Business Suite...');
      setTimeout(() => {
        setIsSocialLinked(true);
        triggerToast('Social channels successfully linked!');
        setActiveComms(platform);
      }, 2000);
    }
  };

  const renderProfile = (customer: DealRecord) => {
    const availableSocials = customer.socials ? Object.entries(customer.socials).filter(([, val]) => val) : [];
    const hasSocials = STORE_HAS_META_INTEGRATION && availableSocials.length > 0;

    const drawerConfig: Record<string, { border: string; text: string; icon: React.ReactNode; btn: string }> = {
      instagram: { border: 'border-pink-500/30 bg-pink-500/10', text: 'text-pink-400', icon: <Camera size={12}/>, btn: 'bg-linear-to-r from-purple-600 to-pink-600 text-white border border-pink-500' },
      facebook: { border: 'border-blue-500/30 bg-blue-500/10', text: 'text-blue-400', icon: <Globe size={12}/>, btn: 'bg-blue-600 hover:bg-blue-700 text-white' },
      whatsapp: { border: 'border-green-500/30 bg-green-500/10', text: 'text-green-400', icon: <MessageCircle size={12}/>, btn: 'bg-green-500 hover:bg-green-600 text-white' },
      sms: { border: 'border-blue-500/30 bg-blue-500/10', text: 'text-blue-400', icon: <MessageSquare size={12}/>, btn: 'bg-blue-500 hover:bg-blue-600 text-white' }
    };

    const activeDrawer = activeComms !== 'none' ? drawerConfig[activeComms] : null;

    return (
      <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} className="flex flex-col bg-[#0a0f16] border border-white/10 rounded-2xl p-6 shadow-sm overflow-hidden relative">
        <div className="flex justify-between items-start mb-6">
          <div className="flex items-center gap-4">
            {type === 'pending' && <button onClick={() => { setSelectedCustomer(null); setActiveComms('none'); }} className="p-2 bg-black border border-white/10 rounded-lg hover:bg-white/10 transition-colors outline-none cursor-pointer"><ArrowLeft size={16}/></button>}
            <div>
              <h1 className="text-3xl font-black text-white mb-1">{customer.name}</h1>
              <span className={`px-3 py-1 text-xs font-bold uppercase tracking-widest rounded-lg ${type === 'next' ? 'bg-emerald-500/20 text-emerald-400' : 'bg-blue-500/20 text-blue-400'}`}>
                {type === 'next' ? customer.stage : customer.stage}
              </span>
            </div>
          </div>
          {type === 'next' && (
            <div className="text-right">
              <p className="text-3xl font-black text-orange-500">Today</p>
              <p className="text-sm font-bold text-gray-400 mt-1">Pending Arrival</p>
            </div>
          )}
        </div>
        
        <div className="grid grid-cols-2 gap-4 mb-6 relative z-10">
          <div className="bg-white/5 p-4 rounded-xl border border-white/5">
            <span className="text-[10px] uppercase tracking-widest text-gray-500 block mb-1">Vehicle of Interest</span>
            <span className="font-bold text-white text-lg">{customer.vehicle}</span>
          </div>
          <div className="bg-white/5 p-4 rounded-xl border border-white/5">
            <span className="text-[10px] uppercase tracking-widest text-gray-500 block mb-1">
              {hasSocials ? 'Social Handles' : 'Assigned Rep'}
            </span>
            <div className="font-bold text-white text-sm flex flex-col gap-1.5 mt-1">
              {hasSocials ? (
                availableSocials.map(([p, h]) => (
                  <span key={p} className="flex items-center gap-1.5 capitalize">
                    {p === 'instagram' ? <Camera size={12} className="text-pink-400"/> : p === 'facebook' ? <Globe size={12} className="text-blue-400"/> : <MessageCircle size={12} className="text-green-400"/>} 
                    {h as string}
                  </span>
                ))
              ) : (
                <span className="text-lg">{customer.rep}</span>
              )}
            </div>
          </div>
        </div>

        <AnimatePresence>
          {activeComms !== 'none' && activeDrawer && (
            <motion.div 
              initial={{ height: 0, opacity: 0, marginBottom: 0 }} 
              animate={{ height: 'auto', opacity: 1, marginBottom: 24 }} 
              exit={{ height: 0, opacity: 0, marginBottom: 0 }}
              className="overflow-hidden"
            >
              <div className={`p-4 rounded-xl border ${activeDrawer.border}`}>
                <div className="flex justify-between items-center mb-2">
                  <span className={`text-[10px] font-bold uppercase tracking-widest flex items-center gap-1.5 ${activeDrawer.text}`}>
                    {activeDrawer.icon} Quick {activeComms} Reply
                  </span>
                </div>
                <textarea 
                  autoFocus
                  value={messageText}
                  onChange={(e) => setMessageText(e.target.value)}
                  placeholder={`Type your message to ${customer.name}...`}
                  className="w-full bg-black/40 border border-white/10 rounded-lg p-3 text-sm text-white outline-none focus:border-white/30 resize-none h-20 mb-3"
                />
                <div className="flex justify-end gap-2">
                  <button onClick={() => setActiveComms('none')} className="px-4 py-2 text-xs font-bold text-gray-400 hover:text-white transition-colors outline-none cursor-pointer">Cancel</button>
                  <button onClick={() => { triggerToast(`${activeComms} message sent!`); setActiveComms('none'); setMessageText(''); }} className={`px-5 py-2 text-xs font-bold rounded-lg outline-none cursor-pointer shadow-md transition-transform hover:scale-105 ${activeDrawer.btn}`}>
                    Send Message
                  </button>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
        
        <div className="flex gap-2 sm:gap-3 relative z-10">
          <button onClick={() => triggerToast(`Calling ${customer.name}...`)} className="flex-1 py-3 bg-emerald-500/20 text-emerald-400 font-bold rounded-xl border border-emerald-500/30 flex items-center justify-center gap-2 transition-colors hover:bg-emerald-500/30 outline-none cursor-pointer">
            <Phone size={16}/> Call
          </button>
          
          {hasSocials ? (
            <div className="flex gap-2">
              {availableSocials.map(([platform]) => {
                const isActive = activeComms === platform;
                const isIg = platform === 'instagram';
                const isFb = platform === 'facebook';
                
                const activeClass = isIg ? 'bg-pink-500/40 text-white border-pink-500' : isFb ? 'bg-blue-600 border-blue-500 text-white' : 'bg-green-500 border-green-400 text-white';
                const idleClass = isIg ? 'bg-pink-500/20 text-pink-400 border-pink-500/30 hover:bg-pink-500/30' : isFb ? 'bg-blue-500/20 text-blue-400 border-blue-500/30 hover:bg-blue-500/30' : 'bg-green-500/20 text-green-400 border-green-500/30 hover:bg-green-500/30';
                
                return (
                  <button 
                    key={platform}
                    onClick={() => handleSocialClick(platform as CommMethod)}
                    className={`px-4 py-3 font-bold rounded-xl flex items-center justify-center transition-all outline-none cursor-pointer border ${isSocialLinked ? (isActive ? activeClass : idleClass) : 'bg-linear-to-br from-gray-700 to-gray-800 text-gray-400 border-gray-600 hover:text-white hover:border-gray-500 shadow-sm'}`}
                    title={isSocialLinked ? `Message on ${platform}` : 'Link Meta Business Suite'}
                  >
                    {isIg ? <Camera size={16}/> : isFb ? <Globe size={16}/> : <MessageCircle size={16}/>}
                  </button>
                )
              })}
            </div>
          ) : (
            <button 
              onClick={() => setActiveComms(activeComms === 'sms' ? 'none' : 'sms')} 
              className={`flex-1 py-3 font-bold rounded-xl flex items-center justify-center gap-2 transition-all outline-none cursor-pointer ${activeComms === 'sms' ? 'bg-blue-500/40 text-white border border-blue-500' : 'bg-blue-500/20 text-blue-400 border border-blue-500/30 hover:bg-blue-500/30'}`}
            >
              <MessageSquare size={16}/> SMS
            </button>
          )}
          
          <button onClick={() => triggerToast('Opening CRM profile...')} className="flex-1 py-3 bg-white/10 hover:bg-white/20 text-white font-bold rounded-xl transition-colors flex items-center justify-center gap-2 outline-none cursor-pointer">
            <ExternalLink size={16}/> CRM
          </button>
        </div>
      </motion.div>
    );
  };

  return (
    <div className="flex flex-col h-full">
      <div className="flex-1 p-6 md:p-8 overflow-y-auto custom-scrollbar">
        {type === 'next' ? (
          nextApptRecord ? (
            renderProfile(nextApptRecord)
          ) : (
            <div className="flex items-center justify-center h-full text-gray-500 font-bold">
              No upcoming appointments to display.
            </div>
          )
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