import React, { createContext, useContext, useState, useEffect, useCallback, useMemo } from 'react';
import { STORES, type Store } from '../data/mockDatabase';
import { useAuth } from './AuthContext';
import { ApiError, apiRequest, type ApiStore } from '../services/apiClient';

interface StoreAppearanceContextType {
  banners: Record<string, string>;
  getBanner: (storeId: string) => string | undefined;
  setBanner: (storeId: string, url: string) => void;
  activeStoreId: string;
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
  id: '', name: '', logoText: '', logoUrl: '', bannerUrl: '', themeGradient: '',
};

function toAppearanceStore(store: ApiStore): Store {
  return {
    id: store.id,
    name: store.name,
    websiteUrl: store.website,
    phone: store.phone,
    logoText: store.code,
    logoUrl: '',
    bannerUrl: '',
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
  const [storesLoading, setStoresLoading] = useState(false);
  const [storesError, setStoresError] = useState('');
  const [activeStoreId, setActiveStoreIdState] = useState(() => localStorage.getItem('eveo_active_store_id') || '');
  const stores = useMemo(() => user ? registeredStores.map(toAppearanceStore) : STORES, [user, registeredStores]);

  const refreshStores = useCallback(async () => {
    if (!user) {
      setRegisteredStores([]);
      setStoresError('');
      setStoresLoading(false);
      return;
    }
    setStoresLoading(true);
    setStoresError('');
    try {
      const records = await apiRequest<ApiStore[]>('/stores');
      setRegisteredStores(records);
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

  useEffect(() => { void refreshStores(); }, [refreshStores]);

  useEffect(() => {
    try { localStorage.setItem('eveo_store_banners', JSON.stringify(banners)); } catch { /* Ignore storage errors */ }
  }, [banners]);

  const setActiveStoreId = useCallback((storeId: string) => {
    if ((user && storeId.length > 0) || stores.some((store) => store.id === storeId)) {
      setActiveStoreIdState(storeId);
      localStorage.setItem('eveo_active_store_id', storeId);
    }
  }, [stores, user]);

  const cycleNextStore = useCallback(() => {
    if (stores.length === 0) return;
    const currentIdx = stores.findIndex((store) => store.id === activeStoreId);
    setActiveStoreId(stores[(currentIdx + 1) % stores.length].id);
  }, [activeStoreId, setActiveStoreId, stores]);

  const activeStore = stores.find((store) => store.id === activeStoreId) || (user ? EMPTY_STORE : STORES[0] || EMPTY_STORE);
  const getBanner = useCallback((storeId: string) => banners[storeId], [banners]);
  const setBanner = useCallback((storeId: string, url: string) => setBanners((prev) => ({ ...prev, [storeId]: url })), []);

  const value = useMemo(() => ({
    banners, getBanner, setBanner, activeStoreId, setActiveStoreId, activeStore,
    stores, registeredStores, storesLoading, storesError, refreshStores, cycleNextStore,
  }), [banners, getBanner, setBanner, activeStoreId, setActiveStoreId, activeStore, stores, registeredStores, storesLoading, storesError, refreshStores, cycleNextStore]);

  return <StoreAppearanceContext.Provider value={value}>{children}</StoreAppearanceContext.Provider>;
}

export const useStoreAppearance = () => {
  const context = useContext(StoreAppearanceContext);
  if (!context) throw new Error('useStoreAppearance must be used within a StoreAppearanceProvider');
  return context;
};
