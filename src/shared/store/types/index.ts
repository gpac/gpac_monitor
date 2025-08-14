import { GraphState } from '../slices/graphSlice';
import { WidgetsState } from '../slices/widgetsSlice';
import { SessionStatsState } from '../slices/sessionStatsSlice';
import { filterArgumentSlice } from '../slices/filterArgumentSlice';

export interface RootState {
  graph: GraphState;
  widgets: WidgetsState;
  sessionStats: SessionStatsState;
  filterArgument: ReturnType<typeof filterArgumentSlice.reducer>;
}
