import { motion } from 'framer-motion';
import { NavLink, useNavigate } from 'react-router-dom';
import eveoSymbol from '../../images/logo/eveo-symbol.svg';

export default function Register() {
  const navigate = useNavigate();

  const handleRegister = (e: React.FormEvent) => {
    e.preventDefault();
    // Simulate account creation for now
    localStorage.setItem('eveo_token', 'mock_dev_token_12345');
    localStorage.setItem('eveo_role', 'owner');
    navigate('/admin/portal'); 
  };

  return (
    // Matches the exact mobile-safe padding we calculated for the Login page
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
            Create your account
          </h2>
          <p className="mt-2 text-center text-sm text-gray-600 dark:text-gray-400">
            Already have an account? <NavLink to="/login" className="font-medium text-orange-500 hover:text-orange-400 transition-colors">Sign in</NavLink>
          </p>
        </div>

        <form className="mt-8 space-y-5" onSubmit={handleRegister}>
          
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-5 sm:gap-4">
            <div>
              <label htmlFor="firstName" className="block text-xs font-medium text-gray-700 dark:text-gray-300 ml-1 mb-1">First name</label>
              <input id="firstName" name="firstName" type="text" required className="w-full px-4 py-3 rounded-xl bg-gray-50 dark:bg-black/50 border border-gray-200 dark:border-white/10 focus:border-orange-500 focus:ring-1 focus:ring-orange-500 outline-none transition-all text-sm text-gray-900 dark:text-white" placeholder="John" />
            </div>
            <div>
              <label htmlFor="lastName" className="block text-xs font-medium text-gray-700 dark:text-gray-300 ml-1 mb-1">Last name</label>
              <input id="lastName" name="lastName" type="text" required className="w-full px-4 py-3 rounded-xl bg-gray-50 dark:bg-black/50 border border-gray-200 dark:border-white/10 focus:border-orange-500 focus:ring-1 focus:ring-orange-500 outline-none transition-all text-sm text-gray-900 dark:text-white" placeholder="Doe" />
            </div>
          </div>

          <div>
            <label htmlFor="dealership" className="block text-xs font-medium text-gray-700 dark:text-gray-300 ml-1 mb-1">Dealership name</label>
            <input id="dealership" name="dealership" type="text" required className="w-full px-4 py-3 rounded-xl bg-gray-50 dark:bg-black/50 border border-gray-200 dark:border-white/10 focus:border-orange-500 focus:ring-1 focus:ring-orange-500 outline-none transition-all text-sm text-gray-900 dark:text-white" placeholder="Premium Auto Group" />
          </div>

          <div>
            <label htmlFor="email" className="block text-xs font-medium text-gray-700 dark:text-gray-300 ml-1 mb-1">Work email</label>
            <input id="email" name="email" type="email" required className="w-full px-4 py-3 rounded-xl bg-gray-50 dark:bg-black/50 border border-gray-200 dark:border-white/10 focus:border-orange-500 focus:ring-1 focus:ring-orange-500 outline-none transition-all text-sm text-gray-900 dark:text-white" placeholder="admin@dealership.com" />
          </div>

          <div>
            <label htmlFor="password" className="block text-xs font-medium text-gray-700 dark:text-gray-300 ml-1 mb-1">Password</label>
            <input id="password" name="password" type="password" required className="w-full px-4 py-3 rounded-xl bg-gray-50 dark:bg-black/50 border border-gray-200 dark:border-white/10 focus:border-orange-500 focus:ring-1 focus:ring-orange-500 outline-none transition-all text-sm text-gray-900 dark:text-white" placeholder="••••••••" />
          </div>

          <div className="flex items-start pt-2">
            <div className="flex items-center h-5">
              <input id="terms" name="terms" type="checkbox" required className="h-4 w-4 text-orange-500 focus:ring-orange-500 border-gray-300 rounded cursor-pointer" />
            </div>
            <div className="ml-2 text-xs">
              <label htmlFor="terms" className="font-medium text-gray-600 dark:text-gray-400">
                I agree to the{' '}
                <a href="#" className="text-orange-500 hover:text-orange-400 transition-colors">Terms of Service</a>
                {' '}and{' '}
                <a href="#" className="text-orange-500 hover:text-orange-400 transition-colors">Privacy Policy</a>.
              </label>
            </div>
          </div>

          <button type="submit" className="w-full py-3.5 rounded-xl bg-orange-500 hover:bg-orange-600 text-white font-bold transition-all shadow-lg hover:shadow-orange-500/25 mt-2">
            Start 14-day free trial
          </button>
        </form>
      </motion.div>
    </div>
  );
}