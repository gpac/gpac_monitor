import React, { createContext, useContext, useState, useCallback } from 'react';
import { useDispatch } from 'react-redux';
import { clearGraph } from '@/shared/store/slices/graphSlice';
import { clearSessionDetails } from '@/shared/store/slices/sessionDetailsSlice';
import { clearFilterPids } from '@/shared/store/slices/sessionStatsSlice';
import { clearFilterArgs } from '@/shared/store/slices/filterArgumentSlice';
import { historyController } from '@/services/historyService/historyController';
import type { HistorySnapshot } from '@/services/historyService/types';
import { hydrateFromSnapshot } from '@/services/historyService/snapshotHydrator';
import type { AppDispatch } from '@/shared/store';

export type DataSourceMode = 'live' | 'history';

const getInitialMode = (): DataSourceMode => {
  const params = new URLSearchParams(window.location.search);
  return params.get('mode') === 'history' ? 'history' : 'live';
};

interface DataSourceContextValue {
  mode: DataSourceMode;
  switchToLive: () => void;
  switchToHistory: (snapshot: HistorySnapshot) => void;
  loadHistory: (snapshotFile: File, eventsFile: File) => Promise<void>;
}

const DataSourceContext = createContext<DataSourceContextValue>({
  mode: 'live',
  switchToLive: () => {},
  switchToHistory: () => {},
  loadHistory: async () => {},
});

export function DataSourceProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const dispatch = useDispatch<AppDispatch>();
  const [mode, setMode] = useState<DataSourceMode>(getInitialMode);

  const switchToHistory = useCallback(
    (snapshot: HistorySnapshot) => {
      hydrateFromSnapshot(snapshot, dispatch);
      setMode('history');
    },
    [dispatch],
  );

  const loadHistory = useCallback(
    async (snapshotFile: File, eventsFile: File) => {
      await historyController.load(snapshotFile, eventsFile, dispatch);
      setMode('history');
    },
    [dispatch],
  );

  const switchToLive = useCallback(() => {
    historyController.stop();
    dispatch(clearGraph());
    dispatch(clearSessionDetails());
    dispatch(clearFilterPids());
    dispatch(clearFilterArgs());
    setMode('live');
  }, [dispatch]);

  return (
    <DataSourceContext.Provider
      value={{ mode, switchToLive, switchToHistory, loadHistory }}
    >
      {children}
    </DataSourceContext.Provider>
  );
}

export const useDataSource = () => useContext(DataSourceContext);
