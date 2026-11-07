// src/pages/Admin/AdminPortal.tsx
import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { CreditCard, Users, Settings, Copy, Trash2, CheckCircle2, ExternalLink, ShieldAlert } from 'lucide-react';
import { mockIntegrations, type Integration } from '../../data/mockDatabase';

import StoreProfileTab from '../../components/Admin/StoreProfileTab';
import IntegrationWizardModal from '../../components/Admin/IntegrationWizardModal';

type Tab = 'billing' | 'team' | 'settings';

export default function AdminPortal() {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<Tab>('settings');
  const [copied, setCopied] = useState(false);

  const [integrations, setIntegrations] = useState<Integration[]>(mockIntegrations);
  const [isIntegrationModalOpen, setIsIntegrationModalOpen] = useState(false);

  const inviteLink = 'https://eveo.app/invite/dlr_7x9Q2mP';
  const teamMembers = [
    { id: 1, name: 'Andres Hernandez', role: 'Owner', email: 'admin@premiumauto.com' },
    { id: 2, name: 'Sofia', role: 'BDC Agent', email: 'sofia@premiumauto.com' },
    { id: 3, name: 'Ricardo', role: 'Floor Manager', email: 'ricardo@premiumauto.com' },
  ];

  const handleCopyLink = () => {
    void navigator.clipboard.writeText(inviteLink);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="min-h-screen w-full bg-[#05080c] text-white pt-24 sm:pt-28 pb-16 px-4 sm:px-6 overflow-x-hidden">

      {/* Page Header */}
      <div className="max-w-5xl mx-auto mb-6 sm:mb-10 flex flex-col md:flex-row md:items-end justify-between gap-5 sm:gap-6">
        <div>
          <span className="text-[10px] font-bold uppercase tracking-widest text-orange-500 block mb-1">
            Master Control
          </span>
          <h1 className="text-2xl sm:text-3xl md:text-4xl font-black tracking-tight">Store Administration</h1>
          <p className="text-gray-400 text-sm sm:text-base mt-1 font-medium">Manage your team access, configurations, and billing.</p>
        </div>
        <div className="grid grid-cols-2 sm:flex sm:flex-row gap-3 sm:gap-4">
          <button
            type="button"
            onClick={() => navigate('/admin/store')}
            className="min-h-11 px-4 sm:px-5 py-2.5 bg-orange-500/15 hover:bg-orange-500/25 active:scale-[0.98] text-orange-400 text-xs sm:text-sm font-bold rounded-xl transition-all border border-orange-500/35 flex items-center justify-center gap-2 outline-none cursor-pointer"
          >
            Upgrade Plan
          </button>
          <button
            type="button"
            onClick={() => navigate('/app/hub')}
            className="min-h-11 px-4 sm:px-5 py-2.5 bg-white/10 hover:bg-white/15 active:scale-[0.98] text-white text-xs sm:text-sm font-bold rounded-xl transition-all border border-white/10 flex items-center justify-center gap-2 group outline-none cursor-pointer"
          >
            <span>Workspace</span>
            <ExternalLink size={15} className="text-orange-500 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform shrink-0" />
          </button>
        </div>
      </div>

      <div className="max-w-5xl mx-auto grid grid-cols-1 md:grid-cols-4 gap-6 md:gap-8">

        {/* Sidebar Navigation */}
        <div className="md:col-span-1 grid grid-cols-3 md:flex md:flex-col gap-1.5 md:gap-2 p-1.5 md:p-0 rounded-2xl bg-[#0a0f16] md:bg-transparent border border-white/10 md:border-transparent h-fit">
          <button
            type="button"
            onClick={() => setActiveTab('settings')}
            className={`flex flex-col md:flex-row items-center justify-center md:justify-start gap-1.5 md:gap-3 px-2 md:px-4 py-2.5 md:py-3 rounded-xl font-bold transition-all text-xs md:text-sm outline-none cursor-pointer ${
              activeTab === 'settings'
                ? 'bg-[#0a0f16] text-white border border-orange-500/35 shadow-lg'
                : 'text-gray-400 hover:bg-white/5 hover:text-white border border-transparent'
            }`}
          >
            <Settings size={17} className={activeTab === 'settings' ? 'text-orange-500 shrink-0' : 'shrink-0'} />
            <span>Store Profile</span>
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('team')}
            className={`flex flex-col md:flex-row items-center justify-center md:justify-start gap-1.5 md:gap-3 px-2 md:px-4 py-2.5 md:py-3 rounded-xl font-bold transition-all text-xs md:text-sm outline-none cursor-pointer ${
              activeTab === 'team'
                ? 'bg-[#0a0f16] text-white border border-orange-500/35 shadow-lg'
                : 'text-gray-400 hover:bg-white/5 hover:text-white border border-transparent'
            }`}
          >
            <Users size={17} className={activeTab === 'team' ? 'text-orange-500 shrink-0' : 'shrink-0'} />
            <span>Team</span>
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('billing')}
            className={`flex flex-col md:flex-row items-center justify-center md:justify-start gap-1.5 md:gap-3 px-2 md:px-4 py-2.5 md:py-3 rounded-xl font-bold transition-all text-xs md:text-sm outline-none cursor-pointer ${
              activeTab === 'billing'
                ? 'bg-[#0a0f16] text-white border border-orange-500/35 shadow-lg'
                : 'text-gray-400 hover:bg-white/5 hover:text-white border border-transparent'
            }`}
          >
            <CreditCard size={17} className={activeTab === 'billing' ? 'text-orange-500 shrink-0' : 'shrink-0'} />
            <span>Billing</span>
          </button>
        </div>

        {/* Content Area */}
        <div className="md:col-span-3 min-w-0">
          <AnimatePresence mode="wait">

            {/* --- TAB: BILLING OVERVIEW --- */}
            {activeTab === 'billing' && (
              <motion.div key="billing" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} className="space-y-6">
                <div className="p-5 sm:p-6 rounded-2xl bg-[#0a0f16] border border-white/10 shadow-lg">
                  <div className="flex items-center justify-between mb-3">
                    <span className="text-[10px] font-bold text-orange-500 uppercase tracking-widest">Current Subscription</span>
                    <span className="w-2 h-2 rounded-full bg-orange-500" />
                  </div>
                  <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-5 pb-6 border-b border-white/10 mb-6">
                    <div>
                      <h2 className="text-2xl sm:text-3xl font-black text-white mb-1">14-Day Free Trial</h2>
                      <p className="text-xs sm:text-sm text-orange-400 font-medium">Expires in 12 days</p>
                    </div>
                    <button
                      type="button"
                      onClick={() => navigate('/admin/store')}
                      className="w-full sm:w-auto min-h-11 px-5 py-2.5 bg-orange-500 hover:bg-orange-600 active:scale-[0.98] text-white text-xs sm:text-sm font-bold rounded-xl transition-all shadow-md shadow-orange-500/20 whitespace-nowrap outline-none cursor-pointer"
                    >
                      View Plans &amp; Upgrade
                    </button>
                  </div>
                  <div className="flex items-start gap-3 p-4 rounded-xl bg-white/5 border border-red-500/30 relative overflow-hidden">
                    <div className="absolute top-0 left-0 w-1.5 h-full bg-red-500" />
                    <ShieldAlert className="text-red-500 shrink-0 mt-0.5 ml-2" size={18} />
                    <div>
                      <h4 className="text-sm font-bold text-white mb-1">Danger Zone</h4>
                      <p className="text-xs text-gray-400 leading-relaxed mb-3">
                        Canceling your subscription will immediately revoke workspace access for all your team members and halt any active BDC integrations.
                      </p>
                      <button type="button" className="text-xs font-bold text-red-500 hover:text-red-400 transition-colors cursor-pointer">
                        Cancel Subscription
                      </button>
                    </div>
                  </div>
                </div>
              </motion.div>
            )}

            {/* --- TAB: TEAM MANAGEMENT --- */}
            {activeTab === 'team' && (
              <motion.div key="team" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} className="space-y-6">
                <div className="p-5 sm:p-6 rounded-2xl bg-[#0a0f16] border border-white/10 shadow-lg">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-[10px] font-bold uppercase tracking-widest text-orange-500">Onboarding</span>
                    <span className="w-2 h-2 rounded-full bg-emerald-500" />
                  </div>
                  <h3 className="text-base sm:text-lg font-bold text-white mb-1.5">Dealership Invite Link</h3>
                  <p className="text-xs sm:text-sm text-gray-400 mb-4 leading-relaxed">
                    Send this unique URL to your employees. Anyone who registers through this link will be automatically tied to your store&apos;s master hub.
                  </p>
                  <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
                    <div className="flex-1 px-3.5 py-2.5 bg-black/40 border border-white/15 rounded-xl text-xs sm:text-sm font-mono text-gray-300 overflow-x-auto whitespace-nowrap">
                      {inviteLink}
                    </div>
                    <button
                      type="button"
                      onClick={handleCopyLink}
                      className="min-h-11 px-5 py-2.5 bg-orange-500 hover:bg-orange-600 active:scale-[0.98] text-white text-xs sm:text-sm font-bold rounded-xl transition-all shadow-md shadow-orange-500/20 flex items-center justify-center gap-2 shrink-0 outline-none cursor-pointer"
                    >
                      {copied ? <CheckCircle2 size={16} /> : <Copy size={16} />}
                      <span>{copied ? 'Copied!' : 'Copy Invite Link'}</span>
                    </button>
                  </div>
                </div>

                <div className="rounded-2xl border border-white/10 bg-[#0a0f16] overflow-hidden shadow-lg">
                  <div className="px-5 sm:px-6 py-4 border-b border-white/10 bg-white/5">
                    <h3 className="text-[10px] font-bold uppercase tracking-widest text-gray-400">Active Users</h3>
                  </div>
                  <div className="divide-y divide-white/5">
                    {teamMembers.map((user) => (
                      <div key={user.id} className="p-5 sm:p-6 flex items-center justify-between gap-4 hover:bg-white/2 transition-colors">
                        <div className="min-w-0">
                          <div className="flex items-center gap-2.5 mb-1">
                            <span className="font-bold text-white text-base truncate">{user.name}</span>
                            {user.role === 'Owner' && (
                              <span className="px-2.5 py-0.5 rounded-md text-[10px] font-bold uppercase tracking-widest bg-orange-500/10 text-orange-500 shrink-0">
                                Owner
                              </span>
                            )}
                          </div>
                          <div className="text-xs text-gray-400 flex flex-wrap items-center gap-x-2 gap-y-0.5">
                            <span>{user.role}</span>
                            <span>&bull;</span>
                            <span className="truncate">{user.email}</span>
                          </div>
                        </div>
                        {user.role !== 'Owner' && (
                          <button
                            type="button"
                            aria-label={`Remove ${user.name}`}
                            className="p-2.5 text-gray-400 hover:text-red-500 bg-white/5 hover:bg-red-500/10 active:scale-95 rounded-xl transition-all border border-white/5 hover:border-red-500/20 shrink-0 outline-none cursor-pointer"
                          >
                            <Trash2 size={16} />
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