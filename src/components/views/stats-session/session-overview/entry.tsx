import React, { useMemo, useState, useRef } from 'react';
import { useMultiFilterMonitor } from '@/components/views/stats-session/hooks/useMultiFilterMonitor';
import WidgetWrapper from '@/components/common/WidgetWrapper';
import { WidgetProps } from '@/types/ui/widget';
import { EnrichedFilterOverview, } from '@/types/domain/gpac/model';
import { Tabs, TabsContent } from '@/components/ui/tabs';
import { StatsTabs } from './StatsTabs';
import { DashboardTabContent } from './DashboardTabContent';
import { FilterTabContent } from './FilterTabContent';

const MultiFilterMonitor: React.FC<WidgetProps> = React.memo(
  ({ id, title }) => {
    const {  isLoading, sessionStats, staticFilters } =
      useMultiFilterMonitor();

    const enrichedGraphFilterCollection = useMemo(() => {
      return staticFilters.map(staticFilter => {
            // Trouver les stats dynamiques correspondantes par idx
        const dynamicStats = sessionStats.find(stat => stat.idx === staticFilter.idx);
        if (!dynamicStats) {console.log('[****BUG 0**]No dynamic stats found for filter idx:', staticFilter.idx);}
        
        return {
          // Données statiques du filtre
          ...staticFilter,
          ipid: Object.fromEntries(
            Object.entries(staticFilter.ipid).map(([key, value]) => [
              key, 
              { ...value, buffer: 0, buffer_total: 0 }
            ])
          ),
          opid: Object.fromEntries(
            Object.entries(staticFilter.opid).map(([key, value]) => [
              key, 
              { ...value, buffer: 0, buffer_total: 0 }
            ])
          ),
          // Données dynamiques (priorité aux stats dynamiques si disponibles)
          status: dynamicStats?.status || staticFilter.status,
          bytes_done: dynamicStats?.bytes_done || 0,
          bytes_sent: dynamicStats?.bytes_sent || 0,
          pck_done: dynamicStats?.pck_done || 0,
          pck_sent: dynamicStats?.pck_sent || 0,
          time: dynamicStats?.time || 0,
          tasks: 0,
          errors: 0,
        };
      });
    }, [staticFilters, sessionStats]);
    
 
    
    const [activeTab, setActiveTab] = useState('main');
    const [monitoredFiltersState, setMonitoredFiltersState] = useState<Map<number, EnrichedFilterOverview>>(new Map());
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

    if (isLoading) {
      return (
        <WidgetWrapper id={id} title={title}>
          <div className="flex items-center justify-center h-full">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500" />
          </div>
        </WidgetWrapper>
      );
    }

    if (staticFilters.length === 0) {
      return (
      <WidgetWrapper id={id} title={title}>
        <div className="flex flex-col items-center justify-center h-full p-4 text-gray-400">
        <p>No filters available</p>
        <p className="text-sm mt-2">
          Waiting
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
                loading={isLoading}
                monitoredFilters={monitoredFiltersState}
                onCardClick={handleCardClick}
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
  },
);

MultiFilterMonitor.displayName = 'MultiFilterMonitor';

export default MultiFilterMonitor;
