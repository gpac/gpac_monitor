import { Widget, WidgetType } from '@/types';
import { LuFileText, LuGauge, LuShare2, LuVolume2 } from 'react-icons/lu';
import { TbFilterCog } from 'react-icons/tb';
import { IconType } from 'react-icons';
import LogsMonitor from '../views/logs/LogsMonitor';
import MetricsMonitor from '../views/cpu/MetricsMonitor';
import AudioMonitor from '../views/audio/AudioMonitor';
import GraphMonitor from '../views/graph/GraphMonitor';
import MultiFilterMonitor from '../views/stats-session/session-overview/entry';
import { generateID } from '@/utils/core';

export interface WidgetDefinition {
  type: WidgetType;
  title: string;
  icon: IconType;
  component: React.ElementType;
  defaultSize: { w: number; h: number };
  defaultPosition?: { x: number; y: number };
  defaultZIndex?: number;
  description?: string;
  enabled: boolean;
  fixedPosition?: boolean;
}

export const widgetRegistry: Record<WidgetType, WidgetDefinition> = {
  [WidgetType.FILTERSESSION]: {
    type: WidgetType.FILTERSESSION,
    title: 'Session Filters',
    icon: TbFilterCog,
    component: MultiFilterMonitor,
    defaultSize: { w: 24, h: 6 },
    defaultPosition: { x: 0, y: 0 },
    defaultZIndex: 1000,
    description: 'Manage session filters effectively.',
    enabled: true,
  },
  [WidgetType.GRAPH]: {
    type: WidgetType.GRAPH,
    title: 'Pipeline Graph',
    icon: LuShare2,
    component: GraphMonitor,
    defaultSize: { w: 18, h: 4 },
    defaultPosition: { x: 10, y: 0 },
    defaultZIndex: 1004,
    description: 'Visualize the processing pipeline graph.',
    enabled: true,
  },
  [WidgetType.METRICS]: {
    type: WidgetType.METRICS,
    title: 'System Metrics',
    icon: LuGauge,
    component: MetricsMonitor,
    defaultSize: { w: 6, h: 6 },
    defaultPosition: { x: 0, y: 6 },
    defaultZIndex: 1001,
    description: 'Display real-time system performance metrics.',
    enabled: true,
  },
  [WidgetType.LOGS]: {
    type: WidgetType.LOGS,
    title: 'System Logs',
    icon: LuFileText,
    component: LogsMonitor,
    defaultSize: { w: 18, h: 2 },
    defaultPosition: { x: 6, y: 6 },
    defaultZIndex: 1002,
    description: 'View and filter system logs.',
    enabled: true,
  },
  [WidgetType.AUDIO]: {
    type: WidgetType.AUDIO,
    title: 'Audio Monitor',
    icon: LuVolume2,
    component: AudioMonitor,
    defaultSize: { w: 8, h: 4 },
    defaultPosition: { x: 16, y: 6 },
    defaultZIndex: 1003,
    description: 'Monitor audio levels in real-time.',
    enabled: false,
  },
};

export const createWidgetInstance = (type: WidgetType): Widget | null => {
  const def = widgetRegistry[type];
  if (!def || !def.enabled) return null;

  const id = generateID(type);
  const { w, h } = def.defaultSize;
  const { x = 0, y = 0 } = def.defaultPosition || {};

  return {
    id,
    type,
    title: def.title,
    x,
    y,
    w,
    h,
    fixedPosition: def.fixedPosition,
  };
};

export const getAllWidgets = () => Object.values(widgetRegistry);
export const getWidgetDefinition = (type: WidgetType) => widgetRegistry[type];
