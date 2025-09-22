import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useLogsWithConfig } from '../hooks/useLogsWithConfig';

// Mock dependencies
vi.mock('@/shared/hooks/redux', () => ({
  useAppSelector: vi.fn(),
  useAppDispatch: vi.fn(() => vi.fn()),
}));

vi.mock('@/services/gpacService', () => ({
  gpacService: {
    load: vi.fn(),
    subscribe: vi.fn(),
    logs: {
      updateLogLevel: vi.fn(),
    },
  },
}));

vi.mock('../utils/configParser', () => ({
  parseConfigChanges: vi.fn(),
}));

vi.mock('../utils/configAnalyzer', () => ({
  analyzeConfigChanges: vi.fn(),
}));

describe('useLogsWithConfig', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should initialize with default values', () => {
    const mockSelector = vi.fn();
    mockSelector
      .mockReturnValueOnce('') // configString
      .mockReturnValueOnce('warning') // defaultAllLevel
      .mockReturnValueOnce({ lastSentConfig: { levelsByTool: {} } }); // logsState

    const { useAppSelector } = require('@/shared/hooks/redux');
    useAppSelector.mockImplementation(mockSelector);

    const { result } = renderHook(() => useLogsWithConfig());

    expect(result.current.logs).toEqual([]);
    expect(result.current.isSubscribed).toBe(false);
    expect(result.current.currentConfig).toBe('');
  });

  it('should not subscribe when disabled', () => {
    const mockSelector = vi.fn();
    mockSelector
      .mockReturnValueOnce('') // configString
      .mockReturnValueOnce('warning') // defaultAllLevel
      .mockReturnValueOnce({ lastSentConfig: { levelsByTool: {} } }); // logsState

    const { useAppSelector } = require('@/shared/hooks/redux');
    useAppSelector.mockImplementation(mockSelector);

    const { result } = renderHook(() => useLogsWithConfig({ enabled: false }));

    expect(result.current.isSubscribed).toBe(false);
  });
});