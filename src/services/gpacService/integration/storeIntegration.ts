import { store } from '@/shared/store';
import { setSelectedFilters, updateFilterData } from '@/shared/store/slices/multiFilterSlice';
import { setFilterDetails, updateGraphData, setLoading } from '@/shared/store/slices/graphSlice';
import { updateSessionStats } from '@/shared/store/slices/sessionStatsSlice';
import { MessageHandlerCallbacks } from '../infrastructure/messageHandler/baseMessageHandler'

export const createStoreCallbacks = (): MessageHandlerCallbacks => ({
  onUpdateFilterData: (payload) => store.dispatch(updateFilterData(payload)),
  onUpdateGraphData: (data) => store.dispatch(updateGraphData(data)),
  onSetLoading: (loading) => store.dispatch(setLoading(loading)),
  onSetFilterDetails: (filter) => store.dispatch(setFilterDetails(filter)),
  onUpdateSessionStats: (stats) => store.dispatch(updateSessionStats(stats))
});

export const clearStoreFilters = (): void => {
  store.dispatch(setSelectedFilters([]));
  store.dispatch(setFilterDetails(null));
};