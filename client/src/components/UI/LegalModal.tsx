import { Shield, FileText, X } from 'lucide-react';
import SwipeableModal from './SwipeableModal'; // Assuming it's in the same folder

interface LegalModalProps {
  isOpen: boolean;
  onClose: () => void;
  type: 'terms' | 'privacy' | null;
}

export default function LegalModal({ isOpen, onClose, type }: LegalModalProps) {
  const title = type === 'terms' ? 'Master Subscription Agreement & Terms of Service' : 'Enterprise Privacy & Data Processing Policy';
  const Icon = type === 'terms' ? FileText : Shield;

  return (
    <SwipeableModal isOpen={isOpen} onClose={onClose} layoutId="legal-modal">
      <div className="flex flex-col h-full bg-[#0a0f16] text-gray-300 relative">
        <div className="absolute top-0 left-0 w-full h-1 bg-linear-to-r from-orange-500 to-orange-400" />
        
        {/* Header */}
        <div className="flex items-center justify-between p-6 pb-4 border-b border-white/10 shrink-0">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-orange-500/10 border border-orange-500/20 text-orange-500 hidden sm:block">
              <Icon size={22} />
            </div>
            <h2 className="text-lg sm:text-xl font-black text-white leading-tight">{title}</h2>
          </div>
          <button onClick={onClose} className="p-2 text-gray-400 hover:text-white rounded-lg hover:bg-white/5 transition-colors outline-none shrink-0 self-start">
            <X size={20} />
          </button>
        </div>

        {/* Scrollable Content */}
        <div className="flex-1 overflow-y-auto p-6 space-y-5 text-sm leading-relaxed">
          <p className="font-mono text-xs text-orange-400 mb-2">Effective Date: October 9, 2026 | Version 1.0-ENTERPRISE</p>
          
          {type === 'terms' ? (
            <>
              <div className="space-y-2">
                <h3 className="text-white font-bold text-base">1. Corporate Binding Authority & Account Security</h3>
                <p>By registering a Master Account on EVEO (Enterprise Dealership OS), you represent and warrant that you are an authorized corporate officer, general manager, or principal owner of the dealership entity with full legal authority to bind said entity to this Agreement. You are strictly responsible for maintaining the confidentiality of all team invite links, admin credentials, and sub-user accounts generated within your store portal.</p>
              </div>

              <div className="space-y-2">
                <h3 className="text-white font-bold text-base">2. Subscription Tiers, Billing, and No-Refund Policy</h3>
                <p>EVEO operates on a recurring subscription model across two primary tiers: Software Only ($499/mo) and Full Service + AI ($1,899/mo). All initial signups include a 14-day evaluation period. Upon expiration of the trial, your designated payment method (Stripe or approved gateway) will be billed automatically. <strong>All subscription fees, setup fees, and retainer payments are strictly non-refundable.</strong> You agree not to initiate fraudulent chargebacks through your financial institution for services rendered or active billing cycles.</p>
              </div>

              <div className="space-y-2">
                <h3 className="text-white font-bold text-base">3. Hybrid Human-Software Labor & Capacity Constraints</h3>
                <p>The "Full Service + AI" tier allocates dedicated human BDC personnel (remote agents) to your dealership workflow. Because human capital is finite, full-service assignments are subject to prior capacity verification and management approval. EVEO guarantees good-faith execution of communication SLAs but explicitly disclaims liability for local dealership inventory inaccuracies, delayed trade-in appraisals, or third-party CRM outages (e.g., Elead, VinSolutions).</p>
              </div>

              <div className="space-y-2">
                <h3 className="text-white font-bold text-base">4. Limitation of Liability & Indemnification</h3>
                <p>To the maximum extent permitted by applicable law, EVEO, its founders, engineers, and affiliates shall not be liable for any indirect, incidental, special, consequential, or punitive damages, including loss of vehicle sales, missed showroom appointments, or lead response delays. You agree to indemnify, defend, and hold harmless EVEO from any third-party claims, liabilities, or legal expenses arising out of your misuse of the platform, violation of consumer communication laws (TCPA), or unauthorized data extraction.</p>
              </div>

              <div className="space-y-2">
                <h3 className="text-white font-bold text-base">5. Mandatory Arbitration & Class Action Waiver</h3>
                <p>Any legal dispute, claim, or controversy arising out of or relating to this Agreement or the use of EVEO shall be settled through binding individual arbitration, waiving any right to a jury trial or participation in a class-action lawsuit.</p>
              </div>
            </>
          ) : (
            <>
              <div className="space-y-2">
                <h3 className="text-white font-bold text-base">1. Role as Data Processor & Dealership Ownership</h3>
                <p>EVEO operates strictly as a B2B "Data Processor" (or Service Provider) with respect to any consumer lead data, customer records, or shopper communications processed through our platform. The subscribing dealership remains the independent "Data Controller" and maintains exclusive ownership of all customer data, inventory listings, and transaction lead logs.</p>
              </div>

              <div className="space-y-2">
                <h3 className="text-white font-bold text-base">2. Information Collection & CRM Integration</h3>
                <p>To provide automated BDC routing, lead mining, and inventory tracking, EVEO collects dealership corporate metadata, employee roster credentials, phone logs, and secure API keys linking to your dealership CRM and inventory feed syndicators (vAuto, HomeNet, XML feeds).</p>
              </div>

              <div className="space-y-2">
                <h3 className="text-white font-bold text-base">3. Data Security, Infrastructure, and Sub-processors</h3>
                <p>All sensitive authentication tokens, database records, and communication transcripts are encrypted in transit (via TLS/HTTPS) and at rest. EVEO utilizes trusted enterprise cloud and payment infrastructure sub-processors (such as AWS, Google Cloud, and Stripe). We will never monetize, sell, or share your proprietary lead lists with external automotive competitors.</p>
              </div>

              <div className="space-y-2">
                <h3 className="text-white font-bold text-base">4. Communications Monitoring and Recording Consent</h3>
                <p>By utilizing EVEO's interactive BDC hub, automated logging, and telephony tools, you represent and warrant that your dealership provides all necessary disclosures and obtains lawful consent from your internal staff and external customers for the recording, monitoring, and transcription of voice calls and chat transcripts for quality and performance verification.</p>
              </div>

              <div className="space-y-2">
                <h3 className="text-white font-bold text-base">5. Data Retention and Account Termination</h3>
                <p>Upon the expiration or termination of your subscription agreement, EVEO reserves the right to securely archive, purge, or delete store profile data and lead logs in accordance with standard data lifecycle policies, unless a longer retention period is required by applicable commercial or tax regulations.</p>
              </div>
            </>
          )}
        </div>

        {/* Footer */}
        <div className="p-6 border-t border-white/10 shrink-0 bg-[#0a0f16]">
          <button onClick={onClose} className="w-full sm:w-auto float-right px-6 py-3 bg-orange-500 hover:bg-orange-600 text-white font-bold text-sm rounded-xl transition-all outline-none shadow-[0_0_15px_rgba(249,115,22,0.4)]">
            I Understand & Agree
          </button>
        </div>
      </div>
    </SwipeableModal>
  );
}