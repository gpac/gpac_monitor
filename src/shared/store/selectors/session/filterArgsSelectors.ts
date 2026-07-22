import type { RootState } from '../../types';

export const selectFilterArgs = (state: RootState, filterIdx: string) =>
  state.filterArgument.argsByFilter[filterIdx];
