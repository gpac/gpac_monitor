import React, { useCallback } from 'react';
import { IoClose } from 'react-icons/io5';
import { FiSettings } from 'react-icons/fi';
import { useAppDispatch, useAppSelector } from '@/shared/hooks/redux';
import { setSelectedNode } from '@/shared/store/slices/widgetsSlice';
import FilterArgumentsContent from '../filtersArgs/FilterArgumentsContent';

/**
 * Properties panel - Pure container (style only).
 * Displays filter arguments when a node is selected.
 */
const PropertiesPanel: React.FC = () => {
  const dispatch = useAppDispatch();
  const selectedNode = useAppSelector((state) => state.widgets.selectedNode);

  const handleClose = useCallback(() => {
    dispatch(setSelectedNode(null));
  }, [dispatch]);

  // Empty state
  if (!selectedNode) {
    return (
      <div className="flex flex-col items-center justify-center p-4 text-center border-t border-gray-800 mt-4">
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
    <div className="flex flex-col border-t border-transparent mt-4 flex-1 bg-slate-950 overflow-hidden">
      {/* Header - sticky */}
      <div className="shrink-0 px-3 pt-3 pb-2 bg-slate-950 border-b border-gray-700/50">
        <div className="flex items-center justify-between">
          <div className="flex-1 min-w-0">
            <h3 className="text-sm font-semibold text-ui text-gray-100 truncate">
              {selectedNode.name}
            </h3>
            <p className="text-xs text-gray-400">Properties</p>
          </div>
          <button
            onClick={handleClose}
            className="p-1 hover:bg-gray-800 rounded transition-colors shrink-0"
            aria-label="Close panel"
          >
            <IoClose className="w-4 h-4 text-gray-400" />
          </button>
        </div>
      </div>

      {/* Content - scrollable */}
      <div className="flex-1 overflow-y-auto">
        {Array.isArray(selectedNode.gpac_args) &&
        selectedNode.gpac_args.length > 0 ? (
          <FilterArgumentsContent
            filterId={selectedNode.idx}
            filterArgs={selectedNode.gpac_args}
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
