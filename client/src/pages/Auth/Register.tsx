import { useState, type FormEvent } from 'react';
import { motion } from 'framer-motion';
import { NavLink } from 'react-router-dom';
import eveoSymbol from '../../images/logo/eveo-symbol.svg';
import { useAuth } from '../../contexts/AuthContext';
import LegalModal from '../../components/UI/LegalModal';

export default function Register() {
  const { signUp } = useAuth();
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [legalType, setLegalType] = useState<'terms' | 'privacy' | null>(null);
  const [verificationSent, setVerificationSent] = useState(false);

  const handleRegister = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError('');
    setIsSubmitting(true);
    const form = new FormData(event.currentTarget);
    try {
      await signUp({
        name: String(form.get('name')).trim(),
        businessName: String(form.get('businessName')).trim(),
        phone: String(form.get('phone')).trim(),
        email: String(form.get('email')).trim(),
        password: String(form.get('password')),
        promotionalConsent: form.get('promotionalConsent') === 'on',
      });
      setVerificationSent(true);
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'We could not submit your request. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const inputClasses = 'w-full min-h-12 px-4 py-3 rounded-xl bg-gray-50 dark:bg-black/50 border border-gray-200 dark:border-white/10 focus:border-orange-500 focus:ring-1 focus:ring-orange-500 outline-none transition-all text-base sm:text-sm text-gray-900 dark:text-white';

  if (verificationSent) return (
    <div className="flex flex-1 items-center justify-center px-4 py-12">
      <section className="w-full max-w-lg rounded-3xl border border-gray-200 bg-white p-8 text-center shadow-2xl dark:border-white/10 dark:bg-[#0a0f16]">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Verify your email</h1>
        <p className="mt-3 text-sm leading-6 text-gray-600 dark:text-gray-300">We sent a secure verification link to the email address you provided. Verify it to sign in and open the EVEO demo workspace.</p>
        <p className="mt-4 text-xs text-gray-500">Promotional emails are sent only if you opted in during registration.</p>
        <NavLink to="/login" className="mt-6 inline-flex min-h-11 items-center rounded-xl bg-orange-500 px-5 font-semibold text-white">Continue to sign in</NavLink>
      </section>
    </div>
  );

  return (
    <div className="flex-1 flex items-center justify-center px-4 pt-24 pb-10 md:pt-32 sm:px-6 lg:px-8">
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, ease: 'easeOut' }}
        className="w-full max-w-lg space-y-6 sm:space-y-8 bg-white dark:bg-[#0a0f16] p-6 sm:p-10 rounded-3xl border border-gray-100 dark:border-white/5 shadow-2xl my-auto"
      >
        <div className="flex flex-col items-center">
          <div className="w-12 h-12 rounded-2xl bg-orange-500/10 flex items-center justify-center border border-orange-500/20 mb-4 sm:mb-6">
            <img src={eveoSymbol} alt="EVEO" className="w-7 h-7" />
          </div>
          <h1 className="text-center text-2xl font-bold text-gray-900 dark:text-white tracking-tight">
            Create your EVEO account
          </h1>
          <p className="mt-2 text-center text-sm text-gray-600 dark:text-gray-400">
            <>Set up your dealership workspace. You can complete your profile and billing from the admin portal. Already have an account? <NavLink to="/login" className="font-semibold text-orange-500 hover:text-orange-400">Sign in</NavLink></>
          </p>
        </div>

          <form className="space-y-4" onSubmit={(event) => void handleRegister(event)}>
            {error && <p role="alert" className="rounded-xl border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-700 dark:text-red-300">{error}</p>}

            <div>
              <label htmlFor="name" className="mb-1.5 ml-1 block text-xs font-semibold text-gray-700 dark:text-gray-300">Your name</label>
              <input id="name" name="name" type="text" autoComplete="name" required minLength={2} maxLength={100} className={inputClasses} />
            </div>
            <div>
              <label htmlFor="businessName" className="mb-1.5 ml-1 block text-xs font-semibold text-gray-700 dark:text-gray-300">Dealership / company name</label>
              <input id="businessName" name="businessName" type="text" autoComplete="organization" required minLength={2} maxLength={120} className={inputClasses} />
            </div>
            <div>
              <label htmlFor="phone" className="mb-1.5 ml-1 block text-xs font-semibold text-gray-700 dark:text-gray-300">Phone</label>
              <input id="phone" name="phone" type="tel" autoComplete="tel" required minLength={7} maxLength={40} className={inputClasses} />
            </div>
            <div>
              <label htmlFor="email" className="mb-1.5 ml-1 block text-xs font-semibold text-gray-700 dark:text-gray-300">Work email</label>
              <input id="email" name="email" type="email" autoComplete="email" required maxLength={254} className={inputClasses} />
            </div>
            <div>
              <label htmlFor="password" className="mb-1.5 ml-1 block text-xs font-semibold text-gray-700 dark:text-gray-300">Password</label>
              <input id="password" name="password" type="password" autoComplete="new-password" required minLength={12} maxLength={128} className={inputClasses} />
              <p className="mt-1 ml-1 text-xs text-gray-500">At least 12 characters.</p>
            </div>

            <p className="px-1 pt-1 text-xs leading-relaxed text-gray-500 dark:text-gray-400">
              Verify your email to access the illustrative EVEO demo. No paid subscription is required to explore it.
            </p>
            <label className="flex items-start gap-2 px-1 text-xs leading-relaxed text-gray-600 dark:text-gray-400">
              <input name="promotionalConsent" type="checkbox" className="mt-0.5 accent-orange-500" />
              <span>I agree to receive occasional EVEO product updates and promotional emails. I can unsubscribe at any time.</span>
            </label>
            <p className="px-1 text-center text-xs leading-relaxed text-gray-500 dark:text-gray-400">
              By creating an account, you agree to our{' '}
              <button type="button" onClick={() => setLegalType('terms')} className="font-semibold text-orange-500 hover:text-orange-400">Terms of Service</button>
              {' '}and{' '}
              <button type="button" onClick={() => setLegalType('privacy')} className="font-semibold text-orange-500 hover:text-orange-400">Privacy Policy</button>.
            </p>
            <button type="submit" disabled={isSubmitting} className="mt-2 w-full min-h-13 rounded-xl bg-orange-500 py-3.5 text-sm font-bold text-white shadow-lg transition hover:bg-orange-600 hover:shadow-orange-500/25 disabled:cursor-wait disabled:opacity-60">
              {isSubmitting ? 'Sending verification link…' : 'Create account and verify email'}
            </button>
          </form>
      </motion.div>
      <LegalModal isOpen={legalType !== null} onClose={() => setLegalType(null)} type={legalType} />
    </div>
  );
}
