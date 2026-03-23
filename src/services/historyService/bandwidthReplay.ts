import type { AppDispatch } from '@/shared/store';
import { addNetworkDataPoint } from '@/shared/store/slices/monitoredFilterSlice';
import { formatCompactTime } from '@/utils/formatting';
import type { SessionStatsEvent } from './types';

// Per-session state — reset when a new history session loads
type BandwidthRef = { bytes_sent: number; bytes_done: number; ts_us: number };
let prevBandwidth: Record<string, BandwidthRef> = {};
let sessionStartUs = 0;

/** Reset state. Call from snapshotHydrator when loading a new history session. */
export function resetBandwidthReplay(startUs = 0) {
  prevBandwidth = {};
  sessionStartUs = startUs;
}

/**
 * Compute upload/download rates from a session_stats event and dispatch
 * to the same monitoredFilter slice as live mode.
 * Ensures bandwidth charts behave identically in live and history.
 */
export function dispatchBandwidthPoints(
  evt: SessionStatsEvent,
  dispatch: AppDispatch,
): void {
  const time = formatCompactTime(evt.ts_us - sessionStartUs);

  for (const filter of evt.stats) {
    const filterId = filter.idx.toString();
    const prev = prevBandwidth[filterId];

    if (prev) {
      const deltaTimeSec = (evt.ts_us - prev.ts_us) / 1_000_000;
      if (deltaTimeSec > 0) {
        const uploadRate = Math.max(
          0,
          ((filter.bytes_sent ?? 0) - prev.bytes_sent) / deltaTimeSec,
        );
        const downloadRate = Math.max(
          0,
          ((filter.bytes_done ?? 0) - prev.bytes_done) / deltaTimeSec,
        );
        dispatch(
          addNetworkDataPoint({
            filterId,
            type: 'upload',
            point: { time, timestamp: evt.ts_us, value: uploadRate },
          }),
        );
        dispatch(
          addNetworkDataPoint({
            filterId,
            type: 'download',
            point: { time, timestamp: evt.ts_us, value: downloadRate },
          }),
        );
      }
    }

    prevBandwidth[filterId] = {
      bytes_sent: filter.bytes_sent ?? 0,
      bytes_done: filter.bytes_done ?? 0,
      ts_us: evt.ts_us,
    };
  }
}
