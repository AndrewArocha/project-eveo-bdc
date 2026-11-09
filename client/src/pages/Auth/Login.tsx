import { useState, type FormEvent } from 'react';
import { motion } from 'framer-motion';
import { NavLink, useLocation, useNavigate } from 'react-router-dom';
import eveoSymbol from '../../images/logo/eveo-symbol.svg';
import { useAuth } from '../../contexts/AuthContext';
import { apiRequest } from '../../services/apiClient';
import { AuthSplitLayout, GoogleSignInButton } from '../../components/Auth/AuthSplitLayout';

export default function Login() {
  const navigate = useNavigate();
  const location = useLocation();
  const { signIn } = useAuth();
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [needsVerification, setNeedsVerification] = useState(false);
  const [verificationNotice, setVerificationNotice] = useState('');
  const [isResending, setIsResending] = useState(false);

  const handleLogin = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError('');
    setNeedsVerification(false);
    setVerificationNotice('');
    setIsSubmitting(true);
    const form = new FormData(e.currentTarget);
    try {
      const user = await signIn(email || String(form.get('email')), password || String(form.get('password')));
      const destination = (location.state as { from?: { pathname?: string } } | null)?.from?.pathname;
      navigate(user.role === 'owner' ? '/admin/portal' : destination?.startsWith('/app/') ? destination : '/app/hub', { replace: true });
    } catch (cause) {
      const message = cause instanceof Error ? cause.message : 'Sign-in failed. Please try again.';
      setError(message);
      if (message.toLowerCase().includes('verify your email')) setNeedsVerification(true);
    } finally {
      setIsSubmitting(false);
    }
  };

  const resendVerification = async () => {
    setIsResending(true);
    setVerificationNotice('');
    try {
      await apiRequest('/auth/resend-verification', { method: 'POST', body: JSON.stringify({ email, password }) });
      setVerificationNotice('If this account needs verification, a fresh link has been sent to its email address.');
    } catch (cause) {
      setVerificationNotice(cause instanceof Error ? cause.message : 'A verification email could not be sent.');
    } finally { setIsResending(false); }
  };

  const inputClasses = "w-full min-h-12 px-4 py-3 rounded-xl bg-gray-50 dark:bg-black/50 border border-gray-200 dark:border-white/10 focus:border-orange-500 focus:ring-1 focus:ring-orange-500 outline-none transition-all text-base sm:text-sm text-gray-900 dark:text-white";

  return (
    <AuthSplitLayout>
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, ease: "easeOut" }}
        className="w-full space-y-6 sm:space-y-8"
      >
        <div className="flex flex-col items-center">
          <div className="w-12 h-12 rounded-2xl bg-orange-500/10 flex items-center justify-center border border-orange-500/20 mb-4 sm:mb-6">
            <img src={eveoSymbol} alt="EVEO Brand Symbol" className="w-7 h-7 dark:invert-0 invert" />
          </div>
          <h2 className="text-center text-2xl font-bold text-gray-900 dark:text-white tracking-tight">
            Sign in to your account
          </h2>
          <p className="mt-1.5 text-center text-sm text-gray-600 dark:text-gray-400">
            New to EVEO? <NavLink to="/register" className="font-semibold text-orange-500 hover:text-orange-400 transition-colors">Create an account</NavLink>
          </p>
        </div>

        <GoogleSignInButton />
        <div className="flex items-center gap-3 text-xs text-gray-400"><span className="h-px flex-1 bg-gray-200 dark:bg-white/10" />OR EMAIL<span className="h-px flex-1 bg-gray-200 dark:bg-white/10" /></div>

        <form className="mt-6 sm:mt-8 space-y-5 sm:space-y-6" onSubmit={handleLogin}>
          {error && <p role="alert" className="rounded-xl border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-700 dark:text-red-300">{error}</p>}
          <div className="space-y-4">
            <div>
              <label htmlFor="email" className="block text-xs font-semibold text-gray-700 dark:text-gray-300 ml-1 mb-1.5">Email address</label>
              <input id="email" name="email" value={email} onChange={(event) => setEmail(event.target.value)} type="email" autoComplete="email" required className={inputClasses} placeholder="admin@dealership.com" />
            </div>
            <div>
              <label htmlFor="password" className="block text-xs font-semibold text-gray-700 dark:text-gray-300 ml-1 mb-1.5">Password</label>
            <input id="password" name="password" value={password} onChange={(event) => setPassword(event.target.value)} type="password" autoComplete="current-password" required minLength={12} className={inputClasses} placeholder="••••••••" />
            </div>
          </div>

          <div className="flex items-center justify-between pt-1">
            <div className="flex items-center">
              <input id="remember-me" name="remember-me" type="checkbox" className="h-4.5 w-4.5 text-orange-500 focus:ring-orange-500 border-gray-300 rounded cursor-pointer" />
              <label htmlFor="remember-me" className="ml-2.5 block text-xs font-medium text-gray-700 dark:text-gray-400 cursor-pointer">Remember me</label>
            </div>
            <div className="text-xs">
              <a href="#forgot-password" onClick={(e) => e.preventDefault()} className="font-semibold text-orange-500 hover:text-orange-400 transition-colors">Forgot password?</a>
            </div>
          </div>

          <button type="submit" className="w-full min-h-13 py-3.5 rounded-xl bg-orange-500 hover:bg-orange-600 active:scale-[0.98] text-white font-bold text-base sm:text-sm transition-all shadow-lg hover:shadow-orange-500/25 cursor-pointer">
            {isSubmitting ? 'Signing in…' : 'Sign in'}
          </button>
          {needsVerification && <button type="button" onClick={() => void resendVerification()} disabled={isResending || !email || !password} className="w-full min-h-10 rounded-xl border border-orange-500/30 px-4 text-xs font-semibold text-orange-700 disabled:opacity-50 dark:text-orange-300">{isResending ? 'Sending…' : 'Resend verification email'}</button>}
          {verificationNotice && <p role="status" className="text-xs text-gray-600 dark:text-gray-400">{verificationNotice}</p>}
        </form>
      </motion.div>
    </AuthSplitLayout>
  );
}
