import { useCallback, useEffect, useState, type FormEvent } from 'react';
import { useLocation } from 'react-router-dom';
import { apiRequest, type CustomerRecord } from '../../services/apiClient';
import { useStoreAppearance } from '../../contexts/StoreAppereanceContext';
import { demoStorage } from '../../services/demo/demoSession';

interface PageState {
  notice?: string;
}

export default function Customers() {
  const location = useLocation();
  const { activeStoreId, isDemoWorkspace } = useStoreAppearance();
  const [customers, setCustomers] = useState<CustomerRecord[]>([]);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [notes, setNotes] = useState('');
  const [search, setSearch] = useState('');
  const [editingId, setEditingId] = useState('');
  const [notice, setNotice] = useState((location.state as PageState | null)?.notice ?? '');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

  const loadCustomers = useCallback(async (query: string) => {
    setIsLoading(true);
    setError('');
    try {
      if (isDemoWorkspace) {
        const saved = demoStorage.getItem(`eveo_demo_customer_records_${activeStoreId}`);
        const records = saved ? JSON.parse(saved) as CustomerRecord[] : [];
        const normalizedQuery = query.trim().toLowerCase();
        setCustomers(records.filter((item) => !normalizedQuery || `${item.name} ${item.email} ${item.phone}`.toLowerCase().includes(normalizedQuery)));
        return;
      }
      const params = new URLSearchParams();
      if (activeStoreId) params.set('storeId', activeStoreId);
      if (query.trim()) params.set('search', query.trim());
      setCustomers(await apiRequest<CustomerRecord[]>(`/customers${params.size ? `?${params}` : ''}`));
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'Customers could not be loaded.');
    } finally {
      setIsLoading(false);
    }
  }, [activeStoreId, isDemoWorkspace]);

  useEffect(() => {
    const timer = window.setTimeout(() => void loadCustomers(search), 250);
    return () => window.clearTimeout(timer);
  }, [loadCustomers, search]);

  const createCustomer = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setIsSaving(true);
    setNotice('');
    setError('');
    try {
      const isEditing = Boolean(editingId);
      if (isDemoWorkspace) {
        const now = Date.now();
        const rateKey = 'eveo_demo_customer_rate';
        const recentCreates = (JSON.parse(demoStorage.getItem(rateKey) || '[]') as number[]).filter((timestamp) => now - timestamp < 60_000);
        if (!isEditing && recentCreates.length >= 10) throw new Error('Demo limit reached. Try again in a minute.');
        if (!isEditing) demoStorage.setItem(rateKey, JSON.stringify([...recentCreates, now]));
        const storageKey = `eveo_demo_customer_records_${activeStoreId}`;
        const current = JSON.parse(demoStorage.getItem(storageKey) || '[]') as CustomerRecord[];
        const customer: CustomerRecord = { _id: editingId || `demo_${crypto.randomUUID()}`, storeId: activeStoreId, name: name.trim(), email: email.trim(), phone: phone.trim(), notes: notes.trim(), createdAt: new Date().toISOString() };
        const next = [customer, ...current.filter((item) => item._id !== customer._id)];
        demoStorage.setItem(storageKey, JSON.stringify(next));
        setCustomers(next);
        setName(''); setEmail(''); setPhone(''); setNotes(''); setEditingId('');
        setNotice(isEditing ? 'Temporary demo customer updated.' : 'Temporary demo customer added. It will be cleared when you sign out or close this tab.');
        return;
      }
      const customer = await apiRequest<CustomerRecord>(isEditing ? `/customers/${encodeURIComponent(editingId)}` : '/customers', {
        method: isEditing ? 'PATCH' : 'POST',
        body: JSON.stringify({ name, email, phone, notes, storeId: activeStoreId }),
      });
      setCustomers((current) => [customer, ...current.filter((item) => item._id !== customer._id)]);
      setName('');
      setEmail('');
      setPhone('');
      setNotes('');
      setEditingId('');
      setNotice(customer.duplicate ? 'Matched the existing customer record.' : isEditing ? 'Customer record updated.' : 'Customer record created.');
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'Customer could not be created.');
    } finally {
      setIsSaving(false);
    }
  };

  const startEdit = (customer: CustomerRecord) => {
    setEditingId(customer._id);
    setName(customer.name);
    setEmail(customer.email);
    setPhone(customer.phone);
    setNotes(customer.notes);
    setNotice('');
    setError('');
  };

  const removeCustomer = async (customer: CustomerRecord) => {
    setNotice('');
    setError('');
    try {
      if (isDemoWorkspace) {
        const storageKey = `eveo_demo_customer_records_${activeStoreId}`;
        const next = (JSON.parse(demoStorage.getItem(storageKey) || '[]') as CustomerRecord[]).filter((item) => item._id !== customer._id);
        demoStorage.setItem(storageKey, JSON.stringify(next));
        setCustomers(next);
        setNotice(`${customer.name} was removed from this tab's demo data.`);
        return;
      }
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
          <p className="mt-2 max-w-2xl text-sm text-gray-600 dark:text-gray-400">Manage the customer records you own in your active store.</p>
          {isDemoWorkspace && <p className="mt-2 text-xs text-orange-700 dark:text-orange-300">Demo entries are temporary and limited to 10 per minute. They stay in this browser tab only.</p>}
        </header>

        {notice && <p role="status" className="rounded-2xl border border-emerald-500/30 bg-emerald-500/10 px-4 py-3 text-sm text-emerald-800 dark:text-emerald-200">{notice}</p>}
        {error && <p role="alert" className="rounded-2xl border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-800 dark:text-red-200">{error}</p>}

        <form onSubmit={createCustomer} className="grid gap-4 rounded-3xl border border-gray-200 bg-white p-5 shadow-sm dark:border-white/10 dark:bg-[#0a0f16] sm:grid-cols-2 sm:p-7">
          <h2 className="text-lg font-bold text-gray-900 dark:text-white sm:col-span-2">{editingId ? 'Edit customer' : 'Add a customer'}</h2>
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
          <div className="flex items-center gap-2 self-end">
            <button disabled={isSaving} type="submit" className="rounded-xl bg-orange-500 px-5 py-3 font-bold text-white transition hover:bg-orange-600 disabled:opacity-60">{isSaving ? 'Saving…' : editingId ? 'Save customer' : 'Create customer'}</button>
            {editingId && <button type="button" onClick={() => { setEditingId(''); setName(''); setEmail(''); setPhone(''); setNotes(''); }} className="rounded-xl border border-gray-300 px-4 py-3 font-semibold text-gray-700 dark:border-white/15 dark:text-gray-300">Cancel</button>}
          </div>
        </form>

        <section aria-labelledby="customer-list-title" className="space-y-3">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <h2 id="customer-list-title" className="text-lg font-bold text-gray-900 dark:text-white">Your records</h2>
            <label className="text-sm text-gray-600 dark:text-gray-400">Search customers<input aria-label="Search customers" type="search" value={search} onChange={(event) => setSearch(event.target.value)} className="ml-2 rounded-lg border border-gray-300 bg-transparent px-3 py-2 dark:border-white/15" /></label>
          </div>
          {isLoading ? <p className="text-sm text-gray-500" role="status">Loading customer records…</p> : customers.length === 0 ? <p className="rounded-2xl border border-dashed border-gray-300 p-6 text-sm text-gray-500 dark:border-white/15">No customer records yet.</p> : customers.map((customer) => (
            <article key={customer._id} className="flex flex-col gap-4 rounded-2xl border border-gray-200 bg-white p-4 dark:border-white/10 dark:bg-[#0a0f16] sm:flex-row sm:items-center sm:justify-between">
              <div className="min-w-0">
                <h3 className="font-bold text-gray-900 dark:text-white">{customer.name}</h3>
                <p className="mt-1 text-sm text-gray-600 dark:text-gray-400">{[customer.email, customer.phone].filter(Boolean).join(' · ') || 'No contact details'}</p>
                {customer.notes && <p className="mt-2 whitespace-pre-wrap text-sm text-gray-500">{customer.notes}</p>}
              </div>
              <div className="flex gap-2">
                <button type="button" onClick={() => startEdit(customer)} className="rounded-lg border border-white/15 px-3 py-2 text-sm font-semibold text-gray-700 hover:bg-gray-100 dark:text-gray-200 dark:hover:bg-white/5">Edit</button>
                <button type="button" onClick={() => void removeCustomer(customer)} className="rounded-lg border border-red-500/30 px-3 py-2 text-sm font-semibold text-red-700 hover:bg-red-500/10 dark:text-red-300">Delete</button>
              </div>
            </article>
          ))}
        </section>
      </div>
    </section>
  );
}
