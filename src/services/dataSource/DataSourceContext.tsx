import React, { createContext, useContext, useState, useCallback } from 'react';
import { useDispatch } from 'react-redux';
import { clearGraph } from '@/shared/store/slices/graphSlice';
import { clearSessionDetails } from '@/shared/store/slices/sessionDetailsSlice';
import { clearFilterPids } from '@/shared/store/slices/sessionStatsSlice';
import { clearFilterArgs } from '@/shared/store/slices/filterArgumentSlice';
import { historyController } from '@/services/historyService/historyController';
import type { HistorySnapshot } from '@/services/historyService/types';
import { hydrateFromSnapshot } from '@/services/historyService/loader/snapshotHydrator';
import type { AppDispatch } from '@/shared/store';
import type { SessionFileReader } from '@/services/historyService/sessionFileReader';

export type DataSourceMode = 'live' | 'history';

const getInitialMode = (): DataSourceMode => {
  const params = new URLSearchParams(window.location.search);
  return params.get('mode') === 'history' ? 'history' : 'live';
};

interface DataSourceContextValue {
  mode: DataSourceMode;
  sessionLoaded: boolean;
  switchToLive: () => void;
  switchToHistory: (snapshot: HistorySnapshot) => void;
  loadHistory: (snapshotFile: File, eventsFile: File) => Promise<void>;
  loadFromReader: (reader: SessionFileReader, sessionId: string) => Promise<void>;
}

const DataSourceContext = createContext<DataSourceContextValue>({
  mode: 'live',
  sessionLoaded: false,
  switchToLive: () => {},
  switchToHistory: () => {},
  loadHistory: async () => {},
  loadFromReader: async () => {},
});

export function DataSourceProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const dispatch = useDispatch<AppDispatch>();
  const [mode, setMode] = useState<DataSourceMode>(getInitialMode);
  const [sessionLoaded, setSessionLoaded] = useState(false);

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
      setSessionLoaded(true);
      setMode('history');
    },
    [dispatch],
  );

  const loadFromReader = useCallback(
    async (reader: SessionFileReader, sessionId: string) => {
      await historyController.loadFromReader(reader, sessionId, dispatch);
      setSessionLoaded(true);
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
    setSessionLoaded(false);
    setMode('live');
  }, [dispatch]);

  return (
    <DataSourceContext.Provider
      value={{ mode, sessionLoaded, switchToLive, switchToHistory, loadHistory, loadFromReader }}
    >
      {children}
    </DataSourceContext.Provider>
  );
}

export const useDataSource = () => useContext(DataSourceContext);
