import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { act, renderHook, waitFor } from '@testing-library/react';
import { Provider } from 'react-redux';
import { configureStore } from '@reduxjs/toolkit';
import connectionsReducer, {
  updateConnectionStatus,
} from '../../../store/slices/connectionsSlice';
import { useServiceReady } from '../useServiceReady';
import { gpacService } from '@/services/gpacService';
import { ConnectionStatus } from '@/types/communication/shared';

vi.mock('@/services/gpacService', () => ({
  gpacService: { ready: vi.fn().mockResolvedValue(undefined) },
}));

const mockUseDataSource = vi.fn();
vi.mock('@/services/dataSource/DataSourceContext', () => ({
  useDataSource: () => mockUseDataSource(),
}));

const makeStore = () =>
  configureStore({ reducer: { connections: connectionsReducer } });

const makeWrapper =
  (store: ReturnType<typeof makeStore>) =>
  ({ children }: { children: React.ReactNode }) => (
    <Provider store={store}>{children}</Provider>
  );

describe('useServiceReady — history mode must never open the live WS', () => {
  beforeEach(() => {
    vi.mocked(gpacService.ready).mockClear();
  });

  it('does not call gpacService.ready in history mode', () => {
    mockUseDataSource.mockReturnValue({ mode: 'history' });
    const { result } = renderHook(() => useServiceReady(), {
      wrapper: makeWrapper(makeStore()),
    });

    expect(gpacService.ready).not.toHaveBeenCalled();
    expect(result.current.isReady).toBe(false);
    expect(result.current.isLoading).toBe(false);
  });

  it('calls gpacService.ready with the active address in live mode', async () => {
    mockUseDataSource.mockReturnValue({ mode: 'live' });
    const { result } = renderHook(() => useServiceReady(), {
      wrapper: makeWrapper(makeStore()),
    });

    await waitFor(() => expect(result.current.isReady).toBe(true));
    expect(gpacService.ready).toHaveBeenCalledWith('ws://localhost:6363');
  });
});

describe('useServiceReady — WS disconnect invalidates readiness', () => {
  beforeEach(() => {
    vi.mocked(gpacService.ready).mockClear();
    mockUseDataSource.mockReturnValue({ mode: 'live' });
  });

  it('returns to not ready when the active connection disconnects', async () => {
    const store = makeStore();
    const { result } = renderHook(() => useServiceReady(), {
      wrapper: makeWrapper(store),
    });
    act(() => {
      store.dispatch(
        updateConnectionStatus({
          id: 'default',
          status: ConnectionStatus.CONNECTED,
        }),
      );
    });
    await waitFor(() => expect(result.current.isReady).toBe(true));

    act(() => {
      store.dispatch(
        updateConnectionStatus({
          id: 'default',
          status: ConnectionStatus.DISCONNECTED,
        }),
      );
    });

    expect(result.current.isReady).toBe(false);
  });

  it('does not call gpacService.ready again after a disconnect', async () => {
    const store = makeStore();
    const { result } = renderHook(() => useServiceReady(), {
      wrapper: makeWrapper(store),
    });
    act(() => {
      store.dispatch(
        updateConnectionStatus({
          id: 'default',
          status: ConnectionStatus.CONNECTED,
        }),
      );
    });
    await waitFor(() => expect(result.current.isReady).toBe(true));

    act(() => {
      store.dispatch(
        updateConnectionStatus({
          id: 'default',
          status: ConnectionStatus.DISCONNECTED,
        }),
      );
    });

    expect(gpacService.ready).toHaveBeenCalledTimes(1);
  });
});

describe('useServiceReady — a failed check is retried when the WS opens', () => {
  beforeEach(() => {
    vi.mocked(gpacService.ready).mockClear();
    mockUseDataSource.mockReturnValue({ mode: 'live' });
  });

  it('becomes ready after a failed check once the connection opens', async () => {
    vi.mocked(gpacService.ready).mockRejectedValueOnce(new Error('refused'));
    const store = makeStore();
    const { result } = renderHook(() => useServiceReady(), {
      wrapper: makeWrapper(store),
    });
    await waitFor(() => expect(result.current.error).not.toBeNull());

    act(() => {
      store.dispatch(
        updateConnectionStatus({
          id: 'default',
          status: ConnectionStatus.CONNECTED,
        }),
      );
    });

    await waitFor(() => expect(result.current.isReady).toBe(true));
    expect(result.current.error).toBeNull();
  });
});
