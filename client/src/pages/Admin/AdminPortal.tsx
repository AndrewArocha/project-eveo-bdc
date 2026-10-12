import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { CreditCard, Users, Settings, Copy, Trash2, CheckCircle2, ExternalLink, ShieldAlert } from 'lucide-react';
import { mockIntegrations, type Integration } from '../../data/mockDatabase';

// Import our new extracted components
import StoreProfileTab from '../../components/Admin/StoreProfileTab';
import IntegrationWizardModal from '../../components/Admin/IntegrationWizardModal';

type Tab = 'billing' | 'team' | 'settings';

export default function AdminPortal() {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<Tab>('settings'); 
  const [copied, setCopied] = useState(false);

  // Lifted state that the Wizard and Profile Tab share
  const [integrations, setIntegrations] = useState<Integration[]>(mockIntegrations); 
  const [isIntegrationModalOpen, setIsIntegrationModalOpen] = useState(false);

  // Master Account Data
  const inviteLink = "https://eveo.app/invite/dlr_7x9Q2mP";
  const teamMembers = [
    { id: 1, name: "Andres Hernandez", role: "Owner", email: "admin@premiumauto.com" },
    { id: 2, name: "Sofia", role: "BDC Agent", email: "sofia@premiumauto.com" },
    { id: 3, name: "Ricardo", role: "Floor Manager", email: "ricardo@premiumauto.com" },
  ];

  const handleCopyLink = () => {
    navigator.clipboard.writeText(inviteLink);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="min-h-screen w-full bg-[#05080c] text-white pt-28 pb-12 px-4 sm:px-6">
      
      {/* Page Header */}
      <div className="max-w-5xl mx-auto mb-10 flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div>
          <h1 className="text-3xl md:text-4xl font-black drop-shadow-md tracking-tight">Store Administration</h1>
          <p className="text-gray-400 mt-2 font-medium">Manage your team access, configurations, and billing.</p>
        </div>
        <div className="flex flex-col sm:flex-row gap-4">
          <button type="button" onClick={() => navigate('/admin/store')} className="px-6 py-3 bg-orange-500/10 hover:bg-orange-500/20 text-orange-500 font-bold rounded-xl transition-all border border-orange-500/30 flex items-center justify-center gap-2 outline-none cursor-pointer">
            Upgrade Plan
          </button>
          <button type="button" onClick={() => navigate('/app/hub')} className="px-6 py-3 bg-white/10 hover:bg-white/20 text-white font-bold rounded-xl transition-all border border-white/20 shadow-lg flex items-center justify-center gap-2 group outline-none cursor-pointer">
            Launch Workspace <ExternalLink size={18} className="group-hover:translate-x-1 group-hover:-translate-y-1 transition-transform" />
          </button>
        </div>
      </div>

      <div className="max-w-5xl mx-auto grid grid-cols-1 md:grid-cols-4 gap-8">
        
        {/* Sidebar Navigation */}
        <div className="md:col-span-1 flex flex-col gap-2">
          <button type="button" onClick={() => setActiveTab('billing')} className={`flex items-center gap-3 px-4 py-3 rounded-xl font-bold transition-all text-sm md:text-base outline-none cursor-pointer ${activeTab === 'billing' ? 'bg-white/10 text-white border border-white/20 shadow-lg' : 'text-gray-400 hover:bg-white/5 hover:text-white border border-transparent'}`}>
            <CreditCard size={20} /> Billing & Plan
          </button>
          <button type="button" onClick={() => setActiveTab('team')} className={`flex items-center gap-3 px-4 py-3 rounded-xl font-bold transition-all text-sm md:text-base outline-none cursor-pointer ${activeTab === 'team' ? 'bg-white/10 text-white border border-white/20 shadow-lg' : 'text-gray-400 hover:bg-white/5 hover:text-white border border-transparent'}`}>
            <Users size={20} /> Team Management
          </button>
          <button type="button" onClick={() => setActiveTab('settings')} className={`flex items-center gap-3 px-4 py-3 rounded-xl font-bold transition-all text-sm md:text-base outline-none cursor-pointer ${activeTab === 'settings' ? 'bg-white/10 text-white border border-white/20 shadow-lg' : 'text-gray-400 hover:bg-white/5 hover:text-white border border-transparent'}`}>
            <Settings size={20} /> Store Profile
          </button>
        </div>

        {/* Content Area */}
        <div className="md:col-span-3">
          <AnimatePresence mode="wait">
            
            {/* --- TAB: BILLING OVERVIEW --- */}
            {activeTab === 'billing' && (
              <motion.div key="billing" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} className="space-y-6">
                <div className="p-6 md:p-8 rounded-2xl bg-white/5 border border-white/10 backdrop-blur-md">
                  <h3 className="text-sm font-bold text-gray-400 uppercase tracking-widest mb-2">Current Subscription</h3>
                  <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-6 pb-6 border-b border-white/10 mb-6">
                    <div>
                      <h2 className="text-3xl font-black text-white mb-1">14-Day Free Trial</h2>
                      <p className="text-sm text-orange-400 font-medium">Expires in 12 days</p>
                    </div>
                    <button type="button" onClick={() => navigate('/admin/store')} className="px-6 py-3 bg-orange-500 hover:bg-orange-600 text-white font-bold rounded-xl transition-all shadow-[0_0_15px_rgba(249,115,22,0.4)] whitespace-nowrap outline-none cursor-pointer">
                      View Plans & Upgrade
                    </button>
                  </div>
                  <div className="flex items-start gap-3 p-4 rounded-xl bg-red-500/10 border border-red-500/20">
                    <ShieldAlert className="text-red-500 shrink-0 mt-0.5" size={20} />
                    <div>
                      <h4 className="text-sm font-bold text-white mb-1">Danger Zone</h4>
                      <p className="text-xs text-gray-400 leading-relaxed mb-3">Canceling your subscription will immediately revoke workspace access for all your team members and halt any active BDC integrations.</p>
                      <button type="button" className="text-xs font-bold text-red-500 hover:text-red-400 transition-colors cursor-pointer">Cancel Subscription</button>
                    </div>
                  </div>
                </div>
              </motion.div>
            )}

            {/* --- TAB: TEAM MANAGEMENT --- */}
            {activeTab === 'team' && (
              <motion.div key="team" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} className="space-y-6">
                <div className="p-6 rounded-2xl bg-white/5 border border-white/10 backdrop-blur-md">
                  <h3 className="text-lg font-bold text-white mb-2">Dealership Invite Link</h3>
                  <p className="text-sm text-gray-400 mb-4">Send this unique URL to your employees. Anyone who registers through this link will be automatically tied to your store's master hub.</p>
                  <div className="flex items-center gap-3">
                    <div className="flex-1 px-4 py-3 bg-black/50 border border-white/10 rounded-xl text-sm font-mono text-gray-300 overflow-x-auto whitespace-nowrap">
                      {inviteLink}
                    </div>
                    <button type="button" onClick={handleCopyLink} className="px-6 py-3 bg-orange-500 hover:bg-orange-600 text-white font-bold rounded-xl transition-all shadow-md flex items-center gap-2 shrink-0 outline-none cursor-pointer">
                      {copied ? <CheckCircle2 size={18} /> : <Copy size={18} />}
                      <span className="hidden sm:inline">{copied ? 'Copied!' : 'Copy Link'}</span>
                    </button>
                  </div>
                </div>

                <div className="rounded-2xl border border-white/10 bg-[#0a0f16] overflow-hidden">
                  <div className="px-6 py-4 border-b border-white/10 bg-white/5">
                    <h3 className="text-sm font-bold uppercase tracking-widest text-gray-300">Active Users</h3>
                  </div>
                  <div className="divide-y divide-white/5">
                    {teamMembers.map((user) => (
                      <div key={user.id} className="p-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4 hover:bg-white/2 transition-colors">
                        <div>
                          <div className="flex items-center gap-3 mb-1">
                            <span className="font-bold text-white text-lg">{user.name}</span>
                            {user.role === 'Owner' && <span className="px-2 py-0.5 rounded text-[10px] font-black uppercase tracking-widest bg-orange-500/20 text-orange-400 border border-orange-500/30">Owner</span>}
                          </div>
                          <div className="text-sm text-gray-400 flex items-center gap-2">
                            <span>{user.role}</span>
                            <span>&bull;</span>
                            <span>{user.email}</span>
                          </div>
                        </div>
                        {user.role !== 'Owner' && (
                          <button type="button" className="p-2 text-gray-500 hover:text-red-500 hover:bg-red-500/10 rounded-lg transition-colors border border-transparent hover:border-red-500/20 self-start sm:self-auto outline-none cursor-pointer">
                            <Trash2 size={18} />
                          </button>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              </motion.div>
            )}

            {/* --- TAB: STORE PROFILE --- */}
            {activeTab === 'settings' && (
              <StoreProfileTab 
                integrations={integrations} 
                setIntegrations={setIntegrations} 
                setIsIntegrationModalOpen={setIsIntegrationModalOpen} 
              />
            )}

          </AnimatePresence>
        </div>
      </div>

      <IntegrationWizardModal 
        isOpen={isIntegrationModalOpen} 
        onClose={() => setIsIntegrationModalOpen(false)} 
        integrations={integrations} 
        setIntegrations={setIntegrations} 
      />

    </div>
  );
}