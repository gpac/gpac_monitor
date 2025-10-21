import React, { memo, useMemo } from 'react';
import { EnrichedFilterOverview } from '@/types/domain/gpac/model';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import FilterStatCard from '../monitored_filters/FilterStatCard';

interface FiltersGridProps {
  filtersWithLiveStats: EnrichedFilterOverview[];
  filtersMatchingCriteria: EnrichedFilterOverview[];
  loading: boolean;
  monitoredFilters: Map<number, EnrichedFilterOverview>;
  onCardClick: (filterIndex: number) => void;
}

export const FiltersGrid: React.FC<FiltersGridProps> = memo(
  ({
    filtersWithLiveStats,
    filtersMatchingCriteria,
    monitoredFilters,
    onCardClick,
  }) => {
    // Memoize the filters count to avoid recalculation
    const filtersCount = useMemo(
      () => filtersMatchingCriteria.length,
      [filtersMatchingCriteria.length],
    );

    // Memoize the filtered and sorted data
    const sortedFilters = useMemo(() => {
      return filtersWithLiveStats.sort((a, b) => {
        // Prioritize monitored filters first
        const aMonitored = monitoredFilters.has(a.idx || -1);
        const bMonitored = monitoredFilters.has(b.idx || -1);
        if (aMonitored && !bMonitored) return -1;
        if (!aMonitored && bMonitored) return 1;

        // Then sort by activity (bytes processed)
        return (b.bytes_done || 0) - (a.bytes_done || 0);
      });
    }, [filtersWithLiveStats, monitoredFilters]);

    return (
      <div className="flex flex-col h-full">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="flex items-center gap-2 text-lg font-semibold">
            Filters
            <Badge
              variant="secondary"
              className="ml-1 h-6 text-sm text-info tabular-nums"
            >
              {filtersCount}
            </Badge>
          </h2>
        </div>

        <ScrollArea className="flex-1">
          {filtersCount > 0 ? (
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
              {sortedFilters.map((enrichedFilterOverview) => (
                <FilterStatCard
                  key={
                    enrichedFilterOverview.idx ||
                    enrichedFilterOverview.ID ||
                    enrichedFilterOverview.name
                  }
                  filter={enrichedFilterOverview}
                  onClick={onCardClick}
                  isMonitored={monitoredFilters.has(
                    enrichedFilterOverview.idx || -1,
                  )}
                />
              ))}
            </div>
          ) : (
            <div className="flex items-center justify-center h-full">
              <div className="text-center space-y-4 p-8">
                <div className="rounded-lg border bg-card/50 p-8 shadow-sm">
                  <h3 className="text-lg font-medium mb-2 stat">
                    No filters found
                  </h3>
                </div>
              </div>
            </div>
          )}
        </ScrollArea>
      </div>
    );
  },
);

FiltersGrid.displayName = 'FiltersGrid';
