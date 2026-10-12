import { useState, useRef, useEffect } from 'react';
import { NavLink, useNavigate, useLocation } from 'react-router-dom';
import { Home, FileText, User, Settings as SettingsIcon, LogOut, Sparkles, ShieldCheck, FolderCode } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import ThemeToggle from './ThemeToggle';
import eveoSymbol from '../../images/logo/eveo-symbol.svg';
import { useAuth } from '../../contexts/AuthContext';
import { type UserRole } from '../../types';

export default function Navbar() {
  const navigate = useNavigate();
  const [showLogout, setShowLogout] = useState(false);
  const [showDevMenu, setShowDevMenu] = useState(false);
  const [avatarImg, setAvatarImg] = useState<string | null>(localStorage.getItem('eveo_avatar'));
  const logoutRef = useRef<HTMLDivElement>(null);
  const devMenuRef = useRef<HTMLDivElement>(null);
  const location = useLocation();

  const { role, setRole } = useAuth();

  // 🌟 SECURITY: Only shows in Local Dev environment OR if you set the secret localStorage flag
  const isSuperAdmin = import.meta.env.DEV || localStorage.getItem('eveo_dev') === 'true';

  useEffect(() => {
    const handleAvatarUpdate = () => setAvatarImg(localStorage.getItem('eveo_avatar'));
    window.addEventListener('avatarUpdated', handleAvatarUpdate);
    return () => window.removeEventListener('avatarUpdated', handleAvatarUpdate);
  }, []);

  const navLinks = [
    { name: 'Hub', path: '/app/hub', icon: <Home size={20} /> },
    { name: 'Insights', path: '/app/insights', icon: <Sparkles size={20} /> },
    { name: 'Reports', path: '/app/reports', icon: <FileText size={20} /> },
    { name: 'Account', path: '/app/account', icon: <User size={20} /> },
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
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleLogout = () => {
    setShowLogout(false);
    localStorage.removeItem('eveo_token');
    localStorage.removeItem('eveo_role');
    navigate('/login');
  };

  const handleGoToAdmin = () => {
    setShowLogout(false);
    navigate('/admin');
  };

  const handleRoleSwitch = (newRole: UserRole) => {
    setRole(newRole);
    localStorage.setItem('eveo_role', newRole);
    setShowDevMenu(false);
    //window.location.reload(); 
  };

  return (
    <nav className="fixed bottom-6 inset-x-4 sm:inset-x-6 md:inset-x-auto md:bottom-auto md:left-6 md:top-1/2 md:-translate-y-1/2 z-50 flex md:flex-col items-center justify-between md:justify-start gap-2 sm:gap-4 p-2 sm:p-3 rounded-[2.5rem] 
      backdrop-blur-xl bg-white/40 dark:bg-[#0a0f16]/40 
      border border-white/50 dark:border-white/10 
      shadow-[0_15px_30px_rgba(0,0,0,0.05),inset_0_1px_8px_rgba(255,255,255,0.6)] 
      dark:shadow-[0_15px_30px_rgba(0,0,0,0.2),inset_0_1px_8px_rgba(255,255,255,0.1)]
      w-[calc(100%-2rem)] sm:w-auto mx-auto"
    >
      {/* Top Logo */}
      <div className="hidden md:flex items-center justify-center w-12 h-12 rounded-3xl bg-orange-500/10 border border-orange-500/20 mb-2 shadow-inner shrink-0">
        <img src={eveoSymbol} alt="EVEO" className="w-6 h-6 dark:invert-0 invert opacity-90" />
      </div>

      {/* Internal Navigation Links */}
      <div className="flex md:flex-col items-center gap-1 sm:gap-2 w-full md:w-auto justify-around md:justify-start overflow-visible">
        {navLinks.map((link) => (
          <NavLink
            key={link.name}
            to={link.path}
            className={({ isActive }) => {
              const isAccountCheckout = link.name === 'Account' && location.pathname.includes('payroll-checkout');
              const isActuallyActive = isActive || isAccountCheckout;

              return `relative group flex items-center justify-center w-10 h-10 sm:w-12 sm:h-12 rounded-2xl transition-all duration-300 outline-none focus-visible:ring-2 focus-visible:ring-orange-500 shrink-0
              ${isActive
                  ? 'bg-orange-500 text-white shadow-[0_8px_20px_rgba(249,115,22,0.4)] scale-105'
                  : 'text-gray-500 dark:text-gray-400 hover:bg-white/60 dark:hover:bg-white/10 hover:text-gray-900 dark:hover:text-white'
                }
                relative group flex items-center justify-center w-10 h-10 sm:w-12 sm:h-12 rounded-2xl transition-all duration-300 outline-none focus-visible:ring-2 focus-visible:ring-orange-500 shrink-0
          ${isActuallyActive
                  ? 'bg-orange-500 text-white shadow-[0_8px_20px_rgba(249,115,22,0.4)] scale-105'
                  : 'text-gray-500 dark:text-gray-400 hover:bg-white/60 dark:hover:bg-white/10 hover:text-gray-900 dark:hover:text-white'
                }
              }
            `;
            }}
          >
            {link.icon}
            <span className="absolute left-16 px-3 py-1.5 rounded-xl bg-gray-900 dark:bg-white text-white dark:text-gray-900 text-xs font-bold opacity-0 -translate-x-4 pointer-events-none group-hover:opacity-100 group-hover:translate-x-0 transition-all shadow-lg hidden md:block whitespace-nowrap z-50">
              {link.name}
            </span>
          </NavLink>
        ))}

        {/* 🌟 DEV ROLE SWITCHER (Only visible to you) */}
        {isSuperAdmin && (
          <div className="relative" ref={devMenuRef}>
            <button
              onClick={() => setShowDevMenu(!showDevMenu)}
              className={`relative group flex items-center justify-center w-10 h-10 sm:w-12 sm:h-12 rounded-2xl transition-all duration-300 outline-none focus-visible:ring-2 focus-visible:ring-orange-500 shrink-0 ${showDevMenu ? 'bg-orange-500 text-white shadow-[0_8px_20px_rgba(249,115,22,0.4)] scale-105' : 'text-gray-500 dark:text-gray-400 hover:bg-white/60 dark:hover:bg-white/10 hover:text-gray-900 dark:hover:text-white'}`}
            >
              <FolderCode size={20} />
              <span className="absolute left-16 px-3 py-1.5 rounded-xl bg-gray-900 dark:bg-white text-white dark:text-gray-900 text-xs font-bold opacity-0 -translate-x-4 pointer-events-none group-hover:opacity-100 group-hover:translate-x-0 transition-all shadow-lg hidden md:block whitespace-nowrap z-50">
                Dev Switcher
              </span>
            </button>

            <AnimatePresence>
              {showDevMenu && (
                <motion.div
                  initial={{ opacity: 0, scale: 0.9, x: -10, y: 10 }}
                  animate={{ opacity: 1, scale: 1, x: 0, y: 0 }}
                  exit={{ opacity: 0, scale: 0.9, x: -10, y: 10 }}
                  transition={{ duration: 0.2 }}
                  className="absolute bottom-[calc(100%+1rem)] left-0 md:bottom-auto md:top-0 md:left-full md:ml-4 flex flex-col gap-1 p-2 rounded-2xl bg-white dark:bg-[#0a0f16] border border-gray-200 dark:border-white/10 shadow-[0_10px_50px_rgba(0,0,0,0.5)] z-999 min-w-37.5"
                >
                  <div className="px-3 py-2 text-[10px] font-black text-gray-400 dark:text-gray-500 uppercase tracking-widest border-b border-gray-100 dark:border-white/10 mb-1">
                    Switch Role
                  </div>
                  {(['bdc', 'sales', 'manager', 'owner'] as UserRole[]).map((r) => (
                    <button
                      key={r}
                      onClick={() => handleRoleSwitch(r)}
                      className={`flex items-center justify-between px-3 py-2.5 rounded-xl text-xs font-bold uppercase tracking-wider transition-colors outline-none cursor-pointer ${role === r ? 'bg-orange-500/10 text-orange-600 dark:text-orange-400' : 'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-white/5'}`}
                    >
                      {r}
                      {role === r && <div className="w-1.5 h-1.5 rounded-full bg-orange-500" />}
                    </button>
                  ))}
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        )}
      </div>

      {/* Bottom Actions: Theme & Avatar */}
      <div className="flex md:flex-col items-center gap-2 sm:gap-4 md:mt-2 md:pt-4 md:border-t border-gray-300 dark:border-white/10 relative shrink-0" ref={logoutRef}>
        <div className="hidden sm:block"><ThemeToggle /></div>

        <button
          onClick={() => setShowLogout(!showLogout)}
          className="relative w-10 h-10 rounded-full bg-linear-to-br from-orange-400 to-orange-600 border-2 border-white dark:border-[#0a0f16] shadow-md overflow-hidden hover:scale-105 transition-transform outline-none focus-visible:ring-2 focus-visible:ring-orange-500 flex items-center justify-center text-white font-bold text-sm shrink-0"
        >
          {/* Glass Glare Overlay - ALWAYS ON TOP */}
          <div className="absolute top-0.5 left-1/2 -translate-x-1/2 w-[70%] h-[35%] bg-white/30 rounded-[100%] pointer-events-none z-20" />

          {avatarImg ? (
            <img src={avatarImg} alt="Profile" className="w-full h-full object-cover relative z-10" />
          ) : (
            <span className="relative z-10">AH</span>
          )}
        </button>

        <AnimatePresence>
          {showLogout && (
            <motion.div
              initial={{ opacity: 0, scale: 0.9, y: 10, x: 0 }}
              animate={{ opacity: 1, scale: 1, y: 0, x: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 10, x: 0 }}
              transition={{ duration: 0.2 }}
              className="absolute bottom-[calc(100%+1rem)] right-0 md:bottom-0 md:left-full md:ml-6 flex flex-col gap-1 p-2 rounded-2xl bg-white dark:bg-[#0a0f16] border border-gray-200 dark:border-white/10 shadow-[0_10px_50px_rgba(0,0,0,0.5)] z-999 min-w-55"
            >
              {(role === 'owner' || role === 'manager') && (
                <button
                  onClick={handleGoToAdmin}
                  className="flex items-center gap-3 px-4 py-3 rounded-xl text-gray-700 dark:text-gray-300 font-bold text-sm hover:bg-orange-50 dark:hover:bg-orange-500/10 hover:text-orange-600 dark:hover:text-orange-400 transition-colors whitespace-nowrap outline-none cursor-pointer"
                >
                  <ShieldCheck size={18} /> Store Administration
                </button>
              )}

              {(role === 'owner' || role === 'manager') && <div className="h-px w-full bg-gray-100 dark:bg-white/5 my-1" />}

              <button
                onClick={handleLogout}
                className="flex items-center gap-3 px-4 py-3 rounded-xl text-gray-700 dark:text-gray-300 font-bold text-sm hover:bg-red-50 dark:hover:bg-red-500/10 hover:text-red-600 dark:hover:text-red-400 transition-colors whitespace-nowrap outline-none cursor-pointer"
              >
                <LogOut size={18} /> Log out
              </button>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </nav>
  );
}