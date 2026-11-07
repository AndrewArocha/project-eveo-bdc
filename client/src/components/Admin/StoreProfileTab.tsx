import { useState } from 'react';
import { motion } from 'framer-motion';
import { Building2, Upload, Trash2, Globe, CheckCircle2, Database, Plus, Pencil, RefreshCw, Users, Share2, Target, Phone, Sparkles } from 'lucide-react';
import { type Integration } from '../../data/mockDatabase';

// --- MOCK STORE PROFILE STATE (Ready for Backend API Swap in Phase 2) ---
interface StoreProfileData {
  name: string;
  phone: string;
  websiteUrl: string;
  logoUrl: string | null;
}

const INITIAL_STORE_PROFILE: StoreProfileData = {
  name: 'Premium Auto Group',
  phone: '(555) 123-4567',
  websiteUrl: 'https://www.premiumauto.com',
  logoUrl: null,
};

/**
 * Generates a crisp, deterministic SVG brand badge from any dealership domain
 * so the frontend simulation never hangs or fails on external ad-blockers.
 */
function generateMockBrandLogo(domainInput: string): string {
  const cleanDomain = domainInput
    .trim()
    .toLowerCase()
    .replace(/^(?:https?:\/\/)?(?:www\.)?/i, '')
    .split('/')[0];

  const brandName = cleanDomain.split('.')[0] || 'dealer';
  const initials = brandName.slice(0, 2).toUpperCase();

  const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 120 120" width="120" height="120">
    <defs>
      <linearGradient id="bg" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stop-color="#0f172a" />
        <stop offset="100%" stop-color="#1e293b" />
      </linearGradient>
    </defs>
    <rect width="120" height="120" rx="24" fill="url(#bg)" />
    <circle cx="60" cy="60" r="46" fill="none" stroke="#f97316" stroke-width="3" stroke-opacity="0.6" />
    <text x="60" y="66" font-family="system-ui, sans-serif" font-size="38" font-weight="900" fill="#ffffff" text-anchor="middle">${initials}</text>
    <text x="60" y="90" font-family="monospace" font-size="10" font-weight="700" fill="#fb923c" text-anchor="middle" letter-spacing="1">${brandName.slice(0, 10).toUpperCase()}</text>
  </svg>`;

  return `data:image/svg+xml;utf8,${encodeURIComponent(svg)}`;
}

const SyncSkeleton = () => (
  <div className="animate-pulse space-y-4 mt-4 p-4 border border-white/10 rounded-2xl bg-black/30">
    <div className="flex items-center gap-4">
      <div className="w-10 h-10 rounded-full bg-white/10 shrink-0" />
      <div className="flex-1 space-y-2">
        <div className="h-2 bg-white/10 rounded w-1/3" />
        <div className="h-2 bg-white/10 rounded w-1/4" />
      </div>
      <div className="w-16 h-6 rounded bg-white/10 shrink-0" />
    </div>
    <div className="space-y-2 pt-2">
      <div className="h-2 bg-white/10 rounded w-full" />
      <div className="h-2 bg-white/10 rounded w-5/6" />
    </div>
  </div>
);

interface StoreProfileTabProps {
  integrations: Integration[];
  setIntegrations: React.Dispatch<React.SetStateAction<Integration[]>>;
  setIsIntegrationModalOpen: (val: boolean) => void;
}

export default function StoreProfileTab({ integrations, setIntegrations, setIsIntegrationModalOpen }: StoreProfileTabProps) {
  // Unified Mock Store Profile State
  const [profile, setProfile] = useState<StoreProfileData>(INITIAL_STORE_PROFILE);
  const [isFetchingLogo, setIsFetchingLogo] = useState(false);
  const [isSavedToast, setIsSavedToast] = useState(false);

  // Sync Simulation State
  const [isSyncing, setIsSyncing] = useState(false);
  const [syncData, setSyncData] = useState<{ timestamp: string; inventoryCount: number; leadsCount: number } | null>(null);

  // Google S2 Favicon API & Duckduckgo unavatar loader w/ fallback svg
const handleFetchBrandLogo = () => {
    if (!profile.websiteUrl.trim()) return;
    setIsFetchingLogo(true);

    const cleanDomain = profile.websiteUrl
      .trim()
      .toLowerCase()
      .replace(/^(?:https?:\/\/)?(?:www\.)?/i, '')
      .split('/')[0];

    // 1. Try high-res unavatar/duckduckgo scraper first, but reject tiny 16x16 generic globes!
    const candidateUrl = `https://unavatar.io/${encodeURIComponent(cleanDomain)}?fallback=false`;

    const img = new Image();
    img.src = candidateUrl;

    img.onload = () => {
      // Only accept if it's a real high-res icon (>= 32px), never a blurry 16x16 fallback
      if (img.naturalWidth >= 32) {
        setProfile((prev) => ({ ...prev, logoUrl: candidateUrl }));
      } else {
        setProfile((prev) => ({ ...prev, logoUrl: generateMockBrandLogo(cleanDomain) }));
      }
      setIsFetchingLogo(false);
    };

    img.onerror = () => {
      // Fallback to crisp vector SVG emblem (e.g. NJX / KIA) if blocked or missing
      setProfile((prev) => ({ ...prev, logoUrl: generateMockBrandLogo(cleanDomain) }));
      setIsFetchingLogo(false);
    };
  };

  // Support local file upload preview as well
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result === 'string') {
        setProfile((prev) => ({ ...prev, logoUrl: reader.result as string }));
      }
    };
    reader.readAsDataURL(file);
  };

  const handleSaveProfile = (e: React.FormEvent) => {
    e.preventDefault();
    setIsSavedToast(true);
    setTimeout(() => setIsSavedToast(false), 2500);
  };

  const handleSync = async () => {
    setIsSyncing(true);
    setSyncData(null);
    try {
      await new Promise(resolve => setTimeout(resolve, 2000));
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
    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} className="space-y-6 relative">
      <div className="p-5 sm:p-8 rounded-3xl bg-[#0a0f16] border border-white/10 shadow-xl">
        <div className="flex items-center justify-between gap-3 mb-6 pb-5 sm:pb-6 border-b border-white/10">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-orange-500/10 border border-orange-500/20 flex items-center justify-center shrink-0">
              <Building2 className="text-orange-500" size={20} />
            </div>
            <div>
              <h3 className="text-lg sm:text-xl font-bold text-white">Dealership Profile</h3>
              <p className="text-xs text-gray-400 mt-0.5">Configure brand assets and active data pipelines.</p>
            </div>
          </div>
          {isSavedToast && (
            <span className="px-3 py-1 rounded-full bg-emerald-500/15 border border-emerald-500/30 text-emerald-400 text-xs font-bold flex items-center gap-1.5">
              <CheckCircle2 size={14} /> Saved
            </span>
          )}
        </div>

        <form className="space-y-6 sm:space-y-8" onSubmit={handleSaveProfile}>

          {/* Logo & Website Auto-Fetch Row */}
          <div className="flex flex-col sm:flex-row items-center gap-5 sm:gap-6">
            {profile.logoUrl ? (
              <div className="w-24 h-24 rounded-2xl bg-[#0f172a] border border-white/20 flex flex-col items-center justify-center relative overflow-hidden group shadow-lg shrink-0">
                <img src={profile.logoUrl} alt={`${profile.name} Brand Logo`} className="w-full h-full object-contain p-1.5" />
                <button
                  type="button"
                  aria-label="Remove dealership logo"
                  onClick={() => setProfile((prev) => ({ ...prev, logoUrl: null }))}
                  className="absolute inset-0 bg-black/70 flex items-center justify-center opacity-0 group-hover:opacity-100 focus:opacity-100 transition-opacity backdrop-blur-[2px] text-white hover:text-red-500 cursor-pointer"
                >
                  <Trash2 size={22} />
                </button>
              </div>
            ) : (
              <label className="w-24 h-24 rounded-2xl bg-black/50 border-2 border-dashed border-white/20 flex flex-col items-center justify-center text-gray-400 hover:text-orange-500 hover:border-orange-500/50 active:scale-95 transition-all cursor-pointer relative overflow-hidden group shrink-0">
                {isFetchingLogo ? <RefreshCw className="animate-spin text-orange-500 mb-1" size={22} /> : <Upload size={22} className="mb-1" />}
                <span className="text-[11px] font-bold">{isFetchingLogo ? 'Fetching...' : 'Upload'}</span>
                {!isFetchingLogo && <input type="file" onChange={handleFileUpload} aria-label="Upload dealership logo" className="sr-only" accept="image/*" />}
              </label>
            )}

            <div className="flex-1 w-full min-w-0">
              <div className="flex items-center justify-between mb-1.5">
                <label htmlFor="dealership-url" className="block text-xs font-semibold text-gray-400 ml-1">Dealership Website URL</label>
                {profile.logoUrl && (
                  <button
                    type="button"
                    onClick={() => setProfile((prev) => ({ ...prev, logoUrl: null }))}
                    className="text-[10px] font-bold text-emerald-400 hover:text-red-400 tracking-wider uppercase flex items-center gap-1 cursor-pointer transition-colors"
                  >
                    <CheckCircle2 size={12} /> Brand Asset Active (Reset)
                  </button>
                )}
              </div>
              <div className="relative flex items-center">
                <Globe className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-500 pointer-events-none" size={16} />
                <input
                  id="dealership-url"
                  type="url"
                  placeholder="https://www.premiumauto.com"
                  value={profile.websiteUrl}
                  onChange={(e) => setProfile((prev) => ({ ...prev, websiteUrl: e.target.value }))}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault();
                      void handleFetchBrandLogo();
                    }
                  }}
                  className="w-full min-h-12 pl-10 pr-24 py-3 rounded-xl bg-black/50 border border-white/10 focus:border-orange-500 outline-none transition-all text-base sm:text-sm text-white"
                />
                <button
                  type="button"
                  onClick={() => void handleFetchBrandLogo()}
                  disabled={!profile.websiteUrl.trim() || isFetchingLogo}
                  className="absolute right-2 px-3 py-1.5 rounded-lg bg-white/10 hover:bg-white/15 active:scale-95 text-[11px] font-bold text-orange-400 flex items-center gap-1 transition-all disabled:opacity-40 cursor-pointer"
                >
                  <Sparkles size={12} /> {isFetchingLogo ? 'Syncing' : 'Fetch'}
                </button>
              </div>
              <p className="text-[11px] sm:text-xs text-gray-500 mt-2 ml-1">
                Enter your domain and tap <span className="text-gray-300 font-semibold">Fetch</span> (or press <kbd className="bg-white/10 px-1.5 py-0.5 rounded text-white">Enter</kbd>) to generate your store emblem.
              </p>
            </div>
          </div>

          {/* Dealership Name & Primary Contact Phone */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6">
            <div>
              <label htmlFor="dealership-name" className="block text-xs font-semibold text-gray-400 ml-1 mb-1.5">Dealership Name</label>
              <input
                id="dealership-name"
                type="text"
                value={profile.name}
                onChange={(e) => setProfile((prev) => ({ ...prev, name: e.target.value }))}
                className="w-full min-h-12 px-4 py-3 rounded-xl bg-black/50 border border-white/10 focus:border-orange-500 outline-none transition-all text-base sm:text-sm text-white"
              />
            </div>
            <div>
              <label htmlFor="dealership-phone" className="block text-xs font-semibold text-gray-400 ml-1 mb-1.5">Primary Contact Phone</label>
              <div className="relative flex items-center">
                <Phone className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-500 pointer-events-none" size={16} />
                <input
                  id="dealership-phone"
                  type="tel"
                  value={profile.phone}
                  onChange={(e) => setProfile((prev) => ({ ...prev, phone: e.target.value }))}
                  className="w-full min-h-12 pl-10 pr-4 py-3 rounded-xl bg-black/50 border border-white/10 focus:border-orange-500 outline-none transition-all text-base sm:text-sm text-white"
                />
              </div>
            </div>
          </div>

          {/* Data Integrations Section */}
          <div className="pt-6 border-t border-white/10 space-y-5 sm:space-y-6">
            <div className="flex items-center justify-between gap-3">
              <div className="flex items-center gap-2.5">
                <Database className="text-blue-500 shrink-0" size={20} />
                <h4 className="text-base sm:text-lg font-bold text-white">Data Integrations</h4>
              </div>
              {integrations.length > 0 && (
                <button
                  type="button"
                  onClick={() => setIsIntegrationModalOpen(true)}
                  className="min-h-10 flex items-center gap-1.5 px-3.5 py-2 bg-orange-500/10 hover:bg-orange-500/20 active:scale-95 text-orange-500 text-xs font-bold rounded-xl transition-all border border-orange-500/30 cursor-pointer outline-none shrink-0"
                >
                  <Plus size={14} /> Add Integration
                </button>
              )}
            </div>

            {integrations.length === 0 ? (
              <div className="w-full p-6 sm:p-8 rounded-2xl border-2 border-dashed border-white/10 bg-black/30 flex flex-col items-center justify-center text-center">
                <div className="w-12 h-12 bg-white/5 rounded-full flex items-center justify-center mb-3">
                  <Database size={24} className="text-gray-500" />
                </div>
                <h5 className="text-sm font-bold text-white mb-1">No integrations connected</h5>
                <p className="text-xs text-gray-400 max-w-sm mb-4 leading-relaxed">Connect your CRM, inventory feed, and social media accounts to enable automated EVEO routing.</p>
                <button
                  type="button"
                  onClick={() => setIsIntegrationModalOpen(true)}
                  className="min-h-11 px-6 py-2.5 bg-white/10 hover:bg-white/20 active:scale-95 text-white font-bold text-sm rounded-xl transition-all flex items-center gap-2 cursor-pointer outline-none"
                >
                  <Plus size={16} /> Add First Integration
                </button>
              </div>
            ) : (
              <div className="space-y-3">
                {integrations.map((integration) => (
                  <div key={integration.id} className="flex items-center justify-between p-4 rounded-2xl bg-white/4 border border-white/10 gap-3">
                    <div className="flex items-center gap-3.5 min-w-0">
                      <div className="w-10 h-10 rounded-xl bg-black/50 border border-white/5 flex items-center justify-center shrink-0">
                        {getIntegrationIcon(integration.type)}
                      </div>
                      <div className="min-w-0">
                        <div className="flex flex-wrap items-center gap-2 mb-0.5">
                          <h5 className="text-sm font-bold text-white truncate">{integration.provider}</h5>
                          <span className="px-1.5 py-0.5 rounded bg-emerald-500/20 text-emerald-400 text-[9px] font-black uppercase tracking-wider border border-emerald-500/20 flex items-center gap-1 shrink-0">
                            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" /> Active
                          </span>
                        </div>
                        <p className="text-xs text-gray-400 font-mono truncate">{integration.value}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-1.5 shrink-0">
                      <button
                        type="button"
                        aria-label={`Edit ${integration.provider}`}
                        className="p-2.5 text-gray-400 hover:text-white hover:bg-white/10 active:scale-95 rounded-xl transition-all outline-none cursor-pointer"
                      >
                        <Pencil size={16} />
                      </button>
                      <button
                        type="button"
                        aria-label={`Delete ${integration.provider}`}
                        onClick={() => setIntegrations(integrations.filter(i => i.id !== integration.id))}
                        className="p-2.5 text-gray-400 hover:text-red-500 hover:bg-red-500/10 active:scale-95 rounded-xl transition-all outline-none cursor-pointer"
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}

            <div className="pt-4 mt-4 border-t border-white/5">
              <button
                type="button"
                onClick={() => void handleSync()}
                disabled={isSyncing || integrations.length === 0}
                className="w-full sm:w-auto min-h-12 flex items-center justify-center gap-2 px-6 py-3 bg-white/5 hover:bg-white/10 active:scale-[0.98] text-white text-sm font-bold rounded-xl transition-all border border-white/10 outline-none disabled:opacity-50 cursor-pointer"
              >
                <RefreshCw size={16} className={isSyncing ? "animate-spin text-orange-500" : ""} />
                {isSyncing ? "Fetching Data Sources..." : "Force Global Sync"}
              </button>
              {isSyncing && <SyncSkeleton />}
              {!isSyncing && syncData && (
                <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="mt-4 p-4 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div className="flex items-start gap-3">
                    <CheckCircle2 className="text-emerald-500 shrink-0 mt-0.5" size={18} />
                    <div>
                      <h5 className="text-sm font-bold text-emerald-500">Sync Successful at {syncData.timestamp}</h5>
                      <p className="text-xs text-gray-400 mt-1 leading-relaxed">
                        Successfully fetched <strong className="text-white">{syncData.inventoryCount} active units</strong> and <strong className="text-white">{syncData.leadsCount} new leads</strong>. Database updated.
                      </p>
                    </div>
                  </div>
                </motion.div>
              )}
            </div>
          </div>

          <div className="pt-6 border-t border-white/10 flex justify-end">
            <button
              type="submit"
              className="w-full sm:w-auto min-h-13 px-8 py-3.5 bg-orange-500 hover:bg-orange-600 active:scale-[0.98] text-white text-sm font-black rounded-xl transition-all shadow-[0_8px_20px_rgba(249,115,22,0.35)] outline-none cursor-pointer"
            >
              Save Configurations
            </button>
          </div>
        </form>
      </div>
    </motion.div>
  );
}