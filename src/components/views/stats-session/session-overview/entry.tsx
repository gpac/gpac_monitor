import React, {  useMemo } from 'react';
import { useMultiFilterMonitor } from '@/components/views/stats-session/hooks/useMultiFilterMonitor';
import WidgetWrapper from '@/components/common/WidgetWrapper';
import { WidgetProps } from '@/types/ui/widget';
import { GPACFilterStats } from '@/components/views/stats-session/types';
import { FiltersGrid } from '@/components/views/stats-session/session-overview/FiltersGrid';
import { GpacNodeData } from '@/types/domain/gpac/model';
import FilterStatCard from '../FilterStatCard';

const MultiFilterMonitor: React.FC<WidgetProps> = React.memo(
  ({ id, title }) => {
    const { selectedFilters, isLoading, sessionStats } =
      useMultiFilterMonitor(id);
    

    
    const sessionFiltersArray = useMemo(() => 
      Object.values(sessionStats) as GPACFilterStats[], 
      [sessionStats]
    );
    
    const filtersAsGpacNodes = useMemo(() => 
      sessionFiltersArray.map(stats => ({
        name: `Filter ${stats.idx}`,
        type: 'filter',
        idx: stats.idx,
        status: stats.status,
        bytes_done: stats.bytes_done,
        pck_done: stats.pck_done,
        pck_sent: stats.pck_sent,
        time: stats.time,
        nb_ipid: stats.nb_ipid,
        nb_opid: stats.nb_opid,
        tasks: 0,
        itag: null,
        ID: null,
        errors: 0,
        pck_ifce_sent: stats.pck_sent,
        ipid: {},
        opid: {}
      } as GpacNodeData)), 
      [sessionFiltersArray]
    );
    
    const monitoredFiltersMap = useMemo(() => 
      new Map(filtersAsGpacNodes.map(filter => [filter.idx, filter])), 
      [filtersAsGpacNodes]
    );
    
    const handleCardClick = (idx: number) => {
      console.log('Filter clicked:', idx);
    };
    
    const handleRefreshFilters = () => {
      console.log('Refresh filters');
    };

    if (isLoading) {
      return (
        <WidgetWrapper id={id} title={title}>
          <div className="flex items-center justify-center h-full">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500" />
          </div>
        </WidgetWrapper>
      );
    }

    if (selectedFilters.length === 0) {
      if (sessionFiltersArray.length === 0) {
        return (
          <WidgetWrapper id={id} title={title}>
            <div className="flex flex-col items-center justify-center h-full p-4 text-gray-400">
              <p>No session data available</p>
              <p className="text-sm mt-2">
                Waiting for session statistics...
              </p>
            </div>
          </WidgetWrapper>
        );
      }

      return (
        <WidgetWrapper id={id} title="Session-stats Overview">
          <div className="h-full p-4">
            <FiltersGrid
              filtersWithLiveStats={filtersAsGpacNodes}
              filtersMatchingCriteria={filtersAsGpacNodes}
              rawFiltersFromServer={filtersAsGpacNodes}
              loading={isLoading}
              monitoredFilters={monitoredFiltersMap}
              onCardClick={handleCardClick}
              onRefreshFilters={handleRefreshFilters}
            />
          </div>
        </WidgetWrapper>
      );
    }

    return (
      <WidgetWrapper id={id} title={title}>
        <div className="h-full flex flex-col overflow-hidden">
          <div className="flex-1 overflow-auto p-4">
            <div
              className="grid gap-6 auto-rows-[600px] grid-cols-1 xl:grid-cols-2 2xl:grid-cols-3"
              style={{
                minHeight: 'min-content',
                height: '100%',
              }}
            >
              {selectedFilters.map((filter) => (
                <div key={`filter-${filter.nodeData.idx}`} className="h-full">
                  <FilterStatCard
                    filter={filter.nodeData}
                    onClick={handleCardClick}
                    isMonitored={monitoredFiltersMap.has(filter.nodeData.idx)}
                  />
                </div>
              ))}
            </div>
          </div>
        </div>
      </WidgetWrapper>
    );
  },
);

MultiFilterMonitor.displayName = 'MultiFilterMonitor';

export default MultiFilterMonitor;
