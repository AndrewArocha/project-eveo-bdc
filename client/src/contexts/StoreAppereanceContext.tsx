import React, { createContext, useContext, useState, useEffect, useCallback, useMemo } from 'react';
import { STORES, type Store } from '../data/mockDatabase';

interface StoreAppearanceContextType {
  banners: Record<string, string>;
  getBanner: (storeId: string) => string | undefined;
  setBanner: (storeId: string, url: string) => void;
  activeStoreId: string;
  setActiveStoreId: (storeId: string) => void;
  activeStore: Store;
  cycleNextStore: () => void;
}

const StoreAppearanceContext = createContext<StoreAppearanceContextType | undefined>(undefined);

export function StoreAppearanceProvider({ children }: { children: React.ReactNode }) {
  const [banners, setBanners] = useState<Record<string, string>>(() => {
    try {
      const saved = localStorage.getItem('eveo_store_banners');
      return saved ? JSON.parse(saved) : {};
    } catch {
      return {};
    }
  });

  const [activeStoreId, setActiveStoreIdState] = useState<string>(() => {
    return localStorage.getItem('eveo_active_store_id') || STORES[0].id;
  });

  useEffect(() => {
    try {
      localStorage.setItem('eveo_store_banners', JSON.stringify(banners));
    } catch {
      // Ignore storage errors
    }
  }, [banners]);

  const setActiveStoreId = useCallback((storeId: string) => {
    if (STORES.some((s) => s.id === storeId)) {
      setActiveStoreIdState(storeId);
      localStorage.setItem('eveo_active_store_id', storeId);
    }
  }, []);

  const cycleNextStore = useCallback(() => {
    const currentIdx = STORES.findIndex((s) => s.id === activeStoreId);
    const nextStore = STORES[(currentIdx + 1) % STORES.length];
    setActiveStoreId(nextStore.id);
  }, [activeStoreId, setActiveStoreId]);

  const activeStore = STORES.find((s) => s.id === activeStoreId) || STORES[0];

  const getBanner = useCallback((storeId: string) => banners[storeId], [banners]);

  const setBanner = useCallback((storeId: string, url: string) => {
    setBanners((prev) => ({ ...prev, [storeId]: url }));
  }, []);

  const value = useMemo(() => ({
    banners,
    getBanner,
    setBanner,
    activeStoreId,
    setActiveStoreId,
    activeStore,
    cycleNextStore,
  }), [banners, getBanner, setBanner, activeStoreId, setActiveStoreId, activeStore, cycleNextStore]);

  return (
    <StoreAppearanceContext.Provider value={value}>
      {children}
    </StoreAppearanceContext.Provider>
  );
}

export const useStoreAppearance = () => {
  const context = useContext(StoreAppearanceContext);
  if (!context) {
    throw new Error('useStoreAppearance must be used within a StoreAppearanceProvider');
  }
  return context;
};
