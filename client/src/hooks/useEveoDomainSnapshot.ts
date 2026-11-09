import { useCallback, useEffect, useState } from 'react';
import type { EveoDomainSnapshot } from '../types/domain';
import {
  eveoDomainRepository,
  type EveoDomainRepository,
} from '../services/repositories';

export interface EveoDomainSnapshotState {
  snapshot: EveoDomainSnapshot | null;
  isLoading: boolean;
  error: string | null;
  reload: () => Promise<void>;
}

/**
 * React adapter for the canonical EVEO repository.
 * Pages consume typed snapshots without importing localStorage or demo fixtures.
 */
export function useEveoDomainSnapshot(
  repository: EveoDomainRepository = eveoDomainRepository,
): EveoDomainSnapshotState {
  const [snapshot, setSnapshot] = useState<EveoDomainSnapshot | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const reload = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      setSnapshot(await repository.getSnapshot());
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : 'Unable to load EVEO data.');
    } finally {
      setIsLoading(false);
    }
  }, [repository]);

  useEffect(() => {
    let active = true;
    const unsubscribe = repository.subscribe((nextSnapshot) => {
      if (!active) return;
      setSnapshot(nextSnapshot);
      setError(null);
      setIsLoading(false);
    });

    void repository.getSnapshot()
      .then((initialSnapshot) => {
        if (!active) return;
        setSnapshot(initialSnapshot);
        setError(null);
      })
      .catch((caught: unknown) => {
        if (!active) return;
        setError(caught instanceof Error ? caught.message : 'Unable to load EVEO data.');
      })
      .finally(() => {
        if (active) setIsLoading(false);
      });

    return () => {
      active = false;
      unsubscribe();
    };
  }, [repository]);

  return { snapshot, isLoading, error, reload };
}

export default useEveoDomainSnapshot;
