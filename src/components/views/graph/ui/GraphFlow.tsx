import React, { memo, useCallback } from 'react';
import {
  ReactFlow,
  MiniMap,
  Controls,
  Background,
  BackgroundVariant,
  Node,
  Edge,
  useReactFlow,
  useViewport,
  NodeChange,
  EdgeChange,
} from '@xyflow/react';
import '@xyflow/react/dist/style.css';
import { CustomNode } from '../../../views/graph/ui/CustomNode';

interface GraphFlowProps {
  nodes: Node[];
  edges: Edge[];
  onNodesChange: (changes: NodeChange[]) => void;
  onEdgesChange: (changes: EdgeChange[]) => void;
  onNodeClick: (event: React.MouseEvent, node: Node) => void;
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
  const { setViewport } = useReactFlow();
  const { zoom } = useViewport();

  const handleMiniMapDrag = useCallback(
    (event: React.DragEvent<SVGSVGElement>) => {
      const svgElement = event.currentTarget;
      const svgRect = svgElement.getBoundingClientRect();

      const x = (event.clientX - svgRect.left) / zoom;
      const y = (event.clientY - svgRect.top) / zoom;

      setViewport(
        {
          x: -x,
          y: -y,
          zoom,
        },
        { duration: 0 },
      );
    },
    [setViewport, zoom],
  );

  return (
    <div style={flowStyles} className={isResizing ? 'resize-optimized' : ''}>
      <ReactFlow
        nodes={nodes}
        edges={edges}
        nodeTypes={nodeTypes}
        onNodesChange={isResizing ? () => {} : onNodesChange}
        onEdgesChange={isResizing ? () => {} : onEdgesChange}
        onNodeClick={isResizing ? () => {} : onNodeClick}
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
          maskColor="rgba(0, 0, 0, 0.3)"
          className="bg-gray-800 border border-gray-700"
          onDrag={isResizing ? undefined : handleMiniMapDrag}
        />
      </ReactFlow>
    </div>
  );
};

export default memo(GraphFlow);
