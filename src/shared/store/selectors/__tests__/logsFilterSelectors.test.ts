import { describe, it, expect, beforeEach } from 'vitest';
import { selectVisibleLogs } from '../logs/logsFilterSelectors';
import type { RootState } from '../../index';
import type { LogsState } from '../../slices/logs/logs.types';
import {
  GpacLogLevel,
  GpacLogTool,
  GpacLogEntry,
  LOG_LEVEL_VALUES,
} from '@/types/domain/gpac/log-types';

const makeLog = (
  timestamp: number,
  tool: GpacLogTool,
  level: GpacLogLevel,
): GpacLogEntry => ({
  timestamp,
  tool,
  level: LOG_LEVEL_VALUES[level],
  message: `log ${timestamp}`,
});

const makeLogsState = (overrides: Partial<LogsState> = {}): LogsState => ({
  currentTool: GpacLogTool.FILTER,
  levelsByTool: {} as Record<GpacLogTool, GpacLogLevel>,
  defaultAllLevel: GpacLogLevel.INFO,
  visibleToolsFilter: [],
  buffers: {} as Record<GpacLogTool, GpacLogEntry[]>,
  maxEntriesPerTool: 2000,
  isSubscribed: false,
  highlightedLogId: null,
  uiFilter: null,
  viewMode: 'perTool',
  timestampMode: 'relative',
  lastSentConfig: {
    levelsByTool: {} as Record<GpacLogTool, GpacLogLevel>,
    defaultAllLevel: null,
  },
  alertsByFilterKey: {},
  ...overrides,
});

const makeState = (logsState: LogsState): RootState =>
  ({ logs: logsState }) as unknown as RootState;

describe('selectVisibleLogs', () => {
  beforeEach(() => {
    selectVisibleLogs.resetRecomputations();
  });

  it('returns logs for the current tool filtered by level', () => {
    const state = makeState(
      makeLogsState({
        currentTool: GpacLogTool.FILTER,
        defaultAllLevel: GpacLogLevel.WARNING,
        buffers: {
          [GpacLogTool.FILTER]: [
            makeLog(1, GpacLogTool.FILTER, GpacLogLevel.ERROR),
            makeLog(2, GpacLogTool.FILTER, GpacLogLevel.INFO),
          ],
        } as Record<GpacLogTool, GpacLogEntry[]>,
      }),
    );

    const result = selectVisibleLogs(state);
    expect(result).toHaveLength(1);
    expect(result[0].timestamp).toBe(1);
  });

  it('returns empty array when buffers are empty', () => {
    const state = makeState(makeLogsState());
    expect(selectVisibleLogs(state)).toHaveLength(0);
  });

  it('does NOT recompute when only highlightedLogId changes', () => {
    const buffers = {
      [GpacLogTool.FILTER]: [makeLog(1, GpacLogTool.FILTER, GpacLogLevel.INFO)],
    } as Record<GpacLogTool, GpacLogEntry[]>;

    const state1 = makeState(
      makeLogsState({ buffers, highlightedLogId: null }),
    );
    const state2 = makeState(
      makeLogsState({ buffers, highlightedLogId: 'some-log-id' }),
    );

    const result1 = selectVisibleLogs(state1);
    const recomputationsBefore = selectVisibleLogs.recomputations();

    const result2 = selectVisibleLogs(state2);

    expect(result1).toBe(result2);
    expect(selectVisibleLogs.recomputations()).toBe(recomputationsBefore);
  });

  it('recomputes when buffers change', () => {
    const state1 = makeState(
      makeLogsState({
        buffers: {
          [GpacLogTool.FILTER]: [
            makeLog(1, GpacLogTool.FILTER, GpacLogLevel.INFO),
          ],
        } as Record<GpacLogTool, GpacLogEntry[]>,
      }),
    );
    const state2 = makeState(
      makeLogsState({
        buffers: {
          [GpacLogTool.FILTER]: [
            makeLog(1, GpacLogTool.FILTER, GpacLogLevel.INFO),
            makeLog(2, GpacLogTool.FILTER, GpacLogLevel.WARNING),
          ],
        } as Record<GpacLogTool, GpacLogEntry[]>,
      }),
    );

    const result1 = selectVisibleLogs(state1);
    const result2 = selectVisibleLogs(state2);

    expect(result1).not.toBe(result2);
    expect(result2).toHaveLength(2);
  });

  it('shows all tools in ALL mode (visibleToolsFilter with 2+ tools)', () => {
    const state = makeState(
      makeLogsState({
        currentTool: GpacLogTool.FILTER,
        visibleToolsFilter: [GpacLogTool.FILTER, GpacLogTool.CORE],
        defaultAllLevel: GpacLogLevel.INFO,
        buffers: {
          [GpacLogTool.FILTER]: [
            makeLog(1, GpacLogTool.FILTER, GpacLogLevel.INFO),
          ],
          [GpacLogTool.CORE]: [
            makeLog(2, GpacLogTool.CORE, GpacLogLevel.ERROR),
          ],
        } as Record<GpacLogTool, GpacLogEntry[]>,
      }),
    );

    const result = selectVisibleLogs(state);
    expect(result).toHaveLength(2);
  });
});
