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
import { addStatusMetricSamples } from '@/shared/store/slices/monitoredFilterSlice';
import {
  appendLogsForAllTools,
  setSubscriptionStatus,
} from '@/shared/store/slices/logsSlice';
import { parseFilterStatus } from '@/workers/filterStatusParser';
import { extractGraphableStatusMetrics } from '@/utils/metrics/statusMetricGraph';
import { buildStatusMetricKey } from '@/components/views/stats-session/types/statusMetric';
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
  onUpdateSessionStats: (payload) => {
    store.dispatch(updateSessionStats(payload));
    if (!Array.isArray(payload) && payload.ts_us !== undefined) {
      const { stats, ts_us } = payload as {
        stats: { idx: number; status: string }[];
        ts_us: number;
      };
      const samples = stats.flatMap((stat) => {
        if (!stat.status) return [];
        const parsed = parseFilterStatus(stat.status);
        return extractGraphableStatusMetrics(parsed).map((metric) => ({
          key: buildStatusMetricKey(stat.idx, metric.key),
          sample: { sessionTimestampUs: ts_us, value: metric.value },
        }));
      });
      if (samples.length) store.dispatch(addStatusMetricSamples(samples));
    }
  },
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
