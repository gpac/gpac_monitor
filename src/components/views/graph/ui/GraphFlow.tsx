import React, { memo } from 'react';
import {
  ReactFlow,
  MiniMap,
  Controls,
  Background,
  BackgroundVariant,
  Node,
  Edge,
  NodeChange,
  EdgeChange,
  NodeMouseHandler,
} from '@xyflow/react';
import '@xyflow/react/dist/style.css';
import { CustomNode } from '../ui/CustomNode';
import { useMinimapNavigation } from '../hooks/layout/useMinimapNavigation';

interface GraphFlowProps {
  nodes: Node[];
  edges: Edge[];
  onNodesChange: (changes: NodeChange[]) => void;
  onEdgesChange: (changes: EdgeChange[]) => void;
  onNodeClick?: NodeMouseHandler;
  isResizing?: boolean;
}

const flowStyles = {
  background: '#111827',
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
  const { handleMiniMapClick, handleMiniMapDrag } = useMinimapNavigation();

  return (
    <div style={flowStyles} className={isResizing ? 'resize-optimized' : ''}>
      <ReactFlow
        nodes={nodes}
        edges={edges}
        nodeTypes={nodeTypes}
        onNodesChange={isResizing ? () => {} : onNodesChange}
        onEdgesChange={isResizing ? () => {} : onEdgesChange}
        onNodeClick={isResizing ? undefined : onNodeClick}
        fitView={!isResizing}
        minZoom={0.1}
        maxZoom={4}
        defaultEdgeOptions={{
          type: 'smoothstep',
          animated: !isResizing,
          style: { stroke: '#6b7280', strokeWidth: 3 },
        }}
        defaultViewport={{ x: 0, y: 0, zoom: 1 }}
        proOptions={{ hideAttribution: true }}
        selectionKeyCode={null}
      >
        <Background color="#4b5563" gap={16} variant={BackgroundVariant.Dots} />
        <Controls
          className="bg-gray-800 border-gray-700 fill-gray-400"
          showInteractive={!isResizing}
        />
        <MiniMap
          nodeColor={(n) => {
            switch (n.type) {
              case 'input':
                return '#4ade80';
              case 'output':
                return '#ef4444';
              default:
                return '#3b82f6';
            }
          }}
          nodeStrokeWidth={1}
          nodeStrokeColor="#374151"
          maskColor="rgba(0, 0, 0, 0.4)"
          className="bg-gray-800 border border-gray-700 rounded-lg shadow-lg"
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
      </ReactFlow>
    </div>
  );
};

export default memo(GraphFlow);
