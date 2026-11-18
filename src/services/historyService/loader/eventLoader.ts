import type { HistoryEvent, LogEvent } from '../types';

function parseJsonlLines(text: string): unknown[] {
  const values: unknown[] = [];

  for (const line of text.split('\n')) {
    const trimmed = line.trim();
    if (!trimmed) continue;
    try {
      values.push(JSON.parse(trimmed));
    } catch {
      console.warn(
        '[EventLoader] Skipping malformed line:',
        trimmed.slice(0, 120),
      );
    }
  }

  return values;
}

function isLogEvent(value: unknown): value is LogEvent {
  if (typeof value !== 'object' || value === null) return false;
  const event = value as Record<string, unknown>;
  if (event.message === 'log_batch') return Array.isArray(event.logs);
  if (event.message === 'log_config_changed')
    return typeof event.logLevel === 'string';
  return false;
}

/** Parse JSONL text into HistoryEvent array. */
export function parseEventsJsonl(text: string): HistoryEvent[] {
  return parseJsonlLines(text) as HistoryEvent[];
}

export function parseLogEventsJsonl(text: string): LogEvent[] {
  const values = parseJsonlLines(text);
  const events = values.filter(isLogEvent);
  if (events.length < values.length) {
    console.warn(
      `[EventLoader] Skipping ${values.length - events.length} invalid log line(s)`,
    );
  }
  return events;
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
