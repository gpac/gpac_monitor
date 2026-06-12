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
  setSystemStats,
  setCommandLine,
} from '@/shared/store/slices/sessionDetailsSlice';
import { MessageHandlerCallbacks } from '../infrastructure/messageHandler/baseMessageHandler';
import { GpacLogEntry } from '@/types/domain/gpac/log-types';
import { parseMetricDefinitions } from '@/workers/metricDefinitionParser';

export const createStoreCallbacks = (): MessageHandlerCallbacks => ({
  onUpdateGraphData: (data) => {
    store.dispatch(filtersUpdated(data));
  },
  onSetLoading: (loading) => store.dispatch(setLoading(loading)),
  onUpdateSessionStats: (stats) => store.dispatch(updateSessionStats(stats)),
  onLogsUpdate: (logs: GpacLogEntry[]) => {
    store.dispatch(appendLogsForAllTools(logs));
  },
  onLogSubscriptionChange: (isSubscribed: boolean) =>
    store.dispatch(setSubscriptionStatus(isSubscribed)),
  onUpdateCpuStats: (stats) => store.dispatch(setSystemStats(stats)),
  onUpdateCommandLine: (commandLine) =>
    store.dispatch(setCommandLine(commandLine)),
  onPidReconfigured: (indexes) => store.dispatch(markPidReconfigured(indexes)),
  onArgUpdated: (indexes) => store.dispatch(markArgUpdated(indexes)),
  onSetMetricDefinitions: (raw) =>
    store.dispatch(setMetricDefinitions(parseMetricDefinitions(raw))),
});
