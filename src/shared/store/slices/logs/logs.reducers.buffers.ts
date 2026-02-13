import { PayloadAction } from '@reduxjs/toolkit';
import { GpacLogTool, GpacLogEntry } from '@/types/domain/gpac/log-types';
import { LogsState } from './logs.types';
import { getAlertKeysForLog, trimBuffer } from './logs.helpers';

export const buffersReducers = {
  appendLogs: (
    state: LogsState,
    action: PayloadAction<{ tool: GpacLogTool; logs: GpacLogEntry[] }>,
  ) => {
    const { tool, logs } = action.payload;

    if (logs.length === 0) return;

    let buffer = state.buffers[tool];
    if (!buffer) {
      buffer = state.buffers[tool] = [];
    }

    // Push all logs (mutation in-place with Immer)
    buffer.push(...logs);

    // Trim if overflow
    const overflow = buffer.length - state.maxEntriesPerTool;
    if (overflow > 0) {
      buffer.splice(0, overflow);
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
    const modifiedTools = new Set<GpacLogTool>();

    // 1) push logs and increment alerts
    for (let i = 0; i < logs.length; i++) {
      const log = logs[i];
      const tool = log.tool as GpacLogTool;

      let buffer = buffers[tool];
      if (!buffer) {
        buffer = buffers[tool] = [];
      }

      buffer.push(log);
      modifiedTools.add(tool);

      // Calculate alerts for ERROR (1), WARNING (2), and INFO (3)
      if (log.level === 1 || log.level === 2 || log.level === 3) {
        // Increment directly for caller if present (avoid array allocation)
        if (log.caller !== null && log.caller !== undefined) {
          const callerKey = String(log.caller);
          if (!alertsByFilterKey[callerKey]) {
            alertsByFilterKey[callerKey] = { warnings: 0, errors: 0, info: 0 };
          }
          if (log.level === 1) {
            alertsByFilterKey[callerKey].errors += 1;
          } else if (log.level === 2) {
            alertsByFilterKey[callerKey].warnings += 1;
          } else {
            alertsByFilterKey[callerKey].info += 1;
          }
        }

        // Increment directly for thread_id if present
        if (log.thread_id !== undefined) {
          const threadKey = `t:${log.thread_id}`;
          if (!alertsByFilterKey[threadKey]) {
            alertsByFilterKey[threadKey] = { warnings: 0, errors: 0, info: 0 };
          }
          if (log.level === 1) {
            alertsByFilterKey[threadKey].errors += 1;
          } else if (log.level === 2) {
            alertsByFilterKey[threadKey].warnings += 1;
          } else {
            alertsByFilterKey[threadKey].info += 1;
          }
        }
      }
    }

    // 2) smart trim (respects BUFFER_TRIM_PRIORITY) + sync alert counters
    for (const tool of modifiedTools) {
      const buffer = buffers[tool]!;
      const overflow = buffer.length - maxEntriesPerTool;
      if (overflow <= 0) continue;
      const removed = trimBuffer(buffer, overflow);
      for (const log of removed) {
        if (log.level < 1 || log.level > 3) continue;
        for (const key of getAlertKeysForLog(log)) {
          const a = alertsByFilterKey[key];
          if (!a) continue;
          if (log.level === 1) a.errors--;
          else if (log.level === 2) a.warnings--;
          else a.info--;
          if (a.errors + a.warnings + a.info <= 0)
            delete alertsByFilterKey[key];
        }
      }
    }
  },

  /** Update buffer size limit and truncate existing buffers if needed */
  setMaxEntriesPerTool: (state: LogsState, action: PayloadAction<number>) => {
    state.maxEntriesPerTool = action.payload;

    // Apply new limit to all existing buffers
    Object.keys(state.buffers).forEach((tool) => {
      const buffer = state.buffers[tool as GpacLogTool];
      const overflow = buffer.length - action.payload;
      if (overflow > 0) {
        buffer.splice(0, overflow);
      }
    });
  },
};
