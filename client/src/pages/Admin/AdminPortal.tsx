import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { CreditCard, Users, Settings, Copy, Trash2, CheckCircle2, Building2, ExternalLink, ShieldAlert, Upload, RefreshCw, Globe, Database } from 'lucide-react';

// --- SKELETON LOADER COMPONENT ---
const SyncSkeleton = () => (
  <div className="animate-pulse space-y-4 mt-4 p-4 border border-white/10 rounded-xl bg-black/30">
    <div className="flex items-center gap-4">
      <div className="w-10 h-10 rounded-full bg-white/10"></div>
      <div className="flex-1 space-y-2">
        <div className="h-2 bg-white/10 rounded w-1/3"></div>
        <div className="h-2 bg-white/10 rounded w-1/4"></div>
      </div>
      <div className="w-16 h-6 rounded bg-white/10"></div>
    </div>
    <div className="space-y-2 pt-2">
      <div className="h-2 bg-white/10 rounded w-full"></div>
      <div className="h-2 bg-white/10 rounded w-5/6"></div>
      <div className="h-2 bg-white/10 rounded w-4/6"></div>
    </div>
  </div>
);

type Tab = 'billing' | 'team' | 'settings';

export default function AdminPortal() {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<Tab>('billing');
  const [copied, setCopied] = useState(false);

  // Sync Simulation State
  const [isSyncing, setIsSyncing] = useState(false);
  const [syncComplete, setSyncComplete] = useState(false);

  // Simulated Master Account Data
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

  const handleSync = () => {
    setIsSyncing(true);
    setSyncComplete(false);
    setTimeout(() => {
      setIsSyncing(false);
      setSyncComplete(true);
    }, 3000);
  };

  return (
    <div className="min-h-screen w-full bg-[#05080c] text-white pt-28 pb-12 px-4 sm:px-6">
      
      {/* Page Header with App Launcher & Upgrade Button */}
      <div className="max-w-5xl mx-auto mb-10 flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div>
          <h1 className="text-3xl md:text-4xl font-black drop-shadow-md tracking-tight">Store Administration</h1>
          <p className="text-gray-400 mt-2 font-medium">Manage your team access, configurations, and billing.</p>
        </div>
        <div className="flex flex-col sm:flex-row gap-4">
          <button 
            onClick={() => navigate('/admin/store')}
            className="px-6 py-3 bg-orange-500/10 hover:bg-orange-500/20 text-orange-500 font-bold rounded-xl transition-all border border-orange-500/30 flex items-center justify-center gap-2 outline-none cursor-pointer"
          >
            Upgrade Plan
          </button>
          <button 
            onClick={() => navigate('/app/hub')}
            className="px-6 py-3 bg-white/10 hover:bg-white/20 text-white font-bold rounded-xl transition-all border border-white/20 shadow-lg flex items-center justify-center gap-2 group outline-none cursor-pointer"
          >
            Launch Workspace 
            <ExternalLink size={18} className="group-hover:translate-x-1 group-hover:-translate-y-1 transition-transform" />
          </button>
        </div>
      </div>

      <div className="max-w-5xl mx-auto grid grid-cols-1 md:grid-cols-4 gap-8">
        
        {/* Sidebar Navigation */}
        <div className="md:col-span-1 flex flex-col gap-2">
          <button 
            onClick={() => setActiveTab('billing')}
            className={`flex items-center gap-3 px-4 py-3 rounded-xl font-bold transition-all text-sm md:text-base outline-none cursor-pointer ${activeTab === 'billing' ? 'bg-white/10 text-white border border-white/20 shadow-lg' : 'text-gray-400 hover:bg-white/5 hover:text-white border border-transparent'}`}
          >
            <CreditCard size={20} /> Billing & Plan
          </button>
          <button 
            onClick={() => setActiveTab('team')}
            className={`flex items-center gap-3 px-4 py-3 rounded-xl font-bold transition-all text-sm md:text-base outline-none cursor-pointer ${activeTab === 'team' ? 'bg-white/10 text-white border border-white/20 shadow-lg' : 'text-gray-400 hover:bg-white/5 hover:text-white border border-transparent'}`}
          >
            <Users size={20} /> Team Management
          </button>
          <button 
            onClick={() => setActiveTab('settings')}
            className={`flex items-center gap-3 px-4 py-3 rounded-xl font-bold transition-all text-sm md:text-base outline-none cursor-pointer ${activeTab === 'settings' ? 'bg-white/10 text-white border border-white/20 shadow-lg' : 'text-gray-400 hover:bg-white/5 hover:text-white border border-transparent'}`}
          >
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
                    <button 
                      onClick={() => navigate('/admin/store')}
                      className="px-6 py-3 bg-orange-500 hover:bg-orange-600 text-white font-bold rounded-xl transition-all shadow-[0_0_15px_rgba(249,115,22,0.4)] whitespace-nowrap outline-none cursor-pointer"
                    >
                      View Plans & Upgrade
                    </button>
                  </div>

                  <div className="flex items-start gap-3 p-4 rounded-xl bg-red-500/10 border border-red-500/20">
                    <ShieldAlert className="text-red-500 shrink-0 mt-0.5" size={20} />
                    <div>
                      <h4 className="text-sm font-bold text-white mb-1">Danger Zone</h4>
                      <p className="text-xs text-gray-400 leading-relaxed mb-3">Canceling your subscription will immediately revoke workspace access for all your team members and halt any active BDC integrations.</p>
                      <button className="text-xs font-bold text-red-500 hover:text-red-400 transition-colors cursor-pointer">Cancel Subscription</button>
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
                    <button 
                      onClick={handleCopyLink}
                      className="px-6 py-3 bg-orange-500 hover:bg-orange-600 text-white font-bold rounded-xl transition-all shadow-md flex items-center gap-2 shrink-0 outline-none cursor-pointer"
                    >
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
                            <span>{user.role}</span> • <span>{user.email}</span>
                          </div>
                        </div>
                        {user.role !== 'Owner' && (
                          <button className="p-2 text-gray-500 hover:text-red-500 hover:bg-red-500/10 rounded-lg transition-colors border border-transparent hover:border-red-500/20 self-start sm:self-auto outline-none cursor-pointer">
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
              <motion.div key="settings" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} className="space-y-6">
                
                <div className="p-6 sm:p-8 rounded-2xl bg-[#0a0f16] border border-white/10 shadow-xl">
                  <div className="flex items-center gap-3 mb-6 pb-6 border-b border-white/10">
                    <Building2 className="text-orange-500" size={24} />
                    <h3 className="text-xl font-bold text-white">Dealership Profile</h3>
                  </div>

                  <form className="space-y-8" onSubmit={e => e.preventDefault()}>
                    
                    {/* Logo Uploader */}
                    <div className="flex items-center gap-6">
                      <div className="w-24 h-24 rounded-2xl bg-black/50 border-2 border-dashed border-white/20 flex flex-col items-center justify-center text-gray-500 hover:text-orange-500 hover:border-orange-500/50 transition-colors cursor-pointer relative overflow-hidden group">
                        <Upload size={24} className="mb-1" />
                        <span className="text-xs font-bold">Upload</span>
                        <input type="file" className="absolute inset-0 opacity-0 cursor-pointer" accept="image/*" />
                      </div>
                      <div>
                        <h4 className="text-sm font-bold text-white">Store Logo</h4>
                        <p className="text-xs text-gray-400 mt-1 max-w-xs">Upload your dealership's logo (PNG or JPG). This will be displayed on client-facing communications and your internal hub.</p>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                      <div>
                        <label className="block text-xs font-medium text-gray-400 ml-1 mb-1.5">Dealership Name</label>
                        <input type="text" defaultValue="Premium Auto Group" className="w-full px-4 py-3 rounded-xl bg-black/50 border border-white/10 focus:border-orange-500 outline-none transition-all text-sm text-white" />
                      </div>
                      <div>
                        <label className="block text-xs font-medium text-gray-400 ml-1 mb-1.5">Primary Contact Phone</label>
                        <input type="tel" defaultValue="(555) 123-4567" className="w-full px-4 py-3 rounded-xl bg-black/50 border border-white/10 focus:border-orange-500 outline-none transition-all text-sm text-white" />
                      </div>
                    </div>

                    {/* Inventory & Data Integrations */}
                    <div className="pt-6 border-t border-white/10 space-y-6">
                      <div className="flex items-center gap-2">
                        <Database className="text-blue-500" size={20} />
                        <h4 className="text-lg font-bold text-white">Data Integrations</h4>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div>
                          <label className="block text-xs font-medium text-gray-400 ml-1 mb-1.5">Dealership Website URL</label>
                          <div className="relative">
                            <Globe className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" size={16} />
                            <input type="url" placeholder="https://www.premiumauto.com" className="w-full pl-10 pr-4 py-3 rounded-xl bg-black/50 border border-white/10 focus:border-orange-500 outline-none transition-all text-sm text-white" />
                          </div>
                        </div>
                        <div>
                          <label className="block text-xs font-medium text-gray-400 ml-1 mb-1.5">Inventory Feed URL (vAuto, HomeNet, XML)</label>
                          <div className="relative">
                            <Database className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" size={16} />
                            <input type="url" placeholder="ftp://feed.homenetinc.com/..." className="w-full pl-10 pr-4 py-3 rounded-xl bg-black/50 border border-white/10 focus:border-orange-500 outline-none transition-all text-sm text-white" />
                          </div>
                        </div>
                      </div>

                      {/* Sync Button & Output */}
                      <div>
                        <button 
                          onClick={handleSync}
                          disabled={isSyncing}
                          className="flex items-center justify-center gap-2 px-6 py-3 bg-white/5 hover:bg-white/10 text-white font-bold rounded-xl transition-all border border-white/10 outline-none disabled:opacity-50 cursor-pointer"
                        >
                          <RefreshCw size={16} className={isSyncing ? "animate-spin text-orange-500" : ""} /> 
                          {isSyncing ? "Fetching Inventory Data..." : "Force Inventory Sync"}
                        </button>

                        {/* Rendering the Skeleton or Success State */}
                        {isSyncing && <SyncSkeleton />}
                        {!isSyncing && syncComplete && (
                          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="mt-4 p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-start gap-3">
                            <CheckCircle2 className="text-emerald-500 shrink-0 mt-0.5" size={18} />
                            <div>
                              <h5 className="text-sm font-bold text-emerald-500">Sync Successful</h5>
                              <p className="text-xs text-gray-400 mt-1">Successfully fetched 342 active units from the provider feed. Database updated.</p>
                            </div>
                          </motion.div>
                        )}
                      </div>
                    </div>

                    <div className="pt-6 border-t border-white/10 flex justify-end">
                      <button className="px-8 py-3 bg-orange-500 hover:bg-orange-600 text-white font-bold rounded-xl transition-all shadow-[0_0_15px_rgba(249,115,22,0.4)] outline-none cursor-pointer">
                        Save Configurations
                      </button>
                    </div>
                  </form>
                </div>
              </motion.div>
            )}

          </AnimatePresence>
        </div>
      </div>
    </div>
  );
}