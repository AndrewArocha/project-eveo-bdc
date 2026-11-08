// src/pages/Dashboard/ShowroomVisitDomain.tsx
import { useEffect, useState, useRef, useCallback, type ChangeEvent, type FormEvent } from 'react';
import { useParams, useSearchParams, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ArrowLeft,
  CarFront,
  CheckCircle2,
  ImagePlus,
  LoaderCircle,
  Lock,
  ScanBarcode,
  Send,
  ShieldAlert,
  Trash2,
  UserCheck,
  Users,
  Video,
  Zap,
} from 'lucide-react';
import { CURRENT_USER, getStoreDataOrEmpty } from '../../data/mockDatabase';
import { useAuth } from '../../contexts/AuthContext';
import { useStoreAppearance } from '../../contexts/StoreAppereanceContext';
import { showroomRepository } from '../../services/showroom';
import { saveMockShowroomMedia } from '../../services/showroomMedia/mockShowroomMediaStore';
import { publishLiveActivity, resolveAgentAvatar } from '../../services/liveActivity/liveActivityStore';
import { checkAndAlertIfVehicleSold } from '../../services/inventory/storeInventorySync';
import { playWoodBlockAlert, playSocialMediaChime } from '../../utils/soundEngine';
import VehicleVinLookupField from '../../components/showroom/VehicleVinLookupField';
import SwipeableModal from '../../components/UI/SwipeableModal';
import type {
  ShowroomVisitSnapshot,
  ShowroomEventType,
  AppendShowroomEventInput,
} from '../../types/showroom';
import type { ShowroomVehicleDraft } from '../../types/vehicle';

const EVENT_LABELS: Record<ShowroomEventType, string> = {
  customer_greeted: 'Customer Greeted',
  visit_claimed: 'Ownership Claimed',
  walkaround_started: 'Walkaround Started',
  media_added: 'Media Attached',
  test_drive_started: 'Test Drive Started',
  test_drive_completed: 'Test Drive Completed',
  handoff_requested: 'BDC Handoff Requested',
  bdc_contact_logged: 'BDC Touch Logged',
  note_added: 'Floor Update',
  visit_completed: 'Visit Completed',
};

function vehicleTitle(vehicle: ShowroomVehicleDraft | null | undefined): string {
  if (!vehicle) return 'Tap to Scan / Decode VIN';
  return (
    [vehicle.modelYear, vehicle.make, vehicle.model, vehicle.trim]
      .filter(Boolean)
      .join(' ') || vehicle.vin
  );
}

export default function ShowroomVisitDomain() {
  const { visitId } = useParams<{ visitId: string }>();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { role, user } = useAuth();
  const { activeStoreId, activeStoreDomainId, activeStore, stores, storesLoading, setActiveStoreId } = useStoreAppearance();

  const requestedStoreId = searchParams.get('storeId') || activeStoreId;
  const resolvedStore = stores.find((store) =>
    store.id === requestedStoreId || store.domainId === requestedStoreId || store.legacyDataKey === requestedStoreId,
  );
  const storeId = resolvedStore?.domainId || activeStoreDomainId;
  const actorName = user?.name || localStorage.getItem('eveo_user_name') || CURRENT_USER;
  const actorId = user?.id || localStorage.getItem('eveo_user_id') || `user_${role}`;

  const [snapshot, setSnapshot] = useState<ShowroomVisitSnapshot | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [busyAction, setBusyAction] = useState<string | null>(null);
  const [noteText, setNoteText] = useState('');
  const [stagedFile, setStagedFile] = useState<File | null>(null);
  const [stagedPreview, setStagedPreview] = useState<string | null>(null);
  const [isVehicleModalOpen, setIsVehicleModalOpen] = useState<'interest' | 'trade' | null>(null);
  const [vehicleDraft, setVehicleDraft] = useState<ShowroomVehicleDraft | null>(null);
  const [soldAlertMsg, setSoldAlertMsg] = useState<string | null>(null);
  const [mutationError, setMutationError] = useState<string | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);

  const loadVisit = useCallback(async () => {
    if (!visitId || !storeId) return;
    const res = await showroomRepository.getVisit(storeId, visitId);
    setSnapshot(res);
    setIsLoading(false);
  }, [storeId, visitId]);

  useEffect(() => {
    if (resolvedStore && resolvedStore.id !== activeStoreId) setActiveStoreId(resolvedStore.id);
  }, [activeStoreId, resolvedStore, setActiveStoreId]);

  useEffect(() => {
    if (!storeId) {
      if (!storesLoading) setIsLoading(false);
      return;
    }
    void loadVisit();
    const unsub = showroomRepository.subscribe(storeId, () => {
      void loadVisit();
    });
    return () => unsub();
  }, [storeId, loadVisit, storesLoading]);

  useEffect(() => {
    if (!stagedFile) {
      setStagedPreview(null);
      return;
    }
    const url = URL.createObjectURL(stagedFile);
    setStagedPreview(url);
    return () => URL.revokeObjectURL(url);
  }, [stagedFile]);

  const appendVisitEvent = async (
    type: ShowroomEventType,
    message: string,
    extras: Partial<AppendShowroomEventInput> = {}
  ): Promise<boolean> => {
    if (!snapshot || !visitId) return false;
    setBusyAction(type);
    setMutationError(null);
    try {
      const updated = await showroomRepository.appendEvent(storeId, visitId, {
        type,
        actorId,
        actorName,
        message,
        ...extras,
      });
      setSnapshot(updated);
      playSocialMediaChime();

      publishLiveActivity(storeId, {
        agentName: actorName,
        role,
        priority: type === 'note_added' && !extras.media ? 2 : 1,
        category: 'showroom',
        title: `${EVENT_LABELS[type]} • ${snapshot.visit.customerName}`,
        detail: message,
        media: extras.media,
        route: `/app/showroom/visit/${visitId}?storeId=${storeId}`,
      });

      if (type === 'visit_completed') {
        setTimeout(() => navigate(`/app/showroom?view=showroom`), 500);
      }
      return true;
    } catch (error) {
      setMutationError(error instanceof Error ? error.message : 'Could not update this showroom visit.');
      return false;
    } finally {
      setBusyAction(null);
    }
  };

  const handleClaimVisit = async () => {
    if (!snapshot || !visitId) return;
    const staff = user ? [] : getStoreDataOrEmpty(storeId).staff;
    const rep = staff.find((s) => s.name === actorName);
    setBusyAction('visit_claimed');
    setMutationError(null);
    try {
      const updated = await showroomRepository.assignVisit(storeId, visitId, {
        assignedRepId: user?.id || (rep ? String(rep.id) : actorId),
        assignedRepName: actorName,
        actorId,
        actorName,
      });
      setSnapshot(updated);
      playSocialMediaChime();
    } catch (error) {
      setMutationError(error instanceof Error ? error.message : 'Could not claim this visit.');
    } finally {
      setBusyAction(null);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-full w-full flex items-center justify-center p-10 text-gray-400">
        <LoaderCircle size={22} className="animate-spin text-orange-500 mr-2" /> Initializing Visit Domain…
      </div>
    );
  }

  if (!snapshot) {
    return (
      <div className="min-h-full w-full flex flex-col items-center justify-center p-8 text-center">
        <p className="text-lg font-black text-white mb-2">Visit Not Found</p>
        <button
          type="button"
          onClick={() => navigate('/app/showroom?view=showroom')}
          className="px-5 py-2.5 rounded-full bg-orange-500 text-white text-xs font-black cursor-pointer"
        >
          Back to Live Showroom
        </button>
      </div>
    );
  }

  const { visit, events } = snapshot;
  const isClosed = visit.status === 'completed' || visit.status === 'cancelled';
  const hasWalkaround = events.some((e) => e.type === 'walkaround_started');
  const hasMedia = events.some((e) => e.type === 'media_added');
  const hasDriveDone = events.some((e) => e.type === 'test_drive_completed');
  const hasHandoff =
    visit.status === 'handoff_requested' ||
    events.some((e) => e.type === 'handoff_requested');
  const isMine = visit.assignedRepName === actorName;

  // Determine the single active mandatory step (1 to 5) so the rep never sees a cluttered page
  const activeStepNumber = (() => {
    if (!hasWalkaround) return 1;
    if (!hasMedia) return 2;
    if (!hasDriveDone) return 3;
    if (!hasHandoff) return 4;
    return 5;
  })();

  const stepConfig = [
    {
      num: 1,
      short: 'Walkaround',
      title: 'Step 1: Verify Vehicle of Interest & Start Walkaround',
      desc: 'Confirm the customer vehicle of interest (SOLD vehicles are blocked) and log keys pulled.',
      icon: <CarFront size={16} />,
      canSubmit: Boolean(noteText.trim().length >= 3 || stagedFile) && !soldAlertMsg,
      submitType: 'walkaround_started' as ShowroomEventType,
      placeholder: 'Enter key tag # or exterior walkaround note to unlock Step 2...',
    },
    {
      num: 2,
      short: 'Photo Proof',
      title: 'Step 2: Mandatory Lot Walkaround / Buyer Photo',
      desc: 'You must attach a live photo or video of the vehicle walkaround before starting the road test.',
      icon: <ImagePlus size={16} />,
      canSubmit: Boolean(stagedFile),
      submitType: 'media_added' as ShowroomEventType,
      placeholder: 'Add optional caption for your attached walkaround photo...',
    },
    {
      num: 3,
      short: 'Test Drive',
      title: 'Step 3: Road Test Drive & Trade-In Appraisal Note',
      desc: 'Scan the customer Trade-In VIN (if applicable) and log their feedback from the test drive route.',
      icon: <Zap size={16} />,
      canSubmit: Boolean(noteText.trim().length >= 4 || stagedFile),
      submitType: 'test_drive_completed' as ShowroomEventType,
      placeholder: 'Log road test feedback or trade-in condition to unlock Step 4...',
    },
    {
      num: 4,
      short: 'Desk / BDC',
      title: 'Step 4: Desk Pencil & Manager / BDC Handoff',
      desc: 'Submit the customer payment/down-payment commitment to alert the Desk Manager.',
      icon: <Users size={16} />,
      canSubmit: Boolean(noteText.trim().length >= 4 || stagedFile),
      submitType: 'handoff_requested' as ShowroomEventType,
      placeholder: 'Enter target monthly payment / down payment commitment to unlock Step 5...',
    },
    {
      num: 5,
      short: 'Complete',
      title: 'Step 5: Final Manager TO & Complete Visit',
      desc: 'Log the final disposition and Manager Turn-Over summary to close out this visit.',
      icon: <CheckCircle2 size={16} />,
      canSubmit: Boolean(noteText.trim().length >= 4 || stagedFile),
      submitType: 'visit_completed' as ShowroomEventType,
      placeholder: 'Enter final Manager TO outcome (Sold, F&I Pending, or Follow-Up)...',
    },
  ][activeStepNumber - 1];

  const handleStepSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!stepConfig.canSubmit) {
      playWoodBlockAlert();
      return;
    }

    if (stagedFile) {
      if (user) {
        setMutationError('Secure photo storage is not configured for authenticated showroom visits yet.');
        return;
      }
      setBusyAction(stepConfig.submitType);
      try {
        const asset = await saveMockShowroomMedia(stagedFile);
        const msg =
          noteText.trim() ||
          `${stepConfig.short} media verified (${asset.fileName})`;
        await appendVisitEvent(stepConfig.submitType, msg, { media: asset });
        setStagedFile(null);
        setNoteText('');
      } finally {
        setBusyAction(null);
      }
      return;
    }

    if (await appendVisitEvent(stepConfig.submitType, noteText.trim())) setNoteText('');
  };

  return (
    <div className="h-[calc(100dvh-5rem)] md:h-dvh w-full max-w-2xl mx-auto px-4 sm:px-6 md:pl-28 py-4 sm:py-6 flex flex-col justify-between overflow-hidden select-none sm:select-auto text-white">
      {/* 1. Compact Header */}
      <div className="flex items-center justify-between gap-2 shrink-0">
        <button
          type="button"
          onClick={() => navigate(`/app/showroom?view=showroom`)}
          className="h-9 px-3.5 rounded-full bg-white/6 hover:bg-white/12 border border-white/12 text-xs font-bold text-white flex items-center gap-1.5 cursor-pointer"
        >
          <ArrowLeft size={14} /> {activeStore.logoText} Floor
        </button>

        <div className="flex items-center gap-2">
          {!isMine && !isClosed && (
            <button
              type="button"
              onClick={() => void handleClaimVisit()}
              className="h-9 px-3.5 rounded-full bg-emerald-500 text-white text-xs font-black cursor-pointer"
            >
              Claim Visit
            </button>
          )}
          <div className="flex items-center gap-2 px-3 py-1 rounded-full bg-white/5 border border-white/10">
            <img
              src={resolveAgentAvatar(visit.customerName) || ''}
              alt={visit.customerName}
              className="w-5 h-5 rounded-full object-cover"
            />
            <span className="text-xs font-bold text-white truncate max-w-32">
              {visit.customerName}
            </span>
          </div>
        </div>
      </div>
      {mutationError && (
        <p role="alert" className="mt-2 rounded-xl border border-red-400/20 bg-red-500/10 px-3 py-2 text-xs text-red-300">{mutationError}</p>
      )}

      {/* 2. Locked 5-Step Progress Indicator */}
      <div className="grid grid-cols-5 gap-1.5 my-2.5 shrink-0">
        {[1, 2, 3, 4, 5].map((num) => {
          const isDone = num < activeStepNumber || isClosed;
          const isCurrent = num === activeStepNumber && !isClosed;
          return (
            <div
              key={num}
              className={`py-2 px-1.5 rounded-2xl border text-center flex flex-col items-center justify-center gap-0.5 transition-all ${
                isDone
                  ? 'bg-emerald-500/15 border-emerald-500/40 text-emerald-300'
                  : isCurrent
                    ? 'bg-orange-500/20 border-orange-500/60 text-white shadow-[0_0_15px_rgba(249,115,22,0.25)]'
                    : 'bg-white/2 border-white/6 text-gray-500 opacity-45'
              }`}
            >
              <span className="text-[10px] font-black flex items-center gap-1">
                {isDone ? (
                  <CheckCircle2 size={11} className="text-emerald-400" />
                ) : isCurrent ? (
                  <UserCheck size={11} className="text-orange-400" />
                ) : (
                  <Lock size={10} />
                )}
                <span>Step {num}</span>
              </span>
            </div>
          );
        })}
      </div>

      {/* 3. Single Active Step Card (Zero Distractions!) */}
      <div className="flex-1 min-h-0 flex flex-col justify-center">
        <AnimatePresence mode="wait">
          <motion.form
            key={activeStepNumber}
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            onSubmit={(e) => void handleStepSubmit(e)}
            className="w-full h-full max-h-115 rounded-3xl bg-linear-to-b from-[#141a24]/95 via-[#0a0f16] to-[#070a0f] border border-white/12 shadow-[0_24px_60px_rgba(0,0,0,0.65),inset_0_1px_0_rgba(255,255,255,0.14)] p-5 sm:p-6 flex flex-col justify-between overflow-y-auto custom-scrollbar"
          >
            <div>
              <span className="text-[10px] font-black uppercase tracking-widest text-orange-400 block mb-1">
                Mandatory Step {activeStepNumber} of 5
              </span>
              <h2 className="text-lg sm:text-xl font-black text-white leading-snug">
                {stepConfig.title}
              </h2>
              <p className="text-xs text-gray-400 mt-1 leading-relaxed">
                {stepConfig.desc}
              </p>
            </div>

            {/* Vehicle of Interest & Trade-In VIN Scanner Buttons */}
            <div className="grid grid-cols-2 gap-2.5 my-2">
              <button
                type="button"
                onClick={() => {
                  setVehicleDraft(visit.vehicleOfInterest);
                  setIsVehicleModalOpen('interest');
                }}
                className="p-3 rounded-2xl bg-white/4 hover:bg-white/8 border border-white/10 text-left cursor-pointer"
              >
                <span className="text-[9px] font-black uppercase tracking-wider text-orange-400 flex items-center justify-between">
                  <span>Vehicle of Interest</span>
                  <ScanBarcode size={12} />
                </span>
                <p className="text-xs font-bold text-white truncate mt-1">
                  {vehicleTitle(visit.vehicleOfInterest)}
                </p>
              </button>

              <button
                type="button"
                onClick={() => {
                  setVehicleDraft(visit.tradeIn);
                  setIsVehicleModalOpen('trade');
                }}
                className="p-3 rounded-2xl bg-white/4 hover:bg-white/8 border border-white/10 text-left cursor-pointer"
              >
                <span className="text-[9px] font-black uppercase tracking-wider text-sky-400 flex items-center justify-between">
                  <span>Trade-In VIN</span>
                  <ScanBarcode size={12} />
                </span>
                <p className="text-xs font-bold text-white truncate mt-1">
                  {vehicleTitle(visit.tradeIn)}
                </p>
              </button>
            </div>

            {soldAlertMsg && (
              <div className="p-3 rounded-2xl bg-red-500/15 border border-red-500/40 flex items-start gap-2 text-xs text-red-200">
                <ShieldAlert size={15} className="text-red-400 shrink-0 mt-0.5" />
                <span>{soldAlertMsg}</span>
              </div>
            )}

            {/* Required Media Upload + Note Input */}
            <div className="space-y-2.5">
              {stagedFile ? (
                <div className="p-3 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-between gap-3">
                  <div className="flex items-center gap-3 min-w-0">
                    {stagedPreview && stagedFile.type.startsWith('image/') ? (
                      <img
                        src={stagedPreview}
                        alt="Preview"
                        className="w-11 h-11 rounded-xl object-cover border border-white/20"
                      />
                    ) : (
                      <div className="w-11 h-11 rounded-xl bg-emerald-500/20 flex items-center justify-center text-emerald-400">
                        <Video size={18} />
                      </div>
                    )}
                    <div className="min-w-0">
                      <p className="text-xs font-bold text-white truncate">{stagedFile.name}</p>
                      <p className="text-[10px] text-emerald-400 font-bold">
                        Photo/Video Proof Attached
                      </p>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => setStagedFile(null)}
                    className="p-2 text-gray-400 hover:text-red-400 cursor-pointer"
                  >
                    <Trash2 size={15} />
                  </button>
                </div>
              ) : (
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className={`w-full py-3 px-4 rounded-2xl border-2 border-dashed flex items-center justify-center gap-2 text-xs font-bold transition-all cursor-pointer ${
                    activeStepNumber === 2
                      ? 'border-orange-500/50 bg-orange-500/10 text-orange-300'
                      : 'border-white/15 hover:border-white/30 bg-white/2 text-gray-300'
                  }`}
                >
                  <ImagePlus size={16} className="text-orange-400" />
                  <span>
                    {activeStepNumber === 2
                      ? 'Tap to Attach Mandatory Walkaround Photo/Video *'
                      : 'Attach Step Photo / Worksheet (Optional)'}
                  </span>
                </button>
              )}

              <input
                ref={fileInputRef}
                type="file"
                accept="image/*,video/*"
                onChange={(e: ChangeEvent<HTMLInputElement>) => {
                  const f = e.target.files?.[0];
                  e.target.value = '';
                  if (f) {
                    setStagedFile(f);
                    playSocialMediaChime();
                  }
                }}
                className="hidden"
              />

              <input
                type="text"
                value={noteText}
                onChange={(e) => setNoteText(e.target.value)}
                placeholder={stepConfig.placeholder}
                className="w-full h-11 px-4 rounded-2xl bg-black/50 border border-white/15 text-xs sm:text-sm text-white outline-none focus:border-orange-500"
              />
            </div>

            {/* Locked Submit Gate Button */}
            <div className="pt-3 border-t border-white/10 flex items-center justify-between gap-3">
              <span className="text-[10px] font-semibold text-gray-500 flex items-center gap-1">
                <Lock size={11} className="text-orange-400" />
                {stepConfig.canSubmit ? 'Ready to unlock next step' : 'Submit info or photo to unlock'}
              </span>

              <button
                type="submit"
                disabled={!stepConfig.canSubmit || busyAction !== null}
                className={`h-10 px-5 rounded-full text-xs font-black flex items-center gap-2 transition-all ${
                  stepConfig.canSubmit
                    ? 'bg-orange-500 hover:bg-orange-600 text-white shadow-[0_6px_20px_rgba(249,115,22,0.4)] cursor-pointer active:scale-95'
                    : 'bg-white/4 border border-white/8 text-gray-500 cursor-not-allowed'
                }`}
              >
                {!stepConfig.canSubmit ? <Lock size={13} /> : <Send size={13} />}
                <span>
                  {activeStepNumber < 5
                    ? `Complete & Unlock Step ${activeStepNumber + 1}`
                    : 'Finish Showroom Visit'}
                </span>
              </button>
            </div>
          </motion.form>
        </AnimatePresence>
      </div>

      {/* Vehicle VIN Scanner Modal (With Sold-Vehicle WoodBlock Check!) */}
      <SwipeableModal
        isOpen={isVehicleModalOpen !== null}
        onClose={() => setIsVehicleModalOpen(null)}
        maxWidthClass="md:max-w-lg"
      >
        <div className="p-5 sm:p-6 overflow-y-auto">
          <VehicleVinLookupField
            purpose={isVehicleModalOpen === 'trade' ? 'trade_in' : 'vehicle_of_interest'}
            value={vehicleDraft}
            onChange={(decoded) => {
              setVehicleDraft(decoded);
              if (decoded) {
                const label = [
                  decoded.modelYear,
                  decoded.make,
                  decoded.model,
                  decoded.trim,
                ]
                  .filter(Boolean)
                  .join(' ');

                // Check if this vehicle of interest is already marked DELIVERED (Sold) in store inventory!
                if (isVehicleModalOpen === 'interest') {
                  const soldUnit = checkAndAlertIfVehicleSold(
                    storeId,
                    decoded.vin || label
                  );
                  if (soldUnit) {
                    setSoldAlertMsg(
                      `WOODKNOCK ALERT: ${soldUnit.vehicle} (VIN: ${soldUnit.vin}) is marked DELIVERED (Sold)! Pick an available unit.`
                    );
                    setIsVehicleModalOpen(null);
                    return;
                  }
                  setSoldAlertMsg(null);
                }

                void appendVisitEvent(
                  'note_added',
                  `Decoded ${
                    isVehicleModalOpen === 'trade' ? 'Trade-In' : 'Vehicle of Interest'
                  }: ${label} (VIN: ${decoded.vin})`
                );
                setIsVehicleModalOpen(null);
              }
            }}
          />
        </div>
      </SwipeableModal>
    </div>
  );
}
