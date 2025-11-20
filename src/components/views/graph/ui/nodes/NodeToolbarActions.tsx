import React, { memo, useCallback } from 'react';
import { NodeToolbar, Position, useReactFlow } from '@xyflow/react';
import { LuLayoutList } from 'react-icons/lu';
import { useAppDispatch } from '@/shared/hooks/redux';
import {
  requestFilterOpen,
  clearSelectedNode,
} from '@/shared/store/slices/graphSlice';

interface NodeToolbarActionsProps {
  filterIdx: number;
  filterName: string;
}

const NodeToolbarActions: React.FC<NodeToolbarActionsProps> = ({
  filterIdx,
}) => {
  const dispatch = useAppDispatch();
  const { setNodes } = useReactFlow();

  const handleOpenInputs = useCallback(() => {
    dispatch(requestFilterOpen({ filterIdx, initialTab: 'inputs' }));
    dispatch(clearSelectedNode());
    // Deselect all nodes in React Flow to hide the toolbar
    setNodes((nodes) => nodes.map((n) => ({ ...n, selected: false })));
  }, [dispatch, filterIdx, setNodes]);

  return (
    <NodeToolbar position={Position.Top} align="start" offset={8}>
      <div className="flex items-center gap-1 bg-monitor-panel border border-slate-700 rounded-lg p-1 shadow-lg">
        <button
          onClick={handleOpenInputs}
          className="flex items-center gap-1.5 px-2 py-1 text-xs font-medium text-slate-200 hover:bg-slate-900 rounded transition-colors"
          title="View Inputs"
        >
          <LuLayoutList className="w-3.5 h-3.5" />
          See IPIDS
        </button>
      </div>
    </NodeToolbar>
  );
};

export default memo(NodeToolbarActions);
