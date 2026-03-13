import type { RootState } from '../../index';

export const selectCommandLine = (state: RootState) =>
  state.sessionDetails.commandLine;

export const selectSystemStats = (state: RootState) =>
  state.sessionDetails.systemStats;
