import { GpacLogTool } from '@/types/domain/gpac/log-types';
import { getInitialLogsState } from './logs.storage';
import { LogsState } from './logs.types';

/** Initial state with empty buffers for all GPAC tools */
const createInitialState = (): LogsState => {
  const state = getInitialLogsState();

  // Initialize empty buffers for all GPAC tools
  Object.values(GpacLogTool).forEach((tool) => {
    state.buffers[tool] = [];
  });

  return state;
};

export const initialState: LogsState = createInitialState();
