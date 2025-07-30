import { configureStore } from '@reduxjs/toolkit';
import graphReducer from './slices/graphSlice';
import widgetsReducer from './slices/widgetsSlice';
import multiFilterReducer from './slices/multiFilterSlice';
import filterArgumentSlice from './slices/filterArgumentSlice';
import sessionStatsReducer from './slices/sessionStatsSlice';

export const store = configureStore({
  reducer: {
    graph: graphReducer,
    filterArgument: filterArgumentSlice,

    widgets: widgetsReducer,
    multiFilter: multiFilterReducer,
    sessionStats: sessionStatsReducer,
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
export type AppThunk<ReturnType = void> = ReturnType;
