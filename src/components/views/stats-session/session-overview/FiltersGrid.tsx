import React from 'react';
import { GpacNodeData } from '@/types/domain/gpac/model';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import FilterStatCard from '../FilterStatCard';

interface FiltersGridProps {
  filtersWithLiveStats: GpacNodeData[];
  filtersMatchingCriteria: GpacNodeData[];
  rawFiltersFromServer: GpacNodeData[];
  loading: boolean;
  monitoredFilters: Map<number, GpacNodeData>;
  onCardClick: (idx: number) => void;
  onRefreshFilters: () => void;
}

export const FiltersGrid: React.FC<FiltersGridProps> = ({
  filtersWithLiveStats,
  filtersMatchingCriteria,
  rawFiltersFromServer,
  loading,
  monitoredFilters,
  onCardClick,
  onRefreshFilters
}) => {
  return (
    <div className="flex flex-col h-full">
      <div className="mb-4 flex items-center justify-between">
        <h2 className="flex items-center gap-2 text-lg font-semibold">
          Filters
          <Badge variant="secondary" className="ml-1 h-6 text-sm">
            {filtersMatchingCriteria.length}
          </Badge>
        </h2>
        <Button 
          variant="outline" 
          size="sm" 
          onClick={onRefreshFilters}
          disabled={loading}
        >
          {loading ? 'Loading...' : 'Refresh'}
        </Button>
      </div>

      <ScrollArea className="flex-1">
        {filtersMatchingCriteria.length > 0 ? (
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {filtersWithLiveStats.map((filter) => (
              <FilterStatCard
                key={filter.idx || filter.ID || filter.name}
                filter={filter}
                onClick={onCardClick}
                isMonitored={monitoredFilters.has(filter.idx || -1)}
              />
            ))}
          </div>
        ) : (
          <div className="flex items-center justify-center h-full">
            <div className="text-center space-y-4 p-8">
              <div className="rounded-lg border bg-card/50 p-8 shadow-sm">
                <h3 className="text-lg font-medium mb-2">No filters found</h3>
                <p className="text-sm text-muted-foreground mb-4">
                  {rawFiltersFromServer.length > 0
                    ? 'Try adjusting your search criteria or filters'
                    : 'No filters are currently available from the server'}
                </p>
                {rawFiltersFromServer.length === 0 && !loading && (
                  <Button 
                    variant="outline" 
                    onClick={onRefreshFilters}
                    className="mt-2"
                  >
                    Refresh filters
                  </Button>
                )}
              </div>
            </div>
          </div>
        )}
      </ScrollArea>
    </div>
  );
};