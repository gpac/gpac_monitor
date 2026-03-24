import type { HistorySnapshot, HistoryEvent } from '../types';

export interface SessionInfo {
  sessionId: string;
  hasSnapshot: boolean;
  hasEvents: boolean;
  sizeBytes: number;
}

export interface SessionFileReader {
  listSessions(): Promise<SessionInfo[]>;
  readSnapshot(sessionId: string): Promise<HistorySnapshot>;
  readEvents(sessionId: string): Promise<HistoryEvent[]>;
}
