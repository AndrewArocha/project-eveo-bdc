import { useState, type FormEvent } from 'react';
import { motion } from 'framer-motion';
import { NavLink, useNavigate } from 'react-router-dom';
import { CheckCircle2 } from 'lucide-react';
import eveoSymbol from '../../images/logo/eveo-symbol.svg';
import { apiRequest } from '../../services/apiClient';

interface ApplicationResponse {
  status: 'submitted';
  submittedAt: string;
}

export default function Register() {
  const navigate = useNavigate();
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  const handleRegister = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError('');
    setIsSubmitting(true);
    const form = new FormData(event.currentTarget);
    try {
      await apiRequest<ApplicationResponse>('/auth/signup', {
        method: 'POST',
        body: JSON.stringify({
          name: String(form.get('name')).trim(),
          businessName: String(form.get('businessName')).trim(),
          phone: String(form.get('phone')).trim(),
          email: String(form.get('email')).trim(),
        }),
      });
      setSubmitted(true);
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'We could not submit your request. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const inputClasses = 'w-full min-h-12 px-4 py-3 rounded-xl bg-gray-50 dark:bg-black/50 border border-gray-200 dark:border-white/10 focus:border-orange-500 focus:ring-1 focus:ring-orange-500 outline-none transition-all text-base sm:text-sm text-gray-900 dark:text-white';

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
            {submitted ? 'Request received' : 'Bring your dealership to EVEO'}
          </h1>
          <p className="mt-2 text-center text-sm text-gray-600 dark:text-gray-400">
            {submitted
              ? 'Our team will contact you about membership and secure billing setup.'
              : <>Already have an account? <NavLink to="/login" className="font-semibold text-orange-500 hover:text-orange-400">Sign in</NavLink></>}
          </p>
        </div>

        {submitted ? (
          <div className="space-y-5 text-center">
            <div className="mx-auto grid h-14 w-14 place-items-center rounded-full border border-emerald-500/20 bg-emerald-500/10 text-emerald-500">
              <CheckCircle2 size={28} />
            </div>
            <p className="text-sm leading-relaxed text-gray-600 dark:text-gray-300">
              This request does not create a login, activate a dealership workspace, or start a trial. Workspace access begins after membership and billing are set up.
            </p>
            <button type="button" onClick={() => navigate('/')} className="w-full min-h-12 rounded-xl bg-orange-500 px-4 py-3 text-sm font-bold text-white transition hover:bg-orange-600">
              Return to EVEO
            </button>
          </div>
        ) : (
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

            <p className="px-1 pt-1 text-xs leading-relaxed text-gray-500 dark:text-gray-400">
              Membership activation and any trial terms are confirmed during secure billing setup. Submitting this request does not start a trial.
            </p>
            <button type="submit" disabled={isSubmitting} className="mt-2 w-full min-h-13 rounded-xl bg-orange-500 py-3.5 text-sm font-bold text-white shadow-lg transition hover:bg-orange-600 hover:shadow-orange-500/25 disabled:cursor-wait disabled:opacity-60">
              {isSubmitting ? 'Sending request…' : 'Request dealership access'}
            </button>
          </form>
        )}
      </motion.div>
    </div>
  );
}
