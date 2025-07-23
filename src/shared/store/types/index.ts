import { GraphState } from '../slices/graphSlice';
import { WidgetsState } from '../slices/widgetsSlice';
import { MultifilterState } from '../slices/multiFilterSlice';
import { SessionStatsState } from '../slices/sessionStatsSlice';

export interface RootState {
  graph: GraphState;
  widgets: WidgetsState;
  multiFilter: MultifilterState;
  sessionStats: SessionStatsState;
}
