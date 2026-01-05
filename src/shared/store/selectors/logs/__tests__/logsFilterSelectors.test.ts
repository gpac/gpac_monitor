import { describe, it, expect } from 'vitest';
import { selectVisibleLogs } from '../../logs/logsFilterSelectors';
import {
  GpacLogEntry,
  GpacLogLevel,
  GpacLogTool,
  LOG_LEVEL_VALUES,
} from '@/types/domain/gpac/log-types';

const createLog = (overrides: Partial<GpacLogEntry>): GpacLogEntry => ({
  timestamp: Date.now(),
  tool: GpacLogTool.FILTER,
  level: LOG_LEVEL_VALUES[GpacLogLevel.INFO],
  message: 'log',
  ...overrides,
});

const createState = (overrides: Partial<any> = {}) => ({
  logs: {
    currentTool: GpacLogTool.FILTER,
    levelsByTool: { [GpacLogTool.FILTER]: GpacLogLevel.DEBUG },
    defaultAllLevel: GpacLogLevel.DEBUG,
    visibleToolsFilter: [],
    buffers: {
      [GpacLogTool.FILTER]: [],
      [GpacLogTool.MMIO]: [],
    },
    uiFilter: null,
    ...overrides,
  },
});

describe('selectVisibleLogs', () => {
  it('filters by levels only', () => {
    const state = createState({
      uiFilter: { levels: [GpacLogLevel.ERROR] },
      buffers: {
        [GpacLogTool.FILTER]: [
          createLog({
            tool: GpacLogTool.FILTER,
            level: LOG_LEVEL_VALUES[GpacLogLevel.ERROR],
            message: 'error',
          }),
          createLog({
            tool: GpacLogTool.FILTER,
            level: LOG_LEVEL_VALUES[GpacLogLevel.WARNING],
            message: 'warning',
          }),
        ],
        [GpacLogTool.MMIO]: [
          createLog({
            tool: GpacLogTool.MMIO,
            level: LOG_LEVEL_VALUES[GpacLogLevel.ERROR],
            message: 'error-mmio',
          }),
        ],
      },
    });

    const visible = selectVisibleLogs(state as any);
    expect(visible).toHaveLength(2);
    expect(visible.every((log) => log.level === 1)).toBe(true);
  });

  it('filters by filterKeys only', () => {
    const state = createState({
      uiFilter: { filterKeys: ['12', 't:9'] },
      buffers: {
        [GpacLogTool.FILTER]: [
          createLog({
            tool: GpacLogTool.FILTER,
            caller: 12,
            message: 'caller-12',
          }),
          createLog({
            tool: GpacLogTool.FILTER,
            caller: 77,
            message: 'caller-77',
          }),
        ],
        [GpacLogTool.MMIO]: [
          createLog({
            tool: GpacLogTool.MMIO,
            thread_id: 9,
            message: 'thread-9',
          }),
          createLog({
            tool: GpacLogTool.MMIO,
            thread_id: 10,
            message: 'thread-10',
          }),
        ],
      },
    });

    const visible = selectVisibleLogs(state as any);
    const messages = visible.map((log) => log.message);
    expect(messages).toEqual(expect.arrayContaining(['caller-12', 'thread-9']));
    expect(messages).not.toEqual(
      expect.arrayContaining(['caller-77', 'thread-10']),
    );
  });

  it('filters by levels and filterKeys together', () => {
    const state = createState({
      uiFilter: { levels: [GpacLogLevel.ERROR], filterKeys: ['12'] },
      buffers: {
        [GpacLogTool.FILTER]: [
          createLog({
            tool: GpacLogTool.FILTER,
            caller: 12,
            level: LOG_LEVEL_VALUES[GpacLogLevel.ERROR],
            message: 'match',
          }),
          createLog({
            tool: GpacLogTool.FILTER,
            caller: 12,
            level: LOG_LEVEL_VALUES[GpacLogLevel.WARNING],
            message: 'wrong-level',
          }),
          createLog({
            tool: GpacLogTool.FILTER,
            caller: 77,
            level: LOG_LEVEL_VALUES[GpacLogLevel.ERROR],
            message: 'wrong-caller',
          }),
        ],
        [GpacLogTool.MMIO]: [],
      },
    });

    const visible = selectVisibleLogs(state as any);
    expect(visible).toHaveLength(1);
    expect(visible[0].message).toBe('match');
  });

  it('handles uiFilter = null', () => {
    const state = createState({
      uiFilter: null,
      levelsByTool: { [GpacLogTool.FILTER]: GpacLogLevel.WARNING },
      buffers: {
        [GpacLogTool.FILTER]: [
          createLog({
            tool: GpacLogTool.FILTER,
            level: LOG_LEVEL_VALUES[GpacLogLevel.ERROR],
            message: 'error',
          }),
          createLog({
            tool: GpacLogTool.FILTER,
            level: LOG_LEVEL_VALUES[GpacLogLevel.INFO],
            message: 'info',
          }),
        ],
        [GpacLogTool.MMIO]: [],
      },
    });

    const visible = selectVisibleLogs(state as any);
    expect(visible).toHaveLength(1);
    expect(visible[0].message).toBe('error');
  });
});
