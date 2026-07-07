import { describe, it, expect } from 'vitest';
import { selectLogCounts, selectThreadAlerts } from '../headerSelectors';
import type { RootState } from '../../../index';
import type { LogsState } from '../../../slices/logs/logs.types';
import { GpacLogLevel } from '@/types/domain/gpac/log-types';

const makeLogsState = (overrides: Partial<LogsState> = {}): LogsState => ({
  currentTool: 'core',
  levelsByTool: {} as LogsState['levelsByTool'],
  defaultAllLevel: GpacLogLevel.WARNING,
  visibleToolsFilter: [],
  buffers: {} as LogsState['buffers'],
  maxEntriesPerTool: 1000,
  isSubscribed: false,
  highlightedLogId: null,
  uiFilter: null,
  viewMode: 'perTool',
  timestampMode: 'relative',
  lastSentConfig: {
    levelsByTool: {} as LogsState['levelsByTool'],
    defaultAllLevel: null,
  },
  alertsByFilterKey: {},
  ...overrides,
});

const makeState = (logs: LogsState): RootState =>
  ({ logs }) as unknown as RootState;

describe('selectLogCounts', () => {
  it('returns same reference when a new log batch keeps the same counts', () => {
    const state1 = makeState(
      makeLogsState({
        buffers: {
          core: [
            {
              timestamp: 0,
              tool: 'core',
              level: GpacLogLevel.ERROR,
              message: 'a',
            },
          ],
        } as LogsState['buffers'],
      }),
    );
    // New `logs` object reference (as a real log batch would produce), same counts
    const state2 = makeState(
      makeLogsState({
        buffers: {
          core: [
            {
              timestamp: 1,
              tool: 'core',
              level: GpacLogLevel.ERROR,
              message: 'a',
            },
          ],
        } as LogsState['buffers'],
      }),
    );

    expect(selectLogCounts(state1)).toBe(selectLogCounts(state1));
    expect(selectLogCounts(state1)).toEqual(selectLogCounts(state2));
  });

  it('returns new value when counts actually change', () => {
    const state1 = makeState(
      makeLogsState({ buffers: {} as LogsState['buffers'] }),
    );
    const state2 = makeState(
      makeLogsState({
        buffers: {
          core: [
            {
              timestamp: 0,
              tool: 'core',
              level: GpacLogLevel.ERROR,
              message: 'a',
            },
          ],
        } as LogsState['buffers'],
      }),
    );

    expect(selectLogCounts(state1)).not.toEqual(selectLogCounts(state2));
  });
});

describe('selectThreadAlerts', () => {
  it('returns same reference across recomputes when alert totals are unchanged', () => {
    const alertsByFilterKey = { 't:1': { errors: 2, warnings: 0, info: 0 } };
    const first = selectThreadAlerts(
      makeState(makeLogsState({ alertsByFilterKey })),
    );
    const second = selectThreadAlerts(
      makeState(makeLogsState({ alertsByFilterKey: { ...alertsByFilterKey } })),
    );

    expect(second).toBe(first);
  });

  it('returns a new reference when a thread alert count changes', () => {
    const first = selectThreadAlerts(
      makeState(
        makeLogsState({
          alertsByFilterKey: { 't:1': { errors: 2, warnings: 0, info: 0 } },
        }),
      ),
    );
    const second = selectThreadAlerts(
      makeState(
        makeLogsState({
          alertsByFilterKey: { 't:1': { errors: 3, warnings: 0, info: 0 } },
        }),
      ),
    );

    expect(second).not.toBe(first);
  });
});
