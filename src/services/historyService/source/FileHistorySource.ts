import type { HistorySnapshot, HistoryEvent, LogEvent } from '../types';
import type { HistorySource, HistoryManifest } from './types';
import type { LocalFileSessionFileReader } from '../sessionFileReader/LocalFileSessionFileReader';

export class FileHistorySource implements HistorySource {
  private cachedManifest: HistoryManifest | null | undefined = undefined;

  constructor(
    private reader: LocalFileSessionFileReader,
    readonly sessionId: string,
  ) {}

  async loadSnapshot(): Promise<HistorySnapshot> {
    return this.reader.readSnapshot(this.sessionId);
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

  async readCheckpoint(
    sessionId: string,
    chunkIndex: number,
  ): Promise<unknown> {
    return this.reader.readCheckpoint(sessionId, chunkIndex);
  }

  private async loadManifest(): Promise<HistoryManifest | null> {
    if (this.cachedManifest !== undefined) return this.cachedManifest;
    const manifest = await this.reader.readManifest(this.sessionId);
    this.cachedManifest = manifest;
    return manifest;
  }
}
