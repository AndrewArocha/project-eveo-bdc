
import { createContext, useContext, useState, type ReactNode } from 'react';

type BannerMap = Record<string, string>;

interface StoreAppearanceContextValue {
    banners: BannerMap;
    getBanner: (storeId: string) => string | undefined;
    setBanner: (storeId: string, image: string) => void;
}

const StoreAppearanceContext =
    createContext<StoreAppearanceContextValue | null>(null);

const STORAGE_KEY = 'store-banners';

function readBanners(): BannerMap {
    try {
        const stored = localStorage.getItem(STORAGE_KEY);
        return stored ? JSON.parse(stored) as BannerMap : {};
    } catch {
        return {};
    }
}

export function StoreAppearanceProvider({
    children,
}: {
    children: ReactNode;
}) {
    const [banners, setBanners] = useState<BannerMap>(readBanners);

    function setBanner(storeId: string, image: string) {
        setBanners((previous) => {
            const updated = { ...previous, [storeId]: image };

            try {
                localStorage.setItem(
                    STORAGE_KEY,
                    JSON.stringify(updated),
                );
            } catch (error) {
                console.error('Could not persist store banner:', error);
            }

            return updated;
        });
    }

    function getBanner(storeId: string) {
        return banners[storeId];
    }

    return (
        <StoreAppearanceContext.Provider
            value={{ banners, getBanner, setBanner }}
        >
            {children}
        </StoreAppearanceContext.Provider>
    );
}

export function useStoreAppearance() {
    const context = useContext(StoreAppearanceContext);

    if (!context) {
        throw new Error(
            'useStoreAppearance must be used inside StoreAppearanceProvider',
        );
    }

    return context;
}
