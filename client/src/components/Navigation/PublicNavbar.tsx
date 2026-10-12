import { NavLink } from 'react-router-dom';
import ThemeToggle from './ThemeToggle';
import eveoSymbol from '../../images/logo/eveo-symbol.svg';

export default function PublicNavbar() {
  return (
    <header className="w-full fixed top-0 inset-x-0 z-50 bg-white/80 dark:bg-[#05080c]/80 backdrop-blur-md border-b border-gray-200 dark:border-white/10">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-20 flex items-center justify-between">
        
        {/* Logo Section */}
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-orange-500/10 flex items-center justify-center border border-orange-500/20">
            <img src={eveoSymbol} alt="Eveo" className="w-6 h-6 dark:invert-0 invert" />
          </div>
          <span className="font-bold tracking-wide text-gray-900 dark:text-white text-lg">
            EVEO <span className="text-orange-500">BDC</span>
          </span>
        </div>

        {/* Center Links */}
        <nav className="hidden md:flex items-center gap-8">
          <NavLink 
            to="/" 
            className={({ isActive }) => `text-sm font-medium transition-colors ${isActive ? 'text-orange-500' : 'text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white'}`}
          >
            Home
          </NavLink>
          <NavLink 
            to="/about" 
            className={({ isActive }) => `text-sm font-medium transition-colors ${isActive ? 'text-orange-500' : 'text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white'}`}
          >
            About the Author
          </NavLink>
        </nav>

        {/* Right CTAs */}
        <div className="flex items-center gap-4">
          <ThemeToggle />
          <div className="hidden sm:flex items-center gap-3 border-l border-gray-200 dark:border-white/10 pl-4">
            <NavLink 
              to="/login" 
              className="text-sm font-medium text-gray-700 dark:text-gray-200 hover:text-orange-500 transition-colors"
            >
              Sign in
            </NavLink>
            <NavLink 
              to="/register" 
              className="text-sm font-medium px-4 py-2 rounded-full bg-orange-500 text-white hover:bg-orange-600 transition-colors shadow-md"
            >
              Get Started
            </NavLink>
          </div>
        </div>

      </div>
    </header>
  );
}