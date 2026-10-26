import { Widget, WidgetConfig } from '@/types/ui/widget';
import type { InitialTabType } from '@/shared/store/slices/graphSlice';

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

export interface FilterView {
  mode: ViewMode;
  widgetId?: string;
  activeTab?: InitialTabType;
}

export interface WidgetsState {
  activeWidgets: Widget[];
  configs: Record<string, WidgetConfig>;
  savedLayouts: Record<string, LayoutState>;
  viewByFilter: Record<number, FilterView | undefined>;
  currentLayout?: string;
}
