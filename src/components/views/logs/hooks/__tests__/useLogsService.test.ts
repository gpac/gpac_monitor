import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { Provider } from 'react-redux';
import { configureStore } from '@reduxjs/toolkit';
import React from 'react';
import { useLogsService } from '../useLogsService';
import logsReducer, {
  setDefaultAllLevel,
  setToolLevel,
  setSubscriptionStatus,
  markConfigAsSent,
} from '../../../../../shared/store/slices/logsSlice';
import {
  GpacLogLevel,
  GpacLogTool,
  LogLevelUtils,
} from '../../../../../types';
import { gpacService } from '../../../../../services/gpacService';

// Mock gpacService
vi.mock('@/services/gpacService', () => ({
  gpacService: {
    logs: {
      updateLogLevel: vi.fn(),
    },
  },
}));

// Mock other reducers to satisfy store requirements
const mockReducer = (state = {}) => state;

const createTestStore = (initialState?: any) =>
  configureStore({
    reducer: {
      logs: logsReducer,
      graph: mockReducer,
      filterArgument: mockReducer,
      widgets: mockReducer,
      sessionStats: mockReducer,
    } as any,
    preloadedState: initialState,
  });

const renderUseLogsService = (store: ReturnType<typeof createTestStore>) => {
  return renderHook(() => useLogsService(), {
    wrapper: ({ children }: { children?: React.ReactNode }) =>
      React.createElement(Provider, { store, children }),
  });
};

describe('useLogsService - Intelligent Backend Call Optimization', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('LogLevelUtils', () => {
    it('should correctly determine when backend calls are needed', () => {
      // Test escalation (needs backend)
      expect(
        LogLevelUtils.needsBackendCall(GpacLogLevel.INFO, GpacLogLevel.DEBUG),
      ).toBe(true);
      expect(
        LogLevelUtils.needsBackendCall(GpacLogLevel.WARNING, GpacLogLevel.INFO),
      ).toBe(true);
      expect(
        LogLevelUtils.needsBackendCall(
          GpacLogLevel.ERROR,
          GpacLogLevel.WARNING,
        ),
      ).toBe(true);

      // Test reduction (frontend filtering only)
      expect(
        LogLevelUtils.needsBackendCall(GpacLogLevel.DEBUG, GpacLogLevel.INFO),
      ).toBe(false);
      expect(
        LogLevelUtils.needsBackendCall(GpacLogLevel.INFO, GpacLogLevel.WARNING),
      ).toBe(false);
      expect(
        LogLevelUtils.needsBackendCall(
          GpacLogLevel.WARNING,
          GpacLogLevel.ERROR,
        ),
      ).toBe(false);

      // Test same level (no backend needed)
      expect(
        LogLevelUtils.needsBackendCall(GpacLogLevel.INFO, GpacLogLevel.INFO),
      ).toBe(false);
    });

    it('should correctly determine frontend filtering capability', () => {
      // Can use frontend filtering (requested <= current)
      expect(
        LogLevelUtils.canUseFrontendFiltering(
          GpacLogLevel.DEBUG,
          GpacLogLevel.INFO,
        ),
      ).toBe(true);
      expect(
        LogLevelUtils.canUseFrontendFiltering(
          GpacLogLevel.INFO,
          GpacLogLevel.WARNING,
        ),
      ).toBe(true);
      expect(
        LogLevelUtils.canUseFrontendFiltering(
          GpacLogLevel.INFO,
          GpacLogLevel.INFO,
        ),
      ).toBe(true);

      // Cannot use frontend filtering (requested > current)
      expect(
        LogLevelUtils.canUseFrontendFiltering(
          GpacLogLevel.INFO,
          GpacLogLevel.DEBUG,
        ),
      ).toBe(false);
      expect(
        LogLevelUtils.canUseFrontendFiltering(
          GpacLogLevel.WARNING,
          GpacLogLevel.INFO,
        ),
      ).toBe(false);
    });
  });

  describe('Backend call optimization scenarios', () => {
    it('should skip backend call when reducing verbosity (mmio@info → mmio@warning)', async () => {
      const store = createTestStore();

      // Initial setup: subscribe and set mmio@info
      store.dispatch(setSubscriptionStatus(true));
      store.dispatch(setDefaultAllLevel(GpacLogLevel.QUIET));
      store.dispatch(
        setToolLevel({ tool: GpacLogTool.MMIO, level: GpacLogLevel.INFO }),
      );
      store.dispatch(markConfigAsSent()); // Mark as sent to backend

      const { result } = renderUseLogsService(store);

      // Clear mocks after initial setup
      vi.clearAllMocks();

      // User changes to mmio@warning (less verbose)
      await act(async () => {
        store.dispatch(
          setToolLevel({ tool: GpacLogTool.MMIO, level: GpacLogLevel.WARNING }),
        );
      });

      // Should NOT call backend (frontend filtering sufficient)
      expect(gpacService.logs.updateLogLevel).not.toHaveBeenCalled();
    });

    it('should call backend when increasing verbosity (mmio@info → mmio@debug)', async () => {
      const store = createTestStore();

      // Initial setup: subscribe and set mmio@info
      store.dispatch(setSubscriptionStatus(true));
      store.dispatch(setDefaultAllLevel(GpacLogLevel.QUIET));
      store.dispatch(
        setToolLevel({ tool: GpacLogTool.MMIO, level: GpacLogLevel.INFO }),
      );
      store.dispatch(markConfigAsSent()); // Mark as sent to backend

      const { result } = renderUseLogsService(store);

      // Clear mocks after initial setup
      vi.clearAllMocks();

      // User changes to mmio@debug (more verbose)
      await act(async () => {
        store.dispatch(
          setToolLevel({ tool: GpacLogTool.MMIO, level: GpacLogLevel.DEBUG }),
        );
      });

      // Should call backend (needs more logs)
      expect(gpacService.logs.updateLogLevel).toHaveBeenCalledWith(
        'mmio@debug',
      );
    });

    it('should handle mixed scenarios: some need backend, some dont', async () => {
      const store = createTestStore();

      // Initial setup: multiple tools at info level
      store.dispatch(setSubscriptionStatus(true));
      store.dispatch(setDefaultAllLevel(GpacLogLevel.QUIET));
      store.dispatch(
        setToolLevel({ tool: GpacLogTool.MMIO, level: GpacLogLevel.INFO }),
      );
      store.dispatch(
        setToolLevel({ tool: GpacLogTool.CODEC, level: GpacLogLevel.INFO }),
      );
      store.dispatch(markConfigAsSent());

      const { result } = renderUseLogsService(store);
      vi.clearAllMocks();

      // Mixed changes:
      // - mmio@info → mmio@warning (frontend only)
      // - codec@info → codec@debug (needs backend)
      await act(async () => {
        store.dispatch(
          setToolLevel({ tool: GpacLogTool.MMIO, level: GpacLogLevel.WARNING }),
        );
        store.dispatch(
          setToolLevel({ tool: GpacLogTool.CODEC, level: GpacLogLevel.DEBUG }),
        );
      });

      // Should only send the backend-required change
      expect(gpacService.logs.updateLogLevel).toHaveBeenCalledWith(
        'codec@debug',
      );
      expect(gpacService.logs.updateLogLevel).toHaveBeenCalledTimes(1);
    });

    it('should call backend for initial configuration setup', async () => {
      const store = createTestStore();

      // First, render the hook to initialize
      const { result } = renderUseLogsService(store);

      // Clear any initial calls
      vi.clearAllMocks();

      // Subscribe and change level - this should trigger backend call
      await act(async () => {
        store.dispatch(setSubscriptionStatus(true));
        store.dispatch(setDefaultAllLevel(GpacLogLevel.INFO));
      });

      // Wait for effects to process
      await act(async () => {
        await new Promise(resolve => setTimeout(resolve, 50));
      });

      // The hook should detect config changes and call backend
      expect(gpacService.logs.updateLogLevel).toHaveBeenCalledWith('all@info');
    });

    it('should optimize multiple consecutive frontend-only changes', async () => {
      const store = createTestStore();

      // Setup: start with debug level (most verbose)
      store.dispatch(setSubscriptionStatus(true));
      store.dispatch(setDefaultAllLevel(GpacLogLevel.QUIET));
      store.dispatch(
        setToolLevel({ tool: GpacLogTool.FILTER, level: GpacLogLevel.DEBUG }),
      );
      store.dispatch(markConfigAsSent());

      const { result } = renderUseLogsService(store);
      vi.clearAllMocks();

      // Multiple reductions (all frontend-only)
      await act(async () => {
        store.dispatch(
          setToolLevel({ tool: GpacLogTool.FILTER, level: GpacLogLevel.INFO }),
        );
      });

      await act(async () => {
        store.dispatch(
          setToolLevel({
            tool: GpacLogTool.FILTER,
            level: GpacLogLevel.WARNING,
          }),
        );
      });

      await act(async () => {
        store.dispatch(
          setToolLevel({ tool: GpacLogTool.FILTER, level: GpacLogLevel.ERROR }),
        );
      });

      // No backend calls should be made
      expect(gpacService.logs.updateLogLevel).not.toHaveBeenCalled();
    });

    it('should call backend when escalating from frontend-filtered level', async () => {
      const store = createTestStore();

      // Setup: start with debug, then reduce to warning (frontend-only)
      store.dispatch(setSubscriptionStatus(true));
      store.dispatch(setDefaultAllLevel(GpacLogLevel.QUIET));
      store.dispatch(
        setToolLevel({ tool: GpacLogTool.NETWORK, level: GpacLogLevel.DEBUG }),
      );
      store.dispatch(markConfigAsSent());

      const { result } = renderUseLogsService(store);
      vi.clearAllMocks();

      // First: reduce to warning (frontend-only)
      await act(async () => {
        store.dispatch(
          setToolLevel({
            tool: GpacLogTool.NETWORK,
            level: GpacLogLevel.WARNING,
          }),
        );
      });

      expect(gpacService.logs.updateLogLevel).not.toHaveBeenCalled();

      // Then: try to go back to debug (should NOT need backend since debug was already sent)
      // This tests that we track the actual backend state correctly
      await act(async () => {
        store.dispatch(
          setToolLevel({
            tool: GpacLogTool.NETWORK,
            level: GpacLogLevel.DEBUG,
          }),
        );
      });

      // Should NOT call backend because debug was already sent previously
      expect(gpacService.logs.updateLogLevel).not.toHaveBeenCalled();
    });
  });

  describe('Real-world usage scenario', () => {
    it('should handle the exact scenario: filter@info → codec@warning/mutex@info → filter@info', async () => {
      const store = createTestStore();

      // Initial configuration: filter@info, all@quiet
      store.dispatch(setSubscriptionStatus(true));
      store.dispatch(setDefaultAllLevel(GpacLogLevel.QUIET));
      store.dispatch(
        setToolLevel({ tool: GpacLogTool.FILTER, level: GpacLogLevel.INFO }),
      );
      store.dispatch(markConfigAsSent());

      const { result } = renderUseLogsService(store);
      vi.clearAllMocks();

      // Change to codec@warning (needs backend - escalation from quiet default)
      await act(async () => {
        store.dispatch(
          setToolLevel({
            tool: GpacLogTool.CODEC,
            level: GpacLogLevel.WARNING,
          }),
        );
      });

      expect(gpacService.logs.updateLogLevel).toHaveBeenCalledWith(
        'codec@warning',
      );
      vi.clearAllMocks();

      // Change to mutex@info (needs backend - escalation from quiet default)
      await act(async () => {
        store.dispatch(
          setToolLevel({ tool: GpacLogTool.MUTEX, level: GpacLogLevel.INFO }),
        );
      });

      expect(gpacService.logs.updateLogLevel).toHaveBeenCalledWith(
        'mutex@info',
      );
      vi.clearAllMocks();

      // Return to filter@info (no backend call - already at info level)
      await act(async () => {
        store.dispatch(
          setToolLevel({ tool: GpacLogTool.FILTER, level: GpacLogLevel.INFO }),
        );
      });

      // Should not call backend since filter@info was already sent
      expect(gpacService.logs.updateLogLevel).not.toHaveBeenCalled();
    });
  });
});
