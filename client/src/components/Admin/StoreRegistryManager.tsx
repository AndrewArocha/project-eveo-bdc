import { useEffect, useState, type FormEvent } from 'react';
import { Building2, LoaderCircle, Plus, Save } from 'lucide-react';
import { ApiError, apiRequest, type ApiStore } from '../../services/apiClient';
import { useStoreAppearance } from '../../contexts/StoreAppereanceContext';

interface StoreDraft {
  name: string;
  code: string;
  website: string;
  phone: string;
  address: string;
  timezone: string;
}

const EMPTY_DRAFT: StoreDraft = {
  name: '',
  code: '',
  website: '',
  phone: '',
  address: '',
  timezone: '',
};

const inputClasses = 'min-h-11 w-full rounded-xl border border-white/10 bg-black/40 px-3.5 py-2.5 text-sm text-white outline-none transition placeholder:text-gray-500 focus:border-orange-500';

export default function StoreRegistryManager() {
  const { registeredStores: stores, storesLoading: isLoading, storesError, refreshStores, setActiveStoreId } = useStoreAppearance();
  const [selectedStoreId, setSelectedStoreId] = useState('');
  const [draft, setDraft] = useState<StoreDraft>(EMPTY_DRAFT);
  const [isCreating, setIsCreating] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState('');
  const [feedback, setFeedback] = useState('');

  useEffect(() => {
    if (!selectedStoreId && stores[0]) setSelectedStoreId(stores[0].id);
  }, [selectedStoreId, stores]);

  useEffect(() => { if (storesError) setError(storesError); }, [storesError]);

  const selectedStore = stores.find((store) => store.id === selectedStoreId) ?? null;

  useEffect(() => {
    if (isCreating) return;
    if (selectedStore) {
      setDraft({
        name: selectedStore.name,
        code: selectedStore.code,
        website: selectedStore.website,
        phone: selectedStore.phone,
        address: selectedStore.address,
        timezone: selectedStore.timezone,
      });
    } else if (stores.length === 0) {
      setDraft(EMPTY_DRAFT);
    }
  }, [isCreating, selectedStore, stores.length]);

  const updateDraft = (key: keyof StoreDraft, value: string) => {
    setDraft((current) => ({ ...current, [key]: value }));
    setError('');
    setFeedback('');
  };

  const handleCreate = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setIsSaving(true);
    setError('');
    setFeedback('');
    try {
      const created = await apiRequest<ApiStore>('/stores', {
        method: 'POST',
        body: JSON.stringify(draft),
      });
      await refreshStores();
      setSelectedStoreId(created.id);
      setActiveStoreId(created.id);
      setIsCreating(false);
      setFeedback(`${created.name} was added to your store registry.`);
    } catch (reason) {
      setError(reason instanceof ApiError ? reason.message : 'Could not create the store.');
    } finally {
      setIsSaving(false);
    }
  };

  const handleUpdate = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!selectedStore) return;
    setIsSaving(true);
    setError('');
    setFeedback('');
    try {
      const updated = await apiRequest<ApiStore>(`/stores/${encodeURIComponent(selectedStore.id)}`, {
        method: 'PATCH',
        body: JSON.stringify(draft),
      });
      await refreshStores();
      setFeedback(`${updated.name} was updated.`);
    } catch (reason) {
      setError(reason instanceof ApiError ? reason.message : 'Could not update the store.');
    } finally {
      setIsSaving(false);
    }
  };

  const handleStartCreate = () => {
    setDraft(EMPTY_DRAFT);
    setError('');
    setFeedback('');
    setIsCreating(true);
  };

  const handleCancelCreate = () => {
    setIsCreating(false);
    setError('');
    setFeedback('');
    if (!selectedStore && stores[0]) setSelectedStoreId(stores[0].id);
  };

  return (
    <section className="mb-6 rounded-3xl border border-white/10 bg-[#0a0f16] p-5 shadow-xl sm:p-7" aria-labelledby="store-registry-title">
      <div className="mb-5 flex flex-col justify-between gap-3 border-b border-white/10 pb-5 sm:flex-row sm:items-center">
        <div>
          <span className="mb-1 block text-[10px] font-bold uppercase tracking-widest text-orange-500">Dealer account</span>
          <h2 id="store-registry-title" className="flex items-center gap-2 text-lg font-black text-white sm:text-xl">
            <Building2 size={20} className="text-orange-500" /> Store registry
          </h2>
          <p className="mt-1 text-xs text-gray-400">Store profiles are saved to your dealer account.</p>
        </div>
        {!isCreating && (
          <button type="button" onClick={handleStartCreate} className="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl border border-orange-500/35 bg-orange-500/15 px-4 py-2.5 text-xs font-bold text-orange-300 transition hover:bg-orange-500/25">
            <Plus size={15} /> Add store
          </button>
        )}
      </div>

      {isLoading ? (
        <div className="flex min-h-24 items-center justify-center gap-2 text-sm text-gray-400" role="status">
          <LoaderCircle size={17} className="animate-spin" /> Loading store registry…
        </div>
      ) : (
        <div className="grid gap-5 lg:grid-cols-[minmax(13rem,0.8fr)_minmax(0,1.2fr)]">
          <div className="space-y-2" aria-label="Your stores">
            {stores.map((store) => (
              <button
                type="button"
                key={store.id}
                aria-pressed={!isCreating && store.id === selectedStoreId}
                onClick={() => {
                  setIsCreating(false);
                  setSelectedStoreId(store.id);
                  setActiveStoreId(store.id);
                  setError('');
                  setFeedback('');
                }}
                className={`w-full rounded-xl border px-4 py-3 text-left transition ${!isCreating && store.id === selectedStoreId ? 'border-orange-500/40 bg-orange-500/10' : 'border-white/10 bg-black/20 hover:bg-white/5'}`}
              >
                <span className="block truncate text-sm font-bold text-white">{store.name}</span>
                <span className="mt-1 block text-[10px] font-semibold uppercase tracking-widest text-gray-500">{store.code} · {store.active ? 'Active' : 'Inactive'}</span>
              </button>
            ))}
            {stores.length === 0 && !isCreating && (
              <p className="rounded-xl border border-dashed border-white/15 p-4 text-xs leading-relaxed text-gray-400">No stores are registered yet. Add your first store to this dealer account.</p>
            )}
          </div>

          {(selectedStore || isCreating || stores.length === 0) && (
            <form onSubmit={isCreating || !selectedStore ? handleCreate : handleUpdate} className="grid gap-3 sm:grid-cols-2">
              <div>
                <label htmlFor="registry-store-name" className="mb-1.5 ml-1 block text-xs font-semibold text-gray-400">Store name</label>
                <input id="registry-store-name" className={inputClasses} required minLength={2} maxLength={120} value={draft.name} onChange={(event) => updateDraft('name', event.target.value)} />
              </div>
              <div>
                <label htmlFor="registry-store-code" className="mb-1.5 ml-1 block text-xs font-semibold text-gray-400">Store code</label>
                <input id="registry-store-code" className={inputClasses} required minLength={2} maxLength={16} pattern="[A-Za-z0-9-]+" value={draft.code} onChange={(event) => updateDraft('code', event.target.value.toUpperCase())} />
              </div>
              <div>
                <label htmlFor="registry-store-website" className="mb-1.5 ml-1 block text-xs font-semibold text-gray-400">Website</label>
                <input id="registry-store-website" className={inputClasses} type="url" maxLength={2048} value={draft.website} onChange={(event) => updateDraft('website', event.target.value)} />
              </div>
              <div>
                <label htmlFor="registry-store-phone" className="mb-1.5 ml-1 block text-xs font-semibold text-gray-400">Phone</label>
                <input id="registry-store-phone" className={inputClasses} type="tel" maxLength={40} value={draft.phone} onChange={(event) => updateDraft('phone', event.target.value)} />
              </div>
              <div className="sm:col-span-2">
                <label htmlFor="registry-store-address" className="mb-1.5 ml-1 block text-xs font-semibold text-gray-400">Physical address</label>
                <input id="registry-store-address" className={inputClasses} maxLength={300} value={draft.address} onChange={(event) => updateDraft('address', event.target.value)} />
              </div>
              <div className="sm:col-span-2">
                <label htmlFor="registry-store-timezone" className="mb-1.5 ml-1 block text-xs font-semibold text-gray-400">Timezone</label>
                <input id="registry-store-timezone" className={inputClasses} required maxLength={100} value={draft.timezone} onChange={(event) => updateDraft('timezone', event.target.value)} />
              </div>
              {(error || feedback) && (
                <p className={`sm:col-span-2 text-xs ${error ? 'text-red-400' : 'text-emerald-400'}`} role={error ? 'alert' : 'status'}>
                  {error || feedback}
                </p>
              )}
              <div className="flex flex-wrap gap-2 sm:col-span-2">
                <button type="submit" disabled={isSaving} className="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl bg-orange-500 px-5 py-2.5 text-xs font-bold text-white transition hover:bg-orange-600 disabled:cursor-wait disabled:opacity-60">
                  {isSaving ? <LoaderCircle size={15} className="animate-spin" /> : <Save size={15} />}
                  {isSaving ? 'Saving…' : isCreating || !selectedStore ? 'Create store' : 'Save store'}
                </button>
                {isCreating && <button type="button" onClick={handleCancelCreate} className="min-h-11 rounded-xl border border-white/10 px-4 py-2.5 text-xs font-bold text-gray-300 transition hover:bg-white/5">Cancel</button>}
              </div>
            </form>
          )}
        </div>
      )}
    </section>
  );
}
