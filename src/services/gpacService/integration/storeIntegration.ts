import { store } from '@/shared/store';
import {
  setFilterDetails,
  updateGraphData,
  setLoading,
} from '@/shared/store/slices/graphSlice';
import { updateSessionStats } from '@/shared/store/slices/sessionStatsSlice';
import {
  appendLogsForAllTools,
  setSubscriptionStatus,
} from '@/shared/store/slices/logsSlice';
import { MessageHandlerCallbacks } from '../infrastructure/messageHandler/baseMessageHandler';
import { GpacLogEntry } from '@/types/domain/gpac/log-types';

export const createStoreCallbacks = (): MessageHandlerCallbacks => ({
  onUpdateGraphData: (data) => store.dispatch(updateGraphData(data)),
  onSetLoading: (loading) => store.dispatch(setLoading(loading)),
  onUpdateSessionStats: (stats) => store.dispatch(updateSessionStats(stats)),
  onLogsUpdate: (logs: GpacLogEntry[]) => {
    console.log(
      '[storeIntegration] onLogsUpdate called with',
      logs?.length || 0,
      'logs',
    );
    console.log('[storeIntegration] logs data:', logs);
    console.log('[storeIntegration] Dispatching appendLogsForAllTools...');
    store.dispatch(appendLogsForAllTools(logs));
    console.log('[storeIntegration] appendLogsForAllTools dispatched');
  },
  onLogSubscriptionChange: (isSubscribed: boolean) =>
    store.dispatch(setSubscriptionStatus(isSubscribed)),
});

export const clearStoreFilters = (): void => {
  store.dispatch(setFilterDetails(null));
};
