import type { TimelineItem } from '@/utils/history/timelineViewportView';

export type TimelineLaneId = 'errors' | 'graph' | 'config';

export interface TimelineLaneView {
  id: TimelineLaneId;
  label: string;
  items: TimelineItem[];
}
