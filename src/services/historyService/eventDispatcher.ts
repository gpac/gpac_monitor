import type { AppDispatch } from '@/shared/store';
import { updateGraphData } from '@/shared/store/slices/graphSlice';
import {
  updateSessionStats,
  setFilterPids,
} from '@/shared/store/slices/sessionStatsSlice';
import {
  applyArgUpdate,
  hydrateFilterArgs,
} from '@/shared/store/slices/filterArgumentSlice';
import type {
  HistoryEvent,
  FiltersEvent,
  SessionStatsEvent,
  FilterArgsUpdateEvent,
} from './types';
import {
  toGraphFilterData,
  buildPidsByFilter,
  buildArgsByFilter,
} from './snapshotHydrator';

type EventHandler = (event: HistoryEvent, dispatch: AppDispatch) => void;

const handleFilters: EventHandler = (event, dispatch) => {
  const evt = event as FiltersEvent;
  dispatch(updateGraphData(evt.filters.map(toGraphFilterData)));

  const filtersWithProps = evt.filters.filter((f) => f.properties);
  if (filtersWithProps.length) {
    const pidsFromProps = filtersWithProps.map((f) => ({
      ...f,
      ipids: f.properties!.ipids,
      opids: f.properties!.opids,
    }));
    dispatch(setFilterPids(buildPidsByFilter(pidsFromProps)));
  }

  const argsByFilter = buildArgsByFilter(evt.filters);
  if (Object.keys(argsByFilter).length) {
    dispatch(hydrateFilterArgs(argsByFilter));
  }
};

const handleSessionStats: EventHandler = (event, dispatch) => {
  const evt = event as SessionStatsEvent;
  dispatch(updateSessionStats({ stats: evt.stats as any, ts_us: evt.ts_us }));
};

const handleFilterArgsUpdate: EventHandler = (event, dispatch) => {
  const evt = event as FilterArgsUpdateEvent;
  dispatch(
    applyArgUpdate({
      filterIdx: evt.payload.filter_idx.toString(),
      argName: evt.payload.arg_name,
      value: evt.payload.value,
    }),
  );
};

const handlers: Record<string, EventHandler> = {
  filters: handleFilters,
  session_stats: handleSessionStats,
  filter_args_update: handleFilterArgsUpdate,
  // cpu_stats: skipped in V2 (not stored in Redux yet)
};

/**
 * Dispatch a single history event to the appropriate Redux reducer.
 */
export function dispatchEvent(
  event: HistoryEvent,
  dispatch: AppDispatch,
): void {
  const handler = handlers[event.message];
  if (handler) {
    handler(event, dispatch);
  }
}
