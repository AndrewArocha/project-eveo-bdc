import { useState } from 'react';
import { motion } from 'framer-motion';
import { Building2, Upload, Trash2, Globe, CheckCircle2, Database, Plus, Pencil, RefreshCw, Users, Share2, Target, Phone} from 'lucide-react';
import { type Integration } from '../../data/mockDatabase';

const SyncSkeleton = () => (
  <div className="animate-pulse space-y-4 mt-4 p-4 border border-white/10 rounded-xl bg-black/30">
    <div className="flex items-center gap-4">
      <div className="w-10 h-10 rounded-full bg-white/10"></div>
      <div className="flex-1 space-y-2"><div className="h-2 bg-white/10 rounded w-1/3"></div><div className="h-2 bg-white/10 rounded w-1/4"></div></div>
      <div className="w-16 h-6 rounded bg-white/10"></div>
    </div>
    <div className="space-y-2 pt-2"><div className="h-2 bg-white/10 rounded w-full"></div><div className="h-2 bg-white/10 rounded w-5/6"></div></div>
  </div>
);

interface StoreProfileTabProps {
  integrations: Integration[];
  setIntegrations: React.Dispatch<React.SetStateAction<Integration[]>>;
  setIsIntegrationModalOpen: (val: boolean) => void;
}

export default function StoreProfileTab({ integrations, setIntegrations, setIsIntegrationModalOpen }: StoreProfileTabProps) {
  // Sync Simulation State
  const [isSyncing, setIsSyncing] = useState(false);
  const [syncData, setSyncData] = useState<{ timestamp: string, inventoryCount: number, leadsCount: number } | null>(null);

  // Clearbit Logic
  const [dealershipUrl, setDealershipUrl] = useState('');
  const [storeLogoUrl, setStoreLogoUrl] = useState<string | null>(null);
  const [isFetchingLogo, setIsFetchingLogo] = useState(false);

const fetchLogoFromClearbit = () => {
    if (!dealershipUrl) return;
    
    setIsFetchingLogo(true);
    
    // Clean the domain
    const cleanDomain = dealershipUrl.replace(/^(?:https?:\/\/)?(?:www\.)?/i, '').split('/')[0];
    const logoUrl = `https://logo.clearbit.com/${cleanDomain}`;
    
    // Create an invisible image element to test if the logo exists natively
    const img = new Image();
    img.src = logoUrl;
    
    // If it loads successfully, update the UI
    img.onload = () => {
      setStoreLogoUrl(logoUrl);
      setIsFetchingLogo(false);
    };
    
    // If it 404s or fails, reset
    img.onerror = () => {
      console.warn("No logo found for this domain.");
      setStoreLogoUrl(null);
      setIsFetchingLogo(false);
    };
  };

  const handleSync = async () => {
    setIsSyncing(true);
    setSyncData(null);
    try {
      await new Promise(resolve => setTimeout(resolve, 2500));
      setSyncData({
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        inventoryCount: Math.floor(Math.random() * (450 - 300 + 1)) + 300,
        leadsCount: Math.floor(Math.random() * (24 - 5 + 1)) + 5 
      });
    } catch (error) {
      console.error("Sync failed", error);
    } finally {
      setIsSyncing(false);
    }
  };

  const getIntegrationIcon = (type: string) => {
    switch (type) {
      case 'CRM': return <Users size={18} className="text-blue-400" />;
      case 'Inventory': return <Database size={18} className="text-emerald-400" />;
      case 'Social': return <Share2 size={18} className="text-pink-400" />;
      case 'Lead Source': return <Target size={18} className="text-orange-400" />;
      case 'Telephony': return <Phone size={18} className="text-purple-400" />;
      default: return <Database size={18} className="text-gray-400" />;
    }
  };

  return (
    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} className="space-y-6">
      <div className="p-6 sm:p-8 rounded-2xl bg-[#0a0f16] border border-white/10 shadow-xl">
        <div className="flex items-center gap-3 mb-6 pb-6 border-b border-white/10">
          <Building2 className="text-orange-500" size={24} />
          <h3 className="text-xl font-bold text-white">Dealership Profile</h3>
        </div>

        <form className="space-y-8" onSubmit={e => e.preventDefault()}>
          
          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-6">
            {storeLogoUrl ? (
              <div className="w-24 h-24 rounded-2xl bg-white border border-white/20 flex flex-col items-center justify-center relative overflow-hidden group shadow-lg">
                <img src={storeLogoUrl} alt="Store Logo" className="w-full h-full object-contain p-2" />
                <div className="absolute inset-0 bg-black/70 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity backdrop-blur-sm">
                  <button type="button" onClick={() => setStoreLogoUrl(null)} className="text-white hover:text-red-500 transition-colors p-2 cursor-pointer">
                    <Trash2 size={24}/>
                  </button>
                </div>
              </div>
            ) : (
              <div className="w-24 h-24 rounded-2xl bg-black/50 border-2 border-dashed border-white/20 flex flex-col items-center justify-center text-gray-500 hover:text-orange-500 hover:border-orange-500/50 transition-colors cursor-pointer relative overflow-hidden group">
                {isFetchingLogo ? <RefreshCw className="animate-spin text-orange-500 mb-1" size={24} /> : <Upload size={24} className="mb-1" />}
                <span className="text-xs font-bold">{isFetchingLogo ? 'Fetching...' : 'Upload'}</span>
                {!isFetchingLogo && <input type="file" className="absolute inset-0 opacity-0 cursor-pointer" accept="image/*" />}
              </div>
            )}

            <div className="flex-1 w-full">
              <div className="flex items-center justify-between mb-1.5">
                <label className="block text-xs font-medium text-gray-400 ml-1">Dealership Website URL</label>
                {storeLogoUrl && <span className="text-[10px] font-bold text-emerald-400 tracking-wider uppercase flex items-center gap-1"><CheckCircle2 size={12}/> API Fetched</span>}
              </div>
              <div className="relative">
                <Globe className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" size={16} />
                <input 
                  type="url" 
                  placeholder="https://www.premiumauto.com" 
                  value={dealershipUrl}
                  onChange={(e) => setDealershipUrl(e.target.value)}
                  onBlur={fetchLogoFromClearbit} 
                  onKeyDown={(e) => { 
                    if (e.key === 'Enter') {
                      e.preventDefault(); // FIX: STOPS ENTER KEY FORM SUBMISSION
                      fetchLogoFromClearbit(); 
                    }
                  }}
                  className="w-full pl-10 pr-4 py-3 rounded-xl bg-black/50 border border-white/10 focus:border-orange-500 outline-none transition-all text-sm text-white" 
                />
              </div>
              <p className="text-xs text-gray-500 mt-2 ml-1">Enter URL and press <kbd className="bg-white/10 px-1 py-0.5 rounded text-white">Enter</kbd> to automatically fetch logo.</p>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
            <div>
              <label className="block text-xs font-medium text-gray-400 ml-1 mb-1.5">Dealership Name</label>
              <input type="text" defaultValue="Premium Auto Group" className="w-full px-4 py-3 rounded-xl bg-black/50 border border-white/10 focus:border-orange-500 outline-none transition-all text-sm text-white" />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-400 ml-1 mb-1.5">Primary Contact Phone</label>
                <Phone className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" size={16} />
              <input type="tel" defaultValue="(555) 123-4567" className="w-full px-4 py-3 rounded-xl bg-black/50 border border-white/10 focus:border-orange-500 outline-none transition-all text-sm text-white" />
            </div>
          </div>

          <div className="pt-6 border-t border-white/10 space-y-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2"><Database className="text-blue-500" size={20} /><h4 className="text-lg font-bold text-white">Data Integrations</h4></div>
              {integrations.length > 0 && (
                <button type="button" onClick={() => setIsIntegrationModalOpen(true)} className="flex items-center gap-2 px-3 py-1.5 bg-orange-500/10 hover:bg-orange-500/20 text-orange-500 text-xs font-bold rounded-lg transition-colors border border-orange-500/30 cursor-pointer outline-none">
                  <Plus size={14} /> Add Integration
                </button>
              )}
            </div>

            {integrations.length === 0 ? (
              <div className="w-full p-8 rounded-2xl border-2 border-dashed border-white/10 bg-black/30 flex flex-col items-center justify-center text-center">
                <div className="w-12 h-12 bg-white/5 rounded-full flex items-center justify-center mb-3"><Database size={24} className="text-gray-500" /></div>
                <h5 className="text-sm font-bold text-white mb-1">No integrations connected</h5>
                <p className="text-xs text-gray-400 max-w-sm mb-4">Connect your CRM, inventory feed, and social media accounts to enable automated EVEO routing.</p>
                <button type="button" onClick={() => setIsIntegrationModalOpen(true)} className="px-6 py-2.5 bg-white/10 hover:bg-white/20 text-white font-bold text-sm rounded-xl transition-all flex items-center gap-2 cursor-pointer outline-none">
                  <Plus size={16} /> Add First Integration
                </button>
              </div>
            ) : (
              <div className="space-y-3">
                {integrations.map((integration) => (
                  <div key={integration.id} className="flex flex-col sm:flex-row sm:items-center justify-between p-4 rounded-xl bg-white/5 border border-white/10 gap-4">
                    <div className="flex items-center gap-4">
                      <div className="w-10 h-10 rounded-lg bg-black/50 border border-white/5 flex items-center justify-center shrink-0">{getIntegrationIcon(integration.type)}</div>
                      <div>
                        <div className="flex items-center gap-2 mb-0.5">
                          <h5 className="text-sm font-bold text-white">{integration.provider}</h5>
                          <span className="px-1.5 py-0.5 rounded-sm bg-emerald-500/20 text-emerald-400 text-[9px] font-black uppercase tracking-wider border border-emerald-500/20 flex items-center gap-1"><div className="w-1.5 h-1.5 rounded-full bg-emerald-400" /> Active</span>
                        </div>
                        <p className="text-xs text-gray-400 font-mono">{integration.value}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 self-end sm:self-auto shrink-0">
                      <button type="button" className="p-2 text-gray-400 hover:text-white hover:bg-white/10 rounded-lg transition-colors outline-none cursor-pointer"><Pencil size={16} /></button>
                      <button type="button" onClick={() => setIntegrations(integrations.filter(i => i.id !== integration.id))} className="p-2 text-gray-400 hover:text-red-500 hover:bg-red-500/10 rounded-lg transition-colors outline-none cursor-pointer"><Trash2 size={16} /></button>
                    </div>
                  </div>
                ))}
              </div>
            )}
            
            <div className="pt-4 mt-4 border-t border-white/5">
              <button type="button" onClick={handleSync} disabled={isSyncing || integrations.length === 0} className="flex items-center justify-center gap-2 px-6 py-3 bg-white/5 hover:bg-white/10 text-white font-bold rounded-xl transition-all border border-white/10 outline-none disabled:opacity-50 cursor-pointer">
                <RefreshCw size={16} className={isSyncing ? "animate-spin text-orange-500" : ""} /> 
                {isSyncing ? "Fetching Data Sources..." : "Force Global Sync"}
              </button>
              {isSyncing && <SyncSkeleton />}
              {!isSyncing && syncData && (
                <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="mt-4 p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div className="flex items-start gap-3">
                    <CheckCircle2 className="text-emerald-500 shrink-0 mt-0.5" size={18} />
                    <div>
                      <h5 className="text-sm font-bold text-emerald-500">Sync Successful at {syncData.timestamp}</h5>
                      <p className="text-xs text-gray-400 mt-1">Successfully fetched <strong className="text-white">{syncData.inventoryCount} active units</strong> and <strong className="text-white">{syncData.leadsCount} new leads</strong>. Database updated.</p>
                    </div>
                  </div>
                </motion.div>
              )}
            </div>
          </div>

          <div className="pt-6 border-t border-white/10 flex justify-end">
            {/* The ONLY button in this form allowed to submit! */}
            <button type="submit" className="px-8 py-3 bg-orange-500 hover:bg-orange-600 text-white font-bold rounded-xl transition-all shadow-[0_0_15px_rgba(249,115,22,0.4)] outline-none cursor-pointer">
              Save Configurations
            </button>
          </div>
        </form>
      </div>
    </motion.div>
  );
}