import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { Provider } from 'react-redux';
import { configureStore } from '@reduxjs/toolkit';
import React from 'react';
import { useLogsRedux } from '../useLogsRedux';
import { GpacLogLevel, GpacLogTool } from '../../../../../types/domain/gpac/log-types';

// Import and mock the slice creation instead of importing the pre-created slice
import { createSlice, PayloadAction } from '@reduxjs/toolkit';

interface GpacLogEntry {
  timestamp: number;
  tool: string;
  level: number;
  message: string;
}

interface LogsState {
  currentTool: GpacLogTool;
  levelsByTool: Record<GpacLogTool, GpacLogLevel>;
  defaultAllLevel: GpacLogLevel;
  buffers: Record<GpacLogTool, GpacLogEntry[]>;
  maxEntriesPerTool: number;
  isSubscribed: boolean;
}

// Mock toast
vi.mock('@/shared/hooks/useToast', () => ({
  toast: vi.fn(),
}));

// Create test logs reducer that uses mocked localStorage
const createTestLogsReducer = (localStorageMock: { [key: string]: string }) => {
  const getInitialState = (): LogsState => {
    const STORAGE_KEY = 'gpac-logs-config';
    
    try {
      const saved = localStorageMock[STORAGE_KEY];
      const config = saved ? JSON.parse(saved) : {};
      
      return {
        currentTool: config.currentTool || GpacLogTool.FILTER,
        levelsByTool: config.levelsByTool || {} as Record<GpacLogTool, GpacLogLevel>,
        defaultAllLevel: config.defaultAllLevel || GpacLogLevel.QUIET,
        buffers: {} as Record<GpacLogTool, GpacLogEntry[]>,
        maxEntriesPerTool: 5000,
        isSubscribed: false,
      };
    } catch {
      return {
        currentTool: GpacLogTool.FILTER,
        levelsByTool: {} as Record<GpacLogTool, GpacLogLevel>,
        defaultAllLevel: GpacLogLevel.QUIET,
        buffers: {} as Record<GpacLogTool, GpacLogEntry[]>,
        maxEntriesPerTool: 5000,
        isSubscribed: false,
      };
    }
  };

  const initialState: LogsState = getInitialState();

  // Initialize empty buffers for all GPAC tools
  Object.values(GpacLogTool).forEach((tool) => {
    initialState.buffers[tool] = [];
  });

  return createSlice({
    name: 'logs',
    initialState,
    reducers: {
      setTool: (state, action: PayloadAction<GpacLogTool>) => {
        state.currentTool = action.payload;
      },
      setToolLevel: (
        state,
        action: PayloadAction<{ tool: GpacLogTool; level: GpacLogLevel }>,
      ) => {
        const { tool, level } = action.payload;
        state.levelsByTool[tool] = level;
      },
      setDefaultAllLevel: (state, action: PayloadAction<GpacLogLevel>) => {
        state.defaultAllLevel = action.payload;
      },
      restoreConfig: (
        state,
        action: PayloadAction<{
          currentTool?: GpacLogTool;
          levelsByTool?: Record<GpacLogTool, GpacLogLevel>;
          defaultAllLevel?: GpacLogLevel;
        }>,
      ) => {
        const { currentTool, levelsByTool, defaultAllLevel } = action.payload;
        if (currentTool) {
          state.currentTool = currentTool;
        }
        if (levelsByTool) {
          state.levelsByTool = { ...state.levelsByTool, ...levelsByTool };
        }
        if (defaultAllLevel) {
          state.defaultAllLevel = defaultAllLevel;
        }
      },
    },
  }).reducer;
};

// Create test store
const createTestStore = (localStorageMock: { [key: string]: string }) => configureStore({
  reducer: {
    logs: createTestLogsReducer(localStorageMock),
  },
});

// Wrapper component for Redux Provider
const createWrapper = (store: ReturnType<typeof createTestStore>) => {
  return ({ children }: { children: React.ReactNode }) => 
    React.createElement(Provider, { store, children });
};

describe('useLogsRedux', () => {
  let store: ReturnType<typeof createTestStore>;
  let localStorageMock: { [key: string]: string };

  beforeEach(() => {
    // Mock localStorage
    localStorageMock = {};
    global.localStorage = {
      getItem: vi.fn((key: string) => localStorageMock[key] || null),
      setItem: vi.fn((key: string, value: string) => {
        localStorageMock[key] = value;
      }),
      removeItem: vi.fn((key: string) => {
        delete localStorageMock[key];
      }),
      clear: vi.fn(() => {
        localStorageMock = {};
      }),
      length: 0,
      key: vi.fn(),
    };

    store = createTestStore(localStorageMock);
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  describe('currentTool management', () => {
    it('should initialize with FILTER as default when no localStorage', () => {
      const { result } = renderHook(() => useLogsRedux(), {
        wrapper: createWrapper(store),
      });

      expect(result.current.currentTool).toBe(GpacLogTool.FILTER);
    });

    it('should change currentTool when setTool is called', async () => {
      const { result } = renderHook(() => useLogsRedux(), {
        wrapper: createWrapper(store),
      });

      await act(async () => {
        result.current.setTool(GpacLogTool.CODEC);
      });

      expect(result.current.currentTool).toBe(GpacLogTool.CODEC);
    });

    it('should save currentTool to localStorage when changed', () => {
      const { result } = renderHook(() => useLogsRedux(), {
        wrapper: createWrapper(store),
      });

      act(() => {
        result.current.setTool(GpacLogTool.MMIO);
      });

      expect(localStorage.setItem).toHaveBeenCalledWith(
        'gpac-logs-config',
        expect.stringContaining('"currentTool":"mmio"')
      );
    });
  });

  describe('localStorage persistence', () => {
    it('should restore currentTool from localStorage on initialization', () => {
      // Setup localStorage with saved config BEFORE creating store
      localStorageMock['gpac-logs-config'] = JSON.stringify({
        currentTool: GpacLogTool.CACHE,
        defaultAllLevel: GpacLogLevel.INFO,
        levelsByTool: {},
      });

      // Create new store AFTER setting localStorage to trigger initialization with saved data
      const storeWithData = createTestStore(localStorageMock);
      
      const { result } = renderHook(() => useLogsRedux(), {
        wrapper: createWrapper(storeWithData),
      });

      expect(result.current.currentTool).toBe(GpacLogTool.CACHE);
      expect(result.current.defaultAllLevel).toBe(GpacLogLevel.INFO);
    });

    it('should save complete config to localStorage', () => {
      const { result } = renderHook(() => useLogsRedux(), {
        wrapper: createWrapper(store),
      });

      act(() => {
        result.current.setTool(GpacLogTool.CORE);
        result.current.setToolLevel(GpacLogTool.HTTP, GpacLogLevel.DEBUG);
        result.current.setDefaultAllLevel(GpacLogLevel.WARNING);
      });

      // Check that localStorage was called with complete config
      expect(localStorage.setItem).toHaveBeenCalledWith(
        'gpac-logs-config',
        expect.stringContaining('"currentTool":"http"')
      );
      expect(localStorage.setItem).toHaveBeenCalledWith(
        'gpac-logs-config',
        expect.stringContaining('"http":"debug"')
      );
      expect(localStorage.setItem).toHaveBeenCalledWith(
        'gpac-logs-config',
        expect.stringContaining('"defaultAllLevel":"warning"')
      );
    });
  });

  describe('tool level management', () => {
    it('should set tool level and switch to that tool', () => {
      const { result } = renderHook(() => useLogsRedux(), {
        wrapper: createWrapper(store),
      });

      act(() => {
        result.current.setToolLevel(GpacLogTool.NETWORK, GpacLogLevel.ERROR);
      });

      expect(result.current.levelsByTool[GpacLogTool.NETWORK]).toBe(GpacLogLevel.ERROR);
      expect(result.current.currentTool).toBe(GpacLogTool.NETWORK);
    });

    it('should persist tool levels to localStorage', () => {
      const { result } = renderHook(() => useLogsRedux(), {
        wrapper: createWrapper(store),
      });

      act(() => {
        result.current.setToolLevel(GpacLogTool.PARSER, GpacLogLevel.INFO);
      });

      expect(localStorage.setItem).toHaveBeenCalledWith(
        'gpac-logs-config',
        expect.stringContaining('"parser":"info"')
      );
    });

    it('should set default all level', () => {
      const { result } = renderHook(() => useLogsRedux(), {
        wrapper: createWrapper(store),
      });

      act(() => {
        result.current.setDefaultAllLevel(GpacLogLevel.DEBUG);
      });

      expect(result.current.defaultAllLevel).toBe(GpacLogLevel.DEBUG);
    });
  });

  describe('complex scenarios', () => {
    it('should handle multiple tool changes correctly', () => {
      const { result } = renderHook(() => useLogsRedux(), {
        wrapper: createWrapper(store),
      });

      act(() => {
        result.current.setTool(GpacLogTool.AUDIO);
        result.current.setToolLevel(GpacLogTool.CORE, GpacLogLevel.WARNING);
        result.current.setTool(GpacLogTool.CODEC);
      });

      expect(result.current.currentTool).toBe(GpacLogTool.CODEC);
      expect(result.current.levelsByTool[GpacLogTool.CORE]).toBe(GpacLogLevel.WARNING);
    });

    it('should preserve levelsByTool when changing currentTool', () => {
      const { result } = renderHook(() => useLogsRedux(), {
        wrapper: createWrapper(store),
      });

      act(() => {
        result.current.setToolLevel(GpacLogTool.CONSOLE, GpacLogLevel.ERROR);
        result.current.setToolLevel(GpacLogTool.MEDIA, GpacLogLevel.INFO);
        result.current.setTool(GpacLogTool.FILTER);
      });

      expect(result.current.currentTool).toBe(GpacLogTool.FILTER);
      expect(result.current.levelsByTool[GpacLogTool.CONSOLE]).toBe(GpacLogLevel.ERROR);
      expect(result.current.levelsByTool[GpacLogTool.MEDIA]).toBe(GpacLogLevel.INFO);
    });
  });

  describe('edge cases', () => {
    it('should handle invalid localStorage data gracefully', () => {
      localStorageMock['gpac-logs-config'] = 'invalid-json';

      const storeWithBadData = createTestStore(localStorageMock);
      
      const { result } = renderHook(() => useLogsRedux(), {
        wrapper: createWrapper(storeWithBadData),
      });

      // Should fallback to default values
      expect(result.current.currentTool).toBe(GpacLogTool.FILTER);
      expect(result.current.defaultAllLevel).toBe(GpacLogLevel.QUIET);
    });

    it('should handle empty localStorage gracefully', () => {
      localStorageMock['gpac-logs-config'] = JSON.stringify({});

      const storeWithEmptyData = createTestStore(localStorageMock);
      
      const { result } = renderHook(() => useLogsRedux(), {
        wrapper: createWrapper(storeWithEmptyData),
      });

      expect(result.current.currentTool).toBe(GpacLogTool.FILTER);
      expect(result.current.defaultAllLevel).toBe(GpacLogLevel.QUIET);
      expect(Object.keys(result.current.levelsByTool)).toHaveLength(0);
    });
  });
});