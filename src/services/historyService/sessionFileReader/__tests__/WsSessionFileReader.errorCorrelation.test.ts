import { afterEach, describe, expect, it, vi } from 'vitest';
import { WsSessionFileReader } from '../WsSessionFileReader';

type ServerReply = (
  request: Record<string, unknown>,
) => Record<string, unknown>;

function stubServer(reply: ServerReply): void {
  class FakeSocket {
    static OPEN = 1;
    readyState = 1;
    onopen?: () => void;
    onmessage?: (event: { data: string }) => void;
    onclose?: () => void;
    constructor() {
      queueMicrotask(() => this.onopen?.());
    }
    send(requestText: string): void {
      const request = JSON.parse(requestText.slice('json:'.length));
      const response = JSON.stringify(reply(request));
      queueMicrotask(() => this.onmessage?.({ data: response }));
    }
    close(): void {
      this.readyState = 3;
      this.onclose?.();
    }
  }
  vi.stubGlobal('WebSocket', FakeSocket);
}

const sessionId = '2026-01-01_00-00-00';
const legacyIndex = { baseTsUs: 12, tsDeltaUs: [0], types: [1] };

const legacyServerFiles: Record<string, string> = {
  'journal_index.json': JSON.stringify(legacyIndex),
  'manifest.json': JSON.stringify({
    version: 1,
    startUs: 0,
    endUs: 10,
    chunkDurationUs: 10,
    chunkCount: 1,
  }),
};

function legacyServerReply(request: Record<string, unknown>) {
  const content = legacyServerFiles[request.file as string];
  if (content !== undefined) {
    return {
      command: 'read_file',
      status: 'ok',
      sessionId: request.sessionId,
      file: request.file,
      content,
    };
  }
  return { command: 'read_file', status: 'error', error: 'file_not_allowed' };
}

describe('WsSessionFileReader read_file error correlation', () => {
  let reader: WsSessionFileReader | undefined;

  afterEach(() => {
    reader?.disconnect();
    vi.unstubAllGlobals();
  });

  it('legacy server error without identity resolves the session index to null', async () => {
    stubServer(legacyServerReply);
    reader = new WsSessionFileReader('ws://test');
    await expect(reader.readSessionIndex(sessionId)).resolves.toBeNull();
  });

  it('legacy server error without identity reaches the legacy journal index', async () => {
    stubServer(legacyServerReply);
    reader = new WsSessionFileReader('ws://test');
    await expect(reader.readJournalIndex(sessionId)).resolves.toEqual(
      legacyIndex,
    );
  });

  it('concurrent reads keep their own outcome with uncorrelated errors', async () => {
    stubServer(legacyServerReply);
    reader = new WsSessionFileReader('ws://test');
    await reader.connect();
    const [sessionIndex, journalIndex, manifest] = await Promise.all([
      reader.readSessionIndex(sessionId),
      reader.readJournalIndex(sessionId),
      reader.readManifest(sessionId),
    ]);
    expect(sessionIndex).toBeNull();
    expect(journalIndex).toEqual(legacyIndex);
    expect(manifest).toMatchObject({ startUs: 0, endUs: 10 });
  });

  it('correlated error rejects the matching read', async () => {
    stubServer((request) => ({
      command: 'read_file',
      status: 'error',
      sessionId: request.sessionId,
      file: request.file,
      error: 'file_not_found',
    }));
    reader = new WsSessionFileReader('ws://test');
    await expect(reader.readSnapshot(sessionId)).rejects.toThrow(
      'file_not_found',
    );
  });
});

describe('WsSessionFileReader read_file response without content', () => {
  afterEach(() => vi.unstubAllGlobals());

  it('rejects the chunk read with the file name instead of a parser TypeError', async () => {
    stubServer((request) => ({
      command: 'read_file',
      status: 'ok',
      sessionId: request.sessionId,
      file: request.file,
    }));
    const reader = new WsSessionFileReader('ws://test');
    await expect(reader.readChunk(sessionId, 3)).rejects.toThrow(
      'read_file response without content: chunks/chunk_0003.jsonl',
    );
    reader.disconnect();
  });
});

describe('WsSessionFileReader list_sessions response', () => {
  afterEach(() => vi.unstubAllGlobals());

  it('rejects a list whose entry has no sessionId', async () => {
    stubServer(() => ({
      command: 'list_sessions',
      status: 'ok',
      sessions: [{ sessionId }, { isComplete: true }],
    }));
    const reader = new WsSessionFileReader('ws://test');
    await expect(reader.listSessions()).rejects.toThrow(
      'list_sessions response without valid sessions',
    );
    reader.disconnect();
  });
});
