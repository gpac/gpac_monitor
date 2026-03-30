import type { HistorySnapshot, HistoryEvent } from '../types';
import type { SessionInfo } from '../sessionFileReader/types';

/** Session metadata — available without loading all events. */
export interface HistoryMetadata {
  sessionId: string;
  startUs: number;
  endUs: number;
  hasChunks: boolean;
  hasCheckpoints: boolean;
}

/** Per-session data source (player side). */
export interface HistorySource {
  readonly sessionId: string;
  loadSnapshot(): Promise<HistorySnapshot>;
  /** Naive: loads all events, filters locally. Range queries come in later phases. */
  loadEventsRange(fromUs?: number, toUs?: number): Promise<HistoryEvent[]>;
  getMetadata(): Promise<HistoryMetadata>;
}

/** Session listing (UI picker side) — separate concern from HistorySource. */
export interface SessionBrowser {
  listSessions(): Promise<SessionInfo[]>;
}
