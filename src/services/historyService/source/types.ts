import type { HistorySnapshot, HistoryEvent, LogEvent } from '../types';
import type { SessionInfo } from '../sessionFileReader/types';

/** Base chunk — shared by event and log chunks. */
export interface HistoryManifestChunk {
  file: string;
  fromUs: number;
  toUs: number;
  count: number;
}

/** Event chunk — indexed, fixed duration, pilots the player. */
export interface HistoryManifestEventChunk extends HistoryManifestChunk {
  index: number;
  hasCheckpoint: boolean;
}

/** Checkpoint attached to an event chunk. */
export interface HistoryManifestCheckpoint {
  chunkIndex: number; // array position in eventChunks
  file: string;
}

export interface HistoryManifest {
  version: number;
  startUs: number;
  endUs: number;
  /** Log chunks — non-indexed, rotation by duration or size. */
  logChunks?: HistoryManifestChunk[];
  /** Checkpoints attached to eventChunks only. */
  checkpoints?: HistoryManifestCheckpoint[];
  /** Fixed-duration mode: chunk duration in microseconds. */
  chunkDurationUs: number;
  /** total number of event chunks. */
  chunkCount: number;
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
  loadLogs(fromUs?: number, toUs?: number): Promise<LogEvent[]>;
  getMetadata(): Promise<HistoryMetadata>;
}

/** Session listing (UI picker side)  */
export interface SessionBrowser {
  listSessions(): Promise<SessionInfo[]>;
}
