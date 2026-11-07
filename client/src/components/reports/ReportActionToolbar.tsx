// src/components/reports/ReportActionToolbar.tsx
import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Share2,
  Mail,
  MessageCircle,
  FileDown,
  MessageSquare,
  Link as LinkIcon,
  FolderClock,
  Lock,
  ShieldCheck,
} from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { useStoreAppearance } from '../../contexts/StoreAppereanceContext';
import { canCurrentUserExportReports } from './OrbModals';

interface ReportActionToolbarProps {
  onGeneratePDF: () => void;
  onShare: (method: string) => void;
  onOpenArchive?: () => void;
}

const iosGlassBtn =
  'h-8 sm:h-9 px-2.5 sm:px-3.5 rounded-full bg-white/[0.05] hover:bg-white/[0.1] active:scale-[0.97] border border-white/[0.1] shadow-[inset_0_1px_0_rgba(255,255,255,0.14),0_4px_12px_rgba(0,0,0,0.35)] text-[10px] sm:text-[11px] font-semibold text-gray-200 hover:text-white flex items-center gap-1.5 transition-all cursor-pointer select-none whitespace-nowrap shrink-0';

const iosPrimaryGlassBtn =
  'h-8 sm:h-9 px-3 sm:px-4 rounded-full bg-linear-to-b from-white/[0.14] to-white/[0.05] hover:from-white/[0.2] hover:to-white/[0.08] active:scale-[0.97] border border-white/[0.18] shadow-[inset_0_1px_0_rgba(255,255,255,0.28),0_6px_16px_rgba(0,0,0,0.45)] text-[10px] sm:text-[11px] font-bold text-white flex items-center gap-1.5 transition-all cursor-pointer select-none whitespace-nowrap shrink-0';

export default function ReportActionToolbar({
  onGeneratePDF,
  onShare,
  onOpenArchive,
}: ReportActionToolbarProps) {
  const [showShareMenu, setShowShareMenu] = useState(false);
  const { role } = useAuth();
  const { activeStoreId } = useStoreAppearance();
  const [, setPermTick] = useState(0);

  const roleStr = String(role).toLowerCase();
  const isManagerOrAbove =
    roleStr === 'super_admin' ||
    roleStr === 'owner' ||
    roleStr === 'manager' ||
    roleStr === 'bdc_manager';

  const hasExportAccess = canCurrentUserExportReports(activeStoreId, roleStr);

  useEffect(() => {
    const sync = () => setPermTick((t) => t + 1);
    window.addEventListener('eveo:report-permissions-updated', sync);
    return () => window.removeEventListener('eveo:report-permissions-updated', sync);
  }, []);

  const handleOpenArchive = () => {
    if (onOpenArchive) {
      onOpenArchive();
    } else {
      window.dispatchEvent(new CustomEvent('eveo:open-generated-reports'));
    }
  };

  const handleOpenPermissions = () => {
    window.dispatchEvent(new CustomEvent('eveo:open-report-permissions'));
  };

  return (
    <div className="relative z-10 shrink-0 flex items-center justify-between gap-1.5 px-3.5 sm:px-5 py-2.5 bg-[#080c12]/90 backdrop-blur-xl border-t border-white/8 w-full mt-auto">
      {/* Left: Single-Row Vault & Access Pills */}
      <div className="flex items-center gap-1.5 shrink-0">
        <button type="button" onClick={handleOpenArchive} className={iosGlassBtn}>
          <FolderClock size={12} className="text-orange-400 shrink-0" />
          <span className="sm:hidden">Vault</span>
          <span className="hidden sm:inline">Generated Reports</span>
        </button>

        {isManagerOrAbove && (
          <button
            type="button"
            onClick={handleOpenPermissions}
            title="Manage report export permissions"
            className={iosGlassBtn}
          >
            <ShieldCheck size={12} className="text-emerald-400 shrink-0" />
            <span className="sm:hidden">Access</span>
            <span className="hidden sm:inline">Export Access</span>
          </button>
        )}
      </div>

      {/* Right: Single-Row Generate PDF & Share Pills */}
      {!hasExportAccess ? (
        <div className="h-8 sm:h-9 px-3 rounded-full bg-white/3 border border-white/8 text-[10px] sm:text-[11px] font-semibold text-gray-400 flex items-center gap-1.5 whitespace-nowrap">
          <Lock size={11} className="text-orange-400 shrink-0" />
          <span>NDA Restricted</span>
        </div>
      ) : (
        <div className="flex items-center gap-1.5 relative shrink-0">
          <button type="button" onClick={onGeneratePDF} className={iosPrimaryGlassBtn}>
            <FileDown size={12} className="text-orange-400 shrink-0" />
            <span className="sm:hidden">PDF</span>
            <span className="hidden sm:inline">Generate Report</span>
          </button>

          <div className="relative">
            <button
              type="button"
              onClick={() => setShowShareMenu(!showShareMenu)}
              className={iosGlassBtn}
            >
              <Share2 size={12} className="text-sky-400 shrink-0" />
              <span>Share</span>
            </button>

            <AnimatePresence>
              {showShareMenu && (
                <motion.div
                  initial={{ opacity: 0, y: 8, scale: 0.96 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: 8, scale: 0.96 }}
                  className="absolute bottom-full right-0 mb-2 w-52 bg-[#0d121b]/95 backdrop-blur-2xl border border-white/15 rounded-2xl shadow-[0_20px_50px_rgba(0,0,0,0.8),inset_0_1px_0_rgba(255,255,255,0.15)] overflow-hidden z-50 p-1.5 flex flex-col gap-0.5"
                >
                  <button
                    type="button"
                    onClick={() => {
                      setShowShareMenu(false);
                      onShare('WhatsApp');
                    }}
                    className="flex items-center gap-2.5 px-3 py-2 text-xs font-semibold text-gray-200 hover:text-white hover:bg-white/10 rounded-xl transition-colors w-full text-left cursor-pointer"
                  >
                    <MessageCircle size={14} className="text-emerald-400" /> Send PDF to WhatsApp
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setShowShareMenu(false);
                      onShare('Email');
                    }}
                    className="flex items-center gap-2.5 px-3 py-2 text-xs font-semibold text-gray-200 hover:text-white hover:bg-white/10 rounded-xl transition-colors w-full text-left cursor-pointer"
                  >
                    <Mail size={14} className="text-sky-400" /> Export PDF for Email
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setShowShareMenu(false);
                      onShare('SMS');
                    }}
                    className="flex items-center gap-2.5 px-3 py-2 text-xs font-semibold text-gray-200 hover:text-white hover:bg-white/10 rounded-xl transition-colors w-full text-left cursor-pointer"
                  >
                    <MessageSquare size={14} className="text-purple-400" /> Share via SMS
                  </button>
                  <div className="h-px w-full bg-white/10 my-0.5" />
                  <button
                    type="button"
                    onClick={() => {
                      setShowShareMenu(false);
                      onShare('Link');
                    }}
                    className="flex items-center gap-2.5 px-3 py-2 text-xs font-semibold text-gray-200 hover:text-white hover:bg-white/10 rounded-xl transition-colors w-full text-left cursor-pointer"
                  >
                    <LinkIcon size={14} className="text-orange-400" /> Copy Vault Link
                  </button>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>
      )}
    </div>
  );
}