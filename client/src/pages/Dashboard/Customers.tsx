import { useCallback, useEffect, useState, type FormEvent } from 'react';
import { useLocation } from 'react-router-dom';
import { apiRequest, type CustomerRecord } from '../../services/apiClient';

interface PageState {
  notice?: string;
}

export default function Customers() {
  const location = useLocation();
  const [customers, setCustomers] = useState<CustomerRecord[]>([]);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [notes, setNotes] = useState('');
  const [notice, setNotice] = useState((location.state as PageState | null)?.notice ?? '');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

  const loadCustomers = useCallback(async () => {
    setIsLoading(true);
    setError('');
    try {
      setCustomers(await apiRequest<CustomerRecord[]>('/customers'));
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'Customers could not be loaded.');
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadCustomers();
  }, [loadCustomers]);

  const createCustomer = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setIsSaving(true);
    setNotice('');
    setError('');
    try {
      const customer = await apiRequest<CustomerRecord>('/customers', {
        method: 'POST',
        body: JSON.stringify({ name, email, phone, notes }),
      });
      setCustomers((current) => [customer, ...current]);
      setName('');
      setEmail('');
      setPhone('');
      setNotes('');
      setNotice('Customer record created.');
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'Customer could not be created.');
    } finally {
      setIsSaving(false);
    }
  };

  const removeCustomer = async (customer: CustomerRecord) => {
    setNotice('');
    setError('');
    try {
      await apiRequest<void>(`/customers/${encodeURIComponent(customer._id)}`, { method: 'DELETE' });
      setCustomers((current) => current.filter((item) => item._id !== customer._id));
      setNotice(`${customer.name} was deleted.`);
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'Customer could not be deleted.');
    }
  };

  return (
    <section className="min-h-full px-4 py-8 pb-24 sm:px-8 md:py-12 md:pl-28 md:pr-10">
      <div className="mx-auto max-w-5xl space-y-8">
        <header>
          <p className="text-xs font-bold uppercase tracking-[0.25em] text-orange-500">Dealership workspace</p>
          <h1 className="mt-2 text-3xl font-black tracking-tight text-gray-900 dark:text-white">Customers</h1>
          <p className="mt-2 max-w-2xl text-sm text-gray-600 dark:text-gray-400">Customer records are scoped to your signed-in account.</p>
        </header>

        {notice && <p role="status" className="rounded-2xl border border-emerald-500/30 bg-emerald-500/10 px-4 py-3 text-sm text-emerald-800 dark:text-emerald-200">{notice}</p>}
        {error && <p role="alert" className="rounded-2xl border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-800 dark:text-red-200">{error}</p>}

        <form onSubmit={createCustomer} className="grid gap-4 rounded-3xl border border-gray-200 bg-white p-5 shadow-sm dark:border-white/10 dark:bg-[#0a0f16] sm:grid-cols-2 sm:p-7">
          <h2 className="text-lg font-bold text-gray-900 dark:text-white sm:col-span-2">Add a customer</h2>
          <label className="grid gap-1.5 text-sm font-medium text-gray-700 dark:text-gray-300">Name
            <input required minLength={2} maxLength={120} value={name} onChange={(event) => setName(event.target.value)} className="rounded-xl border border-gray-300 bg-transparent px-3 py-2.5 dark:border-white/15" autoComplete="name" />
          </label>
          <label className="grid gap-1.5 text-sm font-medium text-gray-700 dark:text-gray-300">Email
            <input type="email" value={email} onChange={(event) => setEmail(event.target.value)} className="rounded-xl border border-gray-300 bg-transparent px-3 py-2.5 dark:border-white/15" autoComplete="email" />
          </label>
          <label className="grid gap-1.5 text-sm font-medium text-gray-700 dark:text-gray-300">Phone
            <input type="tel" value={phone} onChange={(event) => setPhone(event.target.value)} className="rounded-xl border border-gray-300 bg-transparent px-3 py-2.5 dark:border-white/15" autoComplete="tel" />
          </label>
          <label className="grid gap-1.5 text-sm font-medium text-gray-700 dark:text-gray-300 sm:row-span-2">Notes
            <textarea maxLength={2000} value={notes} onChange={(event) => setNotes(event.target.value)} className="min-h-24 rounded-xl border border-gray-300 bg-transparent px-3 py-2.5 dark:border-white/15" />
          </label>
          <button disabled={isSaving} type="submit" className="self-end rounded-xl bg-orange-500 px-5 py-3 font-bold text-white transition hover:bg-orange-600 disabled:opacity-60">{isSaving ? 'Saving…' : 'Create customer'}</button>
        </form>

        <section aria-labelledby="customer-list-title" className="space-y-3">
          <h2 id="customer-list-title" className="text-lg font-bold text-gray-900 dark:text-white">Your records</h2>
          {isLoading ? <p className="text-sm text-gray-500" role="status">Loading customer records…</p> : customers.length === 0 ? <p className="rounded-2xl border border-dashed border-gray-300 p-6 text-sm text-gray-500 dark:border-white/15">No customer records yet.</p> : customers.map((customer) => (
            <article key={customer._id} className="flex flex-col gap-4 rounded-2xl border border-gray-200 bg-white p-4 dark:border-white/10 dark:bg-[#0a0f16] sm:flex-row sm:items-center sm:justify-between">
              <div className="min-w-0">
                <h3 className="font-bold text-gray-900 dark:text-white">{customer.name}</h3>
                <p className="mt-1 text-sm text-gray-600 dark:text-gray-400">{[customer.email, customer.phone].filter(Boolean).join(' · ') || 'No contact details'}</p>
                {customer.notes && <p className="mt-2 whitespace-pre-wrap text-sm text-gray-500">{customer.notes}</p>}
              </div>
              <button type="button" onClick={() => void removeCustomer(customer)} className="rounded-lg border border-red-500/30 px-3 py-2 text-sm font-semibold text-red-700 hover:bg-red-500/10 dark:text-red-300">Delete</button>
            </article>
          ))}
        </section>
      </div>
    </section>
  );
}
