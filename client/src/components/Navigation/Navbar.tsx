// src/components/Navigation/Navbar.tsx
import { useState, useEffect } from 'react';
import { NavLink } from 'react-router-dom';
import { motion } from 'framer-motion';
import ThemeToggle from './ThemeToggle'; // Fixed relative import path
import eveoSymbol from '../../images/logo/eveo-symbol.svg';

interface NavItemConfig {
  path: string;
  label: string;
  tag?: string;
  icon: (active: boolean) => React.ReactNode;
}

const navItems: NavItemConfig[] = [
  {
    path: '/',
    label: 'Hub',
    icon: (active) => (
      <svg className="w-5 h-5" fill={active ? 'currentColor' : 'none'} viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={active ? 2.2 : 1.8} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
      </svg>
    )
  },
  {
    path: '/reports',
    label: 'Reports',
    icon: (active) => (
      <svg className="w-5 h-5" fill={active ? 'currentColor' : 'none'} viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={active ? 2.2 : 1.8} d="M9 17v-2m3 2v-4m3 4v-6m2 10H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
      </svg>
    )
  },
  {
    path: '/about', // Added mandatory sprint route
    label: 'Author',
    icon: (active) => (
      <svg className="w-5 h-5" fill={active ? 'currentColor' : 'none'} viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={active ? 2.2 : 1.8} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
      </svg>
    )
  }
];

export default function Navbar() {
  const [isScrollingDown, setIsScrollingDown] = useState(false);

  useEffect(() => {
    const scrollContainer = document.querySelector('main');
    if (!scrollContainer) return;

    let lastScrollY = scrollContainer.scrollTop;

    const handleScroll = () => {
      const currentScrollY = scrollContainer.scrollTop;
      if (currentScrollY > lastScrollY && currentScrollY > 30) {
        setIsScrollingDown(true);
      } else {
        setIsScrollingDown(false);
      }
      lastScrollY = currentScrollY;
    };

    scrollContainer.addEventListener('scroll', handleScroll, { passive: true });
    return () => scrollContainer.removeEventListener('scroll', handleScroll);
  }, []);

  return (
    <>
      {/* 1. DESKTOP FLOATING PILL */}
      <aside className="hidden md:flex flex-col items-center justify-between py-6 px-3 fixed left-4 top-1/2 -translate-y-1/2 h-max min-h-125 w-20 bg-white/70 dark:bg-[#070b11]/80 backdrop-blur-xl border border-gray-200/80 dark:border-white/10 shadow-[0_8px_32px_rgba(0,0,0,0.1)] rounded-[2.5rem] z-50 transition-colors">
        <div className="flex flex-col items-center gap-4">
          <div className="w-10 h-10 rounded-2xl bg-orange-500/10 flex items-center justify-center border border-orange-500/20 shadow-sm">
            <img src={eveoSymbol} alt="Eveo" className="w-6 h-6 dark:invert-0 invert drop-shadow-sm" />
          </div>
        </div>

        <nav className="flex flex-col items-center gap-4 flex-1 justify-center">
          {navItems.map((item) => (
            <NavLink
              key={item.path}
              to={item.path}
              title={item.label}
              className={({ isActive }) => `
                relative w-12 h-12 rounded-2xl flex items-center justify-center transition-colors group outline-none
                focus-visible:ring-2 focus-visible:ring-orange-500
                ${isActive ? 'text-orange-500' : 'text-gray-400 hover:text-gray-700 dark:hover:text-white'}
              `}
            >
              {({ isActive }) => (
                <>
                  {isActive && (
                    <motion.div
                      layoutId="desktopNavActive"
                      className="absolute inset-0 bg-orange-500/10 dark:bg-orange-500/15 border border-orange-500/25 rounded-2xl shadow-[0_0_15px_rgba(249,115,22,0.12)]"
                      transition={{ type: 'spring', stiffness: 350, damping: 30 }}
                    />
                  )}
                  <div className="relative z-10 flex items-center justify-center">
                    {item.icon(isActive)}
                  </div>
                  {item.tag && (
                    <span className="absolute top-2 right-2 w-2 h-2 rounded-full bg-orange-500 ring-2 ring-white dark:ring-[#070b11] z-20" />
                  )}
                  <span className="absolute left-16 px-3 py-1.5 rounded-lg bg-gray-900 text-white dark:bg-white dark:text-gray-900 text-xs font-bold tracking-wide opacity-0 pointer-events-none group-hover:opacity-100 transition-opacity shadow-lg whitespace-nowrap z-50">
                    {item.label}
                  </span>
                </>
              )}
            </NavLink>
          ))}
        </nav>

        <div className="flex flex-col items-center gap-5">
          <ThemeToggle />
          <NavLink
            to="/settings"
            title="Andres H. - BDC Manager"
            className={({ isActive }) => `
              w-10 h-10 rounded-full ring-2 overflow-hidden outline-none focus-visible:ring-orange-500 hover:scale-105 transition-all shadow-md block
              ${isActive ? 'ring-orange-500 shadow-[0_0_15px_rgba(249,115,22,0.3)]' : 'ring-orange-500/30'}
            `}
          >
            <div className="w-full h-full bg-linear-to-tr from-gray-400 to-gray-600 dark:from-zinc-700 dark:to-zinc-500" />
          </NavLink>
        </div>
      </aside>

      {/* 2. MOBILE SCROLLING CHIP BAR */}
      <motion.div
        initial={{ y: 0, opacity: 1 }}
        animate={{ y: isScrollingDown ? 100 : 0, opacity: isScrollingDown ? 0.3 : 1 }}
        transition={{ type: 'spring', stiffness: 300, damping: 30 }}
        className="md:hidden fixed bottom-5 inset-x-0 flex justify-center px-4 z-50 pointer-events-none"
      >
        <nav className="pointer-events-auto flex items-center gap-1 p-2 rounded-full bg-white/85 dark:bg-[#070b11]/90 backdrop-blur-2xl border border-gray-200/80 dark:border-white/10 shadow-[0_8px_32px_rgba(0,0,0,0.3)] max-w-sm w-full justify-between">
          {navItems.map((item) => (
            <NavLink
              key={item.path}
              to={item.path}
              tabIndex={isScrollingDown ? -1 : 0}
              className={({ isActive }) => `
                relative flex flex-col items-center justify-center flex-1 py-1.5 rounded-full transition-all outline-none
                ${isActive ? 'text-orange-500' : 'text-gray-400 hover:text-gray-600 dark:hover:text-gray-200'}
              `}
            >
              {({ isActive }) => (
                <>
                  {isActive && (
                    <motion.div
                      layoutId="mobileNavActive"
                      className="absolute inset-0 bg-orange-500/10 dark:bg-orange-500/15 border border-orange-500/25 rounded-full"
                      transition={{ type: 'spring', stiffness: 350, damping: 28 }}
                    />
                  )}
                  <div className="relative z-10 flex flex-col items-center">
                    <div className="relative">
                      {item.icon(isActive)}
                      {item.tag && <span className="absolute -top-1 -right-1 w-2 h-2 rounded-full bg-orange-500" />}
                    </div>
                    <span className="text-[10px] font-medium tracking-tight mt-0.5">{item.label}</span>
                  </div>
                </>
              )}
            </NavLink>
          ))}

          {/* Mobile Account Button */}
          <NavLink
            to="/settings"
            tabIndex={isScrollingDown ? -1 : 0}
            className={({ isActive }) => `
              flex flex-col items-center justify-center flex-1 py-1.5 outline-none
              ${isActive ? 'text-orange-500' : 'text-gray-400'}
            `}
          >
            {({ isActive }) => (
              <>
                <div className={`w-6 h-6 rounded-full border overflow-hidden ${isActive ? 'border-orange-500 ring-2 ring-orange-500/30' : 'border-gray-300 dark:border-zinc-700'}`}>
                  <div className="w-full h-full bg-linear-to-tr from-gray-400 to-gray-600 dark:from-zinc-700 dark:to-zinc-500" />
                </div>
                <span className="text-[10px] font-medium tracking-tight mt-0.5">
                  Account
                </span>
              </>
            )}
          </NavLink>
        </nav>
      </motion.div>
    </>
  );
}