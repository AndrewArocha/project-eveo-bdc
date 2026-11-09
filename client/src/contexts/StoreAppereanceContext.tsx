import { clearConversations } from '../services/eveoAgent/conversations';
import React, { createContext, useContext, useState, useEffect, useCallback, useMemo, useLayoutEffect, useRef } from 'react';
import { useLocation } from 'react-router-dom';
import type { Store } from '../types';
import type { StoreRecord } from '../types/domain';
import { useAuth } from './AuthContext';
import { ApiError, apiRequest, type ApiStore } from '../services/apiClient';
import { eveoDomainRepository } from '../services/repositories';
import { resetDemoSession } from '../services/demo/demoSession';
import defaultBanner from '../images/defaultBanner.avif';
import eveoSymbol from '../images/logo/eveo-symbol.svg';

interface StoreAppearanceContextType {
  isDemoWorkspace: boolean;
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
  const location = useLocation();
  const useDemoStores = Boolean(user?.demoMode && /^\/app(?:\/|$)/.test(location.pathname));
  const storeScope = user ? `${user.id}:${useDemoStores ? 'demo' : 'live'}` : '';
  const demoOwner = useDemoStores ? user?.id : undefined;
  const previousDemoOwner = useRef(demoOwner);
  useLayoutEffect(() => {
    const clearDemo = () => { resetDemoSession(); clearConversations(true); };
    if (previousDemoOwner.current && previousDemoOwner.current !== demoOwner) clearDemo();
    previousDemoOwner.current = demoOwner;
    if (!demoOwner) return;
    const restore = (event: PageTransitionEvent) => { if (event.persisted) window.location.reload(); };
    window.addEventListener('pagehide', clearDemo);
    window.addEventListener('pageshow', restore);
    return () => {
      window.removeEventListener('pagehide', clearDemo);
      window.removeEventListener('pageshow', restore);
    };
  }, [demoOwner]);
  const [banners, setBanners] = useState<Record<string, string>>(() => {
    try {
      const saved = localStorage.getItem('eveo_store_banners');
      return saved ? JSON.parse(saved) : {};
    } catch {
      return {};
    }
  });
  const [demoBanners, setDemoBanners] = useState<Record<string, string>>({});
  const [registeredStores, setRegisteredStores] = useState<ApiStore[]>([]);
  const [demoStores, setDemoStores] = useState<Store[]>([]);
  const [storesLoading, setStoresLoading] = useState(false);
  const [loadedScope, setLoadedScope] = useState('');
  const requestId = useRef(0);
  const [storesError, setStoresError] = useState('');
  const [selectedLiveStore, setSelectedLiveStore] = useState(() => localStorage.getItem('eveo_active_store_id') || '');
  const [selectedDemoStore, setSelectedDemoStore] = useState('');
  const stores = useMemo(() => useDemoStores ? demoStores : registeredStores.map(toAppearanceStore), [useDemoStores, registeredStores, demoStores]);
  const selectedStore = useDemoStores ? selectedDemoStore : selectedLiveStore;
  const activeStoreId = (stores.find((store) => store.id === selectedStore)?.id ?? stores[0]?.id) || '';

  const refreshStores = useCallback(async () => {
    const request = ++requestId.current;
    if (!storeScope) {
      setRegisteredStores([]);
      setStoresError('');
      setStoresLoading(false);
      setLoadedScope('');
      return;
    }
    if (useDemoStores) {
      setStoresError('');
      setStoresLoading(true);
      try {
        const records = await eveoDomainRepository.listStores();
        if (request !== requestId.current) return;
        const nextStores = records.filter((store) => store.isDemoData).map(toDemoAppearanceStore);
        setDemoStores(nextStores);
      } catch (cause) {
        if (request !== requestId.current) return;
        setDemoStores([]);
        setStoresError(cause instanceof Error ? cause.message : 'Could not load the demo store registry.');
      } finally {
        if (request === requestId.current) { setLoadedScope(storeScope); setStoresLoading(false); }
      }
      return;
    }
    setStoresLoading(true);
    setStoresError('');
    try {
      const records = await apiRequest<ApiStore[]>('/stores');
      if (request !== requestId.current) return;
      setRegisteredStores(records);
    } catch (cause) {
      if (request !== requestId.current) return;
      setStoresError(cause instanceof ApiError ? cause.message : 'Could not load your store registry.');
    } finally {
      if (request === requestId.current) { setLoadedScope(storeScope); setStoresLoading(false); }
    }
  }, [useDemoStores, storeScope]);

  useEffect(() => {
    void refreshStores();
    if (!useDemoStores) {
      setDemoStores([]);
      setDemoBanners({});
      setSelectedDemoStore('');
      return;
    }
    return eveoDomainRepository.subscribe(() => { void refreshStores(); });
  }, [refreshStores, useDemoStores]);

  useEffect(() => {
    try { localStorage.setItem('eveo_store_banners', JSON.stringify(banners)); } catch { /* Ignore storage errors */ }
  }, [banners]);

  const setActiveStoreId = useCallback((storeId: string) => {
    if (stores.some((store) => store.id === storeId || store.domainId === storeId || store.legacyDataKey === storeId)) {
      const selectedStore = stores.find((store) => store.id === storeId || store.domainId === storeId || store.legacyDataKey === storeId)!;
      const selectedId = selectedStore.id;
      if (useDemoStores) setSelectedDemoStore(selectedId);
      else {
        setSelectedLiveStore(selectedId);
        localStorage.setItem('eveo_active_store_id', selectedId);
      }
    }
  }, [stores, useDemoStores]);

  const cycleNextStore = useCallback(() => {
    if (stores.length === 0) return;
    const currentIdx = stores.findIndex((store) => store.id === activeStoreId);
    setActiveStoreId(stores[(currentIdx + 1) % stores.length].id);
  }, [activeStoreId, setActiveStoreId, stores]);

  const activeStore = stores.find((store) => store.id === activeStoreId) || EMPTY_STORE;
  const activeStoreDomainId = activeStore.domainId || '';
  const activeStoreDataKey = activeStore.legacyDataKey || activeStore.id;
  const visibleBanners = useDemoStores ? demoBanners : banners;
  const getBanner = useCallback((storeId: string) => visibleBanners[storeId], [visibleBanners]);
  const setBanner = useCallback((storeId: string, url: string) => {
    const update = useDemoStores ? setDemoBanners : setBanners;
    update((prev) => ({ ...prev, [storeId]: url }));
  }, [useDemoStores]);

  const value = useMemo(() => ({
    isDemoWorkspace: useDemoStores, banners: visibleBanners, getBanner, setBanner, activeStoreId, activeStoreDomainId, activeStoreDataKey, setActiveStoreId, activeStore,
    stores, registeredStores, storesLoading: storesLoading || storeScope !== loadedScope, storesError, refreshStores, cycleNextStore,
  }), [useDemoStores, visibleBanners, getBanner, setBanner, activeStoreId, activeStoreDomainId, activeStoreDataKey, setActiveStoreId, activeStore, stores, registeredStores, storesLoading, storeScope, loadedScope, storesError, refreshStores, cycleNextStore]);

  return <StoreAppearanceContext.Provider value={value}>{children}</StoreAppearanceContext.Provider>;
}

export const useStoreAppearance = () => {
  const context = useContext(StoreAppearanceContext);
  if (!context) throw new Error('useStoreAppearance must be used within a StoreAppearanceProvider');
  return context;
};

export function useWorkspaceUser() {
  const { user } = useAuth();
  return useStoreAppearance().isDemoWorkspace ? null : user;
}
