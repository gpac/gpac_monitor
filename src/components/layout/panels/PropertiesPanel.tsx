import React, { useState, useCallback, useEffect } from 'react';
import { FiSettings } from 'react-icons/fi';
import { useAppSelector } from '@/shared/hooks/redux';
import { useSidebar } from '@/shared/hooks/useSidebar';
import FilterArgumentsContent from '@/components/filtersArgs/FilterArgumentsContent';
import IPIDPropertiesContent from '../../IPIDProperties/IPIDPropertiesContent';
import PropertiesHeader from './PropertiesHeader';
import { useFetchIPIDProperties } from './hooks/useFetchIPIDProperties';
import { useFilterArgsSubscription } from '../../filtersArgs/hooks/useFilterArgsSubscription';

const PropertiesPanel: React.FC = () => {
  const { sidebarContent, closeSidebar } = useSidebar();
  const filters = useAppSelector((state) => state.graph.filters);

  const getFilterName = (filterIdx: number): string => {
    const filter = filters.find((f) => f.idx === filterIdx);
    return filter?.name || `Filter ${filterIdx}`;
  };

  // Local state for filter args visibility options
  const [showExpert, setShowExpert] = useState(false);
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  // Determine filterIdx and ipidIdx based on sidebar content
  const filterIdxForPid =
    sidebarContent?.type === 'pid-props' ? sidebarContent.filterIdx : undefined;
  const ipidIdx =
    sidebarContent?.type === 'pid-props' ? sidebarContent.ipidIdx : undefined;
  const filterIdxForArgs =
    sidebarContent?.type === 'filter-args'
      ? sidebarContent.filterIdx
      : undefined;

  const ipidProperties = useFetchIPIDProperties(filterIdxForPid, ipidIdx);
  const filterArgs = useFilterArgsSubscription(filterIdxForArgs);

  // Reset search when sidebar content changes
  useEffect(() => {
    setSearchQuery('');
  }, [sidebarContent]);

  const handleSearchChange = useCallback((query: string) => {
    setSearchQuery(query);
  }, []);

  // Empty state
  if (!sidebarContent) {
    return (
      <div className="flex flex-col bg-monitor-panel items-center justify-center p-4 text-center ring-1 ring-monitor-line rounded-xl mt-4">
        <FiSettings className="w-12 h-12 text-monitor-text-muted mb-3" />
        <h3 className="text-sm font-medium text-monitor-text-secondary mb-1">
          No selection
        </h3>
        <p className="text-xs text-monitor-text-muted">
          Click on a filter settings to see properties
        </p>
      </div>
    );
  }

  // Render based on content type
  return (
    <div className="flex flex-col mt-4 flex-1 bg-monitor-surface border border-monitor-line">
      {/* Header - sticky */}
      <div className="sticky top-0 z-20 bg-monitor-surface border-b border-monitor-line">
        {sidebarContent.type === 'pid-props' ? (
          <PropertiesHeader
            filterName={`${getFilterName(sidebarContent.filterIdx)} IPIDs`}
            mode="ipid"
            onClose={closeSidebar}
            onSearchChange={handleSearchChange}
          />
        ) : sidebarContent.type === 'filter-args' ? (
          <PropertiesHeader
            filterName={sidebarContent.filterName}
            mode="filter"
            showExpert={showExpert}
            showAdvanced={showAdvanced}
            onToggleExpert={setShowExpert}
            onToggleAdvanced={setShowAdvanced}
            onClose={closeSidebar}
            onSearchChange={handleSearchChange}
          />
        ) : null}
      </div>

      {/* Content - scrollable */}
      <div className="flex-1 overflow-y-auto">
        {sidebarContent.type === 'pid-props' ? (
          <IPIDPropertiesContent
            properties={ipidProperties}
            searchQuery={searchQuery}
          />
        ) : sidebarContent.type === 'filter-args' ? (
          Array.isArray(filterArgs) && filterArgs.length > 0 ? (
            <FilterArgumentsContent
              filterId={sidebarContent.filterIdx}
              filterArgs={filterArgs}
              showExpert={showExpert}
              showAdvanced={showAdvanced}
              searchQuery={searchQuery}
            />
          ) : (
            <div className="text-center text-monitor-text-muted py-6 text-xs">
              Loading arguments...
            </div>
          )
        ) : null}
      </div>
    </div>
  );
};

export default PropertiesPanel;
