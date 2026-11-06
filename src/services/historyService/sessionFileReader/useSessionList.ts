import { useState, useEffect } from 'react';
import { WsSessionFileReader } from './WsSessionFileReader';
import type { SessionInfo } from './types';
import {
  classifySessionListFailure,
  type SessionListFailure,
} from '@/utils/history/sessionListFailure';

interface UseSessionListResult {
  sessions: SessionInfo[];
  loading: boolean;
  failure: SessionListFailure | null;
  browser: WsSessionFileReader | null;
  retry: () => void;
}

export function useSessionList(
  address: string | undefined,
): UseSessionListResult {
  const [sessions, setSessions] = useState<SessionInfo[]>([]);
  const [loading, setLoading] = useState(false);
  const [failure, setFailure] = useState<SessionListFailure | null>(null);
  const [browser, setBrowser] = useState<WsSessionFileReader | null>(null);
  const [tick, setTick] = useState(0);

  useEffect(() => {
    if (!address) return;

    const wsReader = new WsSessionFileReader(address);
    setBrowser(wsReader);
    setLoading(true);
    setFailure(null);
    setSessions([]);

    wsReader
      .listSessions()
      .then(setSessions)
      .catch((reason: unknown) =>
        setFailure(classifySessionListFailure(reason)),
      )
      .finally(() => setLoading(false));

    return () => {
      wsReader.disconnect();
      setBrowser(null);
    };
  }, [address, tick]);

  const retry = () => setTick((tick) => tick + 1);

  return { sessions, loading, failure, browser, retry };
}
