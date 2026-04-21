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
  chunkDurationUs: number;
  chunkCount: number;
  snapshot?: string;
  logChunks?: HistoryManifestChunk[];
  checkpoints?: HistoryManifestCheckpoint[];
}

/** Low-level chunk I/O — implemented by both File and Remote sources. */
export interface IChunkReader {
  readChunk(sessionId: string, index: number): Promise<HistoryEvent[]>;
  readLogChunk(sessionId: string, index: number): Promise<LogEvent[]>;
}

/** Per-session data source (player side). */
export interface HistorySource extends IChunkReader {
  readonly sessionId: string;
  loadSnapshot(): Promise<HistorySnapshot>;
  getManifest(): Promise<HistoryManifest | null>;
}

/** Session listing (UI picker side)  */
export interface SessionBrowser {
  listSessions(): Promise<SessionInfo[]>;
}
