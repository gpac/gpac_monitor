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
      <div className="flex flex-col items-center justify-center p-4 text-center border-t border-transparent mt-4">
        <FiSettings className="w-12 h-12 text-gray-600 mb-3" />
        <h3 className="text-sm font-medium text-gray-400 mb-1">
          No nodes selected
        </h3>
        <p className="text-xs text-gray-500">
          Click on a node to see its properties
        </p>
      </div>
    );
  }

  return (
    <div className="flex flex-col border-t border-transparent mt-4 flex-1 bg-slate-950 ">
      {/* Header - sticky */}
      <div className="sticky top-0 z-20 bg-slate-950 border-b border-gray-700/50">
        <PropertiesHeader
          filterName={selectedNode.name}
          showExpert={showExpert}
          showAdvanced={showAdvanced}
          onToggleExpert={setShowExpert}
          onToggleAdvanced={setShowAdvanced}
          onClose={handleClose}
        />
      </div>
      m{/* Content - scrollable */}
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
          <div className="text-center text-gray-500 py-6 text-xs">
            No arguments available
          </div>
        )}
      </div>
    </div>
  );
};

export default PropertiesPanel;
