import type { TimelineEventType } from '@/services/historyService/types';

export const EVENT_TYPE_COLOR: Record<TimelineEventType, string> = {
  error: 'bg-red-500',
  warning: 'bg-yellow-400',
  'graph-change': 'bg-purple-400',
  'pid-reconfig': 'bg-cyan-400',
  'args-change': 'bg-yellow-400',
};
