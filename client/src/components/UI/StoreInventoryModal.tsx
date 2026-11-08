// src/components/UI/StoreInventoryModal.tsx
import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, RefreshCw, Search, ExternalLink, Car, Plus } from 'lucide-react';
import SwipeableModal from './SwipeableModal';
import { useStoreAppearance } from '../../contexts/StoreAppereanceContext';
import {
  getStoreInventory,
  saveStoreInventory,
  updateStoreVehicleStatus,
  getStoreWebsiteInventoryUrl,
  type InventoryUnitStatus,
} from '../../services/inventory/storeInventorySync';
import type { StoreInventorySummary } from '../../data/stores/njx/inventory';
import { useAuth } from '../../contexts/AuthContext';
import { apiInventoryRepository, type ApiInventoryVehicle } from '../../services/inventory/apiInventoryRepository';

interface StoreInventoryModalProps {
  isOpen: boolean;
  onClose: () => void;
}

function summarizeInventory(storeId: string, vehicles: ApiInventoryVehicle[]): StoreInventorySummary {
  const now = Date.now();
  const currentMonth = new Date().toISOString().slice(0, 7);
  const today = new Date().toISOString().slice(0, 10);
  const units = vehicles.map((vehicle) => ({
    vin: vehicle.vin,
    vehicle: vehicle.vehicle,
    daysInStock: Math.max(0, Math.floor((now - new Date(vehicle.createdAt).getTime()) / 86_400_000)),
    price: vehicle.price,
    status: vehicle.status,
  }));
  return {
    storeId,
    carsReadyForSale: units.filter((unit) => unit.status === 'READY_FOR_SALE').length,
    carsDeliveredMtd: vehicles.filter((vehicle) => vehicle.status === 'DELIVERED' && vehicle.updatedAt.startsWith(currentMonth)).length,
    dealsDeliveredToday: vehicles.filter((vehicle) => vehicle.status === 'DELIVERED' && vehicle.updatedAt.startsWith(today)).length,
    averageRatioBenchmark: 0,
    units,
  };
}

export default function StoreInventoryModal({
  isOpen,
  onClose,
}: StoreInventoryModalProps) {
  const { activeStoreId, activeStore } = useStoreAppearance();
  const { user } = useAuth();
  const [summary, setSummary] = useState<StoreInventorySummary>(() =>
    user ? { storeId: activeStoreId, carsReadyForSale: 0, carsDeliveredMtd: 0, dealsDeliveredToday: 0, averageRatioBenchmark: 0, units: [] } : getStoreInventory(activeStoreId)
  );
  const [apiVehicles, setApiVehicles] = useState<ApiInventoryVehicle[]>([]);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<'ALL' | InventoryUnitStatus>('ALL');
  const [syncStage, setSyncStage] = useState<string | null>(null);
  const [syncPct, setSyncPct] = useState<number>(0);
  const [syncError, setSyncError] = useState<string | null>(null);
  const inventorySyncAvailable = Boolean(user && activeStore.websiteUrl?.trim());
  const [isAddingUnit, setIsAddingUnit] = useState(false);
  const [newVin, setNewVin] = useState('');
  const [newVehicle, setNewVehicle] = useState('');
  const [newPrice, setNewPrice] = useState('');

  useEffect(() => {
    let active = true;
    const refresh = () => {
      if (user) {
        void apiInventoryRepository.list(activeStoreId).then((vehicles) => {
          if (!active) return;
          setApiVehicles(vehicles);
          setSummary(summarizeInventory(activeStoreId, vehicles));
        }).catch((cause: unknown) => {
          setSyncError(cause instanceof Error ? cause.message : 'Inventory could not be loaded.');
        });
      } else {
        setSummary(getStoreInventory(activeStoreId));
      }
    };
    refresh();
    window.addEventListener('eveo:store-inventory-updated', refresh);
    return () => {
      active = false;
      window.removeEventListener('eveo:store-inventory-updated', refresh);
    };
  }, [activeStoreId, isOpen, user]);

  const handleProgressiveSync = async () => {
    setSyncError(null);
    if (!inventorySyncAvailable) {
      setSyncError(user ? 'Add a dealership website in store settings before syncing inventory.' : 'Sign in to sync a dealership inventory.');
      return;
    }
    try {
      setSyncStage('Reading dealership inventory…');
      setSyncPct(20);
      const result = await apiInventoryRepository.syncWebsite(activeStoreId);
      setSyncPct(85);
      const vehicles = await apiInventoryRepository.list(activeStoreId);
      setApiVehicles(vehicles);
      setSummary(summarizeInventory(activeStoreId, vehicles));
      setSyncStage(`Sync complete · ${result.created} new, ${result.observed} checked`);
      setSyncPct(100);
      window.setTimeout(() => { setSyncStage(null); setSyncPct(0); }, 2400);
    } catch (error) {
      setSyncStage(null);
      setSyncPct(0);
      setSyncError(error instanceof Error ? error.message : 'Inventory synchronization failed.');
    }
  };

  const handleAddUnit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newVin.trim() || !newVehicle.trim()) return;
    const priceNum = parseInt(newPrice.replace(/[^0-9]/g, ''), 10) || 0;
    if (user) {
      try {
        const created = await apiInventoryRepository.create({ storeId: activeStoreId, vin: newVin.trim(), vehicle: newVehicle.trim(), price: priceNum });
        if (created.duplicate) setSyncError(`VIN ${created.vin} is already registered in this dealer account.`);
        else setSyncError(null);
        const vehicles = await apiInventoryRepository.list(activeStoreId);
        setApiVehicles(vehicles);
        setSummary(summarizeInventory(activeStoreId, vehicles));
        if (created.duplicate) return;
      } catch (cause) {
        setSyncError(cause instanceof Error ? cause.message : 'Inventory vehicle could not be saved.');
        return;
      }
    } else {
    const next: StoreInventorySummary = {
      ...summary,
      carsReadyForSale: summary.carsReadyForSale + 1,
      units: [
        {
          vin: newVin.trim().toUpperCase(),
          vehicle: newVehicle.trim(),
          daysInStock: 1,
          price: priceNum,
          status: 'READY_FOR_SALE',
        },
        ...summary.units,
      ],
    };
    saveStoreInventory(activeStoreId, next);
    setSummary(next);
    }
    setNewVin('');
    setNewVehicle('');
    setNewPrice('');
    setIsAddingUnit(false);
  };

  const changeVehicleStatus = async (vin: string, status: InventoryUnitStatus) => {
    if (!user) {
      updateStoreVehicleStatus(activeStoreId, vin, status);
      return;
    }
    const record = apiVehicles.find((vehicle) => vehicle.vin === vin);
    if (!record) return;
    try {
      await apiInventoryRepository.update(record._id, { status });
      const vehicles = await apiInventoryRepository.list(activeStoreId);
      setApiVehicles(vehicles);
      setSummary(summarizeInventory(activeStoreId, vehicles));
    } catch (cause) {
      setSyncError(cause instanceof Error ? cause.message : 'Vehicle status could not be updated.');
    }
  };

  const resolveDiscrepancy = async (recordId: string, discrepancyId: string, resolution: 'accepted_source' | 'kept_current') => {
    try {
      await apiInventoryRepository.resolveDiscrepancy(recordId, discrepancyId, { resolution });
      setApiVehicles(await apiInventoryRepository.list(activeStoreId));
    } catch (cause) {
      setSyncError(cause instanceof Error ? cause.message : 'Inventory discrepancy could not be resolved.');
    }
  };

  const filteredUnits = summary.units.filter((u) => {
    if (statusFilter !== 'ALL' && u.status !== statusFilter) return false;
    const q = search.toLowerCase();
    return u.vehicle.toLowerCase().includes(q) || u.vin.toLowerCase().includes(q);
  });

  const websiteUrl = activeStore.websiteUrl || getStoreWebsiteInventoryUrl(activeStoreId);

  return (
    <SwipeableModal isOpen={isOpen} onClose={onClose} maxWidthClass="md:max-w-5xl">
      <div className="flex flex-col h-[86dvh] text-white select-none sm:select-auto">
        {/* Header */}
        <div className="px-6 py-4 border-b border-white/10 flex flex-wrap items-center justify-between gap-3 shrink-0">
          <div>
            <span className="text-[10px] font-black uppercase tracking-widest text-orange-400 block">
              {activeStore.name} &bull; {summary.carsReadyForSale} Ready &bull;{' '}
              {summary.carsDeliveredMtd} Delivered MTD
            </span>
            <h2 className="text-xl sm:text-2xl font-black text-white flex items-center gap-2">
              <Car className="text-orange-400" size={22} /> Live Store Inventory
            </h2>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setIsAddingUnit(!isAddingUnit)}
              className="h-9 px-3.5 rounded-full bg-white/6 hover:bg-white/12 border border-white/10 text-xs font-bold text-gray-200 flex items-center gap-1.5 cursor-pointer"
            >
              <Plus size={14} className="text-emerald-400" />
              <span>Add VIN</span>
            </button>

            <button
              type="button"
              onClick={() => void handleProgressiveSync()}
              disabled={!inventorySyncAvailable || syncStage !== null}
              title={inventorySyncAvailable ? 'Read vehicle records published by the dealership website' : 'Add a dealership website in store settings to enable sync'}
              aria-label={inventorySyncAvailable ? 'Sync website inventory' : 'Add a dealership website to enable inventory sync'}
              className="h-9 px-4 rounded-full bg-white/8 hover:bg-white/[0.14] border border-white/15 text-xs font-bold text-white flex items-center gap-2 enabled:cursor-pointer disabled:cursor-not-allowed disabled:opacity-50"
            >
              <RefreshCw
                size={13}
                className={syncStage ? 'animate-spin text-orange-400' : 'text-orange-400'}
              />
              <span>{syncStage || 'Sync Website'}</span>
            </button>

            <a
              href={websiteUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="h-9 px-3.5 rounded-full bg-white/5 hover:bg-white/10 border border-white/10 text-xs font-semibold text-gray-300 flex items-center gap-1.5"
            >
              <span className="hidden sm:inline">Dealer Website</span>
              <ExternalLink size={12} />
            </a>

            <button
              type="button"
              onClick={onClose}
              className="w-9 h-9 rounded-full bg-white/8 hover:bg-white/15 flex items-center justify-center text-gray-400 hover:text-white cursor-pointer"
            >
              <X size={18} />
            </button>
          </div>
        </div>

        <p className="px-6 py-2 text-[11px] text-gray-500 border-b border-white/5" role="status">
          Website sync imports VIN-based vehicle data when the site publishes structured inventory. Other sites need a vAuto, CRM, or inventory feed connection.
        </p>
        {syncError && (
          <p className="px-6 py-2 text-[11px] text-amber-300 border-b border-amber-500/20" role="alert">
            {syncError}
          </p>
        )}

        {/* Progressive Sync Bar */}
        <AnimatePresence>
          {syncStage && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              className="px-6 py-2.5 bg-orange-500/10 border-b border-orange-500/30 flex items-center justify-between gap-4 text-xs"
            >
              <span className="font-bold text-orange-300">{syncStage}</span>
              <div className="w-48 h-2 rounded-full bg-black/50 overflow-hidden">
                <div
                  className="h-full bg-orange-500 transition-all duration-300"
                  style={{ width: `${syncPct}%` }}
                />
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Quick Add VIN Form */}
        {isAddingUnit && (
          <form
            onSubmit={handleAddUnit}
            className="px-6 py-3 bg-white/3 border-b border-white/10 grid grid-cols-1 sm:grid-cols-4 gap-2.5 shrink-0"
          >
            <input
              type="text"
              value={newVin}
              onChange={(e) => setNewVin(e.target.value)}
              placeholder="17-Digit VIN *"
              required
              className="h-9 px-3 rounded-xl bg-black/50 border border-white/15 text-xs font-mono text-white outline-none focus:border-orange-500"
            />
            <input
              type="text"
              value={newVehicle}
              onChange={(e) => setNewVehicle(e.target.value)}
              placeholder="Year Make Model *"
              required
              className="h-9 px-3 rounded-xl bg-black/50 border border-white/15 text-xs text-white outline-none focus:border-orange-500"
            />
            <input
              type="text"
              value={newPrice}
              onChange={(e) => setNewPrice(e.target.value)}
              placeholder="Price (e.g. 34900)"
              className="h-9 px-3 rounded-xl bg-black/50 border border-white/15 text-xs text-white outline-none focus:border-orange-500"
            />
            <button
              type="submit"
              className="h-9 rounded-xl bg-orange-500 hover:bg-orange-600 text-xs font-black text-white cursor-pointer"
            >
              Save Unit to Lot
            </button>
          </form>
        )}

        {/* Search & Filter Row */}
        <div className="px-6 py-3 border-b border-white/[0.07] flex flex-wrap items-center justify-between gap-3 shrink-0 bg-black/20">
          <div className="relative flex-1 min-w-56 max-w-md">
            <Search size={14} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-500" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search by vehicle or VIN..."
              className="w-full h-9 pl-9 pr-4 rounded-full bg-white/5 border border-white/10 text-xs text-white outline-none focus:border-orange-500"
            />
          </div>

          <div className="flex items-center gap-1.5">
            {(['ALL', 'READY_FOR_SALE', 'PENDING', 'SOLD', 'DELIVERED'] as const).map((st) => (
              <button
                key={st}
                type="button"
                onClick={() => setStatusFilter(st)}
                className={`h-8 px-3 rounded-full text-[10px] font-black uppercase tracking-wider border cursor-pointer transition-all ${
                  statusFilter === st
                    ? 'bg-orange-500/20 border-orange-500/50 text-orange-300'
                    : 'bg-white/4 border-white/8 text-gray-400 hover:text-white'
                }`}
              >
                {st === 'READY_FOR_SALE' ? 'READY' : st}
              </button>
            ))}
          </div>
        </div>

        {/* Units Grid */}
        <div className="flex-1 min-h-0 overflow-y-auto custom-scrollbar p-6 grid grid-cols-1 sm:grid-cols-2 gap-4 bg-black/25 content-start">
          {filteredUnits.map((unit) => (
            <div
              key={unit.vin}
              className={`p-5 rounded-3xl border flex flex-col justify-between gap-3 bg-linear-to-b from-[#141a23]/95 to-[#0a0f16] ${
                unit.status === 'DELIVERED' || unit.status === 'SOLD'
                  ? 'border-red-500/35 opacity-80'
                  : 'border-white/10'
              }`}
            >
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <h3 className="text-base font-black text-white truncate">
                    {unit.vehicle}
                  </h3>
                  <p className="text-[11px] font-mono text-gray-400 mt-0.5">
                    VIN: {unit.vin}
                  </p>
                </div>
                <span
                  className={`px-2.5 py-0.5 rounded-full text-[9px] font-black uppercase tracking-wider border shrink-0 ${
                    unit.status === 'READY_FOR_SALE'
                      ? 'bg-emerald-500/20 border-emerald-500/40 text-emerald-300'
                      : unit.status === 'PENDING'
                        ? 'bg-amber-500/20 border-amber-500/40 text-amber-300'
                        : 'bg-red-500/25 border-red-500/50 text-red-300'
                  }`}
                >
                  {unit.status === 'DELIVERED' ? 'DELIVERED' : unit.status.replace(/_/g, ' ')}
                </span>
              </div>

              <div className="flex items-baseline justify-between pt-1">
                <span className="text-xl font-black text-white">
                  ${unit.price.toLocaleString()}
                </span>
                <span className="text-xs font-bold text-gray-400">
                  {unit.daysInStock} Days in Stock
                </span>
              </div>

              {apiVehicles.find((record) => record.vin === unit.vin)?.discrepancies.filter((item) => item.status === 'open').map((item) => {
                const record = apiVehicles.find((candidate) => candidate.vin === unit.vin);
                if (!record) return null;
                return (
                  <div key={item._id} className="rounded-xl border border-amber-500/30 bg-amber-500/5 p-3">
                    <p className="text-xs font-bold text-amber-200">Source conflict · {item.field}</p>
                    <p className="mt-1 text-[11px] text-gray-300">Current: {String(item.currentValue ?? '')} · Observed: {String(item.observedValue ?? '')} ({item.source})</p>
                    <div className="mt-2 flex gap-2">
                      <button type="button" onClick={() => void resolveDiscrepancy(record._id, item._id, 'accepted_source')} className="rounded-lg bg-emerald-500/15 px-3 py-1.5 text-[10px] font-bold text-emerald-200">Accept source</button>
                      <button type="button" onClick={() => void resolveDiscrepancy(record._id, item._id, 'kept_current')} className="rounded-lg bg-white/10 px-3 py-1.5 text-[10px] font-bold text-gray-200">Keep current</button>
                    </div>
                  </div>
                );
              })}

              <div className="flex items-center gap-1.5 pt-2 border-t border-white/8">
                {(['READY_FOR_SALE', 'PENDING', 'SOLD', 'DELIVERED'] as const).map((st) => (
                  <button
                    key={st}
                    type="button"
                    onClick={() => void changeVehicleStatus(unit.vin, st)}
                    className={`flex-1 py-1.5 rounded-xl text-[10px] font-bold uppercase border cursor-pointer transition-all ${
                      unit.status === st
                        ? st === 'DELIVERED'
                          ? 'bg-red-500/25 border-red-500/50 text-red-300'
                          : st === 'SOLD'
                            ? 'bg-purple-500/25 border-purple-500/50 text-purple-300'
                          : 'bg-white/15 border-white/30 text-white'
                        : 'bg-white/3 border-white/6 text-gray-500 hover:text-gray-300'
                    }`}
                  >
                    {st === 'READY_FOR_SALE' ? 'Ready' : st === 'PENDING' ? 'Pending' : st === 'SOLD' ? 'Sold' : 'Delivered'}
                  </button>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>
    </SwipeableModal>
  );
}
