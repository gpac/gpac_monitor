import type { HistorySnapshot, HistoryEvent } from '../types';
import type { HistorySource, HistoryMetadata } from './types';
import { WsSessionFileReader } from '../sessionFileReader/WsSessionFileReader';

/**
 * Wraps WsSessionFileReader for a specific session.
 *  Reads persisted history files via WS.
 */
export class RemoteHistorySource implements HistorySource {
  constructor(
    private reader: WsSessionFileReader,
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
    const allEvents = await this.reader.readEvents(this.sessionId);
    if (fromUs === undefined && toUs === undefined) return allEvents;
    return allEvents.filter(
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
}
