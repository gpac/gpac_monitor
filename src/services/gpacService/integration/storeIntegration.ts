import { store } from '@/shared/store';
import {
  setFilterDetails,
  updateGraphData,
  setLoading,
} from '@/shared/store/slices/graphSlice';
import { updateSessionStats } from '@/shared/store/slices/sessionStatsSlice';
import { MessageHandlerCallbacks } from '../infrastructure/messageHandler/baseMessageHandler';

export const createStoreCallbacks = (): MessageHandlerCallbacks => ({
  onUpdateGraphData: (data) => store.dispatch(updateGraphData(data)),
  onSetLoading: (loading) => store.dispatch(setLoading(loading)),
  onUpdateSessionStats: (stats) => store.dispatch(updateSessionStats(stats)),
});

export const clearStoreFilters = (): void => {
  store.dispatch(setFilterDetails(null));
};
