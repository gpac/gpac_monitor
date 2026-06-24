import type { HistoryManifest } from '../source/types';
import type { TimelineEvent, TimelineEventType } from '../types';

const TITLES: Record<TimelineEventType, string> = {
  'graph-change': 'Graph changed',
  'pid-reconfig': 'PID reconfigured',
  'args-change': 'Args changed',
  error: 'Errors',
  warning: 'Warnings',
};

export function deriveTimelineEvents(
  manifest: HistoryManifest,
): TimelineEvent[] {
  return (manifest.eventsIndex ?? []).map((entry) => ({
    id: `${entry.type}_${entry.ts_us}`,
    sessionTimeUs: entry.ts_us - manifest.startUs,
    type: entry.type,
    title: TITLES[entry.type],
  }));
}
