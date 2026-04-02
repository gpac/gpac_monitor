import type { AppDispatch } from '@/shared/store';
import type { LogEvent } from '../../types';
import type { GpacLogLevel, GpacLogTool } from '@/types/domain/gpac/log-types';
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

function applyLogConfig(dispatch: AppDispatch, logLevel: string): void {
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
