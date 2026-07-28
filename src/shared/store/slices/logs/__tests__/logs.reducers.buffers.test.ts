import { describe, it, expect } from 'vitest';
import { configureStore } from '@reduxjs/toolkit';
import logsReducer, { appendLogsForAllTools, clearLogs } from '../logs.slice';
import { GpacLogTool } from '@/types/domain/gpac/log-types';

const makeStore = () => configureStore({ reducer: { logs: logsReducer } });

const makeLog = (tool: GpacLogTool, level: number) => ({
  timestamp: 1000,
  tool,
  level,
  message: 'test',
});

describe('clearLogs', () => {
  it('empties all tool buffers', () => {
    const store = makeStore();
    store.dispatch(
      appendLogsForAllTools([
        makeLog(GpacLogTool.FILTER, 4),
        makeLog(GpacLogTool.CORE, 2),
      ]),
    );

    store.dispatch(clearLogs());

    const { buffers } = store.getState().logs;
    Object.values(GpacLogTool).forEach((tool) => {
      expect(buffers[tool]).toEqual([]);
    });
  });

  it('resets alertsByFilterKey', () => {
    const store = makeStore();
    store.dispatch(
      appendLogsForAllTools([
        { ...makeLog(GpacLogTool.FILTER, 2), caller: '42' },
      ]),
    );
    expect(store.getState().logs.alertsByFilterKey['42']).toBeDefined();

    store.dispatch(clearLogs());

    expect(store.getState().logs.alertsByFilterKey).toEqual({});
  });
});
