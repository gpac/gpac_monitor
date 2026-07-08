import type { RootState } from '../index';

export const selectCpuStatsInterval = (state: RootState): number =>
  state.monitorConfig.intervals.CPU_STATS;

export const selectSessionStatsInterval = (state: RootState): number =>
  state.monitorConfig.intervals.SESSION_STATS;

export const selectFilterStatsInterval = (state: RootState): number =>
  state.monitorConfig.intervals.FILTER_STATS;
