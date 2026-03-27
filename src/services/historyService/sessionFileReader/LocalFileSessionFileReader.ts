import type { HistorySnapshot } from '../types';
import type { SessionFileReader, SessionInfo } from './types';
import { parseEventsJsonl, MAX_EVENTS } from '../loader/eventLoader';

interface SessionEntry {
  snapshot?: File;
  events?: File;
  done: boolean;
}

/**
 * LocalFileSessionFileReader — implements SessionFileReader via File API.
 *
 * Accepts a FileList from <input webkitdirectory> and parses it into sessions
 * using webkitRelativePath .
 */
export class LocalFileSessionFileReader implements SessionFileReader {
  wasTruncated = false;
  private sessionMap = new Map<string, SessionEntry>();

  constructor(files: File[]) {
    for (const file of files) {
      const parts = file.webkitRelativePath.split('/');
      // Need at least: <sessionId>/<filename>
      if (parts.length < 2) continue;
      const sessionId = parts[parts.length - 2];
      const name = parts[parts.length - 1];

      if (!this.sessionMap.has(sessionId)) {
        this.sessionMap.set(sessionId, { done: false });
      }
      const entry = this.sessionMap.get(sessionId)!;
      if (name === 'snapshot.json') entry.snapshot = file;
      else if (name === 'events.jsonl') entry.events = file;
      else if (name === 'done') entry.done = true;
    }
  }

  async listSessions(): Promise<SessionInfo[]> {
    return Array.from(this.sessionMap.entries())
      .sort(([a], [b]) => Number(b) - Number(a)) // newest first
      .map(([sessionId, entry]) => ({
        sessionId,
        hasSnapshot: !!entry.snapshot,
        hasEvents: !!entry.events,
        sizeBytes: (entry.snapshot?.size ?? 0) + (entry.events?.size ?? 0),
        isComplete: entry.done,
      }));
  }

  async readSnapshot(sessionId: string): Promise<HistorySnapshot> {
    const file = this.sessionMap.get(sessionId)?.snapshot;
    if (!file) throw new Error(`No snapshot for session ${sessionId}`);
    return JSON.parse(await file.text()) as HistorySnapshot;
  }

  async readEvents(sessionId: string) {
    const file = this.sessionMap.get(sessionId)?.events;
    if (!file) throw new Error(`No events for session ${sessionId}`);
    const events = parseEventsJsonl(await file.text());
    this.wasTruncated = events.length >= MAX_EVENTS;
    return events;
  }
}
