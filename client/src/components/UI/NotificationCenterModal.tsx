// src/components/UI/NotificationCenterModal.tsx
import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Bell, X, AlertTriangle, CheckCircle2, Volume2 } from 'lucide-react';
import SwipeableModal from './SwipeableModal';
import { useStoreAppearance } from '../../contexts/StoreAppereanceContext';
import {
  getStoreNotifications,
  markAllStoreNotificationsRead,
  type StoreNotificationItem,
} from '../../services/notifications/notificationCenterStore';
import { playWoodBlockAlert, playSocialMediaChime } from '../../utils/soundEngine';

interface NotificationCenterModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function NotificationCenterModal({
  isOpen,
  onClose,
}: NotificationCenterModalProps) {
  const navigate = useNavigate();
  const { activeStoreId, activeStore } = useStoreAppearance();
  const [items, setItems] = useState<StoreNotificationItem[]>(() =>
    getStoreNotifications(activeStoreId)
  );

  useEffect(() => {
    const sync = () => setItems(getStoreNotifications(activeStoreId));
    sync();
    window.addEventListener('eveo:store-notifications-updated', sync);
    return () => window.removeEventListener('eveo:store-notifications-updated', sync);
  }, [activeStoreId, isOpen]);

  return (
    <SwipeableModal isOpen={isOpen} onClose={onClose} maxWidthClass="md:max-w-xl">
      <div className="flex flex-col h-[78dvh] text-white p-5 sm:p-6 space-y-4 select-none sm:select-auto">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-white/10 pb-4 shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-2xl bg-orange-500/15 border border-orange-500/30 flex items-center justify-center text-orange-400">
              <Bell size={18} />
            </div>
            <div>
              <span className="text-[10px] font-black uppercase tracking-widest text-orange-400 block">
                {activeStore.name}
              </span>
              <h2 className="text-lg font-black text-white">Notification Center</h2>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => {
                markAllStoreNotificationsRead(activeStoreId);
                setItems(getStoreNotifications(activeStoreId));
              }}
              className="px-3 py-1.5 rounded-full bg-white/6 hover:bg-white/12 border border-white/10 text-[10px] font-bold text-gray-300 cursor-pointer"
            >
              Mark All Read
            </button>
            <button
              type="button"
              onClick={onClose}
              className="w-8 h-8 rounded-full bg-white/8 flex items-center justify-center text-gray-400 hover:text-white cursor-pointer"
            >
              <X size={16} />
            </button>
          </div>
        </div>

        {/* Audio & Haptic Test Bar */}
        <div className="flex flex-wrap items-center justify-between gap-2 p-3 rounded-2xl bg-white/3 border border-white/8 shrink-0">
          <span className="text-[11px] font-semibold text-gray-300 flex items-center gap-1.5">
            <Volume2 size={14} className="text-orange-400" /> Test Alert Sounds:
          </span>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => playWoodBlockAlert()}
              className="px-3 py-1 rounded-full bg-red-500/15 hover:bg-red-500/25 border border-red-500/35 text-[10px] font-bold text-red-300 cursor-pointer"
            >
              WoodBlock (SLA / Sold)
            </button>
            <button
              type="button"
              onClick={() => playSocialMediaChime()}
              className="px-3 py-1 rounded-full bg-sky-500/15 hover:bg-sky-500/25 border border-sky-500/35 text-[10px] font-bold text-sky-300 cursor-pointer"
            >
              SocialChime (Standard)
            </button>
          </div>
        </div>

        {/* Notification Feed */}
        <div className="flex-1 min-h-0 overflow-y-auto custom-scrollbar space-y-2.5 pr-1">
          {items.map((n) => (
            <div
              key={n.id}
              onClick={() => {
                if (n.route) {
                  onClose();
                  navigate(n.route);
                }
              }}
              className={`p-4 rounded-2xl border flex items-start justify-between gap-3 transition-colors ${
                n.route ? 'cursor-pointer hover:bg-white/6' : ''
              } ${
                n.severity === 'critical'
                  ? 'bg-red-500/[0.07] border-red-500/30'
                  : 'bg-white/3 border-white/8'
              }`}
            >
              <div className="flex items-start gap-3 min-w-0">
                {n.severity === 'critical' ? (
                  <AlertTriangle size={16} className="text-red-400 shrink-0 mt-0.5" />
                ) : (
                  <CheckCircle2 size={16} className="text-emerald-400 shrink-0 mt-0.5" />
                )}
                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-black text-white truncate">
                      {n.title}
                    </span>
                    {!n.read && (
                      <span className="w-2 h-2 rounded-full bg-orange-500 shrink-0" />
                    )}
                  </div>
                  <p className="text-xs text-gray-300 mt-1 leading-relaxed">
                    {n.message}
                  </p>
                </div>
              </div>
              <span className="text-[10px] font-semibold text-gray-500 whitespace-nowrap shrink-0">
                {n.timestamp}
              </span>
            </div>
          ))}
        </div>
      </div>
    </SwipeableModal>
  );
}