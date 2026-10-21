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
  'manifest.json': '{}',
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
    const [sessionIndex, , journalIndex] = await Promise.all([
      reader.readSessionIndex(sessionId),
      reader.readManifest(sessionId),
      reader.readJournalIndex(sessionId),
    ]);
    expect(sessionIndex).toBeNull();
    expect(journalIndex).toEqual(legacyIndex);
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
