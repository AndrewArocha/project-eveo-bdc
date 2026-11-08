import React, { createContext, useContext, useState, useEffect, useCallback, useMemo } from 'react';
import type { Store } from '../types';
import type { StoreRecord } from '../types/domain';
import { useAuth } from './AuthContext';
import { ApiError, apiRequest, type ApiStore } from '../services/apiClient';
import { eveoDomainRepository } from '../services/repositories';
import defaultBanner from '../images/defaultBanner.avif';
import eveoSymbol from '../images/logo/eveo-symbol.svg';

interface StoreAppearanceContextType {
  banners: Record<string, string>;
  getBanner: (storeId: string) => string | undefined;
  setBanner: (storeId: string, url: string) => void;
  activeStoreId: string;
  activeStoreDomainId: string;
  activeStoreDataKey: string;
  setActiveStoreId: (storeId: string) => void;
  activeStore: Store;
  stores: Store[];
  registeredStores: ApiStore[];
  storesLoading: boolean;
  storesError: string;
  refreshStores: () => Promise<void>;
  cycleNextStore: () => void;
}

const EMPTY_STORE: Store = {
  id: '', name: '', logoText: '', logoUrl: eveoSymbol, bannerUrl: defaultBanner, themeGradient: '',
};

function toAppearanceStore(store: ApiStore): Store {
  return {
    id: store.id,
    domainId: store.id,
    storeCode: store.code,
    name: store.name,
    websiteUrl: store.website,
    phone: store.phone,
    logoText: store.code,
    logoUrl: eveoSymbol,
    bannerUrl: defaultBanner,
    themeGradient: '',
  };
}

function toDemoAppearanceStore(store: StoreRecord): Store {
  const legacyDataKey = store.storeCode.toLowerCase();
  return {
    id: store.id,
    domainId: store.id,
    dealerAccountId: store.dealerAccountId,
    storeCode: store.storeCode,
    legacyDataKey,
    name: store.name,
    websiteUrl: store.websiteUrl,
    phone: store.phone,
    logoText: store.storeCode,
    logoUrl: store.logoUrl || eveoSymbol,
    bannerUrl: store.bannerUrl || defaultBanner,
    themeGradient: '',
  };
}

const StoreAppearanceContext = createContext<StoreAppearanceContextType | undefined>(undefined);

export function StoreAppearanceProvider({ children }: { children: React.ReactNode }) {
  const { user } = useAuth();
  const [banners, setBanners] = useState<Record<string, string>>(() => {
    try {
      const saved = localStorage.getItem('eveo_store_banners');
      return saved ? JSON.parse(saved) : {};
    } catch {
      return {};
    }
  });
  const [registeredStores, setRegisteredStores] = useState<ApiStore[]>([]);
  const [demoStores, setDemoStores] = useState<Store[]>([]);
  const [storesLoading, setStoresLoading] = useState(false);
  const [storesError, setStoresError] = useState('');
  const [activeStoreId, setActiveStoreIdState] = useState(() => localStorage.getItem('eveo_active_store_id') || '');
  const stores = useMemo(() => user ? registeredStores.map(toAppearanceStore) : demoStores, [user, registeredStores, demoStores]);

  const refreshStores = useCallback(async () => {
    if (!user) {
      setRegisteredStores([]);
      setStoresError('');
      setStoresLoading(true);
      try {
        const records = await eveoDomainRepository.listStores();
        const nextStores = records.filter((store) => store.isDemoData).map(toDemoAppearanceStore);
        setDemoStores(nextStores);
        setActiveStoreIdState((current) => {
          const next = nextStores.find((store) => store.id === current || store.domainId === current || store.legacyDataKey === current)?.id
            ?? nextStores[0]?.id
            ?? '';
          if (next) localStorage.setItem('eveo_active_store_id', next);
          else localStorage.removeItem('eveo_active_store_id');
          return next;
        });
      } catch (cause) {
        setDemoStores([]);
        setStoresError(cause instanceof Error ? cause.message : 'Could not load the demo store registry.');
      } finally {
        setStoresLoading(false);
      }
      return;
    }
    setStoresLoading(true);
    setStoresError('');
    try {
      const records = await apiRequest<ApiStore[]>('/stores');
      setRegisteredStores(records);
      setDemoStores([]);
      setActiveStoreIdState((current) => {
        const next = records.some((store) => store.id === current) ? current : (records[0]?.id ?? '');
        if (next) localStorage.setItem('eveo_active_store_id', next);
        else localStorage.removeItem('eveo_active_store_id');
        return next;
      });
    } catch (cause) {
      setStoresError(cause instanceof ApiError ? cause.message : 'Could not load your store registry.');
    } finally {
      setStoresLoading(false);
    }
  }, [user]);

  useEffect(() => {
    void refreshStores();
    if (user) return;
    return eveoDomainRepository.subscribe(() => { void refreshStores(); });
  }, [refreshStores, user]);

  useEffect(() => {
    try { localStorage.setItem('eveo_store_banners', JSON.stringify(banners)); } catch { /* Ignore storage errors */ }
  }, [banners]);

  const setActiveStoreId = useCallback((storeId: string) => {
    if (stores.some((store) => store.id === storeId || store.domainId === storeId || store.legacyDataKey === storeId)) {
      const selectedStore = stores.find((store) => store.id === storeId || store.domainId === storeId || store.legacyDataKey === storeId)!;
      const selectedId = selectedStore.id;
      setActiveStoreIdState(selectedId);
      localStorage.setItem('eveo_active_store_id', selectedId);
    }
  }, [stores]);

  const cycleNextStore = useCallback(() => {
    if (stores.length === 0) return;
    const currentIdx = stores.findIndex((store) => store.id === activeStoreId);
    setActiveStoreId(stores[(currentIdx + 1) % stores.length].id);
  }, [activeStoreId, setActiveStoreId, stores]);

  const activeStore = stores.find((store) => store.id === activeStoreId) || EMPTY_STORE;
  const activeStoreDomainId = activeStore.domainId || '';
  const activeStoreDataKey = activeStore.legacyDataKey || activeStore.id;
  const getBanner = useCallback((storeId: string) => banners[storeId], [banners]);
  const setBanner = useCallback((storeId: string, url: string) => setBanners((prev) => ({ ...prev, [storeId]: url })), []);

  const value = useMemo(() => ({
    banners, getBanner, setBanner, activeStoreId, activeStoreDomainId, activeStoreDataKey, setActiveStoreId, activeStore,
    stores, registeredStores, storesLoading, storesError, refreshStores, cycleNextStore,
  }), [banners, getBanner, setBanner, activeStoreId, activeStoreDomainId, activeStoreDataKey, setActiveStoreId, activeStore, stores, registeredStores, storesLoading, storesError, refreshStores, cycleNextStore]);

  return <StoreAppearanceContext.Provider value={value}>{children}</StoreAppearanceContext.Provider>;
}

export const useStoreAppearance = () => {
  const context = useContext(StoreAppearanceContext);
  if (!context) throw new Error('useStoreAppearance must be used within a StoreAppearanceProvider');
  return context;
};
