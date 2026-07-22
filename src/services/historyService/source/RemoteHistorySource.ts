import type {
  HistorySnapshot,
  HistoryEvent,
  LogEvent,
  JournalIndex,
} from '../types';
import type { HistorySource, HistoryManifest } from './types';
import { WsSessionFileReader } from '../sessionFileReader/WsSessionFileReader';

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

  getManifest(): Promise<HistoryManifest | null> {
    return this.loadManifest();
  }

  async readChunk(index: number): Promise<HistoryEvent[]> {
    return this.reader.readChunk(this.sessionId, index);
  }

  async readLogChunk(index: number): Promise<LogEvent[]> {
    return this.reader.readLogChunk(this.sessionId, index);
  }

  async readCheckpoint(chunkIndex: number): Promise<unknown> {
    return this.reader.readCheckpoint(this.sessionId, chunkIndex);
  }

  async loadJournalIndex(): Promise<JournalIndex | null> {
    return this.reader.readJournalIndex(this.sessionId);
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
}
