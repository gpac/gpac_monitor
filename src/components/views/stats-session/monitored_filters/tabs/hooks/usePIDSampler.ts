import { usePIDHistory } from './usePIDHistory';
import type { PIDWithIndex } from '../../../types';

export const usePIDSampler = (
  pids: PIDWithIndex[],
  filterIdx: number,
  direction: 'input' | 'output',
): void => {
  usePIDHistory(pids, filterIdx, direction);
};
