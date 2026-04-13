import { store } from '@/shared/store';
import {
  setLoading,
  markPidReconfigured,
  markArgUpdated,
} from '@/shared/store/slices/graphSlice';
import { filtersUpdated } from '@/shared/store/actions/globalActions';
import { updateSessionStats } from '@/shared/store/slices/sessionStatsSlice';
import {
  appendLogsForAllTools,
  setSubscriptionStatus,
} from '@/shared/store/slices/logsSlice';
import { MessageHandlerCallbacks } from '../infrastructure/messageHandler/baseMessageHandler';
import { GpacLogEntry } from '@/types/domain/gpac/log-types';

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
  onPidReconfigured: (indexes: number[]) =>
    store.dispatch(markPidReconfigured(indexes)),
  onArgUpdated: (indexes: number[]) => store.dispatch(markArgUpdated(indexes)),
});
