import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { WebSocketBase } from '../WebSocketBase';
import { MessageFormatter } from '../formatters/messageFormatters';

// Force the worker constructor to fail so WebSocketBase falls back to
// parseMessageInline — the only path testable in jsdom (no real Worker).
vi.mock('../workers/wsParserWorker?worker&inline', () => ({
  default: class {
    constructor() {
      throw new Error('worker not available in jsdom');
    }
  },
}));

class FakeWebSocket {
  static CONNECTING = 0;
  static OPEN = 1;
  static CLOSING = 2;
  static CLOSED = 3;
  static instances: FakeWebSocket[] = [];

  readyState = FakeWebSocket.CONNECTING;
  binaryType = '';
  onopen: (() => void) | null = null;
  onmessage: ((event: { data: string | ArrayBuffer }) => void) | null = null;
  onclose: ((event: unknown) => void) | null = null;
  onerror: ((event: unknown) => void) | null = null;

  private listeners: Record<string, Array<(event: unknown) => void>> = {};

  constructor(public url: string) {
    FakeWebSocket.instances.push(this);
  }

  addEventListener(type: string, handler: (event: unknown) => void): void {
    (this.listeners[type] ??= []).push(handler);
  }

  removeEventListener(type: string, handler: (event: unknown) => void): void {
    this.listeners[type] = (this.listeners[type] ?? []).filter(
      (registered) => registered !== handler,
    );
  }

  private emit(type: string, event: unknown): void {
    this.listeners[type]?.forEach((handler) => handler(event));
  }

  send(_message: string): void {}

  close(): void {
    this.simulateClose();
  }

  simulateOpen(): void {
    this.readyState = FakeWebSocket.OPEN;
    this.onopen?.();
    this.emit('open', {});
  }

  simulateMessage(data: string | ArrayBuffer): void {
    const event = { data };
    this.onmessage?.(event);
    this.emit('message', event);
  }

  simulateClose(): void {
    this.readyState = FakeWebSocket.CLOSED;
    this.onclose?.({});
    this.emit('close', {});
  }
}

function decode(dataView: DataView): unknown {
  return JSON.parse(MessageFormatter.decodeDataView(dataView));
}

describe('WebSocketBase', () => {
  beforeEach(() => {
    FakeWebSocket.instances = [];
    vi.stubGlobal('WebSocket', FakeWebSocket);
    vi.spyOn(console, 'warn').mockImplementation(() => {});
    vi.spyOn(console, 'error').mockImplementation(() => {});
  });

  afterEach(() => {
    vi.unstubAllGlobals();
    vi.restoreAllMocks();
  });

  it('instantiates without error, falling back to inline parsing when the worker is unavailable', () => {
    expect(() => new WebSocketBase()).not.toThrow();
  });

  describe('connection lifecycle', () => {
    it('resolves connect() on open and triggers __OnConnect__ handlers', async () => {
      const wsBase = new WebSocketBase();
      const onConnect = vi.fn();
      wsBase.addConnectHandler(onConnect);

      const connecting = wsBase.connect('ws://test');
      FakeWebSocket.instances[0].simulateOpen();
      await connecting;

      expect(onConnect).toHaveBeenCalledTimes(1);
      expect(wsBase.isConnected()).toBe(true);
    });

    it('dedupes two connect() calls made while CONNECTING into a single socket', async () => {
      const wsBase = new WebSocketBase();

      const first = wsBase.connect('ws://test');
      const second = wsBase.connect('ws://test');
      expect(FakeWebSocket.instances).toHaveLength(1);

      FakeWebSocket.instances[0].simulateOpen();
      await Promise.all([first, second]);

      expect(FakeWebSocket.instances).toHaveLength(1);
    });

    it('triggers __OnDisconnect__ handlers and reports disconnected on close', async () => {
      const wsBase = new WebSocketBase();
      const onDisconnect = vi.fn();
      wsBase.addDisconnectHandler(onDisconnect);

      const connecting = wsBase.connect('ws://test');
      FakeWebSocket.instances[0].simulateOpen();
      await connecting;

      FakeWebSocket.instances[0].simulateClose();

      expect(onDisconnect).toHaveBeenCalledTimes(1);
      expect(wsBase.isConnected()).toBe(false);
    });

    it('throws when send() is called without an active connection', () => {
      const wsBase = new WebSocketBase();
      expect(() => wsBase.send('hello')).toThrow('Cannot send message');
    });
  });

  describe('message routing (parseMessageInline)', () => {
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

    it('routes a "json:" prefixed string message to the json handler', async () => {
      const { wsBase, socket } = await connectedWsBase();
      const handler = vi.fn();
      wsBase.addJsonMessageHandler(handler);

      socket.simulateMessage('json:{"message":"hello"}');

      expect(handler).toHaveBeenCalledTimes(1);
      const dataView = handler.mock.calls[0][1] as DataView;
      expect(decode(dataView)).toEqual({ message: 'hello' });
    });

    it('routes a bare "{...}" string message to the same json handler', async () => {
      const { wsBase, socket } = await connectedWsBase();
      const handler = vi.fn();
      wsBase.addJsonMessageHandler(handler);

      socket.simulateMessage('{"message":"world"}');

      expect(handler).toHaveBeenCalledTimes(1);
      const dataView = handler.mock.calls[0][1] as DataView;
      expect(decode(dataView)).toEqual({ message: 'world' });
    });

    it('routes an ArrayBuffer starting with a registered 4-char id to its dedicated handler', async () => {
      const { wsBase, socket } = await connectedWsBase();
      const handler = vi.fn();
      wsBase.addMessageHandler('TEST', handler);

      // Built from same-realm Uint8Array/ArrayBuffer globals, not TextEncoder:
      // vitest's jsdom environment polyfills TextEncoder from Node's outer
      // realm, so its .buffer fails `instanceof ArrayBuffer` against jsdom's
      // own ArrayBuffer — a test-env artifact, never true in a real browser.
      const buffer = Uint8Array.from(
        [...'TEST'].map((char) => char.charCodeAt(0)),
      ).buffer;
      socket.simulateMessage(buffer);

      expect(handler).toHaveBeenCalledTimes(1);
      expect(handler.mock.calls[0][0]).toBe(wsBase);
    });

    it('routes an unrecognized message to the __default__ handler', async () => {
      const { wsBase, socket } = await connectedWsBase();
      const handler = vi.fn();
      wsBase.addDefaultMessageHandler(handler);

      socket.simulateMessage('XXXX-not-registered');

      expect(handler).toHaveBeenCalledTimes(1);
    });
  });

  describe('handler robustness', () => {
    it('still calls the second __default__ handler when the first one throws', async () => {
      const wsBase = new WebSocketBase();
      const connecting = wsBase.connect('ws://test');
      const socket = FakeWebSocket.instances[0];
      socket.simulateOpen();
      await connecting;

      const throwingHandler = vi.fn(() => {
        throw new Error('boom');
      });
      const trackingHandler = vi.fn();
      wsBase.addDefaultMessageHandler(throwingHandler);
      wsBase.addDefaultMessageHandler(trackingHandler);

      expect(() => socket.simulateMessage('XXXX-unrouted')).not.toThrow();

      expect(throwingHandler).toHaveBeenCalledTimes(1);
      expect(trackingHandler).toHaveBeenCalledTimes(1);
    });

    it('does not throw on malformed "json:" payloads and routes them to __default__', async () => {
      const wsBase = new WebSocketBase();
      const connecting = wsBase.connect('ws://test');
      const socket = FakeWebSocket.instances[0];
      socket.simulateOpen();
      await connecting;

      const defaultHandler = vi.fn();
      wsBase.addDefaultMessageHandler(defaultHandler);

      expect(() => socket.simulateMessage('json:{oops')).not.toThrow();

      expect(defaultHandler).toHaveBeenCalledTimes(1);
    });
  });
});
