import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useGraphConnection } from '../useGraphConnection';

const { mockDispatch, mockService, activeConnectionRef } = vi.hoisted(() => ({
  mockDispatch: vi.fn(),
  mockService: {
    isConnected: vi.fn(),
    getConnectedAddress: vi.fn(),
    disconnect: vi.fn(),
    connectService: vi.fn(),
    registerHandler: vi.fn(),
  },
  activeConnectionRef: {
    current: { id: 'connection-1', address: 'ws://gpac-a' } as {
      id: string;
      address: string;
    } | null,
  },
}));

vi.mock('@/shared/hooks/redux', () => ({
  useAppDispatch: () => mockDispatch,
  useAppSelector: () => activeConnectionRef.current,
}));

vi.mock('@/shared/hooks/connection/useGpacService', () => ({
  useGpacService: () => mockService,
}));

vi.mock('@/shared/hooks/data/useDataMode', () => ({
  useDataMode: () => ({ isLive: true }),
}));

describe('useGraphConnection', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockService.registerHandler.mockReturnValue(vi.fn());
    mockService.connectService.mockResolvedValue(undefined);
    activeConnectionRef.current = {
      id: 'connection-1',
      address: 'ws://gpac-a',
    };
  });

  it('does not disconnect the shared service when the hook unmounts', async () => {
    mockService.isConnected.mockReturnValue(true);
    mockService.getConnectedAddress.mockReturnValue('ws://gpac-a');

    const { unmount } = renderHook(() =>
      useGraphConnection({ setConnectionError: vi.fn() }),
    );
    await act(async () => {});
    unmount();

    expect(mockService.disconnect).not.toHaveBeenCalled();
  });

  it('does not reconnect when already connected to the active address', async () => {
    mockService.isConnected.mockReturnValue(true);
    mockService.getConnectedAddress.mockReturnValue('ws://gpac-a');

    const { result } = renderHook(() =>
      useGraphConnection({ setConnectionError: vi.fn() }),
    );
    await act(async () => {});

    expect(mockService.connectService).not.toHaveBeenCalled();
    expect(result.current.isConnected).toBe(true);
  });

  it('disconnects then reconnects when the active address changes', async () => {
    mockService.isConnected.mockReturnValue(true);
    mockService.getConnectedAddress.mockReturnValue('ws://gpac-a');
    activeConnectionRef.current = {
      id: 'connection-2',
      address: 'ws://gpac-b',
    };

    renderHook(() => useGraphConnection({ setConnectionError: vi.fn() }));
    await act(async () => {});

    expect(mockService.disconnect).toHaveBeenCalled();
    expect(mockService.connectService).toHaveBeenCalledWith('ws://gpac-b');
  });
});
