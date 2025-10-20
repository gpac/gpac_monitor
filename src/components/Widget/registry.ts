import { Widget, WidgetType } from '@/types';
import { LuFileText, LuGauge, LuShare2, LuVolume2 } from 'react-icons/lu';
import { FiLayout } from 'react-icons/fi';
import { IconType } from 'react-icons';
import LogsMonitor from '../views/logs/LogsMonitor';
import MetricsMonitor from '../views/cpu/MetricsMonitor';
import AudioMonitor from '../views/audio/AudioMonitor';
import GraphMonitor from '../views/graph/GraphMonitor';
import MultiFilterMonitor from '../views/stats-session/session-overview/entry';
import { generateID } from '@/utils/id';

export interface WidgetDefinition {
  type: WidgetType;
  title: string;
  icon: IconType;
  component: React.ElementType;
  defaultSize: { w: number; h: number };
  defaultPosition?: { x: number; y: number };
  description?: string;
  enabled: boolean;
}

export const widgetRegistry: Record<WidgetType, WidgetDefinition> = {
  [WidgetType.AUDIO]: {
    type: WidgetType.AUDIO,
    title: 'Audio Monitor',
    icon: LuVolume2,
    component: AudioMonitor,
    defaultSize: { w: 4, h: 4 },
    defaultPosition: { x: 9, y: 8 },
    description: 'Monitor audio levels in real-time.',
    enabled: false,
  },
  [WidgetType.METRICS]: {
    type: WidgetType.METRICS,
    title: 'System Metrics',
    icon: LuGauge,
    component: MetricsMonitor,
    defaultSize: { w: 5, h: 6 },
    defaultPosition: { x: 8, y: 0 },
    description: 'Display real-time system performance metrics.',
    enabled: true,
  },
  [WidgetType.LOGS]: {
    type: WidgetType.LOGS,
    title: 'System Logs',
    icon: LuFileText,
    component: LogsMonitor,
    defaultSize: { w: 5, h: 6 },
    defaultPosition: { x: 9, y: 8 },
    description: 'View and filter system logs.',
    enabled: true,
  },
  [WidgetType.GRAPH]: {
    type: WidgetType.GRAPH,
    title: 'Pipeline Graph',
    icon: LuShare2,
    component: GraphMonitor,
    defaultSize: { w: 7, h: 6 },
    defaultPosition: { x: 0, y: 8 },
    description: 'Visualize the processing pipeline graph.',
    enabled: true,
  },
  [WidgetType.FILTERSESSION]: {
    type: WidgetType.FILTERSESSION,
    title: 'Session Filters',
    icon: FiLayout,
    component: MultiFilterMonitor,
    defaultSize: { w: 7, h: 6 },
    defaultPosition: { x: 0, y: 0 },
    description: 'Manage session filters effectively.',
    enabled: true,
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
  };
};

export const getAllWidgets = () => Object.values(widgetRegistry);
export const getWidgetDefinition = (type: WidgetType) => widgetRegistry[type];
