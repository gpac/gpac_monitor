import React, { memo } from 'react';
import {
  ReactFlow,
  MiniMap,
  Background,
  Node,
  Edge,
  NodeChange,
  EdgeChange,
  NodeMouseHandler,
  Controls,
} from '@xyflow/react';
import '@xyflow/react/dist/style.css';
import CustomNode from '../nodes/CustomNode';
import GraphLegend from './GraphLegend';
import { useMinimapNavigation } from '../../hooks/layout/useMinimapNavigation';
import { getImmediateGraphColor } from '../../hooks/layout/useGraphColors';
import { useAppDispatch } from '@/shared/hooks/redux';
import { closeSidebar } from '@/shared/store/slices/layoutSlice';

interface GraphFlowProps {
  nodes: Node[];
  edges: Edge[];
  onNodesChange: (changes: NodeChange[]) => void;
  onEdgesChange: (changes: EdgeChange[]) => void;
  onNodeClick?: NodeMouseHandler;
  isResizing?: boolean;
}

const flowStyles = {
  surface: '#101722',
  background: '',
  width: '100%',
  height: '100%',
};
const nodeTypes = {
  gpacer: CustomNode,
};

const GraphFlow: React.FC<GraphFlowProps> = ({
  nodes,
  edges,
  onNodesChange,
  onEdgesChange,
  onNodeClick,
  isResizing = false,
}) => {
  const dispatch = useAppDispatch();
  const { handleMiniMapClick, handleMiniMapDrag } = useMinimapNavigation();

  // Close sidebar when clicking on empty area of the graph
  const handlePaneClick = () => {
    dispatch(closeSidebar());
  };

  return (
    <div style={flowStyles} className={isResizing ? 'resize-optimized' : ''}>
      <ReactFlow
        nodes={nodes}
        edges={edges}
        nodeTypes={nodeTypes}
        onNodesChange={isResizing ? () => {} : onNodesChange}
        onEdgesChange={isResizing ? () => {} : onEdgesChange}
        onNodeClick={isResizing ? undefined : onNodeClick}
        onPaneClick={isResizing ? undefined : handlePaneClick}
        fitView={!isResizing}
        minZoom={0.01}
        maxZoom={2}
        defaultEdgeOptions={{
          type: 'simplebezier',
          animated: !isResizing,
          style: { stroke: '#6b7280', strokeWidth: 3 },
          ariaLabel: 'Clickable edge to see IPID properties',
        }}
        defaultViewport={{ x: 0, y: 0, zoom: 0.5 }}
        proOptions={{ hideAttribution: true }}
        selectionKeyCode={null}
      >
        <Background color="#4b5563" gap={16} />
        <MiniMap
          nodeColor={(node) => getImmediateGraphColor(node)}
          nodeStrokeWidth={2}
          nodeStrokeColor="#374151"
          maskColor="rgba(0, 0, 0, 0.5)"
          className="bg-gray-900 border border-gray-900 rounded-md w-52 h-36"
          style={{
            backgroundColor: '#1f2937',
            border: '1px solid #374151',
          }}
          onClick={isResizing ? undefined : handleMiniMapClick}
          onDrag={isResizing ? undefined : handleMiniMapDrag}
          pannable={!isResizing}
          zoomable={!isResizing}
          ariaLabel="Minimap for graph navigation"
        />
        <Controls
          showInteractive={false}
          className="[&_button]:bg-gray-800 [&_button]:border-gray-700 [&_button]:text-white [&_button:hover]:bg-gray-700"
        />

        <GraphLegend />
      </ReactFlow>
    </div>
  );
};

export default memo(GraphFlow);
