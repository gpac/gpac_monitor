import { Widget, WidgetConfig } from '@/types/ui/widget';
import type { InitialTabType } from '@/shared/store/slices/graphSlice';
import type { PIDMetricMode } from '@/components/views/stats-session/types/pid';

export interface RootState {
  widgets: WidgetsState;
}

export interface LayoutState {
  name: string;
  widgets: Widget[];
  configs: Record<string, WidgetConfig>;
  createdAt: string;
}

export type ViewMode = 'inline' | 'detached';

export interface OpenPreviews {
  input: number[];
  output: number[];
}

export interface FilterView {
  mode: ViewMode;
  widgetId?: string;
  activeTab?: InitialTabType;
  pidMetricMode?: PIDMetricMode;
  openPreviews?: OpenPreviews;
}

export interface WidgetsState {
  activeWidgets: Widget[];
  configs: Record<string, WidgetConfig>;
  savedLayouts: Record<string, LayoutState>;
  viewByFilter: Record<number, FilterView | undefined>;
  currentLayout?: string;
}
