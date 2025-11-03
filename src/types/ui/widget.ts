import { ReactNode } from 'react';

export enum WidgetType {
  GRAPH = 'graph-monitor',
  AUDIO = 'audio-monitor',
  METRICS = 'system-metrics',
  LOGS = 'logs-monitor',
  FILTERSESSION = 'session-filter-monitor',
}
export interface Widget {
  id: string;
  type: WidgetType;
  title: string;
  x: number;
  y: number;
  w: number;
  h: number;
  isResizable?: boolean;
  isDraggable?: boolean;
  isDetached?: boolean;
  detachedFilterIdx?: number;
  // Floating mode (overlay above sidebar)
  isFloating?: boolean;
  floatingX?: number; // in pixels
  floatingY?: number; // in pixels
  floatingWidth?: number; // in pixels
  floatingHeight?: number; // in pixels
  zIndex?: number;
}
export interface WidgetComponent {
  id: string;
  title: string;
  config: WidgetConfig;
  children?: ReactNode;
}

export type WidgetSetting = string | number | boolean | null | undefined;

export interface WidgetConfig {
  isMaximized: boolean;
  isMinimized: boolean;
  settings: Record<string, WidgetSetting>;
}

export interface WidgetProps {
  id: string;
  config: WidgetConfig;
  isDetached?: boolean;
  detachedFilterIdx?: number;
}
