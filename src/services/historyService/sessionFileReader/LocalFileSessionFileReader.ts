import type { HistorySnapshot, LogEvent } from '../types';
import type { SessionInfo } from './types';
import type { HistoryManifest } from '../source/types';
import { parseEventsJsonl, MAX_EVENTS } from '../loader/eventLoader';

interface SessionEntry {
  snapshot?: File;
  events?: File;
  manifest?: File;
  chunks: Map<number, File>;
  logChunks: Map<number, File>;
  done: boolean;
}

export class LocalFileSessionFileReader {
  wasTruncated = false;
  private sessionMap = new Map<string, SessionEntry>();

  constructor(files: File[]) {
    for (const file of files) {
      const parts = file.webkitRelativePath.split('/');
      if (parts.length < 2) continue;

      const fileName = parts[parts.length - 1];
      const parentFolder = parts[parts.length - 2];

      if (parentFolder === 'chunks') {
        if (parts.length < 3) continue;
        const sessionId = parts[parts.length - 3];
        const chunkMatch = fileName.match(/^chunk_(\d+)\.jsonl$/);
        if (!chunkMatch) continue;
        const chunkIndex = parseInt(chunkMatch[1], 10);
        if (!this.sessionMap.has(sessionId)) {
          this.sessionMap.set(sessionId, { done: false, chunks: new Map(), logChunks: new Map() });
        }
        this.sessionMap.get(sessionId)!.chunks.set(chunkIndex, file);
      } else if (parentFolder === 'logs') {
        if (parts.length < 3) continue;
        const sessionId = parts[parts.length - 3];
        const logMatch = fileName.match(/^logs_(\d+)\.jsonl$/);
        if (!logMatch) continue;
        const logIndex = parseInt(logMatch[1], 10);
        if (!this.sessionMap.has(sessionId)) {
          this.sessionMap.set(sessionId, { done: false, chunks: new Map(), logChunks: new Map() });
        }
        this.sessionMap.get(sessionId)!.logChunks.set(logIndex, file);
      } else {
        const sessionId = parentFolder;
        if (!this.sessionMap.has(sessionId)) {
          this.sessionMap.set(sessionId, { done: false, chunks: new Map(), logChunks: new Map() });
        }
        const entry = this.sessionMap.get(sessionId)!;
        if (fileName === 'snapshot.json') entry.snapshot = file;
        else if (fileName === 'events.jsonl') entry.events = file;
        else if (fileName === 'manifest.json') entry.manifest = file;
        else if (fileName === 'done') entry.done = true;
      }
    }
  }

  async listSessions(): Promise<SessionInfo[]> {
    const sessions = Array.from(this.sessionMap.entries())
      .sort(([a], [b]) => Number(b) - Number(a))
      .map(([sessionId, entry]) => ({
        sessionId,
        hasSnapshot: !!entry.snapshot,
        hasEvents: !!entry.events,
        hasManifest: !!entry.manifest,
        sizeBytes: (entry.snapshot?.size ?? 0) + (entry.events?.size ?? 0),
        isComplete: entry.done,
      }));
    console.log('[LocalFileSessionFileReader.listSessions]', sessions.map(s => `${s.sessionId}: snapshot=${s.hasSnapshot} events=${s.hasEvents} manifest=${s.hasManifest} complete=${s.isComplete}`));
    return sessions;
  }

  async readSnapshot(sessionId: string): Promise<HistorySnapshot> {
    const file = this.sessionMap.get(sessionId)?.snapshot;
    if (!file) throw new Error(`No snapshot for session ${sessionId}`);
    return JSON.parse(await file.text()) as HistorySnapshot;
  }

  async readManifest(sessionId: string): Promise<HistoryManifest | null> {
    const file = this.sessionMap.get(sessionId)?.manifest;
    if (!file) return null;
    return JSON.parse(await file.text()) as HistoryManifest;
  }

  async readChunk(sessionId: string, chunkIndex: number) {
    const file = this.sessionMap.get(sessionId)?.chunks.get(chunkIndex);
    if (!file) return [];
    return parseEventsJsonl(await file.text());
  }

  async readLogChunk(sessionId: string, chunkIndex: number): Promise<LogEvent[]> {
    const entry = this.sessionMap.get(sessionId);
    const file = entry?.logChunks.get(chunkIndex);
    console.log('[LocalFileSessionFileReader.readLogChunk] session:', sessionId, 'chunkIndex:', chunkIndex, 'file:', file?.name ?? 'NOT FOUND', 'available logChunks:', entry ? [...entry.logChunks.keys()] : 'no entry');
    if (!file) return [];
    return parseEventsJsonl(await file.text()) as unknown as LogEvent[];
  }

  async readEvents(sessionId: string) {
    const file = this.sessionMap.get(sessionId)?.events;
    if (!file) throw new Error(`No events for session ${sessionId}`);
    const events = parseEventsJsonl(await file.text());
    this.wasTruncated = events.length >= MAX_EVENTS;
    return events;
  }
}
