import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { WebSocketBase } from '../WebSocketBase';

const { postMessage } = vi.hoisted(() => ({ postMessage: vi.fn() }));

// Unlike WebSocketBase.test.ts, this worker mock succeeds — it exists to
// prove ArrayBuffer messages skip the worker even when one is available.
vi.mock('../workers/wsParserWorker?worker&inline', () => ({
  default: class {
    postMessage = postMessage;
    onmessage: unknown = null;
    onerror: unknown = null;
  },
}));

class FakeWebSocket {
  static CONNECTING = 0;
  static OPEN = 1;
  static instances: FakeWebSocket[] = [];

  readyState = FakeWebSocket.CONNECTING;
  binaryType = '';
  onopen: (() => void) | null = null;
  onmessage: ((event: { data: string | ArrayBuffer }) => void) | null = null;
  onclose: ((event: unknown) => void) | null = null;
  onerror: ((event: unknown) => void) | null = null;

  constructor(public url: string) {
    FakeWebSocket.instances.push(this);
  }

  addEventListener(): void {}
  removeEventListener(): void {}
  send(): void {}
  close(): void {}

  simulateOpen(): void {
    this.readyState = FakeWebSocket.OPEN;
    this.onopen?.();
  }

  simulateMessage(data: string | ArrayBuffer): void {
    this.onmessage?.({ data });
  }
}

async function connectedWsBase(): Promise<{
  wsBase: WebSocketBase;
  socket: FakeWebSocket;
}> {
  const wsBase = new WebSocketBase();
  const connecting = wsBase.connect('ws://test');
  const socket = FakeWebSocket.instances[0];
  socket.simulateOpen();
  await connecting;
  return { wsBase, socket };
}

describe('WebSocketBase — binary messages bypass the parser worker', () => {
  beforeEach(() => {
    FakeWebSocket.instances = [];
    postMessage.mockClear();
    vi.stubGlobal('WebSocket', FakeWebSocket);
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('routes an ArrayBuffer straight to its handler without calling worker.postMessage', async () => {
    const { wsBase, socket } = await connectedWsBase();
    const handler = vi.fn();
    wsBase.addMessageHandler('TEST', handler);

    // Same-realm Uint8Array/ArrayBuffer, not TextEncoder — see
    // WebSocketBase.test.ts for why TextEncoder's buffer fails `instanceof`
    // ArrayBuffer in jsdom.
    const buffer = Uint8Array.from(
      [...'TEST'].map((char) => char.charCodeAt(0)),
    ).buffer;
    socket.simulateMessage(buffer);

    expect(postMessage).not.toHaveBeenCalled();
    expect(handler).toHaveBeenCalledTimes(1);
    const [transport, receivedFrame] = handler.mock.calls[0];
    expect(transport).toBe(wsBase);
    expect(receivedFrame.buffer).toBe(buffer);
  });

  it('does not decode a whole binary frame to text before routing it', async () => {
    const { wsBase, socket } = await connectedWsBase();
    const handler = vi.fn();
    wsBase.addMessageHandler('PVWC', handler);
    const decodeSpy = vi.spyOn(TextDecoder.prototype, 'decode');

    const frame = new Uint8Array(50_000);
    frame.set([...'PVWC'].map((char) => char.charCodeAt(0)));
    socket.simulateMessage(frame.buffer);

    const decodedLengths = decodeSpy.mock.calls.map(
      ([input]) => (input as ArrayBufferView | ArrayBuffer).byteLength,
    );
    decodeSpy.mockRestore();
    expect(handler).toHaveBeenCalledTimes(1);
    expect(Math.max(0, ...decodedLengths)).toBeLessThanOrEqual(5);
  });

  it('still routes JSON sent as a binary frame to the json handler', async () => {
    const { wsBase, socket } = await connectedWsBase();
    const handler = vi.fn();
    wsBase.addMessageHandler('json', handler);

    const buffer = Uint8Array.from(
      [...'{"message":"hello"}'].map((char) => char.charCodeAt(0)),
    ).buffer;
    socket.simulateMessage(buffer);

    expect(handler).toHaveBeenCalledTimes(1);
    const [transport, receivedFrame] = handler.mock.calls[0];
    expect(transport).toBe(wsBase);
    expect(JSON.parse(new TextDecoder().decode(receivedFrame))).toEqual({
      message: 'hello',
    });
  });

  it('still routes string messages through the worker when one is available', async () => {
    const { socket } = await connectedWsBase();

    socket.simulateMessage('json:{"message":"hello"}');

    expect(postMessage).toHaveBeenCalledTimes(1);
    expect(postMessage.mock.calls[0][0].data).toBe('json:{"message":"hello"}');
  });
});
