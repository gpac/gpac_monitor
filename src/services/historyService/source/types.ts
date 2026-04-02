import type { HistorySnapshot, HistoryEvent } from '../types';
import type { SessionInfo } from '../sessionFileReader/types';

export interface HistoryManifestChunk {
  file: string;
  fromUs: number;
  toUs: number;
  count: number;
}

export interface HistoryManifest {
  version: number;
  startUs: number;
  endUs: number;
  chunks: HistoryManifestChunk[];
}

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
  loadEventsRange(fromUs?: number, toUs?: number): Promise<HistoryEvent[]>;
  getMetadata(): Promise<HistoryMetadata>;
}

/** Session listing (UI picker side)  */
export interface SessionBrowser {
  listSessions(): Promise<SessionInfo[]>;
}
