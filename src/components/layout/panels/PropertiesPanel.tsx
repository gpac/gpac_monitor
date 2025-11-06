import React, { useCallback, useState } from 'react';
import { FiSettings } from 'react-icons/fi';
import { useAppDispatch, useAppSelector } from '@/shared/hooks/redux';
import { setSelectedEdge } from '@/shared/store/slices/graphSlice';
import { setSelectedFilterForArgs } from '@/shared/store/slices/filterArgumentSlice';
import { closeSidebar } from '@/shared/store/slices/layoutSlice';
import FilterArgumentsContent from '@/components/filtersArgs/FilterArgumentsContent';
import IPIDPropertiesContent from '../../IPIDProperties/IPIDPropertiesContent';
import PropertiesHeader from './PropertiesHeader';
import { useFetchIPIDProperties } from './hooks/useFetchIPIDProperties';
import { useFilterArgsSubscription } from '../../filtersArgs/hooks/useFilterArgsSubscription';

const PropertiesPanel: React.FC = () => {
  const dispatch = useAppDispatch();

  // Redux state
  const selectedEdge = useAppSelector((state) => state.graph.selectedEdge);
  const selectedFilterForArgs = useAppSelector(
    (state) => state.filterArgument.selectedFilterForArgs,
  );
  const filters = useAppSelector((state) => state.graph.filters);

  const getFilterName = (filterIdx: number): string => {
    const filter = filters.find((f) => f.idx === filterIdx);
    return filter?.name || `Filter ${filterIdx}`;
  };

  // Local state for filter args visibility options
  const [showExpert, setShowExpert] = useState(false);
  const [showAdvanced, setShowAdvanced] = useState(false);

  const ipidProperties = useFetchIPIDProperties(
    selectedEdge?.filterIdx,
    selectedEdge?.ipidIdx,
  );
  const filterArgs = useFilterArgsSubscription(selectedFilterForArgs?.idx);

  // Close handlers
  const handleCloseEdge = useCallback(() => {
    dispatch(setSelectedEdge(null));
    dispatch(closeSidebar());
  }, [dispatch]);

  const handleCloseFilterArgs = useCallback(() => {
    dispatch(setSelectedFilterForArgs(null));
    dispatch(closeSidebar());
  }, [dispatch]);

  // Determine mode
  const mode = selectedEdge ? 'ipid' : selectedFilterForArgs ? 'filter' : null;

  // Empty state
  if (!mode) {
    return (
      <div className="flex flex-col bg-monitor-panel items-center justify-center p-4 text-center ring-1 ring-monitor-line rounded-xl mt-4">
        <FiSettings className="w-12 h-12 text-monitor-text-muted mb-3" />
        <h3 className="text-sm font-medium text-monitor-text-secondary mb-1">
          No selection
        </h3>
        <p className="text-xs text-monitor-text-muted">
          Click on an edge or filter settings to see properties
        </p>
      </div>
    );
  }

  // Render based on mode
  return (
    <div className="flex flex-col mt-4 flex-1 bg-monitor-surface border border-monitor-line">
      {/* Header - sticky */}
      <div className="sticky top-0 z-20 bg-monitor-surface border-b border-monitor-line">
        {mode === 'ipid' && selectedEdge ? (
          <PropertiesHeader
            filterName={`${getFilterName(selectedEdge.filterIdx)} IPIDs`}
            mode="ipid"
            onClose={handleCloseEdge}
          />
        ) : mode === 'filter' && selectedFilterForArgs ? (
          <PropertiesHeader
            filterName={selectedFilterForArgs.name}
            mode="filter"
            showExpert={showExpert}
            showAdvanced={showAdvanced}
            onToggleExpert={setShowExpert}
            onToggleAdvanced={setShowAdvanced}
            onClose={handleCloseFilterArgs}
          />
        ) : null}
      </div>

      {/* Content - scrollable */}
      <div className="flex-1 overflow-y-auto">
        {mode === 'ipid' ? (
          <IPIDPropertiesContent properties={ipidProperties} />
        ) : mode === 'filter' && selectedFilterForArgs ? (
          Array.isArray(filterArgs) && filterArgs.length > 0 ? (
            <FilterArgumentsContent
              filterId={selectedFilterForArgs.idx}
              filterArgs={filterArgs}
              showExpert={showExpert}
              showAdvanced={showAdvanced}
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
