// src/components/Navigation/Navbar.tsx
import { useState, useRef, useEffect } from 'react';
import { NavLink, useNavigate, useLocation } from 'react-router-dom';
import {
  Home,
  FileText,
  User,
  Settings as SettingsIcon,
  LogOut,
  Sparkles,
  ShieldCheck,
  FolderCode,
  Radio,
  Building2,
  Check,
  Car,
  Bell,
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import ThemeToggle from './ThemeToggle';
import eveoSymbol from '../../images/logo/eveo-symbol.svg';
import { useAuth } from '../../contexts/AuthContext';
import { useStoreAppearance } from '../../contexts/StoreAppereanceContext';
import { type UserRole } from '../../types';
import { playGalleryClick } from '../../utils/soundEngine';
import StoreInventoryModal from '../UI/StoreInventoryModal';
import NotificationCenterModal from '../UI/NotificationCenterModal';
import { getStoreNotifications } from '../../services/notifications/notificationCenterStore';

export default function Navbar() {
  const navigate = useNavigate();
  const [showLogout, setShowLogout] = useState(false);
  const [showDevMenu, setShowDevMenu] = useState(false);
  const [isInventoryOpen, setIsInventoryOpen] = useState(false);
  const [isNotificationsOpen, setIsNotificationsOpen] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);
  const [avatarImg, setAvatarImg] = useState<string | null>(localStorage.getItem('eveo_avatar'));
  const logoutRef = useRef<HTMLDivElement>(null);
  const devMenuRef = useRef<HTMLDivElement>(null);
  const location = useLocation();

  const { role, setRole, signOut } = useAuth();
  const { activeStoreId, setActiveStoreId, stores } = useStoreAppearance();

  const roleStr = String(role).toLowerCase();
  const isSuperAdmin = import.meta.env.DEV || localStorage.getItem('eveo_dev') === 'true';
  const canSwitchStores =
    roleStr === 'bdc' || roleStr === 'bdc_manager' || roleStr === 'super_admin';

  useEffect(() => {
    const syncUnread = () => {
      const list = getStoreNotifications(activeStoreId);
      setUnreadCount(list.filter((n) => !n.read).length);
    };
    syncUnread();
    window.addEventListener('eveo:store-notifications-updated', syncUnread);
    return () => window.removeEventListener('eveo:store-notifications-updated', syncUnread);
  }, [activeStoreId]);

  useEffect(() => {
    const handleAvatarUpdate = () => setAvatarImg(localStorage.getItem('eveo_avatar'));
    window.addEventListener('avatarUpdated', handleAvatarUpdate);
    return () => window.removeEventListener('avatarUpdated', handleAvatarUpdate);
  }, []);

  const navLinks = [
    { name: 'Hub', path: '/app/hub', icon: <Home size={20} /> },
    { name: 'Live', path: '/app/showroom', icon: <Radio size={20} /> },
    { name: 'Insights', path: '/app/insights', icon: <Sparkles size={20} /> },
    { name: 'Reports', path: '/app/reports', icon: <FileText size={20} /> },
    { name: 'Customers', path: '/app/customers', icon: <Building2 size={20} /> },
    { name: 'Settings', path: '/app/settings', icon: <SettingsIcon size={20} /> },
  ];

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (logoutRef.current && !logoutRef.current.contains(event.target as Node)) {
        setShowLogout(false);
      }
      if (devMenuRef.current && !devMenuRef.current.contains(event.target as Node)) {
        setShowDevMenu(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleLogout = () => {
    setShowLogout(false);
    signOut();
    navigate('/login');
  };

  const handleRoleSwitch = (newRole: UserRole) => {
    playGalleryClick();
    setRole(newRole);
    localStorage.setItem('eveo_role', newRole);
    setShowDevMenu(false);
  };

  const isAccountActive =
    location.pathname.includes('/app/account') || location.pathname.includes('payroll-checkout');

  return (
    <>
      <footer className="w-full md:w-auto shrink-0 px-3 py-2 sm:py-2.5 md:p-0 bg-gray-50/90 dark:bg-[#05080c]/90 md:bg-transparent dark:md:bg-transparent backdrop-blur-md md:backdrop-blur-none border-t border-gray-200/50 dark:border-white/5 md:border-none z-40">
        <nav className="md:fixed md:left-6 md:top-1/2 md:-translate-y-1/2 z-40 flex md:flex-col items-center justify-between md:justify-start gap-1 sm:gap-2.5 p-1.5 sm:p-2.5 rounded-4xl backdrop-blur-2xl bg-white/80 dark:bg-[#0a0f16]/85 border border-white/60 dark:border-white/15 shadow-[0_10px_30px_rgba(0,0,0,0.08),inset_0_1px_8px_rgba(255,255,255,0.6)] dark:shadow-[0_15px_40px_rgba(0,0,0,0.6),inset_0_1px_8px_rgba(255,255,255,0.1)] max-w-md sm:max-w-fit md:w-auto mx-auto select-none">
          {/* Top Logo (Desktop Only) */}
          <button
            type="button"
            onClick={() => navigate('/app/hub')}
            aria-label="Go to EVEO Hub"
            className="hidden md:flex items-center justify-center w-11 h-11 rounded-2xl bg-orange-500/10 border border-orange-500/20 mb-1 shadow-inner shrink-0 hover:bg-orange-500/20 transition-colors cursor-pointer"
          >
            <img src={eveoSymbol} alt="EVEO Brand Symbol" className="w-6 h-6 dark:invert-0 invert opacity-90" />
          </button>

          {/* Navigation Links + Inventory Modal Trigger */}
          <div className="flex md:flex-col items-center gap-1 sm:gap-2 w-full md:w-auto justify-around md:justify-start">
            {navLinks.map((link) => (
              <NavLink
                key={link.name}
                to={link.path}
                aria-label={link.name}
                onClick={() => playGalleryClick()}
                className={({ isActive }) =>
                  `relative group flex items-center justify-center w-9 h-9 sm:w-11 sm:h-11 rounded-2xl transition-all duration-300 outline-none active:scale-90 shrink-0 ${
                    isActive
                      ? 'bg-orange-500 text-white shadow-[0_6px_18px_rgba(249,115,22,0.45)] scale-105'
                      : 'text-gray-500 dark:text-gray-400 hover:bg-white/60 dark:hover:bg-white/10 hover:text-gray-900 dark:hover:text-white'
                  }`
                }
              >
                {link.icon}
                <span className="absolute left-15 px-3 py-1.5 rounded-xl bg-gray-900 dark:bg-white text-white dark:text-gray-900 text-xs font-bold opacity-0 -translate-x-3 pointer-events-none group-hover:opacity-100 group-hover:translate-x-0 transition-all shadow-lg hidden md:block whitespace-nowrap z-50">
                  {link.name}
                </span>
              </NavLink>
            ))}

            {/* Fullscreen Store Inventory Button */}
            <button
              type="button"
              aria-label="Open Store Inventory"
              onClick={() => {
                playGalleryClick();
                setIsInventoryOpen(true);
              }}
              className={`relative group flex items-center justify-center w-9 h-9 sm:w-11 sm:h-11 rounded-2xl transition-all duration-300 outline-none active:scale-90 shrink-0 cursor-pointer ${
                isInventoryOpen
                  ? 'bg-orange-500 text-white shadow-[0_6px_18px_rgba(249,115,22,0.45)] scale-105'
                  : 'text-gray-500 dark:text-gray-400 hover:bg-white/60 dark:hover:bg-white/10 hover:text-gray-900 dark:hover:text-white'
              }`}
            >
              <Car size={20} />
              <span className="absolute left-15 px-3 py-1.5 rounded-xl bg-gray-900 dark:bg-white text-white dark:text-gray-900 text-xs font-bold opacity-0 -translate-x-3 pointer-events-none group-hover:opacity-100 group-hover:translate-x-0 transition-all shadow-lg hidden md:block whitespace-nowrap z-50">
                Inventory
              </span>
            </button>

            {/* Super Admin Dev Role Switcher */}
            {isSuperAdmin && (
              <div className="relative" ref={devMenuRef}>
                <button
                  type="button"
                  aria-label="Developer Role Switcher"
                  onClick={() => {
                    playGalleryClick();
                    setShowDevMenu(!showDevMenu);
                    setShowLogout(false);
                  }}
                  className={`relative group flex items-center justify-center w-9 h-9 sm:w-11 sm:h-11 rounded-2xl transition-all duration-300 outline-none active:scale-90 shrink-0 cursor-pointer ${
                    showDevMenu
                      ? 'bg-orange-500 text-white shadow-[0_6px_18px_rgba(249,115,22,0.45)] scale-105'
                      : 'text-gray-500 dark:text-gray-400 hover:bg-white/60 dark:hover:bg-white/10 hover:text-gray-900 dark:hover:text-white'
                  }`}
                >
                  <FolderCode size={19} />
                </button>

                <AnimatePresence>
                  {showDevMenu && (
                    <motion.div
                      initial={{ opacity: 0, scale: 0.9, y: 10 }}
                      animate={{ opacity: 1, scale: 1, y: 0 }}
                      exit={{ opacity: 0, scale: 0.9, y: 10 }}
                      transition={{ duration: 0.2 }}
                      className="absolute bottom-[calc(100%+0.85rem)] right-0 md:right-auto md:bottom-auto md:top-0 md:left-full md:ml-4 flex flex-col gap-1 p-2 rounded-2xl bg-white/95 dark:bg-[#0a0f16]/95 backdrop-blur-2xl border border-gray-200 dark:border-white/15 shadow-[0_10px_50px_rgba(0,0,0,0.5)] z-999 min-w-40"
                    >
                      <div className="px-3 py-2 text-[10px] font-black text-gray-400 uppercase tracking-widest border-b border-gray-100 dark:border-white/10 mb-1">
                        Switch Role
                      </div>
                      {(['bdc', 'sales', 'manager', 'owner'] as UserRole[]).map((r) => (
                        <button
                          type="button"
                          key={r}
                          onClick={() => handleRoleSwitch(r)}
                          className={`flex items-center justify-between px-3 py-2.5 rounded-xl text-xs font-bold uppercase tracking-wider transition-colors outline-none cursor-pointer ${
                            role === r
                              ? 'bg-orange-500/15 text-orange-600 dark:text-orange-400'
                              : 'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-white/5'
                          }`}
                        >
                          {r}
                          {role === r && (
                            <div className="w-2 h-2 rounded-full bg-orange-500 shadow-[0_0_8px_rgba(249,115,22,0.8)]" />
                          )}
                        </button>
                      ))}
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            )}
          </div>

          {/* Bottom Actions: Theme & Avatar (With Unread Notification Badge!) */}
          <div
            className="flex md:flex-col items-center gap-2 sm:gap-3 pl-1.5 md:pl-0 md:mt-1 md:pt-3 border-l md:border-l-0 md:border-t border-gray-300/60 dark:border-white/10 relative shrink-0"
            ref={logoutRef}
          >
            <div className="hidden sm:block">
              <ThemeToggle />
            </div>

            <button
              type="button"
              aria-label="Account, notifications, and store menu"
              onClick={() => {
                playGalleryClick();
                setShowLogout(!showLogout);
                setShowDevMenu(false);
              }}
              className={`relative w-10 h-10 rounded-full bg-linear-to-br from-orange-400 to-orange-600 border-2 shadow-md active:scale-90 hover:scale-105 transition-transform outline-none flex items-center justify-center text-white font-bold text-xs shrink-0 cursor-pointer ${
                isAccountActive || showLogout
                  ? 'border-orange-500 ring-2 ring-orange-500/60'
                  : 'border-white dark:border-[#0a0f16]'
              }`}
            >
              {avatarImg && avatarImg.startsWith('data:image/') ? (
                <img src={avatarImg} alt="User Avatar" className="w-full h-full rounded-full object-cover" />
              ) : (
                <span>AH</span>
              )}

              {/* Unread Notification Dot on Avatar */}
              {unreadCount > 0 && (
                <span className="absolute -top-1 -right-1 min-w-4 h-4 px-1 rounded-full bg-red-500 border border-[#05080c] text-[9px] font-black text-white flex items-center justify-center">
                  {unreadCount}
                </span>
              )}
            </button>

            <AnimatePresence>
              {showLogout && (
                <motion.div
                  initial={{ opacity: 0, scale: 0.92, y: 10 }}
                  animate={{ opacity: 1, scale: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.92, y: 10 }}
                  transition={{ duration: 0.18 }}
                  className="absolute bottom-[calc(100%+0.85rem)] right-0 md:bottom-0 md:right-auto md:left-full md:ml-5 flex flex-col gap-2 p-3 rounded-3xl bg-[#0a0f16]/95 backdrop-blur-3xl border border-white/20 shadow-[0_20px_60px_rgba(0,0,0,0.8),inset_0_1px_8px_rgba(255,255,255,0.12)] z-999 min-w-62"
                >
                  {/* 1. Notification Center Tactile Button */}
                  <button
                    type="button"
                    onClick={() => {
                      playGalleryClick();
                      setShowLogout(false);
                      setIsNotificationsOpen(true);
                    }}
                    className="w-full flex items-center justify-between gap-3 px-3.5 py-2.5 rounded-2xl bg-white/6 hover:bg-white/12 text-white border border-white/12 hover:border-white/25 font-bold text-xs transition-all cursor-pointer"
                  >
                    <span className="flex items-center gap-2.5">
                      <Bell size={15} className="text-orange-400 shrink-0" />
                      <span>Notifications</span>
                    </span>
                    {unreadCount > 0 ? (
                      <span className="px-2 py-0.5 rounded-full bg-red-500/20 border border-red-500/40 text-[10px] font-black text-red-300">
                        {unreadCount} New
                      </span>
                    ) : (
                      <span className="text-gray-400 text-xs">&rarr;</span>
                    )}
                  </button>

                  {/* 2. Account & Workplace */}
                  <button
                    type="button"
                    onClick={() => {
                      playGalleryClick();
                      setShowLogout(false);
                      navigate('/app/account');
                    }}
                    className="w-full flex items-center justify-between gap-3 px-3.5 py-2.5 rounded-2xl bg-white/6 hover:bg-white/12 text-white border border-white/12 hover:border-white/25 font-bold text-xs transition-all cursor-pointer"
                  >
                    <span className="flex items-center gap-2.5">
                      <User size={15} className="text-orange-400 shrink-0" />
                      <span>Account &amp; Workplace</span>
                    </span>
                    <span className="text-gray-400 text-xs">&rarr;</span>
                  </button>

                  {/* 3. Store Administration (Owner / Super Admin Only) */}
                  {(roleStr === 'owner' || roleStr === 'super_admin') && (
                    <button
                      type="button"
                      onClick={() => {
                        playGalleryClick();
                        setShowLogout(false);
                        navigate('/admin/portal');
                      }}
                      className="w-full flex items-center justify-between gap-3 px-3.5 py-2.5 rounded-2xl bg-white/6 hover:bg-white/12 text-white border border-white/12 hover:border-white/25 font-bold text-xs transition-all cursor-pointer"
                    >
                      <span className="flex items-center gap-2.5">
                        <ShieldCheck size={15} className="text-blue-400 shrink-0" />
                        <span>Store Administration</span>
                      </span>
                      <span className="text-gray-400 text-xs">&rarr;</span>
                    </button>
                  )}

                  {/* 4. Switch Active Store */}
                  {canSwitchStores && (
                    <div className="pt-1.5 border-t border-white/10 space-y-1.5">
                      <div className="px-1 text-[9px] font-black uppercase tracking-widest text-gray-400 flex items-center gap-1.5">
                        <Building2 size={11} className="text-orange-400" /> Switch Active Store
                      </div>
                      {stores.map((s) => {
                        const isCurrent = s.id === activeStoreId;
                        return (
                          <button
                            type="button"
                            key={s.id}
                            onClick={() => {
                              playGalleryClick();
                              setActiveStoreId(s.id);
                              setShowLogout(false);
                            }}
                            className={`w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs font-bold border transition-all cursor-pointer ${
                              isCurrent
                                ? 'bg-orange-500/20 text-orange-300 border-orange-500/45'
                                : 'bg-white/4 hover:bg-white/10 text-gray-300 border-white/8'
                            }`}
                          >
                            <span className="flex items-center gap-2">
                              <span className="px-1.5 py-0.5 rounded bg-black/50 text-[9px] font-black text-white">
                                {s.logoText}
                              </span>
                              <span>{s.name}</span>
                            </span>
                            {isCurrent && <Check size={13} className="text-orange-400" />}
                          </button>
                        );
                      })}
                    </div>
                  )}

                  {/* 5. Log Out */}
                  <div className="pt-1.5 border-t border-white/10 space-y-1.5">
                    <button
                      type="button"
                      onClick={handleLogout}
                      className="w-full flex items-center justify-between px-3.5 py-2.5 rounded-2xl bg-red-500/12 hover:bg-red-500/22 border border-red-500/30 text-red-400 font-bold text-xs transition-all cursor-pointer"
                    >
                      <span className="flex items-center gap-2.5">
                        <LogOut size={15} className="shrink-0" />
                        <span>Log Out</span>
                      </span>
                      <span className="text-xs">&rarr;</span>
                    </button>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </nav>
      </footer>

      {/* Separate Fullscreen Store Inventory Modal */}
      <StoreInventoryModal
        isOpen={isInventoryOpen}
        onClose={() => setIsInventoryOpen(false)}
      />

      {/* Separate Notification Center Modal */}
      <NotificationCenterModal
        isOpen={isNotificationsOpen}
        onClose={() => setIsNotificationsOpen(false)}
      />
    </>
  );
}
