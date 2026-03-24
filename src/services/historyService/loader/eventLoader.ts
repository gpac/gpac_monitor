import type { HistoryEvent } from '../types';

const MAX_EVENTS = 50_000;

/** Parse JSONL text into HistoryEvent array. */
export function parseEventsJsonl(text: string): HistoryEvent[] {
  const events: HistoryEvent[] = [];

  for (const line of text.split('\n')) {
    const trimmed = line.trim();
    if (!trimmed) continue;
    try {
      events.push(JSON.parse(trimmed) as HistoryEvent);
    } catch {
      console.warn('[EventLoader] Skipping malformed line');
    }
    if (events.length >= MAX_EVENTS) break;
  }

  return events;
}

/** Load events from a File object (V2 compat). */
export async function loadEventsFile(file: File): Promise<HistoryEvent[]> {
  return parseEventsJsonl(await file.text());
}

/**
 * Stream events from file chunk by chunk — O(1) memory.
 *
 */
/* export async function* loadEventsStream(
  file: File,
): AsyncGenerator<HistoryEvent> {
  const CHUNK_SIZE = 64 * 1024;
  let offset = 0;
  let remainder = '';

  while (offset < file.size) {
    const chunk = file.slice(offset, offset + CHUNK_SIZE);
    const text = await chunk.text();

    const lines = (remainder + text).split('\n');
    remainder = lines.pop() ?? '';

    for (const line of lines) {
      const trimmed = line.trim();
      if (!trimmed) continue;
      try {
        yield JSON.parse(trimmed) as HistoryEvent;
      } catch {
        console.warn('[EventLoader] Skipping malformed line');
      }
    }

    offset += CHUNK_SIZE;
  }

  if (remainder.trim()) {
    try {
      yield JSON.parse(remainder.trim()) as HistoryEvent;
    } catch {
      console.warn('[EventLoader] Skipping malformed remainder');
    }
  }
}
 */
