import { useState, type FormEvent } from 'react';
import { motion } from 'framer-motion';
import { NavLink, useNavigate } from 'react-router-dom';
import eveoSymbol from '../../images/logo/eveo-symbol.svg';
import { useAuth } from '../../contexts/AuthContext';

export default function Register() {
  const navigate = useNavigate();
  const { signUp } = useAuth();
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleRegister = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError('');
    setIsSubmitting(true);
    const form = new FormData(e.currentTarget);
    try {
      await signUp({
        name: `${String(form.get('firstName')).trim()} ${String(form.get('lastName')).trim()}`,
        email: String(form.get('email')).trim(),
        password: String(form.get('password')),
        dealershipName: String(form.get('dealership')).trim(),
      });
      navigate('/app/customers', {
        replace: true,
        state: { notice: 'Application submitted. Your dealership account is pending review; the trial begins after activation.' },
      });
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'Registration failed. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const inputClasses = "w-full min-h-12 px-4 py-3 rounded-xl bg-gray-50 dark:bg-black/50 border border-gray-200 dark:border-white/10 focus:border-orange-500 focus:ring-1 focus:ring-orange-500 outline-none transition-all text-base sm:text-sm text-gray-900 dark:text-white";

  return (
    <div className="flex-1 flex items-center justify-center px-4 pt-24 pb-10 md:pt-32 sm:px-6 lg:px-8">
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, ease: "easeOut" }}
        className="w-full max-w-md space-y-6 sm:space-y-8 bg-white dark:bg-[#0a0f16] p-6 sm:p-10 rounded-3xl sm:rounded-4xl border border-gray-100 dark:border-white/5 shadow-2xl my-auto"
      >
        <div className="flex flex-col items-center">
          <div className="w-12 h-12 rounded-2xl bg-orange-500/10 flex items-center justify-center border border-orange-500/20 mb-4 sm:mb-6">
            <img src={eveoSymbol} alt="EVEO Brand Symbol" className="w-7 h-7 dark:invert-0 invert" />
          </div>
          <h2 className="text-center text-2xl font-bold text-gray-900 dark:text-white tracking-tight">
            Create your account
          </h2>
          <p className="mt-1.5 text-center text-sm text-gray-600 dark:text-gray-400">
            Already have an account? <NavLink to="/login" className="font-semibold text-orange-500 hover:text-orange-400 transition-colors">Sign in</NavLink>
          </p>
        </div>

        <form className="mt-6 sm:mt-8 space-y-4 sm:space-y-5" onSubmit={handleRegister}>
          {error && <p role="alert" className="rounded-xl border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-700 dark:text-red-300">{error}</p>}

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label htmlFor="firstName" className="block text-xs font-semibold text-gray-700 dark:text-gray-300 ml-1 mb-1.5">First name</label>
              <input id="firstName" name="firstName" type="text" autoComplete="given-name" required className={inputClasses} placeholder="John" />
            </div>
            <div>
              <label htmlFor="lastName" className="block text-xs font-semibold text-gray-700 dark:text-gray-300 ml-1 mb-1.5">Last name</label>
              <input id="lastName" name="lastName" type="text" autoComplete="family-name" required className={inputClasses} placeholder="Doe" />
            </div>
          </div>

          <div>
            <label htmlFor="dealership" className="block text-xs font-semibold text-gray-700 dark:text-gray-300 ml-1 mb-1.5">Dealership name</label>
            <input id="dealership" name="dealership" type="text" autoComplete="organization" required className={inputClasses} placeholder="Premium Auto Group" />
          </div>

          <div>
            <label htmlFor="email" className="block text-xs font-semibold text-gray-700 dark:text-gray-300 ml-1 mb-1.5">Work email</label>
            <input id="email" name="email" type="email" autoComplete="email" required className={inputClasses} placeholder="admin@dealership.com" />
          </div>

          <div>
            <label htmlFor="password" className="block text-xs font-semibold text-gray-700 dark:text-gray-300 ml-1 mb-1.5">Password</label>
            <input id="password" name="password" type="password" autoComplete="new-password" required minLength={12} className={inputClasses} placeholder="At least 12 characters" />
          </div>

          <div className="flex items-start pt-1">
            <div className="flex items-center h-5">
              <input id="terms" name="terms" type="checkbox" required className="h-4.5 w-4.5 text-orange-500 focus:ring-orange-500 border-gray-300 rounded cursor-pointer" />
            </div>
            <div className="ml-2.5 text-xs leading-relaxed">
              <label htmlFor="terms" className="font-medium text-gray-600 dark:text-gray-400">
                I agree to the{' '}
                <a href="#terms" onClick={(e) => e.preventDefault()} className="text-orange-500 hover:text-orange-400 transition-colors">Terms of Service</a>
                {' '}and{' '}
                <a href="#privacy" onClick={(e) => e.preventDefault()} className="text-orange-500 hover:text-orange-400 transition-colors">Privacy Policy</a>.
              </label>
            </div>
          </div>

          <button type="submit" className="w-full min-h-13 py-3.5 rounded-xl bg-orange-500 hover:bg-orange-600 active:scale-[0.98] text-white font-bold text-base sm:text-sm transition-all shadow-lg hover:shadow-orange-500/25 mt-2 cursor-pointer">
            {isSubmitting ? 'Submitting application…' : 'Submit dealership application'}
          </button>
        </form>
      </motion.div>
    </div>
  );
}
