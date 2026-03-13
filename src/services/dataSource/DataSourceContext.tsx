import React, { createContext, useContext, useState, useCallback } from 'react';
import { useDispatch } from 'react-redux';
import { clearGraph } from '@/shared/store/slices/graphSlice';
import { clearSessionDetails } from '@/shared/store/slices/sessionDetailsSlice';
import { hydrateFromSnapshot } from '@/services/historyService/snapshotHydrator';
import type { HistorySnapshot, HistorySnapshotFilter } from '@/services/historyService/types';
import type { AppDispatch } from '@/shared/store';

type DataSourceMode = 'live' | 'history';

interface DataSourceContextValue {
  mode: DataSourceMode;
  snapshotCache: Map<number, HistorySnapshotFilter> | null;
  switchToLive: () => void;
  switchToHistory: (snapshot: HistorySnapshot) => void;
}

const DataSourceContext = createContext<DataSourceContextValue>({
  mode: 'live',
  snapshotCache: null,
  switchToLive: () => {},
  switchToHistory: () => {},
});

export function DataSourceProvider({ children }: { children: React.ReactNode }) {
  const dispatch = useDispatch<AppDispatch>();
  const [mode, setMode] = useState<DataSourceMode>('live');
  const [snapshotCache, setSnapshotCache] = useState<Map<number, HistorySnapshotFilter> | null>(null);

  const switchToHistory = useCallback(
    (snapshot: HistorySnapshot) => {
      const cache = hydrateFromSnapshot(snapshot, dispatch);
      setSnapshotCache(cache);
      setMode('history');
    },
    [dispatch],
  );

  const switchToLive = useCallback(() => {
    dispatch(clearGraph());
    dispatch(clearSessionDetails());
    setSnapshotCache(null);
    setMode('live');
  }, [dispatch]);

  return (
    <DataSourceContext.Provider value={{ mode, snapshotCache, switchToLive, switchToHistory }}>
      {children}
    </DataSourceContext.Provider>
  );
}

export const useDataSource = () => useContext(DataSourceContext);
