import type { MonitoredFilterStats } from '@/types/domain/gpac';
import type { SessionFilterStatistics } from '@/types/domain/gpac/filter-stats';

export interface FilterStatsResult {
  stats: MonitoredFilterStats | null;
  isLoading: boolean;
  isSubscribed: boolean;
}

export interface SessionStatsResult {
  stats: SessionFilterStatistics[];
  isSubscribed: boolean;
}
