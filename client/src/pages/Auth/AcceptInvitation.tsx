import { useState, type FormEvent } from 'react';
import { motion } from 'framer-motion';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';

const inputClasses = 'w-full min-h-12 rounded-xl border border-gray-200 bg-gray-50 px-4 py-3 text-base text-gray-900 outline-none transition focus:border-orange-500 focus:ring-1 focus:ring-orange-500 dark:border-white/10 dark:bg-black/50 dark:text-white sm:text-sm';

export default function AcceptInvitation() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { acceptInvitation } = useAuth();
  const token = searchParams.get('token') || '';
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError('');
    if (!token) {
      setError('This invitation link is missing its secure token. Ask the dealership owner for a new invitation.');
      return;
    }
    const form = new FormData(event.currentTarget);
    setIsSubmitting(true);
    try {
      await acceptInvitation({ token, name: String(form.get('name')).trim(), password: String(form.get('password')) });
      navigate('/app/hub', { replace: true });
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'Could not accept this invitation. Ask the owner for a new link.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="flex flex-1 items-center justify-center px-4 pb-10 pt-24 sm:px-6 md:pt-32">
      <motion.section initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} className="w-full max-w-md space-y-6 rounded-3xl border border-gray-100 bg-white p-6 shadow-2xl dark:border-white/5 dark:bg-[#0a0f16] sm:p-9">
        <div>
          <p className="text-[10px] font-bold uppercase tracking-widest text-orange-500">Dealership team</p>
          <h1 className="mt-2 text-2xl font-black text-gray-900 dark:text-white">Accept your invitation</h1>
          <p className="mt-2 text-sm leading-relaxed text-gray-500 dark:text-gray-400">Your account will use the email address this invitation was sent to and the role and stores selected by the dealership owner.</p>
        </div>
        <form onSubmit={(event) => void handleSubmit(event)} className="space-y-4">
          {error && <p role="alert" className="rounded-xl border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-600 dark:text-red-300">{error}</p>}
          <div>
            <label htmlFor="invite-name" className="mb-1.5 ml-1 block text-xs font-semibold text-gray-600 dark:text-gray-300">Full name</label>
            <input id="invite-name" name="name" autoComplete="name" minLength={2} maxLength={100} required className={inputClasses} />
          </div>
          <div>
            <label htmlFor="invite-password" className="mb-1.5 ml-1 block text-xs font-semibold text-gray-600 dark:text-gray-300">Create password</label>
            <input id="invite-password" name="password" type="password" autoComplete="new-password" minLength={12} maxLength={128} required className={inputClasses} />
            <p className="ml-1 mt-1 text-[11px] text-gray-500">Use at least 12 characters.</p>
          </div>
          <button type="submit" disabled={isSubmitting || !token} className="min-h-12 w-full rounded-xl bg-orange-500 px-5 py-3 text-sm font-bold text-white transition hover:bg-orange-600 disabled:cursor-not-allowed disabled:opacity-60">
            {isSubmitting ? 'Accepting invitation…' : 'Create account and join'}
          </button>
        </form>
      </motion.section>
    </div>
  );
}
