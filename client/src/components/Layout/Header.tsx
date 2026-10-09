import { useState, useEffect } from 'react';
import { NavLink, useNavigate, useLocation } from 'react-router-dom';
import { motion, AnimatePresence, useScroll, useMotionValueEvent } from 'framer-motion';
import { Menu, X, LogOut } from 'lucide-react';
import eveoSymbol from '../../images/logo/eveo-symbol.svg';

export default function Header() {
  const navigate = useNavigate();
  const location = useLocation();
  const { scrollY } = useScroll();
  
  const [hidden, setHidden] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  // --- REACTIVE AUTH STATE ---
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [userRole, setUserRole] = useState<string | null>(null);

  // Re-check authentication every time the URL changes
  useEffect(() => {
    setIsAuthenticated(localStorage.getItem('eveo_token') !== null);
    setUserRole(localStorage.getItem('eveo_role'));
  }, [location.pathname]);

  // --- LOGOUT LOGIC ---
  const handleLogout = () => {
    // 1. Clear the local storage session
    localStorage.removeItem('eveo_token');
    localStorage.removeItem('eveo_role');
    
    // 2. Force the UI to update immediately
    setIsAuthenticated(false);
    setUserRole(null);
    
    // 3. Close mobile menu if open
    setIsMobileMenuOpen(false);
    
    // 4. Redirect back to login
    navigate('/login');
  };

  useMotionValueEvent(scrollY, "change", (latest) => {
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
    return () => { document.body.style.overflow = 'unset'; };
  }, [isMobileMenuOpen]);

  // Auto-close menu on route change
  useEffect(() => {
    setIsMobileMenuOpen(false);
  }, [location.pathname]);

  return (
    <motion.header 
      variants={{ visible: { y: 0 }, hidden: { y: "-100%" } }}
      animate={hidden ? "hidden" : "visible"}
      transition={{ duration: 0.3, ease: "easeInOut" }}
      className="w-full fixed top-0 inset-x-0 z-100 bg-[#05080c]/80 backdrop-blur-xl border-b border-white/5"
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-20 flex items-center justify-between">
        
        {/* Logo Section */}
        <div className="flex items-center gap-3 cursor-pointer group" onClick={() => navigate('/')}>
          <div className="w-10 h-10 rounded-xl bg-orange-500/10 flex items-center justify-center border border-orange-500/30 backdrop-blur-md transition-colors group-hover:bg-orange-500/20">
            <img src={eveoSymbol} alt="Eveo" className="w-6 h-6" />
          </div>
          <span className="font-black tracking-widest uppercase text-white text-xl drop-shadow-lg">EVEO</span>
        </div>

        {/* Center Links (Desktop) */}
        <nav className="hidden md:flex items-center gap-8">
          <NavLink to="/" className={({ isActive }) => `text-sm font-bold tracking-wide transition-colors ${isActive ? 'text-orange-500' : 'text-gray-400 hover:text-white'}`}>Home</NavLink>
          <NavLink to="/about" className={({ isActive }) => `text-sm font-bold tracking-wide transition-colors ${isActive ? 'text-orange-500' : 'text-gray-400 hover:text-white'}`}>About</NavLink>
          <NavLink to="/pricing" className={({ isActive }) => `text-sm font-bold tracking-wide transition-colors ${isActive ? 'text-orange-500' : 'text-gray-400 hover:text-white'}`}>Products</NavLink>
        </nav>

        {/* Right CTAs (Desktop) */}
        <div className="hidden md:flex items-center gap-4">
          {!isAuthenticated ? (
            <>
              <button onClick={() => navigate('/login')} className="text-sm font-bold text-gray-300 hover:text-white transition-colors outline-none cursor-pointer">Sign In</button>
              <button onClick={() => navigate('/register')} className="px-6 py-2.5 rounded-full bg-orange-500 hover:bg-orange-600 text-sm font-bold text-white transition-all shadow-[0_0_15px_rgba(249,115,22,0.4)] outline-none cursor-pointer">Get Started</button>
            </>
          ) : (
            <>
              <button 
                onClick={() => navigate(userRole === 'owner' ? '/admin/portal' : '/app/hub')} 
                className="text-sm font-bold text-orange-500 hover:text-orange-400 transition-colors outline-none mr-2 cursor-pointer"
              >
                Dashboard
              </button>
              <button 
                onClick={handleLogout} 
                className="flex items-center gap-2 px-4 py-2 rounded-full bg-red-500/10 hover:bg-red-500/20 text-sm font-bold text-red-500 transition-colors border border-red-500/20 outline-none cursor-pointer"
              >
                <LogOut size={16} /> Log Out
              </button>
            </>
          )}
        </div>

        {/* Mobile Hamburger Toggle */}
        <button className="md:hidden p-2 text-gray-300 hover:text-white outline-none z-110" onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}>
          {isMobileMenuOpen ? <X size={28} /> : <Menu size={28} />}
        </button>
      </div>

      {/* Mobile Full-Screen Dropdown Menu */}
      <AnimatePresence>
        {isMobileMenuOpen && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: '100vh' }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
            className="md:hidden absolute top-20 left-0 w-full bg-[#05080c] flex flex-col border-t border-white/5 overflow-hidden"
          >
            <div className="flex flex-col p-6 gap-6 mt-4">
              <NavLink to="/" className={({ isActive }) => `text-3xl font-black transition-colors border-b border-white/5 pb-6 ${isActive ? 'text-orange-500' : 'text-gray-400 hover:text-white'}`}>Home</NavLink>
              <NavLink to="/about" className={({ isActive }) => `text-3xl font-black transition-colors border-b border-white/5 pb-6 ${isActive ? 'text-orange-500' : 'text-gray-400 hover:text-white'}`}>About</NavLink>
              
              {!isAuthenticated ? (
                <>
                  <button onClick={() => { setIsMobileMenuOpen(false); navigate('/login'); }} className="text-left text-3xl font-black text-white hover:text-gray-300 transition-colors border-b border-white/5 pb-6 cursor-pointer">Sign In</button>
                  <button onClick={() => { setIsMobileMenuOpen(false); navigate('/register'); }} className="mt-8 px-6 py-5 bg-orange-500 hover:bg-orange-600 text-white text-center text-xl font-black uppercase rounded-full transition-all shadow-[0_0_30px_rgba(249,115,22,0.3)] cursor-pointer">Get Started</button>
                </>
              ) : (
                <>
                  <button onClick={() => { setIsMobileMenuOpen(false); navigate(userRole === 'owner' ? '/admin/portal' : '/app/hub'); }} className="text-left text-3xl font-black text-orange-500 transition-colors border-b border-white/5 pb-6 cursor-pointer">Dashboard</button>
                  <button onClick={handleLogout} className="mt-8 px-6 py-5 flex items-center justify-center gap-3 bg-red-500/10 border border-red-500/20 text-red-500 text-center text-xl font-black uppercase rounded-full transition-all cursor-pointer">
                    <LogOut size={24} /> Log Out
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