import { store } from '@/shared/store';
import {
  setLoading,
  markPidReconfigured,
  markArgUpdated,
} from '@/shared/store/slices/graphSlice';
import { filtersUpdated } from '@/shared/store/actions/globalActions';
import {
  updateSessionStats,
  setMetricDefinitions,
} from '@/shared/store/slices/sessionStatsSlice';
import {
  appendLogsForAllTools,
  setSubscriptionStatus,
} from '@/shared/store/slices/logsSlice';
import {
  setParsedStatuses,
  addStatusMetricSamples,
} from '@/shared/store/slices/monitoredFilterSlice';
import { selectMetricDefinitions } from '@/shared/store/selectors';
import {
  buildStatusSamplesFromStats,
  buildStatusSamplesFromParsed,
} from '@/utils/metrics/statusMetricGraph';
import { selectSessionStartUs } from '@/shared/store/selectors/session/sessionStatsSelectors';
import { selectParsedStatus } from '@/shared/store/selectors/monitoredFilter';
import { MessageHandlerCallbacks } from '../infrastructure/messageHandler/baseMessageHandler';
import { GpacLogEntry } from '@/types/domain/gpac/log-types';
import { extractParsedStatuses } from './extractParsedStatuses';

export const createStoreCallbacks = (): MessageHandlerCallbacks => ({
  onUpdateGraphData: (data) => {
    store.dispatch(filtersUpdated(data));
  },
  onSetLoading: (loading) => store.dispatch(setLoading(loading)),
  onUpdateSessionStats: (payload) => {
    store.dispatch(updateSessionStats(payload));
    const state = store.getState();
    const samples = buildStatusSamplesFromStats(
      payload.stats ?? [],
      payload.ts_us,
      selectSessionStartUs(state),
      selectMetricDefinitions(state),
    );
    if (samples.length > 0) store.dispatch(addStatusMetricSamples(samples));
  },
  onUpdateFilterStats: (payload) => {
    const state = store.getState();
    const parsedStatus = selectParsedStatus(state, payload.idx);
    const samples = buildStatusSamplesFromParsed(
      { [payload.idx]: parsedStatus },
      payload.ts_us,
      selectSessionStartUs(state),
    );
    if (samples.length > 0) store.dispatch(addStatusMetricSamples(samples));
  },
  onLogsUpdate: (logs: GpacLogEntry[]) => {
    store.dispatch(appendLogsForAllTools(logs));
  },
  onLogSubscriptionChange: (isSubscribed: boolean) =>
    store.dispatch(setSubscriptionStatus(isSubscribed)),
  onPidReconfigured: (indexes: number[]) =>
    store.dispatch(markPidReconfigured(indexes)),
  onArgUpdated: (indexes: number[]) => store.dispatch(markArgUpdated(indexes)),
  onSetMetricDefinitions: (definitions) =>
    store.dispatch(setMetricDefinitions(definitions)),
  onFilterStatuses: (entries) =>
    store.dispatch(
      setParsedStatuses(
        extractParsedStatuses(
          entries,
          selectMetricDefinitions(store.getState()),
        ),
      ),
    ),
});
