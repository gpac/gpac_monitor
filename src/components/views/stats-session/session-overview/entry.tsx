import React, { useMemo, useState, useRef } from 'react';
import { useMultiFilterMonitor } from '@/components/views/stats-session/hooks/useMultiFilterMonitor';
import WidgetWrapper from '@/components/common/WidgetWrapper';
import { WidgetProps } from '@/types/ui/widget';
import { GpacNodeData } from '@/types/domain/gpac/model';
import FilterStatCard from '../FilterStatCard';
import { Tabs, TabsContent } from '@/components/ui/tabs';
import { StatsTabs } from './StatsTabs';
import { DashboardTabContent } from './DashboardTabContent';
import { FilterTabContent } from './FilterTabContent';

const MultiFilterMonitor: React.FC<WidgetProps> = React.memo(
  ({ id, title }) => {
    const { selectedFilters, isLoading, sessionStats, staticFilters } =
      useMultiFilterMonitor(id);
    

    
    const enrichedGraphFilterCollection = useMemo(() => 
      staticFilters.map(graphFilterDefinition => {
        // Trouver les statistiques de session correspondantes
        const matchingDynamicFilterData = Object.values(sessionStats).find(filterStat => filterStat.idx === graphFilterDefinition.idx);
        
        return {
          // Données statiques (base du graphe)
          name: graphFilterDefinition.name,
          type: graphFilterDefinition.type,
          idx: graphFilterDefinition.idx,
          nb_ipid: graphFilterDefinition.nb_ipid,
          nb_opid: graphFilterDefinition.nb_opid,
          ipid: graphFilterDefinition.ipid,
          opid: graphFilterDefinition.opid,
          tasks: graphFilterDefinition.tasks,
          itag: graphFilterDefinition.itag,
          ID: graphFilterDefinition.ID,
          errors: graphFilterDefinition.errors,
          
          // Données dynamiques (statistiques de session si disponibles)
          status: matchingDynamicFilterData?.status || graphFilterDefinition.status,
          bytes_done: matchingDynamicFilterData?.bytes_done || graphFilterDefinition.bytes_done,
          pck_done: matchingDynamicFilterData?.pck_done || graphFilterDefinition.pck_done,
          pck_sent: matchingDynamicFilterData?.pck_sent || graphFilterDefinition.pck_sent,
          time: matchingDynamicFilterData?.time || graphFilterDefinition.time,
          pck_ifce_sent: matchingDynamicFilterData?.pck_sent || graphFilterDefinition.pck_ifce_sent,
        } as GpacNodeData;
      }), 
      [staticFilters, sessionStats]
    );
    
    const monitoredFilterLookupMap = useMemo(() => 
      new Map(enrichedGraphFilterCollection.map(filterData => [filterData.idx, filterData])), 
      [enrichedGraphFilterCollection]
    );
    
    const [activeTab, setActiveTab] = useState('main');
    const [monitoredFiltersState, setMonitoredFiltersState] = useState<Map<number, GpacNodeData>>(new Map());
    const tabsRef = useRef<HTMLDivElement>(null);

    const handleCardClick = (idx: number) => {
      const filter = enrichedGraphFilterCollection.find(f => f.idx === idx);
      if (filter) {
        setMonitoredFiltersState(prev => {
          const newMap = new Map(prev);
          newMap.set(idx, filter);
          return newMap;
        });
        setActiveTab(`filter-${idx}`);
      }
    };

    const handleCloseTab = (idx: number, e: React.MouseEvent) => {
      e.stopPropagation();
      setMonitoredFiltersState(prev => {
        const newMap = new Map(prev);
        newMap.delete(idx);
        return newMap;
      });
      if (activeTab === `filter-${idx}`) {
        setActiveTab('main');
      }
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
      if (staticFilters.length === 0) {
        return (
          <WidgetWrapper id={id} title={title}>
            <div className="flex flex-col items-center justify-center h-full p-4 text-gray-400">
              <p>No filters available</p>
              <p className="text-sm mt-2">
                Waiting for graph construction...
              </p>
            </div>
          </WidgetWrapper>
        );
      }

      return (
        <WidgetWrapper id={id} title="Session-stats Overview">
          <div className="h-full">
            <Tabs value={activeTab} onValueChange={setActiveTab} className="h-full flex flex-col">
              <StatsTabs
                activeTab={activeTab}
                onValueChange={setActiveTab}
                monitoredFilters={monitoredFiltersState}
                onCloseTab={handleCloseTab}
                tabsRef={tabsRef}
              />
              
              <TabsContent value="main" className="flex-1 p-4">
                <DashboardTabContent
              
                  systemStats={{
                    activeFilters: enrichedGraphFilterCollection.filter(f => f.status === 'active').length,
                    totalBytes: enrichedGraphFilterCollection.reduce((sum, f) => sum + f.bytes_done, 0),
                    totalPackets: enrichedGraphFilterCollection.reduce((sum, f) => sum + f.pck_done, 0)
                  }}
                  filtersWithLiveStats={enrichedGraphFilterCollection}
                  filtersMatchingCriteria={enrichedGraphFilterCollection}
                  rawFiltersFromServer={enrichedGraphFilterCollection}
                  loading={isLoading}
                  monitoredFilters={monitoredFiltersState}
                  onCardClick={handleCardClick}
                  onRefreshFilters={handleRefreshFilters}
                  refreshInterval="1000"
                />
              </TabsContent>

              {Array.from(monitoredFiltersState.entries()).map(([idx, filter]) => (
                <TabsContent key={`filter-${idx}`} value={`filter-${idx}`} className="flex-1">
                  <FilterTabContent
                    filter={filter}
                    onCardClick={handleCardClick}
                    isMonitored={true}
                  />
                </TabsContent>
              ))}
            </Tabs>
          </div>
        </WidgetWrapper>
      );
    }

    return (
      <WidgetWrapper id={id} title={title}>
        <div className="h-full">
          <Tabs value={activeTab} onValueChange={setActiveTab} className="h-full flex flex-col">
            <StatsTabs
              activeTab={activeTab}
              onValueChange={setActiveTab}
              monitoredFilters={monitoredFiltersState}
              onCloseTab={handleCloseTab}
              tabsRef={tabsRef}
            />
            
            <TabsContent value="main" className="flex-1 overflow-auto p-4">
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
                      isMonitored={monitoredFilterLookupMap.has(filter.nodeData.idx)}
                    />
                  </div>
                ))}
              </div>
            </TabsContent>

            {Array.from(monitoredFiltersState.entries()).map(([idx, filter]) => (
              <TabsContent key={`filter-${idx}`} value={`filter-${idx}`} className="flex-1">
                <FilterTabContent
                  filter={filter}
                  onCardClick={handleCardClick}
                  isMonitored={true}
                />
              </TabsContent>
            ))}
          </Tabs>
        </div>
      </WidgetWrapper>
    );
  },
);

MultiFilterMonitor.displayName = 'MultiFilterMonitor';

export default MultiFilterMonitor;
