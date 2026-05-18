import { usePIDHistory } from './usePIDHistory';
import type { PIDWithIndex } from '../../../types';

type LiveOptions = { mode: 'live'; clockUs: number; wallTimeMs: number };
type HistoryOptions = {
  mode: 'history';
  sessionTimestampUs: number;
  wallTimeMs: number;
};

export const usePIDSampler = (
  pids: PIDWithIndex[],
  filterIdx: number,
  direction: 'input' | 'output',
  options: LiveOptions | HistoryOptions,
): void => {
  const sessionTimestampUs =
    options.mode === 'live' ? options.clockUs : options.sessionTimestampUs;
  usePIDHistory(pids, filterIdx, direction, sessionTimestampUs);
};
