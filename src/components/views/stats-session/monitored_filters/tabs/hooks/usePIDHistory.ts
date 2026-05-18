import { useEffect } from 'react';
import { useDispatch } from 'react-redux';
import { addPIDSamples } from '@/shared/store/slices/monitoredFilterSlice';
import { buildPIDKey } from '@/components/views/stats-session/types/pid';
import type { PIDWithIndex } from '@/components/views/stats-session/types';

export const usePIDHistory = (
  pids: PIDWithIndex[],
  filterIdx: number,
  direction: 'input' | 'output',
): void => {
  const dispatch = useDispatch();

  useEffect(() => {
    if (pids.length === 0) return;

    const nowUs = Date.now() * 1000;

    dispatch(
      addPIDSamples(
        pids.map((pid) => {
          const stats = pid.stats;
          return {
            key: buildPIDKey(filterIdx, direction, pid.pidIdx),
            sample: {
              sessionTimestampUs: nowUs,
              averageBitrate:
                stats && stats.average_bitrate >= 0
                  ? stats.average_bitrate
                  : null,
              bufferTime: stats?.buffer_time ?? null,
              processTime: stats?.average_process_time ?? null,
              processRate:
                stats && stats.average_process_rate >= 0
                  ? stats.average_process_rate
                  : null,
            },
          };
        }),
      ),
    );
  }, [pids, filterIdx, direction, dispatch]);
};
