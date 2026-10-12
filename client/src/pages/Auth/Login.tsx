import { motion } from 'framer-motion';
import { NavLink, useNavigate } from 'react-router-dom';
import eveoSymbol from '../../images/logo/eveo-symbol.svg';

export default function Login() {
  const navigate = useNavigate();

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    // Simulate authentication for now, then push user to the internal dashboard
    localStorage.setItem('eveo_token', 'mock_dev_token_12345');
    localStorage.setItem('eveo_role', 'owner');
    navigate('/admin/portal'); 
  };

  return (
    // The header is h-20 (80px). pt-28 (112px) guarantees at least 32px of safe breathing room below the header on mobile.
    <div className="flex-1 flex items-center justify-center px-4 pt-28 pb-12 md:pt-32 sm:px-6 lg:px-8">
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, ease: "easeOut" }}
        className="w-full max-w-md space-y-8 bg-white dark:bg-[#0a0f16] p-8 sm:p-10 rounded-4xl border border-gray-100 dark:border-white/5 shadow-2xl my-auto"
      >
        <div className="flex flex-col items-center">
          <div className="w-12 h-12 rounded-xl bg-orange-500/10 flex items-center justify-center border border-orange-500/20 mb-6">
            <img src={eveoSymbol} alt="Eveo" className="w-7 h-7 dark:invert-0 invert" />
          </div>
          <h2 className="text-center text-2xl font-bold text-gray-900 dark:text-white tracking-tight">
            Sign in to your account
          </h2>
          <p className="mt-2 text-center text-sm text-gray-600 dark:text-gray-400">
            Or <NavLink to="/register" className="font-medium text-orange-500 hover:text-orange-400 transition-colors">start your 14-day free trial</NavLink>
          </p>
        </div>

        <form className="mt-8 space-y-6" onSubmit={handleLogin}>
          <div className="space-y-4">
            <div>
              <label htmlFor="email" className="block text-xs font-medium text-gray-700 dark:text-gray-300 ml-1 mb-1">Email address</label>
              <input id="email" name="email" type="email" required className="w-full px-4 py-3 rounded-xl bg-gray-50 dark:bg-black/50 border border-gray-200 dark:border-white/10 focus:border-orange-500 focus:ring-1 focus:ring-orange-500 outline-none transition-all text-sm text-gray-900 dark:text-white" placeholder="admin@dealership.com" />
            </div>
            <div>
              <label htmlFor="password" className="block text-xs font-medium text-gray-700 dark:text-gray-300 ml-1 mb-1">Password</label>
              <input id="password" name="password" type="password" required className="w-full px-4 py-3 rounded-xl bg-gray-50 dark:bg-black/50 border border-gray-200 dark:border-white/10 focus:border-orange-500 focus:ring-1 focus:ring-orange-500 outline-none transition-all text-sm text-gray-900 dark:text-white" placeholder="••••••••" />
            </div>
          </div>

          <div className="flex items-center justify-between">
            <div className="flex items-center">
              <input id="remember-me" name="remember-me" type="checkbox" className="h-4 w-4 text-orange-500 focus:ring-orange-500 border-gray-300 rounded" />
              <label htmlFor="remember-me" className="ml-2 block text-xs text-gray-700 dark:text-gray-400">Remember me</label>
            </div>
            <div className="text-xs">
              <a href="#" className="font-medium text-orange-500 hover:text-orange-400 transition-colors">Forgot password?</a>
            </div>
          </div>

          <button type="submit" className="w-full py-3.5 rounded-xl bg-orange-500 hover:bg-orange-600 text-white font-bold transition-all shadow-lg hover:shadow-orange-500/25">
            Sign in
          </button>
        </form>
      </motion.div>
    </div>
  );
}