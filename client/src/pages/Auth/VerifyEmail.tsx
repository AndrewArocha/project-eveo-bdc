import { useEffect, useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';

export default function VerifyEmail() {
  const [params] = useSearchParams();
  const navigate = useNavigate();
  const { verifyEmail } = useAuth();
  const [error, setError] = useState('');

  useEffect(() => {
    let active = true;
    const token = params.get('token');
    if (!token) {
      setError('This verification link is missing its token. Please request a new account link.');
      return () => { active = false; };
    }
    verifyEmail(token)
      .then(() => { if (active) navigate('/admin/portal', { replace: true }); })
      .catch((cause: unknown) => {
        if (active) setError(cause instanceof Error ? cause.message : 'Email verification failed.');
      });
    return () => { active = false; };
  }, [navigate, params, verifyEmail]);

  return (
    <div className="flex flex-1 items-center justify-center px-4 py-12">
      <section className="w-full max-w-lg rounded-3xl border border-gray-200 bg-white p-8 text-center shadow-2xl dark:border-white/10 dark:bg-[#0a0f16]">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Email verification</h1>
        {error ? <><p role="alert" className="mt-3 text-sm text-red-600 dark:text-red-300">{error}</p><Link to="/login" className="mt-6 inline-flex min-h-11 items-center rounded-xl bg-orange-500 px-5 font-semibold text-white">Go to sign in</Link></> : <p className="mt-3 text-sm text-gray-600 dark:text-gray-300">Verifying your email address…</p>}
      </section>
    </div>
  );
}
