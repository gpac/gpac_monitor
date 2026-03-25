import { useState, useEffect } from 'react';
import { WsSessionFileReader } from './WsSessionFileReader';
import type { SessionInfo } from './types';

interface UseSessionListResult {
  sessions: SessionInfo[];
  loading: boolean;
  error: string | null;
  reader: WsSessionFileReader | null;
  retry: () => void;
}

export function useSessionList(address: string | undefined): UseSessionListResult {
  const [sessions, setSessions] = useState<SessionInfo[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [reader, setReader] = useState<WsSessionFileReader | null>(null);
  const [tick, setTick] = useState(0);

  useEffect(() => {
    if (!address) return;

    const wsReader = new WsSessionFileReader(address);
    setReader(wsReader);
    setLoading(true);
    setError(null);
    setSessions([]);

    wsReader
      .listSessions()
      .then(setSessions)
      .catch((err: Error) => setError(err.message ?? 'Connection failed'))
      .finally(() => setLoading(false));

    return () => {
      wsReader.disconnect();
      setReader(null);
    };
  }, [address, tick]);

  const retry = () => setTick((t) => t + 1);

  return { sessions, loading, error, reader, retry };
}
