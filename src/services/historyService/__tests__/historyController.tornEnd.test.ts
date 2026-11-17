import { describe, it, expect, vi } from 'vitest';
import { HistoryController } from '../historyController';
import { parseEventsJsonl } from '../loader/eventLoader';
import { findEventChunkIndex } from '../manifestParser';
import type {
  HistorySource,
  HistoryManifest,
  HistorySessionIndex,
} from '../source/types';

const SESSION_START_US = 45_075;
const MANIFEST_END_US = 62_078_659;
const LAST_COMPLETE_EVENT_US = 67_583_341;

const sessionIndex: HistorySessionIndex = {
  version: 1,
  startUs: SESSION_START_US,
  segmentDurationUs: 86_400_000_000,
  retentionMaxSegments: 30,
  segments: [{ index: 0, fromUs: SESSION_START_US }],
};

const manifest: HistoryManifest = {
  version: 1,
  startUs: SESSION_START_US,
  endUs: MANIFEST_END_US,
  chunkDurationUs: 10_000_000,
  chunkCount: 7,
  eventChunks: Array.from({ length: 6 }, (_, index) => ({
    file: `chunks/chunk_000${index}.jsonl`,
    fromUs: SESSION_START_US + index * 10_000_000,
    toUs: SESSION_START_US + (index + 1) * 10_000_000,
    count: 19,
  })),
};

const openChunkText = [
  '{"message":"session_stats","ts_us":62578771,"all_packets_done":false,"stats":[]}',
  '{"message":"session_stats","ts_us":67583341,"all_packets_done":false,"stats":[]}',
  '{"message":"session_stats","ts_us":68582930,"all_packets_done":false,"stats":[{"idx":0,"status":"Fra',
].join('\n');

function makeTornSource(readChunk: HistorySource['readChunk']): HistorySource {
  return {
    sessionId: 'torn-session',
    getManifest: vi.fn(),
    loadSnapshot: vi.fn(),
    loadJournalIndex: vi.fn().mockResolvedValue(null),
    getSessionIndex: vi.fn().mockResolvedValue(sessionIndex),
    getSegmentManifest: vi.fn().mockResolvedValue(manifest),
    loadSegmentSnapshot: vi.fn().mockResolvedValue({
      ts_us: SESSION_START_US,
      command_line: null,
      graph_v: 1,
      filters: [],
    }),
    loadGlobalEventsIndex: vi.fn().mockResolvedValue(null),
    readChunk,
    readLogChunk: vi.fn(),
    readCheckpoint: vi.fn(),
  };
}

describe('HistoryController.load — session killed mid-chunk', () => {
  it('ends at the last complete event of the open chunk, not the manifest end', async () => {
    const controller = new HistoryController();
    const readChunk = vi.fn().mockResolvedValue(parseEventsJsonl(openChunkText));

    await controller.load(makeTornSource(readChunk), vi.fn() as any);

    expect(readChunk).toHaveBeenCalledWith(6, 'segments/0000');
    expect(controller.durationUs()).toBe(LAST_COMPLETE_EVENT_US - SESSION_START_US);
  });

  it('keeps the manifest end when the open chunk cannot be read', async () => {
    const controller = new HistoryController();
    const readChunk = vi.fn().mockRejectedValue(new Error('missing chunk'));

    await controller.load(makeTornSource(readChunk), vi.fn() as any);

    expect(controller.durationUs()).toBe(MANIFEST_END_US - SESSION_START_US);
  });
});

describe('findEventChunkIndex — session killed mid-chunk', () => {
  it('points past the last listed chunk to the open chunk', () => {
    expect(findEventChunkIndex(manifest, LAST_COMPLETE_EVENT_US)).toBe(6);
  });

  it('keeps a listed chunk for a timestamp inside it', () => {
    expect(findEventChunkIndex(manifest, SESSION_START_US + 55_000_000)).toBe(5);
  });
});
