import type { HistoryEvent, LogEvent } from './types';
import type { HistoryManifest, HistoryManifestChunk } from './source/types';
import { findLogChunksInRange, getEventChunkRange } from './manifestParser';
import { chunkIndexFromPath } from './source/chunkUtils';

export interface IChunkReader {
  readChunk(sessionId: string, index: number): Promise<HistoryEvent[]>;
  readLogChunk(sessionId: string, index: number): Promise<LogEvent[]>;
}

export type EventChunk = {
  index: number;
  fromUs: number;
  toUs: number;
  events: HistoryEvent[];
};

export type LogChunk = {
  fromUs: number;
  toUs: number;
  logs: LogEvent[];
};

const MAX_LOG_CHUNKS = 10;

export class ChunkLoader {
  // Events: 2 slots (current + next). Purged on each load.
  private eventCache = new Map<number, EventChunk>();
  // Logs: keyed by file path. Purged when exceeding MAX_LOG_CHUNKS or via clearCache().
  private logCache = new Map<string, LogChunk>();

  constructor(
    private readonly reader: IChunkReader,
    private readonly sessionId: string,
    private readonly manifest: HistoryManifest,
  ) {}

  async loadEventChunk(position: number): Promise<EventChunk> {
    const cached = this.eventCache.get(position);
    if (cached) return cached;

    if (position < 0 || position >= this.manifest.chunkCount) {
      throw new Error(`[ChunkLoader] no eventChunk at position ${position}`);
    }

    const { fromUs, toUs } = getEventChunkRange(this.manifest, position);
    const events = await this.reader.readChunk(this.sessionId, position);
    const chunk: EventChunk = { index: position, fromUs, toUs, events };

    this.eventCache.set(position, chunk);
    this.purgeEventCache(position);

    return chunk;
  }

  async preloadEventChunk(position: number): Promise<void> {
    if (this.eventCache.has(position)) return;
    if (position < 0 || position >= this.manifest.chunkCount) return;
    try {
      await this.loadEventChunk(position);
    } catch (error) {
      console.warn('[ChunkLoader] preloadEventChunk failed:', error);
    }
  }

  async loadLogChunksInRange(
    fromUs: number,
    toUs: number,
  ): Promise<LogChunk[]> {
    const entries = findLogChunksInRange(this.manifest, fromUs, toUs);
    return Promise.all(entries.map((entry) => this.loadLogChunk(entry)));
  }

  clearCache(): void {
    this.eventCache.clear();
    this.logCache.clear();
  }

  // --- private ---

  private async loadLogChunk(entry: HistoryManifestChunk): Promise<LogChunk> {
    const cached = this.logCache.get(entry.file);
    if (cached) return cached;

    const logIndex = chunkIndexFromPath(entry.file);
    const logs = await this.reader.readLogChunk(this.sessionId, logIndex);
    const chunk: LogChunk = { fromUs: entry.fromUs, toUs: entry.toUs, logs };

    this.logCache.set(entry.file, chunk);
    this.purgeLogCache();

    return chunk;
  }

  /** Keep only current position and next (position + 1) in event cache. */
  private purgeEventCache(currentPosition: number): void {
    for (const key of this.eventCache.keys()) {
      if (key !== currentPosition && key !== currentPosition + 1) {
        this.eventCache.delete(key);
      }
    }
  }

  /** Delete oldest entry when log cache exceeds MAX_LOG_CHUNKS. */
  private purgeLogCache(): void {
    if (this.logCache.size > MAX_LOG_CHUNKS) {
      const oldest = this.logCache.keys().next().value;
      if (oldest !== undefined) this.logCache.delete(oldest);
    }
  }
}
