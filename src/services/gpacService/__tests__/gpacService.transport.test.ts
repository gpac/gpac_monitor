import { describe, it, expect, vi, afterEach } from 'vitest';
import { GpacService } from '../gpacService';
import { GpacTransport } from '../../ws/GpacTransport';

function createFakeTransport(): GpacTransport {
  return {
    connect: vi.fn().mockResolvedValue(undefined),
    disconnect: vi.fn(),
    isConnected: vi.fn(() => false),
    send: vi.fn(),
    addMessageHandler: vi.fn(),
    addJsonMessageHandler: vi.fn(),
    addConnectHandler: vi.fn(),
    addDisconnectHandler: vi.fn(),
    addDefaultMessageHandler: vi.fn(),
  };
}

function resetSingleton(): void {
  (GpacService as unknown as { instance: GpacService | null }).instance = null;
}

describe('GpacService transport injection', () => {
  afterEach(() => {
    resetSingleton();
  });

  it('uses the injected GpacTransport instead of the default WebSocketBase', async () => {
    const fakeTransport = createFakeTransport();
    resetSingleton();

    const service = GpacService.getInstance(fakeTransport);
    await service.connect('ws://fake-address');

    expect(fakeTransport.connect).toHaveBeenCalledWith('ws://fake-address');
  });
});
