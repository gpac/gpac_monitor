import type { HistorySnapshot, HistoryEvent, LogEvent } from '../types';
import type { HistorySource, HistoryManifest } from './types';
import { WsSessionFileReader } from '../sessionFileReader/WsSessionFileReader';
import { chunkIndexFromPath } from './chunkUtils';
import { findEventChunkIndex } from '../manifestParser';

/**
 * Wraps WsSessionFileReader for a specific session.
 * Reads manifest for metadata, loads only relevant chunks individually.
 */
export class RemoteHistorySource implements HistorySource {
  private cachedManifest: HistoryManifest | null | undefined = undefined;
  private manifestPromise: Promise<HistoryManifest | null> | null = null;

  constructor(
    private reader: WsSessionFileReader,
    readonly sessionId: string,
  ) {}

  async loadSnapshot(): Promise<HistorySnapshot> {
    return this.reader.readSnapshot(this.sessionId);
  }

  async loadLogs(fromUs?: number, toUs?: number): Promise<LogEvent[]> {
    const manifest = await this.loadManifest();
    if (!manifest?.logChunks?.length) return [];
    return this.loadLogsFromChunks(manifest, fromUs, toUs);
  }

  async loadEventsRange(
    fromUs?: number,
    toUs?: number,
  ): Promise<HistoryEvent[]> {
    const manifest = await this.loadManifest();
    if (!manifest) return [];

    return this.loadEventsFromChunks(manifest, fromUs, toUs);
  }

  getManifest(): Promise<HistoryManifest | null> {
    return this.loadManifest();
  }

  async readChunk(sessionId: string, index: number): Promise<HistoryEvent[]> {
    return this.reader.readChunk(sessionId, index);
  }

  async readLogChunk(sessionId: string, index: number): Promise<LogEvent[]> {
    return this.reader.readLogChunk(sessionId, index);
  }

  private loadManifest(): Promise<HistoryManifest | null> {
    if (this.cachedManifest !== undefined)
      return Promise.resolve(this.cachedManifest);
    if (!this.manifestPromise) {
      this.manifestPromise = this.reader
        .readManifest(this.sessionId)
        .then((manifest) => {
          this.cachedManifest = manifest;
          return manifest;
        });
    }
    return this.manifestPromise;
  }

  private async loadLogsFromChunks(
    manifest: HistoryManifest,
    fromUs?: number,
    toUs?: number,
  ): Promise<LogEvent[]> {
    const relevantChunks = manifest.logChunks!.filter(
      (chunk) =>
        (toUs === undefined || chunk.fromUs <= toUs) &&
        (fromUs === undefined || chunk.toUs >= fromUs),
    );

    const chunkResults = await Promise.all(
      relevantChunks.map((chunk) =>
        this.reader.readLogChunk(
          this.sessionId,
          chunkIndexFromPath(chunk.file),
        ),
      ),
    );

    return chunkResults
      .flat()
      .filter(
        (log) =>
          (fromUs === undefined || log.ts_us >= fromUs) &&
          (toUs === undefined || log.ts_us <= toUs),
      );
  }

  private async loadEventsFromChunks(
    manifest: HistoryManifest,
    fromUs?: number,
    toUs?: number,
  ): Promise<HistoryEvent[]> {
    const firstIndex =
      fromUs !== undefined ? findEventChunkIndex(manifest, fromUs) : 0;
    const lastIndex =
      toUs !== undefined
        ? findEventChunkIndex(manifest, toUs)
        : manifest.chunkCount - 1;
    const indices = Array.from(
      { length: lastIndex - firstIndex + 1 },
      (_, i) => firstIndex + i,
    );

    const chunkResults = await Promise.all(
      indices.map((index) => this.reader.readChunk(this.sessionId, index)),
    );

    return chunkResults
      .flat()
      .filter(
        (event) =>
          (fromUs === undefined || event.ts_us >= fromUs) &&
          (toUs === undefined || event.ts_us <= toUs),
      );
  }
}
