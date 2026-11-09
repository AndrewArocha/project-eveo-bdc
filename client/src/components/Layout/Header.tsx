// src/components/Layout/Header.tsx
import { useState, useEffect } from 'react';
import { NavLink, useNavigate, useLocation } from 'react-router-dom';
import { motion, AnimatePresence, useScroll, useMotionValueEvent } from 'framer-motion';
import { Menu, X, LogOut, UserCircle, Package, ArrowRight } from 'lucide-react';
import eveoSymbol from '../../images/logo/eveo-symbol.svg';

export default function Header() {
  const navigate = useNavigate();
  const location = useLocation();
  const { scrollY } = useScroll();

  const [hidden, setHidden] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isAuthenticated, setIsAuthenticated] = useState(
    () => localStorage.getItem('eveo_token') !== null
  );

  useEffect(() => {
    setIsAuthenticated(localStorage.getItem('eveo_token') !== null);
    setIsMobileMenuOpen(false);
  }, [location.pathname]);

  const handleLogout = () => {
    localStorage.removeItem('eveo_token');
    localStorage.removeItem('eveo_role');
    setIsAuthenticated(false);
    setIsMobileMenuOpen(false);
    navigate('/login', { replace: true });
  };

  useMotionValueEvent(scrollY, 'change', (latest) => {
    const previous = scrollY.getPrevious() ?? 0;
    if (latest > previous && latest > 150 && !isMobileMenuOpen) {
      setHidden(true);
    } else {
      setHidden(false);
    }
  });

  useEffect(() => {
    if (isMobileMenuOpen) document.body.style.overflow = 'hidden';
    else document.body.style.overflow = 'unset';
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [isMobileMenuOpen]);

  return (
    <motion.header
      variants={{ visible: { y: 0 }, hidden: { y: '-100%' } }}
      animate={hidden ? 'hidden' : 'visible'}
      transition={{ duration: 0.3, ease: 'easeInOut' }}
      className="w-full fixed top-0 inset-x-0 z-100 bg-[#05080c]/85 backdrop-blur-2xl border-b border-white/10 select-none"
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-20 flex items-center justify-between">
        {/* Logo Section: Goes to /admin/portal when authenticated, / when unauthenticated */}
        <button
          type="button"
          onClick={() => navigate(isAuthenticated ? '/admin/portal' : '/')}
          className="flex items-center gap-3 cursor-pointer group outline-none active:scale-95 transition-transform"
        >
          <div className="relative w-11 h-11 rounded-full bg-white/[0.035] flex items-center justify-center border border-white/10 backdrop-blur-xl shadow-[inset_0_1px_1px_rgba(255,255,255,0.16),0_0_18px_rgba(249,115,22,0.08)] transition-colors group-hover:border-orange-400/25">
            <span aria-hidden="true" className="absolute inset-1 rounded-full border border-white/[0.06]" />
            <img src={eveoSymbol} alt="EVEO Brand Logo" className="relative w-6 h-6" />
          </div>
          <span className="font-black tracking-widest uppercase text-white text-xl drop-shadow-lg">
            EVEO
          </span>
        </button>

        {/* Center Links (Desktop) - Strictly controlled by isAuthenticated */}
        <nav className="hidden md:flex items-center gap-8">
          {!isAuthenticated ? (
            <>
              <NavLink
                to="/"
                className={({ isActive }) =>
                  `text-sm font-bold tracking-wide transition-colors ${
                    isActive ? 'text-orange-500' : 'text-gray-400 hover:text-white'
                  }`
                }
              >
                Home
              </NavLink>
              <NavLink
                to="/about"
                className={({ isActive }) =>
                  `text-sm font-bold tracking-wide transition-colors ${
                    isActive ? 'text-orange-500' : 'text-gray-400 hover:text-white'
                  }`
                }
              >
                About
              </NavLink>
              <NavLink
                to="/pricing"
                className={({ isActive }) =>
                  `text-sm font-bold tracking-wide transition-colors ${
                    isActive ? 'text-orange-500' : 'text-gray-400 hover:text-white'
                  }`
                }
              >
                Products
              </NavLink>
            </>
          ) : (
            <>
              <NavLink
                to="/admin/store"
                className={({ isActive }) =>
                  `text-sm font-bold tracking-wide transition-colors ${
                    isActive ? 'text-orange-500' : 'text-gray-400 hover:text-white'
                  }`
                }
              >
                Products
              </NavLink>
              <NavLink
                to="/admin/portal"
                className={({ isActive }) =>
                  `text-sm font-bold tracking-wide transition-colors ${
                    isActive ? 'text-orange-500' : 'text-gray-400 hover:text-white'
                  }`
                }
              >
                Profile
              </NavLink>
            </>
          )}
        </nav>

        {/* Right CTAs (Desktop) */}
        <div className="hidden md:flex items-center gap-3">
          {!isAuthenticated ? (
            <>
              <button type="button" onClick={() => navigate('/app/hub')} className="min-h-10 px-4 py-2 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-xs font-bold text-gray-300 hover:text-white active:scale-95 transition-all outline-none cursor-pointer">App</button>
              <button
                type="button"
                onClick={() => navigate('/login')}
                className="min-h-10 px-4 py-2 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-xs font-bold text-gray-300 hover:text-white active:scale-95 transition-all outline-none cursor-pointer"
              >
                Sign In
              </button>
              <button
                type="button"
                onClick={() => navigate('/register')}
                className="min-h-10 px-5 py-2 rounded-xl bg-orange-500 hover:bg-orange-600 active:scale-95 text-xs font-bold text-white transition-all shadow-md shadow-orange-500/20 outline-none cursor-pointer"
              >
                Get Started
              </button>
            </>
          ) : (
            <>
              <button
                type="button"
                onClick={() => navigate('/app/hub')}
                className="min-h-10 flex items-center gap-1.5 px-4 py-2 rounded-xl bg-white/10 hover:bg-white/15 border border-white/10 active:scale-95 text-xs font-bold text-white transition-all outline-none cursor-pointer"
              >
                App <ArrowRight size={14} className="text-orange-500" />
              </button>
              <button
                type="button"
                onClick={handleLogout}
                className="min-h-10 flex items-center gap-2 px-4 py-2 rounded-xl bg-red-500/10 hover:bg-red-500/20 active:scale-95 text-xs font-bold text-red-500 transition-all border border-red-500/20 outline-none cursor-pointer"
              >
                <LogOut size={15} /> Log Out
              </button>
            </>
          )}
        </div>

        {/* Mobile Hamburger Toggle */}
        <button
          type="button"
          aria-label={isMobileMenuOpen ? 'Close navigation menu' : 'Open navigation menu'}
          className="md:hidden w-11 h-11 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center text-gray-300 hover:text-white active:scale-95 transition-all outline-none z-110 cursor-pointer"
          onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
        >
          {isMobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
        </button>
      </div>

      {/* Mobile Full-Screen Dropdown Menu */}
      <AnimatePresence>
        {isMobileMenuOpen && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'calc(100dvh - 5rem)' }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
            className="md:hidden absolute top-20 left-0 w-full bg-[#05080c]/98 backdrop-blur-2xl flex flex-col border-t border-white/10 overflow-y-auto"
          >
            <div className="flex flex-col p-6 gap-2 flex-1">
              {!isAuthenticated ? (
                <>
                  <NavLink
                    to="/"
                    className={({ isActive }) =>
                      `py-5 text-2xl font-black transition-colors border-b border-white/5 flex items-center justify-between ${
                        isActive ? 'text-orange-500' : 'text-gray-300 hover:text-white'
                      }`
                    }
                  >
                    Home
                  </NavLink>
                  <NavLink
                    to="/about"
                    className={({ isActive }) =>
                      `py-5 text-2xl font-black transition-colors border-b border-white/5 flex items-center justify-between ${
                        isActive ? 'text-orange-500' : 'text-gray-300 hover:text-white'
                      }`
                    }
                  >
                    About
                  </NavLink>
                  <NavLink
                    to="/pricing"
                    className={({ isActive }) =>
                      `py-5 text-2xl font-black transition-colors border-b border-white/5 flex items-center justify-between ${
                        isActive ? 'text-orange-500' : 'text-gray-300 hover:text-white'
                      }`
                    }
                  >
                    Products
                  </NavLink>
                  <button
                    type="button"
                    onClick={() => { setIsMobileMenuOpen(false); navigate('/app/hub'); }}
                    className="py-5 text-left text-2xl font-black text-orange-500 transition-colors border-b border-white/5 cursor-pointer"
                  >
                    App &rarr;
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setIsMobileMenuOpen(false);
                      navigate('/login');
                    }}
                    className="py-5 text-left text-2xl font-black text-white hover:text-gray-300 transition-colors border-b border-white/5 cursor-pointer"
                  >
                    Sign In
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setIsMobileMenuOpen(false);
                      navigate('/register');
                    }}
                    className="mt-auto mb-4 min-h-12 px-6 py-3.5 bg-orange-500 hover:bg-orange-600 active:scale-[0.98] text-white text-center text-sm font-bold rounded-xl transition-all shadow-md shadow-orange-500/20 cursor-pointer"
                  >
                    Get Started
                  </button>
                </>
              ) : (
                <>
                  <NavLink
                    to="/admin/store"
                    className={({ isActive }) =>
                      `py-5 text-2xl font-black transition-colors border-b border-white/5 flex items-center gap-3.5 ${
                        isActive ? 'text-orange-500' : 'text-gray-300 hover:text-white'
                      }`
                    }
                  >
                    <Package size={24} className="text-orange-500 shrink-0" /> Products
                  </NavLink>
                  <NavLink
                    to="/admin/portal"
                    className={({ isActive }) =>
                      `py-5 text-2xl font-black transition-colors border-b border-white/5 flex items-center gap-3.5 ${
                        isActive ? 'text-orange-500' : 'text-gray-300 hover:text-white'
                      }`
                    }
                  >
                    <UserCircle size={24} className="text-orange-500 shrink-0" /> Profile
                  </NavLink>
                  <button
                    type="button"
                    onClick={() => {
                      setIsMobileMenuOpen(false);
                      navigate('/app/hub');
                    }}
                    className="py-5 text-left text-2xl font-black text-orange-500 transition-colors border-b border-white/5 cursor-pointer"
                  >
                    App &rarr;
                  </button>
                  <button
                    type="button"
                    onClick={handleLogout}
                    className="mt-auto mb-4 min-h-12 px-6 py-3.5 flex items-center justify-center gap-2 bg-red-500/10 hover:bg-red-500/20 active:scale-[0.98] border border-red-500/25 text-red-500 text-center text-sm font-bold rounded-xl transition-all cursor-pointer"
                  >
                    <LogOut size={18} /> Log Out
                  </button>
                </>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.header>
  );
}
