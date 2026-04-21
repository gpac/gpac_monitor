import type { HistorySnapshot, HistoryEvent, LogEvent } from '../types';
import type { HistorySource, HistoryManifest } from './types';
import { LocalFileSessionFileReader } from '../sessionFileReader/LocalFileSessionFileReader';
import { chunkIndexFromPath } from './chunkUtils';
import { findEventChunkIndex } from '../manifestParser';

export class FileHistorySource implements HistorySource {
  private cachedManifest: HistoryManifest | null | undefined = undefined;

  constructor(
    private reader: LocalFileSessionFileReader,
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

  async getManifest(): Promise<HistoryManifest | null> {
    return this.loadManifest();
  }

  async readChunk(sessionId: string, index: number): Promise<HistoryEvent[]> {
    return this.reader.readChunk(sessionId, index);
  }

  async readLogChunk(sessionId: string, index: number): Promise<LogEvent[]> {
    return this.reader.readLogChunk(sessionId, index);
  }

  private async loadManifest(): Promise<HistoryManifest | null> {
    if (this.cachedManifest !== undefined) return this.cachedManifest;
    this.cachedManifest = await this.reader.readManifest(this.sessionId);
    return this.cachedManifest;
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
      relevantChunks.map((chunk) => {
        const idx = chunkIndexFromPath(chunk.file);
        return this.reader.readLogChunk(this.sessionId, idx);
      }),
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
