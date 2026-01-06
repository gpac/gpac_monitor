import { PayloadAction } from '@reduxjs/toolkit';
import { GpacLogTool, GpacLogEntry } from '@/types/domain/gpac/log-types';
import { LogsState } from './logs.types';
import { getAlertKeysForLog } from './logs.helpers';

export const buffersReducers = {
  appendLogs: (
    state: LogsState,
    action: PayloadAction<{ tool: GpacLogTool; logs: GpacLogEntry[] }>,
  ) => {
    const { tool, logs } = action.payload;

    if (logs.length === 0) return;

    const currentBuffer = state.buffers[tool] || [];
    const allLogs = [...currentBuffer, ...logs];

    // Apply ring buffer logic
    if (allLogs.length <= state.maxEntriesPerTool) {
      state.buffers[tool] = allLogs;
    } else {
      state.buffers[tool] = allLogs.slice(-state.maxEntriesPerTool);
    }
  },

  /** Distribute and append logs to appropriate tool buffers based on log.tool property */
  appendLogsForAllTools: (
    state: LogsState,
    action: PayloadAction<GpacLogEntry[]>,
  ) => {
    const logs = action.payload;
    if (logs.length === 0) return;

    const { buffers, maxEntriesPerTool, alertsByFilterKey } = state;

    // 1) push logs and increment alerts
    for (let i = 0; i < logs.length; i++) {
      const log = logs[i];
      const tool = log.tool as GpacLogTool;

      let buffer = buffers[tool];
      if (!buffer) {
        buffer = buffers[tool] = [];
      }

      buffer.push(log);

      // Calculate alerts for ERROR (1), WARNING (2), and INFO (3)
      if (log.level === 1 || log.level === 2 || log.level === 3) {
        // Use helper to get all filter keys (caller and thread_id)
        const filterKeys = getAlertKeysForLog(log);

        // Increment counters for all applicable keys
        for (const filterKey of filterKeys) {
          if (!alertsByFilterKey[filterKey]) {
            alertsByFilterKey[filterKey] = { warnings: 0, errors: 0, info: 0 };
          }

          if (log.level === 1) {
            alertsByFilterKey[filterKey].errors += 1;
          } else if (log.level === 2) {
            alertsByFilterKey[filterKey].warnings += 1;
          } else if (log.level === 3) {
            alertsByFilterKey[filterKey].info += 1;
          }
        }
      }
    }

    // 2) trim per tool
    for (const tool in buffers) {
      const buffer = buffers[tool as GpacLogTool]!;
      const overflow = buffer.length - maxEntriesPerTool;
      if (overflow > 0) {
        // mutation in-place
        buffer.splice(0, overflow);
      }
    }
  },

  /** Update buffer size limit and truncate existing buffers if needed */
  setMaxEntriesPerTool: (state: LogsState, action: PayloadAction<number>) => {
    state.maxEntriesPerTool = action.payload;

    // Apply new limit to all existing buffers
    Object.keys(state.buffers).forEach((tool) => {
      const buffer = state.buffers[tool as GpacLogTool];
      if (buffer.length > action.payload) {
        state.buffers[tool as GpacLogTool] = buffer.slice(-action.payload);
      }
    });
  },
};
