import type { FilterStatusViewModel } from './statusViewModel';

export type StatusOverviewState = 'none' | 'summary' | 'graph';

export function getStatusOverviewState(
  groups: FilterStatusViewModel,
): StatusOverviewState {
  const hasGraphable = groups.numericMetrics.some((metric) => metric.graphable);
  if (hasGraphable) return 'graph';

  const hasContent =
    groups.info != null ||
    groups.primaryProgress != null ||
    groups.buffer != null ||
    groups.numericMetrics.length > 0 ||
    groups.textMetrics.length > 0 ||
    groups.stateBadges.length > 0 ||
    groups.arrays.length > 0;

  return hasContent ? 'summary' : 'none';
}
