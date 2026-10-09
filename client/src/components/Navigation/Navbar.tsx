import { useState, useRef, useEffect } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { Home, FileText, User, Settings as SettingsIcon, LogOut, Sparkles } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import ThemeToggle from './ThemeToggle';
import eveoSymbol from '../../images/logo/eveo-symbol.svg';

export default function Navbar() {
  const navigate = useNavigate();
  const [showLogout, setShowLogout] = useState(false);
  const logoutRef = useRef<HTMLDivElement>(null);

  const navLinks = [
    { name: 'Hub', path: '/app/hub', icon: <Home size={20} /> },
    { name: 'Insights', path: '/app/insights', icon: <Sparkles size={20} /> },
    { name: 'Reports', path: '/app/reports', icon: <FileText size={20} /> },
    { name: 'Account', path: '/app/account', icon: <User size={20} /> },
    { name: 'Settings', path: '/app/settings', icon: <SettingsIcon size={20} /> },
  ];

  // Click outside listener to close the logout pop-up
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (logoutRef.current && !logoutRef.current.contains(event.target as Node)) {
        setShowLogout(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleLogout = () => {
    setShowLogout(false);
    
    // Clear the local storage session so the public Header resets
    localStorage.removeItem('eveo_token');
    localStorage.removeItem('eveo_role');
    
    // Redirect to the login screen
    navigate('/login'); 
  };

  return (
    <nav className="fixed bottom-6 inset-x-6 md:inset-x-auto md:bottom-auto md:left-6 md:top-1/2 md:-translate-y-1/2 z-50 flex md:flex-col items-center justify-between md:justify-start gap-4 p-3 rounded-[2.5rem] 
      backdrop-blur-xl bg-white/40 dark:bg-[#0a0f16]/40 
      border border-white/50 dark:border-white/10 
      shadow-[0_15px_30px_rgba(0,0,0,0.05),inset_0_1px_8px_rgba(255,255,255,0.6)] 
      dark:shadow-[0_15px_30px_rgba(0,0,0,0.2),inset_0_1px_8px_rgba(255,255,255,0.1)]"
    >
      {/* Top Logo */}
      <div className="hidden md:flex items-center justify-center w-12 h-12 rounded-3xl bg-orange-500/10 border border-orange-500/20 mb-2 shadow-inner">
        <img src={eveoSymbol} alt="EVEO" className="w-6 h-6 dark:invert-0 invert opacity-90" />
      </div>

      {/* Internal Navigation Links */}
      <div className="flex md:flex-col items-center gap-2 w-full md:w-auto justify-around md:justify-start">
        {navLinks.map((link) => (
          <NavLink
            key={link.name}
            to={link.path}
            className={({ isActive }) => `
              relative group flex items-center justify-center w-12 h-12 rounded-2xl transition-all duration-300 outline-none focus-visible:ring-2 focus-visible:ring-orange-500
              ${isActive 
                ? 'bg-orange-500 text-white shadow-[0_8px_20px_rgba(249,115,22,0.4)] scale-105' 
                : 'text-gray-500 dark:text-gray-400 hover:bg-white/60 dark:hover:bg-white/10 hover:text-gray-900 dark:hover:text-white'
              }
            `}
          >
            {link.icon}
            <span className="absolute left-16 px-3 py-1.5 rounded-xl bg-gray-900 dark:bg-white text-white dark:text-gray-900 text-xs font-bold opacity-0 -translate-x-4 pointer-events-none group-hover:opacity-100 group-hover:translate-x-0 transition-all shadow-lg hidden md:block whitespace-nowrap">
              {link.name}
            </span>
          </NavLink>
        ))}
      </div>

      {/* Bottom Actions: Theme & Avatar */}
      <div className="flex md:flex-col items-center gap-4 md:mt-2 md:pt-4 md:border-t border-gray-300 dark:border-white/10 relative" ref={logoutRef}>
        <ThemeToggle />
        
        <button 
          onClick={() => setShowLogout(!showLogout)}
          className="relative w-10 h-10 rounded-full bg-linear-to-br from-orange-400 to-orange-600 border-2 border-white dark:border-[#0a0f16] shadow-md overflow-hidden hover:scale-105 transition-transform outline-none focus-visible:ring-2 focus-visible:ring-orange-500 flex items-center justify-center text-white font-bold text-sm"
        >
           {/* Replace AH with user initials later */}
           <div className="absolute top-1 left-1/2 -translate-x-1/2 w-[70%] h-[35%] bg-white/30 rounded-[100%] pointer-events-none" />
           AH
        </button>

        {/* Logout Pop-up */}
        <AnimatePresence>
          {showLogout && (
            <motion.div
              initial={{ opacity: 0, scale: 0.9, x: 20 }}
              animate={{ opacity: 1, scale: 1, x: 0 }}
              exit={{ opacity: 0, scale: 0.9, x: 20 }}
              transition={{ duration: 0.2 }}
              className="absolute bottom-full right-0 mb-4 md:mb-0 md:bottom-0 md:left-full md:ml-4 flex items-center"
            >
              <button 
                onClick={handleLogout}
                className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-gray-900 dark:bg-white text-white dark:text-gray-900 font-bold text-sm shadow-xl hover:bg-red-500 hover:text-white dark:hover:bg-red-500 dark:hover:text-white transition-colors whitespace-nowrap"
              >
                <LogOut size={16} /> Log out
              </button>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </nav>
  );
}