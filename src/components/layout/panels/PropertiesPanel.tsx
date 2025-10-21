import React, { useCallback, useState } from 'react';
import { FiSettings } from 'react-icons/fi';
import { useAppDispatch, useAppSelector } from '@/shared/hooks/redux';
import { setSelectedNode } from '@/shared/store/slices/widgetsSlice';
import FilterArgumentsContent from '../../filtersArgs/FilterArgumentsContent';
import PropertiesHeader from './PropertiesHeader';

/**
 * Properties panel - Pure container (style only).
 * Displays filter arguments when a node is selected.
 */
const PropertiesPanel: React.FC = () => {
  const dispatch = useAppDispatch();
  const selectedNode = useAppSelector((state) => state.widgets.selectedNode);
  const [showExpert, setShowExpert] = useState(false);
  const [showAdvanced, setShowAdvanced] = useState(false);

  const handleClose = useCallback(() => {
    dispatch(setSelectedNode(null));
  }, [dispatch]);

  // Empty state
  if (!selectedNode) {
    return (
      <div className="flex flex-col bg-monitor-panel items-center justify-center p-4 text-center ring-1 ring-monitor-line rounded-xl mt-4">
        + <FiSettings className="w-12 h-12 text-monitor-text-muted mb-3" />+{' '}
        <h3 className="text-sm font-medium text-monitor-text-secondary mb-1">
          No nodes selected
        </h3>
        <p className="text-xs text-monitor-text-muted">
          Click on a node to see its properties
        </p>
      </div>
    );
  }

  return (
    <div className="flex flex-col mt-4 flex-1 bg-monitor-surface border border-monitor-line">
      {/* Header - sticky */}
      <div className="sticky top-0 z-20 bg-monitor-surface border-b border-monitor-line">
        <PropertiesHeader
          filterName={selectedNode.name}
          showExpert={showExpert}
          showAdvanced={showAdvanced}
          onToggleExpert={setShowExpert}
          onToggleAdvanced={setShowAdvanced}
          onClose={handleClose}
        />
      </div>
      {/* Content - scrollable */}
      <div className="flex-1 overflow-y-auto">
        {Array.isArray(selectedNode.gpac_args) &&
        selectedNode.gpac_args.length > 0 ? (
          <FilterArgumentsContent
            filterId={selectedNode.idx}
            filterArgs={selectedNode.gpac_args}
            showExpert={showExpert}
            showAdvanced={showAdvanced}
          />
        ) : (
          <div className="text-center text-monitor-text-muted py-6 text-xs">
            No arguments available
          </div>
        )}
      </div>
    </div>
  );
};

export default PropertiesPanel;
