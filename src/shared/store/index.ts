import { configureStore } from '@reduxjs/toolkit';
import graphReducer from './slices/graphSlice';
import widgetsReducer from './slices/widgetsSlice';
import filterArgumentSlice from './slices/filterArgumentSlice';
import sessionStatsReducer from './slices/sessionStatsSlice';
import logsReducer from './slices/logsSlice';
import layoutReducer from './slices/layoutSlice';
import monitoredFilterReducer from './slices/monitoredFilterSlice';

export const store = configureStore({
  reducer: {
    graph: graphReducer,
    filterArgument: filterArgumentSlice,
    logs: logsReducer,
    widgets: widgetsReducer,
    sessionStats: sessionStatsReducer,
    layout: layoutReducer,
    monitoredFilter: monitoredFilterReducer,
  },
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware({
      serializableCheck: {
        // Ignore these action types
        ignoredActions: ['graph/updateGraphData', 'graph/updateNodeData'],
      },
    }),
});
export type AppDispatch = typeof store.dispatch;
export type RootState = ReturnType<typeof store.getState>;
