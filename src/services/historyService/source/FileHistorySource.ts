import type { HistorySnapshot, HistoryEvent } from '../types';
import type { HistorySource, HistoryMetadata } from './types';
import { LocalFileSessionFileReader } from '../sessionFileReader/LocalFileSessionFileReader';

/**
 * Offline per-session data source.
 * Wraps LocalFileSessionFileReader for a specific session.
 */
export class FileHistorySource implements HistorySource {
  private cachedEvents: HistoryEvent[] | null = null;

  constructor(
    private reader: LocalFileSessionFileReader,
    readonly sessionId: string,
  ) {}

  async loadSnapshot(): Promise<HistorySnapshot> {
    return this.reader.readSnapshot(this.sessionId);
  }

  /** reads all events then filters by range. */
  async loadEventsRange(
    fromUs?: number,
    toUs?: number,
  ): Promise<HistoryEvent[]> {
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
}
