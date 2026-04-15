import React, { createContext, useContext, useState, useCallback } from 'react';
import { useDispatch } from 'react-redux';
import { clearAllSessionData } from '@/shared/store/actions/globalActions';
import { historyController } from '@/services/historyService/historyController';
import type { AppDispatch } from '@/shared/store';
import type { HistorySource } from '@/services/historyService/source/types';
import { formatTimestamp } from '@/utils/formatting';

export type DataSourceMode = 'live' | 'history';

const getInitialMode = (): DataSourceMode => {
  const params = new URLSearchParams(window.location.search);
  return params.get('mode') === 'history' ? 'history' : 'live';
};

interface DataSourceContextValue {
  mode: DataSourceMode;
  sessionLoaded: boolean;
  sessionName: string | null;
  switchToLive: () => void;
  loadFromSource: (
    source: HistorySource,
    fromUs?: number,
    toUs?: number,
  ) => Promise<void>;
}

const DataSourceContext = createContext<DataSourceContextValue>({
  mode: 'live',
  sessionLoaded: false,
  sessionName: null,
  switchToLive: () => {},
  loadFromSource: async () => {},
});

export function DataSourceProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const dispatch = useDispatch<AppDispatch>();
  const [mode, setMode] = useState<DataSourceMode>(getInitialMode);
  const [sessionLoaded, setSessionLoaded] = useState(false);
  const [sessionName, setSessionName] = useState<string | null>(null);

  const loadFromSource = useCallback(
    async (source: HistorySource, fromUs?: number, toUs?: number) => {
      await historyController.load(source, dispatch, fromUs, toUs);
      setSessionName(formatTimestamp(source.sessionId));
      setSessionLoaded(true);
      setMode('history');
    },
    [dispatch],
  );

  const switchToLive = useCallback(() => {
    historyController.stop();
    dispatch(clearAllSessionData());
    setSessionLoaded(false);
    setSessionName(null);
    setMode('live');
  }, [dispatch]);

  return (
    <DataSourceContext.Provider
      value={{ mode, sessionLoaded, sessionName, switchToLive, loadFromSource }}
    >
      {children}
    </DataSourceContext.Provider>
  );
}

export const useDataSource = () => useContext(DataSourceContext);
