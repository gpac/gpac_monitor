import { GraphState } from '../slices/graphSlice';
import { WidgetsState } from '../slices/widgetsSlice';
import { FilterMonitoringState } from '../slices/filter-monitoringSlice';
import { MultifilterState } from '../slices/multiFilterSlice';

export interface RootState {
  graph: GraphState;
  widgets: WidgetsState;
  filterMonitoring: FilterMonitoringState;
  multiFilter: MultifilterState;
}
