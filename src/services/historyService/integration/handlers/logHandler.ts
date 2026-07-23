import type { AppDispatch } from '@/shared/store';
import type { LogEvent } from '../../types';
import type {
  GpacLogEntry,
  GpacLogLevel,
  GpacLogTool,
} from '@/types/domain/gpac/log-types';
import {
  appendLogsForAllTools,
  restoreConfig,
} from '@/shared/store/slices/logsSlice';
import { parseConfigChanges } from '@/components/views/logs/utils/configParser';

export function dispatchLogEvent(dispatch: AppDispatch, event: LogEvent): void {
  switch (event.message) {
    case 'log_batch':
      dispatch(appendLogsForAllTools(event.logs));
      break;
    case 'log_config_changed':
      applyLogConfig(dispatch, event.logLevel);
      break;
  }
}

/** Dispatches a run of due LogEvents as one appendLogsForAllTools call per
 *  contiguous log_batch run, instead of one dispatch per line. */
export function dispatchLogEvents(
  dispatch: AppDispatch,
  events: LogEvent[],
): void {
  let accumulatedLogs: GpacLogEntry[] = [];

  function flushLogs(): void {
    if (accumulatedLogs.length === 0) return;

    dispatch(appendLogsForAllTools(accumulatedLogs));
    accumulatedLogs = [];
  }

  for (const event of events) {
    if (event.message === 'log_batch') {
      accumulatedLogs.push(...event.logs);
      continue;
    }

    flushLogs();
    dispatchLogEvent(dispatch, event);
  }

  flushLogs();
}

export function applyLogConfig(dispatch: AppDispatch, logLevel: string): void {
  const changes = parseConfigChanges(logLevel);
  const allEntry = changes.find((entry) => entry.tool === 'all');
  const toolEntries = changes.filter((entry) => entry.tool !== 'all');

  const config: {
    defaultAllLevel?: GpacLogLevel;
    levelsByTool?: Partial<Record<GpacLogTool, GpacLogLevel>>;
  } = {};

  if (allEntry) config.defaultAllLevel = allEntry.level;
  if (toolEntries.length) {
    config.levelsByTool = Object.fromEntries(
      toolEntries.map((entry) => [entry.tool, entry.level]),
    ) as Partial<Record<GpacLogTool, GpacLogLevel>>;
  }

  dispatch(restoreConfig(config));
}
