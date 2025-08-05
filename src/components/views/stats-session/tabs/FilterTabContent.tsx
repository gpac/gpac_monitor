import type { EnrichedFilterOverview } from '@/types/domain/gpac/model';
import FilterStatCard from '../monitored_filters/FilterStatCard';
import { useFilterStats } from '../hooks/useFilterStats';

interface FilterTabContentProps {
  filter: EnrichedFilterOverview;
  onCardClick: (idx: number) => void;
  isMonitored: boolean;
  isActive?: boolean; // To know if this tab is currently active
}

export const FilterTabContent: React.FC<FilterTabContentProps> = ({
  filter,
  onCardClick,
  isMonitored,
  isActive = false,
}) => {


  // Subscribe to filter stats only when this tab is active
  const { stats: filterStats, isSubscribed } = useFilterStats(
    filter.idx,
    isActive, // Only subscribe when tab is active
    1000,
  );


  // Merge static filter data with live stats
  const enrichedFilter = filterStats
    ? {
        ...filter,
        status: filterStats.status,
        bytes_done: filterStats.bytes_done,
        bytes_sent: filterStats.bytes_sent,
        pck_done: filterStats.pck_done,
        pck_sent: filterStats.pck_sent,
        time: filterStats.time,
      }
    : filter;

  return (
    <div className="p-4">
      <div className="max-w-md mx-auto">
        <FilterStatCard
          filter={enrichedFilter}
          onClick={onCardClick}
          isMonitored={isMonitored}
        />
        {isSubscribed && (
          <div className="mt-2 text-sm text-green-600">
            🔄 Live stats active
          </div>
        )}
      </div>
    </div>
  );
};
