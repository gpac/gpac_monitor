import type { HistorySnapshot, HistoryEvent, LogEvent } from '../types';
import type { HistorySource, HistoryMetadata, HistoryManifest } from './types';
import { LocalFileSessionFileReader } from '../sessionFileReader/LocalFileSessionFileReader';
import { chunkIndexFromPath } from './chunkUtils';

export class FileHistorySource implements HistorySource {
  private cachedEvents: HistoryEvent[] | null = null;
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
    console.log('[FileHistorySource.loadLogs] manifest:', manifest ? `chunks=${manifest.chunks.length} logChunks=${manifest.logChunks?.length ?? 0}` : 'null');
    if (!manifest?.logChunks?.length) return [];
    return this.loadLogsFromChunks(manifest, fromUs, toUs);
  }

  async loadEventsRange(
    fromUs?: number,
    toUs?: number,
  ): Promise<HistoryEvent[]> {
    const manifest = await this.loadManifest();

    if (manifest) {
      return this.loadEventsFromChunks(manifest, fromUs, toUs);
    }

    if (!this.cachedEvents) {
      this.cachedEvents = await this.reader.readEvents(this.sessionId);
    }
    if (fromUs === undefined && toUs === undefined) return this.cachedEvents;
    return this.cachedEvents.filter(
      (event) =>
        (fromUs === undefined || event.ts_us >= fromUs) &&
        (toUs === undefined || event.ts_us <= toUs),
    );
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

    const [snapshot, allEvents] = await Promise.all([
      this.loadSnapshot(),
      this.loadEventsRange(),
    ]);
    return {
      sessionId: this.sessionId,
      startUs: snapshot.ts_us,
      endUs: allEvents.at(-1)?.ts_us ?? snapshot.ts_us,
      hasChunks: false,
      hasCheckpoints: false,
    };
  }

  get wasTruncated(): boolean {
    return this.reader.wasTruncated;
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
    console.log('[FileHistorySource.loadLogsFromChunks] logChunks:', manifest.logChunks!.length, 'fromUs:', fromUs, 'toUs:', toUs);
    const relevantChunks = manifest.logChunks!.filter(
      (chunk) =>
        (toUs === undefined || chunk.fromUs <= toUs) &&
        (fromUs === undefined || chunk.toUs >= fromUs),
    );

    console.log('[FileHistorySource.loadLogsFromChunks] relevant chunks:', relevantChunks.length);
    const chunkResults = await Promise.all(
      relevantChunks.map((chunk) => {
        const idx = chunkIndexFromPath(chunk.file);
        console.log('[FileHistorySource.loadLogsFromChunks] reading chunk', chunk.file, '→ idx', idx);
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
