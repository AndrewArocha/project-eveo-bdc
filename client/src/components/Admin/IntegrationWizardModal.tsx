import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Users, Database, Share2, Target, Phone, ArrowLeft, ShieldAlert, RefreshCw, KeyRound, Link } from 'lucide-react';
import SwipeableModal from '../UI/SwipeableModal';
import { type Integration, type IntegrationType } from '../../data/mockDatabase';

interface IntegrationWizardModalProps {
  isOpen: boolean;
  onClose: () => void;
  integrations: Integration[];
  setIntegrations: React.Dispatch<React.SetStateAction<Integration[]>>;
}

export default function IntegrationWizardModal({ isOpen, onClose, integrations, setIntegrations }: IntegrationWizardModalProps) {
  const [integrationStep, setIntegrationStep] = useState<'SELECT' | 'CONFIGURE'>('SELECT');
  const [selectedType, setSelectedType] = useState<IntegrationType | null>(null);
  const [isVerifying, setIsVerifying] = useState(false);
  const [integrationError, setIntegrationError] = useState<string | null>(null);
  const [authValue, setAuthValue] = useState('');

  const handleSelectType = (type: IntegrationType) => {
    setSelectedType(type);
    setIntegrationStep('CONFIGURE');
    setIntegrationError(null);
    setAuthValue('');
  };

  const identifyIntegration = (input: string): { provider: string | null, expectedType: IntegrationType | null } => {
    const lowerInput = input.toLowerCase();
    if (lowerInput.includes('twilio') || input.startsWith('AC')) return { provider: 'Twilio', expectedType: 'Telephony' };
    if (lowerInput.includes('ringcentral')) return { provider: 'RingCentral', expectedType: 'Telephony' };
    if (lowerInput.includes('cars.com')) return { provider: 'Cars.com', expectedType: 'Lead Source' };
    if (lowerInput.includes('cargurus')) return { provider: 'CarGurus', expectedType: 'Lead Source' };
    if (lowerInput.includes('truecar')) return { provider: 'TrueCar', expectedType: 'Lead Source' };
    if (lowerInput.includes('facebook') || lowerInput.includes('meta') || lowerInput.includes('instagram')) return { provider: 'Meta Business Suite', expectedType: 'Social' };
    if (lowerInput.includes('linkedin')) return { provider: 'LinkedIn', expectedType: 'Social' };
    if (lowerInput.includes('elead') || input.startsWith('sk_live_')) return { provider: 'Elead', expectedType: 'CRM' };
    if (lowerInput.includes('vinsolutions')) return { provider: 'VinSolutions', expectedType: 'CRM' };
    if (lowerInput.includes('dealersocket')) return { provider: 'DealerSocket', expectedType: 'CRM' };
    if (lowerInput.includes('vauto')) return { provider: 'vAuto Feed', expectedType: 'Inventory' };
    if (lowerInput.includes('homenet')) return { provider: 'HomeNet', expectedType: 'Inventory' };
    return { provider: null, expectedType: null };
  };

  const verifyIntegrationAPI = async (type: string, provider: string, key: string) => {
    console.log(`Verifying ${type} integration with ${provider}...`);
    return new Promise((resolve, reject) => {
      setTimeout(() => {
        if (key.toLowerCase() === 'error') reject(new Error('Connection timeout or integration failed to sync.'));
        else resolve({ status: 'Success' });
      }, 1500); 
    });
  };

  const handleVerifyAndConnect = async () => {
    if (!selectedType || !authValue) return setIntegrationError('Please paste an integration link or API key.');
    setIsVerifying(true);
    setIntegrationError(null);

    const { provider, expectedType } = identifyIntegration(authValue);

    if (!provider || !expectedType) {
      setIsVerifying(false);
      return setIntegrationError("Couldn't automatically detect the integration provider. Please check your URL or API key.");
    }

    if (expectedType !== selectedType) {
      setIsVerifying(false);
      const friendlySelectedType = selectedType === 'Lead Source' ? 'Third-Party Lead Source' : selectedType;
      return setIntegrationError(`${provider} is not a ${friendlySelectedType} Integration. Please select the correct integration type.`);
    }

    try {
      await verifyIntegrationAPI(selectedType, provider, authValue);
      const newIntegration: Integration = {
        id: `int_${Date.now()}`, type: selectedType, provider,
        value: selectedType === 'Inventory' ? authValue : 'Connected Securely', status: 'Active'
      };
      setIntegrations([...integrations, newIntegration]);
      onClose();
    } catch (err){
      const error = err as Error;
      setIntegrationError(error.message || "Couldn't fetch integration.");
    } finally {
      setIsVerifying(false);
    }
  };

  const renderHelperText = () => {
    switch (selectedType) {
      case 'CRM':
        return (
          <div className="space-y-3 mt-4">
            <h5 className="text-sm font-bold text-white flex items-center gap-2"><KeyRound size={16} className="text-blue-400"/> Supported CRMs</h5>
            <ul className="text-sm text-gray-400 space-y-2 list-disc pl-5">
              <li><strong>Elead:</strong> Paste your Production API Key (starts with <code className="bg-white/10 px-1 py-0.5 rounded text-xs">sk_live_</code>)</li>
              <li><strong>VinSolutions:</strong> Enter your Connect API Webhook URL.</li>
              <li><strong>DealerSocket:</strong> Provide your secure routing token.</li>
            </ul>
          </div>
        );
      case 'Inventory':
        return (
          <div className="space-y-3 mt-4">
            <h5 className="text-sm font-bold text-white flex items-center gap-2"><Link size={16} className="text-emerald-400"/> Supported Feeds</h5>
            <ul className="text-sm text-gray-400 space-y-2 list-disc pl-5">
              <li><strong>vAuto:</strong> Paste your secure FTP feed path (e.g., <code className="bg-white/10 px-1 py-0.5 rounded text-xs">ftp://user:pass@feed.vauto.com/</code>)</li>
              <li><strong>HomeNet:</strong> Enter your designated IOL data export URL.</li>
            </ul>
          </div>
        );
      case 'Social':
        return (
          <div className="space-y-3 mt-4">
            <h5 className="text-sm font-bold text-white flex items-center gap-2"><Link size={16} className="text-pink-400"/> Supported Platforms</h5>
            <ul className="text-sm text-gray-400 space-y-2 list-disc pl-5">
              <li><strong>Meta Business Suite:</strong> Paste your Facebook/Instagram page URL to initiate OAuth.</li>
              <li><strong>LinkedIn:</strong> Enter your Company Page URL.</li>
            </ul>
          </div>
        );
      case 'Lead Source':
        return (
          <div className="space-y-3 mt-4">
            <h5 className="text-sm font-bold text-white flex items-center gap-2"><Link size={16} className="text-orange-400"/> Supported Lead Providers</h5>
            <ul className="text-sm text-gray-400 space-y-2 list-disc pl-5">
              <li><strong>Cars.com:</strong> Paste your custom ADF/XML webhook URL.</li>
              <li><strong>CarGurus:</strong> Enter your dealer feed routing link.</li>
              <li><strong>TrueCar:</strong> Provide your secure dealer endpoint.</li>
            </ul>
          </div>
        );
      case 'Telephony':
        return (
          <div className="space-y-3 mt-4">
            <h5 className="text-sm font-bold text-white flex items-center gap-2"><KeyRound size={16} className="text-purple-400"/> Supported Telecoms</h5>
            <ul className="text-sm text-gray-400 space-y-2 list-disc pl-5">
              <li><strong>Twilio:</strong> Paste your Account SID (starts with <code className="bg-white/10 px-1 py-0.5 rounded text-xs">AC</code>)</li>
              <li><strong>RingCentral:</strong> Enter your OAuth App Client ID.</li>
            </ul>
          </div>
        );
      default:
        return null;
    }
  };

  return (
    <SwipeableModal isOpen={isOpen} onClose={onClose} layoutId="integration-modal">
      <div className="flex flex-col h-full bg-[#0a0f16] text-gray-300 relative">
        <div className="absolute top-0 left-0 w-full h-1 bg-linear-to-r from-orange-500 to-orange-400" />
        <AnimatePresence mode="wait">
          
          {integrationStep === 'SELECT' && (
            <motion.div key="step-select" initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20, transition: { duration: 0.2 } }} className="flex flex-col h-full p-6 md:p-8">
              <div className="mb-6 shrink-0">
                <h2 className="text-xl font-black text-white mb-2">Add New Integration</h2>
                <p className="text-sm text-gray-400">Select a data source to connect to your EVEO workspace.</p>
              </div>
              
              {/* FIX: Increased bottom padding (pb-12) to ensure the 5th item is fully scrollable into view */}
              <div className="flex-1 overflow-y-auto pr-2 pb-12 grid grid-cols-1 sm:grid-cols-2 gap-4">
                
                <button type="button" onClick={() => handleSelectType('CRM')} className="relative flex flex-col text-left p-5 sm:p-6 rounded-2xl bg-white/2 border border-white/10 shadow-[inset_0_1px_1px_rgba(255,255,255,0.05),0_8px_20px_rgba(0,0,0,0.4)] hover:bg-white/5 hover:border-blue-500/40 hover:shadow-[inset_0_1px_1px_rgba(255,255,255,0.1),0_0_30px_rgba(59,130,246,0.15)] transition-all duration-300 backdrop-blur-xl cursor-pointer outline-none group overflow-hidden">
                  <div className="absolute top-0 right-0 w-32 h-32 bg-blue-500/10 blur-2xl rounded-full translate-x-1/2 -translate-y-1/2 group-hover:bg-blue-500/20 transition-colors duration-500" />
                  <div className="relative z-10">
                    <div className="w-12 h-12 rounded-xl bg-blue-500/10 border border-blue-500/20 flex items-center justify-center mb-4 group-hover:scale-110 group-hover:bg-blue-500/20 transition-all duration-300">
                      <Users className="text-blue-400 group-hover:text-blue-300" size={22} />
                    </div>
                    <h4 className="text-sm font-bold text-white mb-1">CRM Connection</h4>
                    <p className="text-xs text-gray-400 font-medium">Elead, VinSolutions, DealerSocket API sync.</p>
                  </div>
                </button>

                <button type="button" onClick={() => handleSelectType('Inventory')} className="relative flex flex-col text-left p-5 sm:p-6 rounded-2xl bg-white/2 border border-white/10 shadow-[inset_0_1px_1px_rgba(255,255,255,0.05),0_8px_20px_rgba(0,0,0,0.4)] hover:bg-white/5 hover:border-emerald-500/40 hover:shadow-[inset_0_1px_1px_rgba(255,255,255,0.1),0_0_30px_rgba(16,185,129,0.15)] transition-all duration-300 backdrop-blur-xl cursor-pointer outline-none group overflow-hidden">
                  <div className="absolute top-0 right-0 w-32 h-32 bg-emerald-500/10 blur-2xl rounded-full translate-x-1/2 -translate-y-1/2 group-hover:bg-emerald-500/20 transition-colors duration-500" />
                  <div className="relative z-10">
                    <div className="w-12 h-12 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center mb-4 group-hover:scale-110 group-hover:bg-emerald-500/20 transition-all duration-300">
                      <Database className="text-emerald-400 group-hover:text-emerald-300" size={22} />
                    </div>
                    <h4 className="text-sm font-bold text-white mb-1">Inventory Feed</h4>
                    <p className="text-xs text-gray-400 font-medium">vAuto, HomeNet, or custom XML feeds.</p>
                  </div>
                </button>

                <button type="button" onClick={() => handleSelectType('Social')} className="relative flex flex-col text-left p-5 sm:p-6 rounded-2xl bg-white/2 border border-white/10 shadow-[inset_0_1px_1px_rgba(255,255,255,0.05),0_8px_20px_rgba(0,0,0,0.4)] hover:bg-white/5 hover:border-pink-500/40 hover:shadow-[inset_0_1px_1px_rgba(255,255,255,0.1),0_0_30px_rgba(236,72,153,0.15)] transition-all duration-300 backdrop-blur-xl cursor-pointer outline-none group overflow-hidden">
                  <div className="absolute top-0 right-0 w-32 h-32 bg-pink-500/10 blur-2xl rounded-full translate-x-1/2 -translate-y-1/2 group-hover:bg-pink-500/20 transition-colors duration-500" />
                  <div className="relative z-10">
                    <div className="w-12 h-12 rounded-xl bg-pink-500/10 border border-pink-500/20 flex items-center justify-center mb-4 group-hover:scale-110 group-hover:bg-pink-500/20 transition-all duration-300">
                      <Share2 className="text-pink-400 group-hover:text-pink-300" size={22} />
                    </div>
                    <h4 className="text-sm font-bold text-white mb-1">Social Media</h4>
                    <p className="text-xs text-gray-400 font-medium">Facebook, Instagram, LinkedIn accounts.</p>
                  </div>
                </button>

                <button type="button" onClick={() => handleSelectType('Lead Source')} className="relative flex flex-col text-left p-5 sm:p-6 rounded-2xl bg-white/2 border border-white/10 shadow-[inset_0_1px_1px_rgba(255,255,255,0.05),0_8px_20px_rgba(0,0,0,0.4)] hover:bg-white/5 hover:border-orange-500/40 hover:shadow-[inset_0_1px_1px_rgba(255,255,255,0.1),0_0_30px_rgba(249,115,22,0.15)] transition-all duration-300 backdrop-blur-xl cursor-pointer outline-none group overflow-hidden">
                  <div className="absolute top-0 right-0 w-32 h-32 bg-orange-500/10 blur-2xl rounded-full translate-x-1/2 -translate-y-1/2 group-hover:bg-orange-500/20 transition-colors duration-500" />
                  <div className="relative z-10">
                    <div className="w-12 h-12 rounded-xl bg-orange-500/10 border border-orange-500/20 flex items-center justify-center mb-4 group-hover:scale-110 group-hover:bg-orange-500/20 transition-all duration-300">
                      <Target className="text-orange-400 group-hover:text-orange-300" size={22} />
                    </div>
                    <h4 className="text-sm font-bold text-white mb-1">Third-Party Lead Sources</h4>
                    <p className="text-xs text-gray-400 font-medium">Cars.com, CarGurus, TrueCar webhooks.</p>
                  </div>
                </button>
                
                {/* FIX: Make the 5th item span both columns on larger screens so it isn't orphaned on the left */}
                <button type="button" onClick={() => handleSelectType('Telephony')} className="sm:col-span-2 lg:col-span-1 relative flex flex-col text-left p-5 sm:p-6 rounded-2xl bg-white/2 border border-white/10 shadow-[inset_0_1px_1px_rgba(255,255,255,0.05),0_8px_20px_rgba(0,0,0,0.4)] hover:bg-white/5 hover:border-purple-500/40 hover:shadow-[inset_0_1px_1px_rgba(255,255,255,0.1),0_0_30px_rgba(168,85,247,0.15)] transition-all duration-300 backdrop-blur-xl cursor-pointer outline-none group overflow-hidden">
                  <div className="absolute top-0 right-0 w-32 h-32 bg-purple-500/10 blur-2xl rounded-full translate-x-1/2 -translate-y-1/2 group-hover:bg-purple-500/20 transition-colors duration-500" />
                  <div className="relative z-10">
                    <div className="w-12 h-12 rounded-xl bg-purple-500/10 border border-purple-500/20 flex items-center justify-center mb-4 group-hover:scale-110 group-hover:bg-purple-500/20 transition-all duration-300">
                      <Phone className="text-purple-400 group-hover:text-purple-300" size={22} />
                    </div>
                    <h4 className="text-sm font-bold text-white mb-1">Telephony & SMS</h4>
                    <p className="text-xs text-gray-400 font-medium">Twilio, RingCentral, or SIP trunks.</p>
                  </div>
                </button>

              </div>
            </motion.div>
          )}

          {integrationStep === 'CONFIGURE' && (
            <motion.div key="step-config" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 20, transition: { duration: 0.2 } }} className="flex flex-col h-full p-6 md:p-8">
              <div className="flex items-center gap-3 mb-6 shrink-0">
                <button type="button" onClick={() => setIntegrationStep('SELECT')} className="p-2 text-gray-400 hover:text-white bg-white/5 hover:bg-white/10 rounded-lg transition-colors outline-none cursor-pointer">
                  <ArrowLeft size={20} />
                </button>
                <div>
                  <h2 className="text-xl font-black text-white">Configure {selectedType}</h2>
                  <p className="text-xs text-gray-400 mt-0.5">EVEO will automatically detect your provider.</p>
                </div>
              </div>

              <div className="flex-1 overflow-y-auto space-y-6">
                {integrationError && (
                  <div className="p-4 rounded-xl bg-red-500/10 border border-red-500/20 flex items-start gap-3">
                    <ShieldAlert className="text-red-500 shrink-0 mt-0.5" size={18} />
                    <p className="text-sm font-medium text-red-400">{integrationError}</p>
                  </div>
                )}
                <div>
                  <label className="block text-xs font-medium text-gray-400 ml-1 mb-1.5">Integration URL, Webhook, or API Key</label>
                  <input type="text" value={authValue} onChange={(e) => setAuthValue(e.target.value)} onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); handleVerifyAndConnect(); } }} placeholder="e.g., https://cars.com/webhook/... or sk_live_..." className="w-full px-4 py-3 rounded-xl bg-black/50 border border-white/10 focus:border-orange-500 focus:bg-white/5 outline-none transition-all text-sm text-white font-mono" />
                </div>
                
                <div className="p-5 rounded-xl bg-white/2 border border-white/10 shadow-[inset_0_1px_1px_rgba(255,255,255,0.05)]">
                  <p className="text-xs text-gray-400 leading-relaxed mb-4">
                    <strong className="text-white">Security Note:</strong> Your API keys and tokens are encrypted at rest using AES-256 and are never exposed to the frontend after configuration. We use this token strictly to sync data based on your Master Subscription Agreement.
                  </p>
                  {renderHelperText()}
                </div>
              </div>

              <div className="pt-6 border-t border-white/10 shrink-0">
                <button type="button" onClick={handleVerifyAndConnect} disabled={isVerifying} className="w-full py-4 bg-orange-500 hover:bg-orange-600 text-white font-bold rounded-xl transition-all shadow-[0_0_15px_rgba(249,115,22,0.4)] outline-none flex items-center justify-center gap-2 cursor-pointer disabled:opacity-70">
                  {isVerifying ? <><RefreshCw size={18} className="animate-spin" /> Verifying...</> : 'Verify & Connect'}
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </SwipeableModal>
  );
}