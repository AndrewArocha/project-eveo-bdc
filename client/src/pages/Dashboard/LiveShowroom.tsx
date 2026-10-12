import { useCallback, useEffect, useMemo, useRef, useState, type FormEvent, type ChangeEvent } from 'react';
import { useSearchParams } from 'react-router-dom';
import {
  Activity, AlertCircle, ArrowRight, CalendarClock, CarFront,
  Check, CheckCircle2, CircleUserRound, Clock3, ImagePlus, LoaderCircle,
  MessageSquareText, Plus, Radio, Send, UserCheck, Users,
  Video, X, Zap,
} from 'lucide-react';
import { CURRENT_USER, STORES, STORE_DATA } from '../../data/mockDatabase';
import { useAuth } from '../../contexts/AuthContext';
import type { AppendShowroomEventInput, ShowroomEvent, ShowroomEventType, ShowroomVisitSnapshot } from '../../types/showroom';
import ShowroomVehicleDetails from '../../components/showroom/ShowroomVehicleDetails';
import { showroomRepository } from '../../services/showroom';
import { getMockShowroomMedia, saveMockShowroomMedia } from '../../services/showroomMedia/mockShowroomMediaStore';
import { type ShowroomVehicleSelection } from '../../types/vehicle';

const EMPTY_VEHICLES: ShowroomVehicleSelection = {
  vehicleOfInterest: null,
  tradeIn: null,
};

const EVENT_LABELS: Record<ShowroomEventType, string> = {
  customer_greeted: 'Customer greeted',
  visit_claimed: 'Salesperson took ownership',
  walkaround_started: 'Walk-around started',
  media_added: 'Photo or video added',
  test_drive_started: 'Test drive started',
  test_drive_completed: 'Test drive completed',
  handoff_requested: 'BDC handoff requested',
  bdc_contact_logged: 'BDC activity logged',
  note_added: 'Visit note added',
  visit_completed: 'Visit completed',
};

function createActor(role: string) {
  const actorName = safeLocalStorageGet('eveo_user_name') || CURRENT_USER;
  const actorId = safeLocalStorageGet('eveo_user_id') || `demo-${role}-${actorName.toLowerCase().replace(/[^a-z0-9]+/g, '-')}`;
  return { actorId, actorName };
}

function safeLocalStorageGet(key: string): string | null {
  try {
    return localStorage.getItem(key);
  } catch {
    return null;
  }
}

function formatTime(value: string) {
  return new Intl.DateTimeFormat(undefined, {
    hour: 'numeric', minute: '2-digit',
  }).format(new Date(value));
}

function formatDateTime(value: string) {
  return new Intl.DateTimeFormat(undefined, {
    month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit',
  }).format(new Date(value));
}

function vehicleTitle(vehicle: ShowroomVehicleSelection['vehicleOfInterest']): string {
  if (!vehicle) return 'Vehicle not decoded';
  return [vehicle.modelYear, vehicle.make, vehicle.model, vehicle.trim].filter(Boolean).join(' ') || vehicle.vin;
}

export default function LiveShowroom() {
  const { role } = useAuth();
  const [searchParams, setSearchParams] = useSearchParams();
  const requestedStoreId = searchParams.get('storeId');
  const storeId = STORES.some((store) => store.id === requestedStoreId)
    ? requestedStoreId as string
    : 'njx';
  const visitIdFromUrl = searchParams.get('visitId');
  const store = STORES.find((item) => item.id === storeId) ?? STORES[0];
  const actor = useMemo(() => createActor(role), [role]);
  const salespeople = useMemo(() => {
    const staff = STORE_DATA[storeId]?.staff ?? [];
    return staff.filter((person) => person.role === 'sales' || person.role === 'manager');
  }, [storeId]);

  const [snapshots, setSnapshots] = useState<ShowroomVisitSnapshot[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [pageError, setPageError] = useState<string | null>(null);
  const [mutationError, setMutationError] = useState<string | null>(null);
  const [isCheckInOpen, setIsCheckInOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [busyAction, setBusyAction] = useState<string | null>(null);
  const [showCompleted, setShowCompleted] = useState(false);
  const [customerName, setCustomerName] = useState('');
  const [customerPhone, setCustomerPhone] = useState('');
  const [assignedRepId, setAssignedRepId] = useState('');
  const [initialNotes, setInitialNotes] = useState('');
  const [vehicles, setVehicles] = useState<ShowroomVehicleSelection>(EMPTY_VEHICLES);
  const [newNote, setNewNote] = useState('');
  const mediaInputRef = useRef<HTMLInputElement>(null);

  const refresh = useCallback(async (showSpinner = false) => {
    if (showSpinner) setIsLoading(true);
    try {
      const results = await showroomRepository.listVisits(storeId);
      setSnapshots(results);
      setPageError(null);
    } catch (error) {
      setPageError(error instanceof Error ? error.message : 'Could not load showroom visits.');
    } finally {
      if (showSpinner) setIsLoading(false);
    }
  }, [storeId]);

  useEffect(() => {
    void refresh(true);
    const unsubscribe = showroomRepository.subscribe(storeId, () => { void refresh(false); });
    // Polling makes the mock adapter exercise the same refresh pattern as a future API.
    // Replace this with SSE/WebSocket invalidation when cross-device backend events exist.
    const timer = window.setInterval(() => { void refresh(false); }, 5000);
    return () => {
      unsubscribe();
      window.clearInterval(timer);
    };
  }, [storeId, refresh]);

  useEffect(() => {
    if (!assignedRepId && salespeople.length > 0) {
      setAssignedRepId(String(salespeople[0].id));
    } else if (assignedRepId && salespeople.length > 0 && !salespeople.some((person) => String(person.id) === assignedRepId)) {
      setAssignedRepId(String(salespeople[0].id));
    }
  }, [assignedRepId, salespeople]);

  const activeSnapshots = useMemo(
    () => snapshots.filter(({ visit }) => visit.status !== 'completed' && visit.status !== 'cancelled'),
    [snapshots],
  );
  const completedSnapshots = useMemo(
    () => snapshots.filter(({ visit }) => visit.status === 'completed' || visit.status === 'cancelled'),
    [snapshots],
  );
  const selectedSnapshot = snapshots.find(({ visit }) => visit.id === visitIdFromUrl)
    ?? activeSnapshots[0]
    ?? null;
  const displayedSnapshots = showCompleted ? completedSnapshots : activeSnapshots;
  const selectedRep = salespeople.find((person) => String(person.id) === assignedRepId);
  const isBdc = role === 'bdc' || role === 'bdc_manager';
  const canChooseStore = role === 'bdc' || role === 'bdc_manager' || role === 'owner' || role === 'manager' || role === 'super_admin';

  const updateUrl = (visitId?: string) => {
    const next: Record<string, string> = { storeId };
    if (visitId) next.visitId = visitId;
    setSearchParams(next);
  };

  const handleCheckIn = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setMutationError(null);
    if (!customerName.trim()) {
      setMutationError('Enter the customer’s name to start the visit.');
      return;
    }
    if (!selectedRep) {
      setMutationError('Choose a salesperson before checking in the customer.');
      return;
    }

    setIsSubmitting(true);
    try {
      const created = await showroomRepository.createVisit(storeId, {
        customerName,
        customerPhone,
        notes: initialNotes,
        assignedRepId: String(selectedRep.id),
        assignedRepName: selectedRep.name,
        checkedInById: actor.actorId,
        checkedInByName: actor.actorName,
        vehicles,
      });
      setSnapshots((current) => [created, ...current.filter((item) => item.visit.id !== created.visit.id)]);
      setCustomerName('');
      setCustomerPhone('');
      setInitialNotes('');
      setVehicles(EMPTY_VEHICLES);
      setIsCheckInOpen(false);
      updateUrl(created.visit.id);
    } catch (error) {
      setMutationError(error instanceof Error ? error.message : 'Could not start the showroom visit.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const appendEvent = async (
    type: ShowroomEventType,
    message: string,
    extras: Partial<AppendShowroomEventInput> = {},
  ) => {
    if (!selectedSnapshot) return;
    setBusyAction(type);
    setMutationError(null);
    try {
      const updated = await showroomRepository.appendEvent(storeId, selectedSnapshot.visit.id, {
        type,
        actorId: actor.actorId,
        actorName: actor.actorName,
        message,
        ...extras,
      });
      setSnapshots((current) => current.map((item) => item.visit.id === updated.visit.id ? updated : item));
    } catch (error) {
      setMutationError(error instanceof Error ? error.message : 'Could not update this visit.');
    } finally {
      setBusyAction(null);
    }
  };

  const handleNoteSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const note = newNote.trim();
    if (!note) return;
    await appendEvent('note_added', note);
    setNewNote('');
  };

  const handleMediaSelected = async (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    event.target.value = '';
    if (!file || !selectedSnapshot) return;

    setBusyAction('media_added');
    setMutationError(null);
    try {
      const asset = await saveMockShowroomMedia(file);
      const updated = await showroomRepository.appendEvent(storeId, selectedSnapshot.visit.id, {
        type: 'media_added',
        actorId: actor.actorId,
        actorName: actor.actorName,
        message: `${asset.kind === 'video' ? 'Video' : 'Photo'} added: ${asset.fileName}`,
        media: asset,
      });
      setSnapshots((current) => current.map((item) => item.visit.id === updated.visit.id ? updated : item));
    } catch (error) {
      setMutationError(error instanceof Error ? error.message : 'Could not upload this media.');
    } finally {
      setBusyAction(null);
    }
  };

  const handleAssignToMe = async () => {
    if (!selectedSnapshot) return;
    const actorIsInRoster = salespeople.some((person) => person.name === actor.actorName);
    const actorRep = salespeople.find((person) => person.name === actor.actorName);
    const nextRepId = actorRep ? String(actorRep.id) : actor.actorId;
    if (!actorIsInRoster && role !== 'sales') {
      setMutationError('Only a salesperson can claim this visit. Sign in as a sales user to test claiming in the demo.');
      return;
    }
    setBusyAction('visit_claimed');
    setMutationError(null);
    try {
      const updated = await showroomRepository.assignVisit(storeId, selectedSnapshot.visit.id, {
        assignedRepId: nextRepId,
        assignedRepName: actor.actorName,
        actorId: actor.actorId,
        actorName: actor.actorName,
      });
      setSnapshots((current) => current.map((item) => item.visit.id === updated.visit.id ? updated : item));
    } catch (error) {
      setMutationError(error instanceof Error ? error.message : 'Could not claim this visit.');
    } finally {
      setBusyAction(null);
    }
  };

  const selectedStatusClass = selectedSnapshot?.visit.status === 'handoff_requested'
    ? 'border-orange-500/30 bg-orange-500/10 text-orange-500'
    : selectedSnapshot?.visit.status === 'completed'
      ? 'border-emerald-500/30 bg-emerald-500/10 text-emerald-500'
      : 'border-emerald-500/30 bg-emerald-500/10 text-emerald-500';

  return (
    <div className="relative mx-auto min-h-full w-full max-w-7xl px-4 pb-32 pt-6 sm:px-6 md:pb-10 md:pl-32 md:pt-10">
      <header className="mb-6 flex flex-col gap-4 sm:mb-8 sm:flex-row sm:items-end sm:justify-between">
        <div className="min-w-0">
          <div className="mb-2 flex flex-wrap items-center gap-2">
            <span className="inline-flex items-center gap-1.5 rounded-full border border-emerald-500/20 bg-emerald-500/10 px-2.5 py-1 text-[10px] font-black uppercase tracking-widest text-emerald-500">
              <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-emerald-500" /> Demo live feed
            </span>
            <span className="text-xs font-semibold text-gray-500 dark:text-gray-400">{store.name}</span>
          </div>
          <h1 className="text-2xl font-black tracking-tight text-gray-900 dark:text-white sm:text-3xl">Live Showroom</h1>
          <p className="mt-2 max-w-2xl text-sm leading-relaxed text-gray-600 dark:text-gray-400">
            Follow every customer visit as it happens, from the first greeting to the handoff or outcome.
          </p>
        </div>
        <div className="flex w-full flex-col gap-2 sm:w-auto sm:min-w-48">
          {canChooseStore && STORES.length > 1 && (
            <label className="text-xs font-bold uppercase tracking-wider text-gray-500 dark:text-gray-400">
              Active store
              <select
                value={storeId}
                onChange={(event) => setSearchParams({ storeId: event.target.value })}
                className="mt-1.5 min-h-11 w-full rounded-xl border border-gray-200 bg-white px-3 text-sm font-semibold text-gray-900 outline-none focus:border-orange-500 dark:border-white/10 dark:bg-[#0a0f16] dark:text-white"
              >
                {STORES.map((item) => <option key={item.id} value={item.id}>{item.name}</option>)}
              </select>
            </label>
          )}
          <button
            type="button"
            onClick={() => { setIsCheckInOpen((open) => !open); setMutationError(null); }}
            className="inline-flex min-h-12 items-center justify-center gap-2 rounded-xl bg-orange-500 px-4 py-3 text-sm font-black text-white shadow-lg shadow-orange-500/20 transition hover:bg-orange-600 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-orange-500 focus-visible:ring-offset-2 dark:focus-visible:ring-offset-[#05080c]"
          >
            {isCheckInOpen ? <X size={17} /> : <Plus size={17} />}
            {isCheckInOpen ? 'Close check-in' : 'Check in customer'}
          </button>
        </div>
      </header>

      <section className="mb-6 grid grid-cols-2 gap-3 sm:grid-cols-3 sm:gap-4">
        <SummaryCard label="Active visits" value={activeSnapshots.length} icon={<Users size={17} />} accent="orange" />
        <SummaryCard label="Handoffs requested" value={activeSnapshots.filter(({ visit }) => visit.status === 'handoff_requested').length} icon={<Zap size={17} />} accent="red" />
        <div className="col-span-2 sm:col-span-1">
          <SummaryCard label="Completed today" value={snapshots.filter(({ visit }) => visit.status === 'completed' && new Date(visit.updatedAt).toDateString() === new Date().toDateString()).length} icon={<CheckCircle2 size={17} />} accent="green" />
        </div>
      </section>

      {isCheckInOpen && (
        <section className="mb-6 overflow-hidden rounded-3xl border border-orange-500/25 bg-white/70 shadow-xl shadow-black/5 dark:bg-[#0a0f16]/70 dark:shadow-black/20">
          <div className="border-b border-gray-200 p-4 dark:border-white/10 sm:p-6">
            <div className="flex items-start gap-3">
              <div className="rounded-2xl bg-orange-500/10 p-3 text-orange-500"><UserCheck size={22} /></div>
              <div>
                <h2 className="text-lg font-black text-gray-900 dark:text-white sm:text-xl">Start a customer visit</h2>
                <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">Starting the visit automatically records the first event: Customer greeted.</p>
              </div>
            </div>
          </div>
          <form onSubmit={handleCheckIn} className="space-y-6 p-4 sm:p-6">
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <FormField label="Customer name" required>
                <input value={customerName} onChange={(event) => setCustomerName(event.target.value)} required maxLength={120} autoComplete="name" placeholder="Customer's full name" className={inputClasses} />
              </FormField>
              <FormField label="Customer phone" optional>
                <input value={customerPhone} onChange={(event) => setCustomerPhone(event.target.value)} maxLength={40} type="tel" autoComplete="tel" placeholder="(732) 555-0123" className={inputClasses} />
              </FormField>
              <FormField label="Assigned salesperson" required>
                <select value={assignedRepId} onChange={(event) => setAssignedRepId(event.target.value)} required className={inputClasses}>
                  <option value="" disabled>Select a salesperson</option>
                  {salespeople.map((person) => <option key={person.id} value={String(person.id)}>{person.name}{person.role === 'manager' ? ' · Manager' : ''}</option>)}
                  {salespeople.length === 0 && <option value={actor.actorId}>{actor.actorName}</option>}
                </select>
              </FormField>
              <FormField label="Check-in handled by">
                <div className={`${inputClasses} flex items-center gap-2 opacity-80`}><CircleUserRound size={16} className="text-orange-500" />{actor.actorName} <span className="ml-auto text-xs text-gray-400">{role.replace('_', ' ')}</span></div>
              </FormField>
            </div>

            <ShowroomVehicleDetails value={vehicles} onChange={setVehicles} />

            <FormField label="Initial context / customer needs" optional>
              <textarea value={initialNotes} onChange={(event) => setInitialNotes(event.target.value)} maxLength={2000} rows={3} placeholder="What brought the customer in? What are they looking for? Any details BDC should know?" className={`${inputClasses} resize-y`} />
            </FormField>

            {mutationError && <InlineError message={mutationError} />}
            <div className="flex flex-col-reverse gap-3 border-t border-gray-200 pt-4 dark:border-white/10 sm:flex-row sm:justify-end">
              <button type="button" onClick={() => setIsCheckInOpen(false)} className="min-h-11 rounded-xl border border-gray-200 px-4 py-3 text-sm font-bold text-gray-600 transition hover:bg-gray-100 dark:border-white/10 dark:text-gray-300 dark:hover:bg-white/5">Cancel</button>
              <button type="submit" disabled={isSubmitting || salespeople.length === 0} className="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl bg-orange-500 px-5 py-3 text-sm font-black text-white transition hover:bg-orange-600 disabled:cursor-not-allowed disabled:opacity-60">
                {isSubmitting ? <LoaderCircle size={17} className="animate-spin" /> : <Radio size={17} />}
                {isSubmitting ? 'Starting visit…' : 'Start live visit'}
              </button>
            </div>
            {salespeople.length === 0 && <p className="text-xs text-amber-600 dark:text-amber-400">This store has no sales staff in the mock roster yet. Add staff to its STORE_DATA entry to enable check-in.</p>}
          </form>
        </section>
      )}

      {pageError && <div className="mb-5"><InlineError message={pageError} onRetry={() => void refresh(true)} /></div>}

      <div className="grid min-w-0 grid-cols-1 gap-5 xl:grid-cols-[minmax(0,0.85fr)_minmax(0,1.15fr)]">
        <section className="min-w-0">
          <div className="mb-3 flex items-center justify-between gap-3">
            <div>
              <h2 className="text-sm font-black uppercase tracking-widest text-gray-500 dark:text-gray-400">{showCompleted ? 'Recent completed visits' : 'Live visit queue'}</h2>
              <p className="mt-1 text-xs text-gray-400">{displayedSnapshots.length} {displayedSnapshots.length === 1 ? 'visit' : 'visits'}</p>
            </div>
            <button type="button" onClick={() => setShowCompleted((current) => !current)} className="inline-flex min-h-10 items-center gap-1.5 rounded-xl border border-gray-200 px-3 py-2 text-xs font-bold text-gray-600 transition hover:border-orange-500/40 hover:text-orange-500 dark:border-white/10 dark:text-gray-300">
              {showCompleted ? <Activity size={14} /> : <Check size={14} />}
              {showCompleted ? 'Show active' : 'Completed'}
            </button>
          </div>

          {isLoading ? (
            <div className="flex min-h-52 items-center justify-center rounded-2xl border border-gray-200 bg-white/40 text-sm text-gray-500 dark:border-white/10 dark:bg-white/2"><LoaderCircle size={18} className="mr-2 animate-spin" /> Loading showroom…</div>
          ) : displayedSnapshots.length === 0 ? (
            <div className="flex min-h-56 flex-col items-center justify-center rounded-2xl border border-dashed border-gray-300 bg-white/30 px-6 text-center dark:border-white/10 dark:bg-white/2">
              <div className="mb-3 rounded-2xl bg-orange-500/10 p-3 text-orange-500"><Users size={24} /></div>
              <h3 className="font-bold text-gray-900 dark:text-white">{showCompleted ? 'No completed visits yet' : 'Showroom is clear'}</h3>
              <p className="mt-1 max-w-xs text-sm text-gray-500 dark:text-gray-400">{showCompleted ? 'Completed visits will appear here for review.' : 'Check in the first customer to start a shared visit timeline.'}</p>
              {!showCompleted && <button type="button" onClick={() => setIsCheckInOpen(true)} className="mt-4 inline-flex min-h-11 items-center gap-2 rounded-xl bg-orange-500 px-4 py-2.5 text-sm font-bold text-white"><Plus size={16} /> Check in customer</button>}
            </div>
          ) : (
            <div className="flex min-w-0 flex-col gap-3">
              {displayedSnapshots.map((snapshot) => (
                <VisitQueueCard
                  key={snapshot.visit.id}
                  snapshot={snapshot}
                  isSelected={selectedSnapshot?.visit.id === snapshot.visit.id}
                  onSelect={() => updateUrl(snapshot.visit.id)}
                />
              ))}
            </div>
          )}
        </section>

        <section className="min-w-0">
          {selectedSnapshot ? (
            <VisitDetails
              key={selectedSnapshot.visit.id}
              snapshot={selectedSnapshot}
              actor={actor}
              role={role}
              isBdc={isBdc}
              busyAction={busyAction}
              mutationError={mutationError}
              newNote={newNote}
              setNewNote={setNewNote}
              mediaInputRef={mediaInputRef}
              selectedStatusClass={selectedStatusClass}
              onAppendEvent={appendEvent}
              onNoteSubmit={handleNoteSubmit}
              onMediaSelected={handleMediaSelected}
              onAssignToMe={handleAssignToMe}
              onClearError={() => setMutationError(null)}
            />
          ) : (
            <div className="hidden min-h-72 flex-col items-center justify-center rounded-2xl border border-gray-200 bg-white/30 p-6 text-center dark:border-white/10 dark:bg-white/2 xl:flex">
              <Activity size={26} className="mb-3 text-orange-500" />
              <p className="font-bold text-gray-900 dark:text-white">Select a visit to spectate</p>
              <p className="mt-1 max-w-xs text-sm text-gray-500 dark:text-gray-400">The visit timeline and actions will appear here as the salesperson progresses.</p>
            </div>
          )}
        </section>
      </div>
      <p className="mt-6 text-center text-[11px] leading-relaxed text-gray-400">
        Demo storage syncs across tabs in this browser only. Cross-device live updates require the production API and a server event channel.
      </p>
    </div>
  );
}

const inputClasses = 'min-h-11 w-full rounded-xl border border-gray-200 bg-white px-3 py-3 text-sm text-gray-900 outline-none transition placeholder:text-gray-400 focus:border-orange-500 focus:ring-2 focus:ring-orange-500/15 dark:border-white/10 dark:bg-[#080B10] dark:text-white dark:placeholder:text-gray-600';

function FormField({ label, required, optional, children }: { label: string; required?: boolean; optional?: boolean; children: React.ReactNode }) {
  return (
    <label className="block min-w-0">
      <span className="mb-1.5 flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-gray-500 dark:text-gray-400">
        {label}
        {required && <span className="text-orange-500">*</span>}
        {optional && <span className="font-normal normal-case tracking-normal text-gray-400">Optional</span>}
      </span>
      {children}
    </label>
  );
}

function SummaryCard({ label, value, icon, accent }: { label: string; value: number; icon: React.ReactNode; accent: 'orange' | 'red' | 'green' }) {
  const colorClasses = {
    orange: 'bg-orange-500/10 text-orange-500',
    red: 'bg-red-500/10 text-red-500',
    green: 'bg-emerald-500/10 text-emerald-500',
  }[accent];
  return (
    <div className="flex min-w-0 items-center gap-3 rounded-2xl border border-gray-200 bg-white/50 p-3 dark:border-white/10 dark:bg-white/3 sm:p-4">
      <div className={`shrink-0 rounded-xl p-2.5 ${colorClasses}`}>{icon}</div>
      <div className="min-w-0"><p className="text-2xl font-black tabular-nums text-gray-900 dark:text-white">{value}</p><p className="truncate text-xs font-semibold text-gray-500 dark:text-gray-400">{label}</p></div>
    </div>
  );
}

function VisitQueueCard({ snapshot, isSelected, onSelect }: { snapshot: ShowroomVisitSnapshot; isSelected: boolean; onSelect: () => void }) {
  const { visit, events } = snapshot;
  const lastEvent = events[events.length - 1];
  const latestActivity = lastEvent?.message || 'Visit started';
  const visitTitle = vehicleTitle(visit.vehicleOfInterest);
  const statusLabel = visit.status === 'handoff_requested' ? 'BDC handoff' : visit.status === 'completed' ? 'Completed' : visit.status === 'cancelled' ? 'Cancelled' : 'In progress';
  const statusClass = visit.status === 'handoff_requested'
    ? 'bg-orange-500/10 text-orange-500 border-orange-500/20'
    : visit.status === 'completed'
      ? 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20'
      : visit.status === 'cancelled'
        ? 'bg-gray-500/10 text-gray-500 border-gray-500/20'
        : 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20';

  return (
    <button type="button" onClick={onSelect} className={`w-full min-w-0 rounded-2xl border p-4 text-left transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-orange-500 ${isSelected ? 'border-orange-500/60 bg-orange-500/6 shadow-lg shadow-orange-500/5' : 'border-gray-200 bg-white/50 hover:border-orange-500/30 dark:border-white/10 dark:bg-white/2 dark:hover:bg-white/4'}`}>
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0"><p className="truncate font-black text-gray-900 dark:text-white">{visit.customerName}</p><p className="mt-1 flex items-center gap-1.5 truncate text-xs text-gray-500 dark:text-gray-400"><CarFront size={13} className="shrink-0" />{visitTitle}</p></div>
        <span className={`shrink-0 rounded-full border px-2 py-1 text-[10px] font-black uppercase tracking-wider ${statusClass}`}>{statusLabel}</span>
      </div>
      <div className="mt-3 rounded-xl bg-gray-100/80 p-3 dark:bg-black/20">
        <div className="flex items-center gap-2 text-xs font-bold text-gray-700 dark:text-gray-200"><Activity size={14} className="shrink-0 text-orange-500" /><span className="truncate">{latestActivity}</span></div>
        <div className="mt-2 flex flex-wrap items-center justify-between gap-2 text-[11px] text-gray-500 dark:text-gray-400"><span>With {visit.assignedRepName}</span><span className="inline-flex items-center gap-1"><Clock3 size={12} /> {formatTime(visit.updatedAt)}</span></div>
      </div>
      <div className="mt-3 flex items-center justify-between text-xs font-bold"><span className="text-gray-500 dark:text-gray-400">{events.length} {events.length === 1 ? 'event' : 'events'}</span><span className="inline-flex items-center gap-1 text-orange-500">Open live view <ArrowRight size={13} /></span></div>
    </button>
  );
}

function VisitDetails({
  snapshot, actor, role, isBdc, busyAction, mutationError, newNote, setNewNote, mediaInputRef,
  selectedStatusClass, onAppendEvent, onNoteSubmit, onMediaSelected, onAssignToMe, onClearError,
}: {
  snapshot: ShowroomVisitSnapshot;
  actor: { actorId: string; actorName: string };
  role: string;
  isBdc: boolean;
  busyAction: string | null;
  mutationError: string | null;
  newNote: string;
  setNewNote: (value: string) => void;
  mediaInputRef: React.RefObject<HTMLInputElement | null>;
  selectedStatusClass: string;
  onAppendEvent: (type: ShowroomEventType, message: string, extras?: Partial<AppendShowroomEventInput>) => Promise<void>;
  onNoteSubmit: (event: FormEvent<HTMLFormElement>) => Promise<void>;
  onMediaSelected: (event: ChangeEvent<HTMLInputElement>) => Promise<void>;
  onAssignToMe: () => Promise<void>;
  onClearError: () => void;
}) {
  const { visit, events } = snapshot;
  const isClosed = visit.status === 'completed' || visit.status === 'cancelled';
  const hasWalkaround = events.some((event) => event.type === 'walkaround_started');
  const hasTestDriveStarted = events.some((event) => event.type === 'test_drive_started');
  const hasTestDriveCompleted = events.some((event) => event.type === 'test_drive_completed');
  const isAssignedToActor = visit.assignedRepId === actor.actorId || visit.assignedRepName === actor.actorName;

  return (
    <article className="min-w-0 overflow-hidden rounded-3xl border border-gray-200 bg-white/60 shadow-xl shadow-black/5 dark:border-white/10 dark:bg-[#0a0f16]/60 dark:shadow-black/20">
      <div className="border-b border-gray-200 bg-linear-to-br from-orange-500/8 to-transparent p-4 dark:border-white/10 sm:p-5">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0"><p className="mb-1 text-[10px] font-black uppercase tracking-[0.18em] text-orange-500">Live visit detail</p><h2 className="wrap-break-word text-xl font-black text-gray-900 dark:text-white sm:text-2xl">{visit.customerName}</h2><p className="mt-1 text-sm text-gray-500 dark:text-gray-400">Assigned to {visit.assignedRepName}</p></div>
          <span className={`shrink-0 rounded-full border px-2.5 py-1 text-[10px] font-black uppercase tracking-wider ${selectedStatusClass}`}>{visit.status.replace('_', ' ')}</span>
        </div>
        <div className="mt-4 grid grid-cols-1 gap-2 sm:grid-cols-2">
          <VehicleSummary title="Vehicle of interest" vehicle={visit.vehicleOfInterest} />
          <VehicleSummary title="Trade-in" vehicle={visit.tradeIn} />
        </div>
        <p className="mt-3 flex items-center gap-1.5 text-xs text-gray-500 dark:text-gray-400"><CalendarClock size={13} /> Started {formatDateTime(visit.createdAt)}</p>
        {visit.customerPhone && <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">Phone: {visit.customerPhone}</p>}
      </div>

      {!isClosed && (
        <div className="space-y-4 border-b border-gray-200 p-4 dark:border-white/10 sm:p-5">
          <div><h3 className="text-xs font-black uppercase tracking-widest text-gray-500 dark:text-gray-400">Progress the visit</h3><p className="mt-1 text-xs leading-relaxed text-gray-400">Each action creates a timestamped event visible to authorized viewers of this demo store.</p></div>
          <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
            {!isAssignedToActor && role === 'sales' && <ActionButton onClick={() => void onAssignToMe()} disabled={busyAction !== null} icon={<UserCheck size={16} />} label="I've got this customer" tone="green" />}
            <ActionButton onClick={() => void onAppendEvent('walkaround_started', 'Walk-around started.')} disabled={busyAction !== null || hasWalkaround} icon={<CarFront size={16} />} label={hasWalkaround ? 'Walk-around started' : 'Start walk-around'} tone="orange" />
            {!hasTestDriveStarted && <ActionButton onClick={() => void onAppendEvent('test_drive_started', 'Test drive started.')} disabled={busyAction !== null} icon={<Zap size={16} />} label="Start test drive" tone="neutral" />}
            {hasTestDriveStarted && !hasTestDriveCompleted && <ActionButton onClick={() => void onAppendEvent('test_drive_completed', 'Test drive completed.')} disabled={busyAction !== null} icon={<CheckCircle2 size={16} />} label="Test drive complete" tone="green" />}
            {!isBdc && <ActionButton onClick={() => void onAppendEvent('handoff_requested', 'Salesperson requested BDC assistance.')} disabled={busyAction !== null || visit.status === 'handoff_requested'} icon={<Users size={16} />} label={visit.status === 'handoff_requested' ? 'BDC handoff requested' : 'Request BDC handoff'} tone="orange" />}
            {isBdc && <ActionButton onClick={() => void onAppendEvent('bdc_contact_logged', 'BDC logged customer contact / follow-up.')} disabled={busyAction !== null} icon={<MessageSquareText size={16} />} label="Log BDC activity" tone="orange" />}
            <ActionButton onClick={() => mediaInputRef.current?.click()} disabled={busyAction !== null} icon={events.some((event) => event.type === 'media_added') ? <Video size={16} /> : <ImagePlus size={16} />} label={busyAction === 'media_added' ? 'Uploading media…' : 'Add photo or video'} tone="neutral" /> <input ref={mediaInputRef} type="file" accept="image/*,video/*" className="hidden" onChange={(event) => void onMediaSelected(event)} />
            <ActionButton onClick={() => { if (window.confirm('Mark this visit as completed? This closes the demo visit.')) void onAppendEvent('visit_completed', 'Visit completed.'); }} disabled={busyAction !== null} icon={<CheckCircle2 size={16} />} label="Complete visit" tone="green" />
          </div>
          {mutationError && <InlineError message={mutationError} onDismiss={onClearError} />}
          <form onSubmit={(event) => void onNoteSubmit(event)} className="flex flex-col gap-2 sm:flex-row">
            <input value={newNote} onChange={(event) => setNewNote(event.target.value)} maxLength={1500} placeholder="Add an update for BDC and the team…" className={`${inputClasses} sm:flex-1`} />
            <button type="submit" disabled={!newNote.trim() || busyAction !== null} className="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl bg-gray-900 px-4 py-3 text-sm font-bold text-white transition hover:bg-black disabled:opacity-50 dark:bg-white dark:text-gray-900 dark:hover:bg-gray-200"><Send size={15} /> Add update</button>
          </form>
        </div>
      )}

      <div className="p-4 sm:p-5">
        <div className="mb-4 flex items-center justify-between gap-3"><div><h3 className="text-xs font-black uppercase tracking-widest text-gray-500 dark:text-gray-400">Visit timeline</h3><p className="mt-1 text-xs text-gray-400">{events.length} recorded events</p></div><span className="inline-flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-wider text-emerald-500"><span className="h-1.5 w-1.5 animate-pulse rounded-full bg-emerald-500" /> Updating</span></div>
        {events.length === 0 ? <p className="rounded-xl bg-gray-100 p-4 text-sm text-gray-500 dark:bg-white/5">No events have been recorded.</p> : (
          <ol className="relative space-y-0">
            {events.map((event, index) => <TimelineEvent key={event.id} event={event} isLast={index === events.length - 1} />)}
          </ol>
        )}
        {visit.notes && <div className="mt-4 rounded-xl border border-gray-200 bg-gray-50 p-3 dark:border-white/10 dark:bg-white/3"><p className="text-[10px] font-black uppercase tracking-wider text-gray-400">Initial context</p><p className="mt-1 whitespace-pre-wrap text-sm text-gray-700 dark:text-gray-300">{visit.notes}</p></div>}
      </div>
    </article>
  );
}

function VehicleSummary({ title, vehicle }: { title: string; vehicle: ShowroomVehicleSelection['vehicleOfInterest'] }) {
  return (
    <div className="min-w-0 rounded-xl border border-gray-200 bg-white/60 p-3 dark:border-white/10 dark:bg-black/20">
      <p className="text-[10px] font-black uppercase tracking-wider text-gray-400">{title}</p>
      <p className="mt-1 wrap-break-word text-sm font-bold text-gray-900 dark:text-white">{vehicleTitle(vehicle)}</p>
      {vehicle && <p className="mt-1 break-all font-mono text-[10px] text-gray-500 dark:text-gray-400">VIN {vehicle.vin}</p>}
    </div>
  );
}

function TimelineEvent({ event, isLast }: { event: ShowroomEvent; isLast: boolean }) {
  const [mediaUrl, setMediaUrl] = useState<string | null>(null);
  const [mediaError, setMediaError] = useState(false);
  const mediaId = event.media?.id;

  useEffect(() => {
    let objectUrl: string | null = null;
    let mounted = true;
    setMediaUrl(null);
    setMediaError(false);
    if (mediaId) {
      void getMockShowroomMedia(mediaId).then((blob) => {
        if (!mounted || !blob) return;
        objectUrl = URL.createObjectURL(blob);
        setMediaUrl(objectUrl);
      }).catch(() => setMediaError(true));
    }
    return () => {
      mounted = false;
      if (objectUrl) URL.revokeObjectURL(objectUrl);
    };
  }, [mediaId]);

  return (
    <li className="relative flex gap-3 pb-5 last:pb-0">
      {!isLast && <span aria-hidden="true" className="absolute bottom-0 left-3.75 top-8 w-px bg-gray-200 dark:bg-white/10" />}
      <span className={`relative z-10 mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-xl ${event.type === 'customer_greeted' ? 'bg-emerald-500/10 text-emerald-500' : event.type === 'handoff_requested' ? 'bg-orange-500/10 text-orange-500' : event.type === 'visit_completed' ? 'bg-blue-500/10 text-blue-500' : 'bg-gray-100 text-gray-500 dark:bg-white/10 dark:text-gray-300'}`}>
        {event.type === 'customer_greeted' ? <UserCheck size={15} /> : event.type === 'media_added' ? <ImagePlus size={15} /> : event.type === 'handoff_requested' ? <Users size={15} /> : event.type === 'visit_completed' ? <CheckCircle2 size={15} /> : <Activity size={15} />}
      </span>
      <div className="min-w-0 flex-1 rounded-xl border border-gray-200 bg-white/60 p-3 dark:border-white/10 dark:bg-black/15">
        <div className="flex flex-wrap items-start justify-between gap-2"><p className="text-sm font-bold text-gray-900 dark:text-white">{EVENT_LABELS[event.type]}</p><time className="shrink-0 text-[10px] font-semibold text-gray-400">{formatDateTime(event.occurredAt)}</time></div>
        <p className="mt-1 whitespace-pre-wrap wrap-break-word text-sm leading-relaxed text-gray-600 dark:text-gray-300">{event.message}</p>
        <p className="mt-2 text-[10px] font-bold uppercase tracking-wider text-gray-400">{event.actorName}</p>
        {event.media && <div className="mt-3 overflow-hidden rounded-xl border border-gray-200 dark:border-white/10">
          {mediaUrl && event.media.kind === 'image' && <img src={mediaUrl} alt={event.media.fileName} className="max-h-64 w-full bg-black/5 object-contain dark:bg-black/30" />}
          {mediaUrl && event.media.kind === 'video' && <video src={mediaUrl} controls playsInline className="max-h-72 w-full bg-black" />}
          {!mediaUrl && !mediaError && <div className="flex items-center gap-2 p-3 text-xs text-gray-500"><LoaderCircle size={14} className="animate-spin" /> Loading attachment…</div>}
          {mediaError && <p className="p-3 text-xs text-amber-600">Attachment preview is unavailable in this browser session.</p>}
          <div className="flex items-center gap-2 p-3"><span className="min-w-0 flex-1 truncate text-xs font-semibold text-gray-700 dark:text-gray-300">{event.media.fileName}</span><span className="shrink-0 text-[10px] text-gray-400">{(event.media.sizeBytes / (1024 * 1024)).toFixed(1)} MB</span></div>
        </div>}
      </div>
    </li>
  );
}

function ActionButton({ onClick, disabled, icon, label, tone }: { onClick: () => void; disabled?: boolean; icon: React.ReactNode; label: string; tone: 'orange' | 'green' | 'neutral' }) {
  const toneClasses = {
    orange: 'border-orange-500/20 bg-orange-500/10 text-orange-600 hover:bg-orange-500/15 dark:text-orange-400',
    green: 'border-emerald-500/20 bg-emerald-500/10 text-emerald-600 hover:bg-emerald-500/15 dark:text-emerald-400',
    neutral: 'border-gray-200 bg-white text-gray-700 hover:bg-gray-100 dark:border-white/10 dark:bg-white/[0.03] dark:text-gray-200 dark:hover:bg-white/[0.06]',
  }[tone];
  return <button type="button" onClick={onClick} disabled={disabled} className={`inline-flex min-h-11 min-w-0 items-center justify-center gap-2 rounded-xl border px-3 py-3 text-xs font-black transition disabled:cursor-not-allowed disabled:opacity-45 ${toneClasses}`}>{icon}<span className="text-center">{label}</span></button>;
}

function InlineError({ message, onRetry, onDismiss }: { message: string; onRetry?: () => void; onDismiss?: () => void }) {
  return <div role="alert" className="flex items-start gap-2 rounded-xl border border-red-500/20 bg-red-500/10 p-3 text-sm text-red-600 dark:text-red-300"><AlertCircle size={17} className="mt-0.5 shrink-0" /><p className="min-w-0 flex-1">{message}</p>{onRetry && <button type="button" onClick={onRetry} className="shrink-0 font-bold underline">Retry</button>}{onDismiss && <button type="button" onClick={onDismiss} aria-label="Dismiss error" className="shrink-0 rounded-lg p-1 hover:bg-red-500/10"><X size={15} /></button>}</div>;
}
