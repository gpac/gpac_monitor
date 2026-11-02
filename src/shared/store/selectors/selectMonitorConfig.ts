import type { RootState } from '../index';
import { PREVIEW_MIN_WS_PROTOCOL_VERSION } from '@/services/ws/protocolVersion';

export const selectCpuStatsInterval = (state: RootState): number =>
  state.monitorConfig.intervals.CPU_STATS;

export const selectSessionStatsInterval = (state: RootState): number =>
  state.monitorConfig.intervals.SESSION_STATS;

export const selectFilterStatsInterval = (state: RootState): number =>
  state.monitorConfig.intervals.FILTER_STATS;

export const selectIsPreviewSupported = (state: RootState): boolean => {
  const version = state.monitorConfig.serverProtocolVersion;
  return version !== undefined && version >= PREVIEW_MIN_WS_PROTOCOL_VERSION;
};
