import type { HistorySnapshot, HistoryEvent, LogEvent } from '../types';
import type { HistorySource, HistoryMetadata, HistoryManifest } from './types';
import { WsSessionFileReader } from '../sessionFileReader/WsSessionFileReader';
import { chunkIndexFromPath } from './chunkUtils';

/**
 * Wraps WsSessionFileReader for a specific session.
 * Reads manifest for metadata, loads only relevant chunks individually.
 */
export class RemoteHistorySource implements HistorySource {
  private cachedManifest: HistoryManifest | null | undefined = undefined;

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

  async getMetadata(): Promise<HistoryMetadata> {
    const manifest = await this.loadManifest();

    if (manifest) {
      return {
        sessionId: this.sessionId,
        startUs: manifest.startUs,
        endUs: manifest.endUs,
        hasChunks: true,
        hasCheckpoints: false,
      };
    }

    const snapshot = await this.loadSnapshot();
    return {
      sessionId: this.sessionId,
      startUs: snapshot.ts_us,
      endUs: snapshot.ts_us,
      hasChunks: false,
      hasCheckpoints: false,
    };
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
    const relevantChunks = manifest.chunks.filter(
      (chunk) =>
        (toUs === undefined || chunk.fromUs <= toUs) &&
        (fromUs === undefined || chunk.toUs >= fromUs),
    );

    const chunkResults = await Promise.all(
      relevantChunks.map((chunk) =>
        this.reader.readChunk(this.sessionId, chunkIndexFromPath(chunk.file)),
      ),
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
