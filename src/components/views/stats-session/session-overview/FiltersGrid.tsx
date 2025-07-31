import React from 'react';
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

export const FiltersGrid: React.FC<FiltersGridProps> = ({
  filtersWithLiveStats,
  filtersMatchingCriteria,
  monitoredFilters,
  onCardClick,
}) => {
  // DEBUG: Log pour comprendre pourquoi seulement 2 filtres s'affichent
  console.log('[FiltersGrid] Props:', {
    filtersWithLiveStatsCount: filtersWithLiveStats?.length || 0,
    filtersMatchingCriteriaCount: filtersMatchingCriteria?.length || 0,
    filtersWithLiveStats: filtersWithLiveStats,
    filtersMatchingCriteria: filtersMatchingCriteria,
  });
  return (
    <div className="flex flex-col h-full">
      <div className="mb-4 flex items-center justify-between">
        <h2 className="flex items-center gap-2 text-lg font-semibold">
          Filters
          <Badge variant="secondary" className="ml-1 h-6 text-sm">
            {filtersMatchingCriteria.length}
          </Badge>
        </h2>
      </div>

      <ScrollArea className="flex-1">
        {filtersMatchingCriteria.length > 0 ? (
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {filtersWithLiveStats.map((enrichedFilterOverview) => (
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
                <h3 className="text-lg font-medium mb-2">No filters found</h3>
              </div>
            </div>
          </div>
        )}
      </ScrollArea>
    </div>
  );
};
