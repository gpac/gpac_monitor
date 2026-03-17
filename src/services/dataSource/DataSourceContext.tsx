import React, { createContext, useContext, useState, useCallback } from 'react';
import { useDispatch } from 'react-redux';
import { clearGraph } from '@/shared/store/slices/graphSlice';
import { clearSessionDetails } from '@/shared/store/slices/sessionDetailsSlice';
import { clearFilterPids } from '@/shared/store/slices/sessionStatsSlice';
import { clearFilterArgs } from '@/shared/store/slices/filterArgumentSlice';
import { hydrateFromSnapshot } from '@/services/historyService/snapshotHydrator';
import type { HistorySnapshot } from '@/services/historyService/types';
import type { AppDispatch } from '@/shared/store';

type DataSourceMode = 'live' | 'history';

interface DataSourceContextValue {
  mode: DataSourceMode;
  switchToLive: () => void;
  switchToHistory: (snapshot: HistorySnapshot) => void;
}

const DataSourceContext = createContext<DataSourceContextValue>({
  mode: 'live',
  switchToLive: () => {},
  switchToHistory: () => {},
});

export function DataSourceProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const dispatch = useDispatch<AppDispatch>();
  const [mode, setMode] = useState<DataSourceMode>('live');

  const switchToHistory = useCallback(
    (snapshot: HistorySnapshot) => {
      hydrateFromSnapshot(snapshot, dispatch);
      setMode('history');
    },
    [dispatch],
  );

  const switchToLive = useCallback(() => {
    dispatch(clearGraph());
    dispatch(clearSessionDetails());
    dispatch(clearFilterPids());
    dispatch(clearFilterArgs());
    setMode('live');
  }, [dispatch]);

  return (
    <DataSourceContext.Provider value={{ mode, switchToLive, switchToHistory }}>
      {children}
    </DataSourceContext.Provider>
  );
}

export const useDataSource = () => useContext(DataSourceContext);
