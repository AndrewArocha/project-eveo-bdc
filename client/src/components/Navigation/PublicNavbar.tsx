// src/components/Layout/PublicNavbar.tsx
import { useEffect, useState } from 'react';
import { NavLink, useLocation, useNavigate } from 'react-router-dom';
import { LogOut, ArrowRight } from 'lucide-react';
import ThemeToggle from './ThemeToggle';
import eveoSymbol from '../../images/logo/eveo-symbol.svg';

export default function PublicNavbar() {
  const navigate = useNavigate();
  const location = useLocation();
  const [isAuthenticated, setIsAuthenticated] = useState(
    () => localStorage.getItem('eveo_token') !== null
  );

  useEffect(() => {
    setIsAuthenticated(localStorage.getItem('eveo_token') !== null);
  }, [location.pathname]);

  const handleLogout = () => {
    localStorage.removeItem('eveo_token');
    localStorage.removeItem('eveo_role');
    setIsAuthenticated(false);
    navigate('/login', { replace: true });
  };

  return (
    <header className="w-full fixed top-0 inset-x-0 z-50 bg-white/80 dark:bg-[#05080c]/85 backdrop-blur-xl border-b border-gray-200 dark:border-white/10">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-20 flex items-center justify-between">
        {/* Logo Section */}
        <button
          type="button"
          onClick={() => navigate(isAuthenticated ? '/admin/portal' : '/')}
          className="flex items-center gap-3 cursor-pointer outline-none active:scale-95 transition-transform"
        >
          <div className="relative w-11 h-11 rounded-full bg-white/[0.035] flex items-center justify-center border border-white/10 backdrop-blur-xl shadow-[inset_0_1px_1px_rgba(255,255,255,0.16),0_0_18px_rgba(249,115,22,0.08)]">
            <span aria-hidden="true" className="absolute inset-1 rounded-full border border-white/[0.06]" />
            <img src={eveoSymbol} alt="EVEO Brand Symbol" className="relative w-6 h-6 dark:invert-0 invert" />
          </div>
          <span className="font-bold tracking-wide text-gray-900 dark:text-white text-lg">
            EVEO <span className="text-orange-500">BDC</span>
          </span>
        </button>

        {/* Center Links */}
        <nav className="hidden md:flex items-center gap-8">
          {!isAuthenticated ? (
            <>
              <NavLink
                to="/"
                className={({ isActive }) =>
                  `text-sm font-bold transition-colors ${
                    isActive
                      ? 'text-orange-500'
                      : 'text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white'
                  }`
                }
              >
                Home
              </NavLink>
              <NavLink
                to="/about"
                className={({ isActive }) =>
                  `text-sm font-bold transition-colors ${
                    isActive
                      ? 'text-orange-500'
                      : 'text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white'
                  }`
                }
              >
                About
              </NavLink>
              <NavLink
                to="/pricing"
                className={({ isActive }) =>
                  `text-sm font-bold transition-colors ${
                    isActive
                      ? 'text-orange-500'
                      : 'text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white'
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
                  `text-sm font-bold transition-colors ${
                    isActive
                      ? 'text-orange-500'
                      : 'text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white'
                  }`
                }
              >
                Products
              </NavLink>
              <NavLink
                to="/admin/portal"
                className={({ isActive }) =>
                  `text-sm font-bold transition-colors ${
                    isActive
                      ? 'text-orange-500'
                      : 'text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white'
                  }`
                }
              >
                Profile
              </NavLink>
            </>
          )}
        </nav>

        {/* Right CTAs */}
        <div className="flex items-center gap-4">
          <ThemeToggle />
          <div className="hidden sm:flex items-center gap-3 border-l border-gray-200 dark:border-white/10 pl-4">
            {!isAuthenticated ? (
              <>
                <NavLink
                  to="/login"
                  className="min-h-10 px-4 py-2 rounded-xl bg-gray-100 dark:bg-white/10 text-xs font-bold text-gray-900 dark:text-white hover:text-orange-500 flex items-center transition-all"
                >
                  Sign In
                </NavLink>
                <NavLink
                  to="/register"
                  className="min-h-10 px-4 py-2 rounded-xl bg-orange-500 hover:bg-orange-600 text-xs font-bold text-white flex items-center transition-all shadow-md shadow-orange-500/20"
                >
                  Get Started
                </NavLink>
              </>
            ) : (
              <>
                <button
                  type="button"
                  onClick={() => navigate('/app/hub')}
                  className="min-h-10 flex items-center gap-1.5 px-4 py-2 rounded-xl bg-gray-100 dark:bg-white/10 text-xs font-bold text-gray-900 dark:text-white hover:bg-gray-200 dark:hover:bg-white/15 transition-all cursor-pointer"
                >
                  App <ArrowRight size={14} className="text-orange-500" />
                </button>
                <button
                  type="button"
                  onClick={handleLogout}
                  className="min-h-10 flex items-center gap-1.5 text-xs font-bold px-4 py-2 rounded-xl bg-red-500/10 text-red-500 border border-red-500/20 hover:bg-red-500/20 transition-all cursor-pointer"
                >
                  <LogOut size={15} /> Log Out
                </button>
              </>
            )}
          </div>
        </div>
      </div>
    </header>
  );
}
