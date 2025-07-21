import React, { memo, useCallback, useState } from 'react';
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
import Legend from '../../../common/Legend';
import { CustomNode } from '../../../CustomNode';

import { useAppSelector } from '../../../../hooks/redux';


interface GraphFlowProps {
  nodes: Node[];
  edges: Edge[];
  onNodesChange: (changes: NodeChange[]) => void;
  onEdgesChange: (changes: EdgeChange[]) => void;
  onNodeClick: (event: React.MouseEvent, node: Node) => void;
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
}) => {
  const { setViewport } = useReactFlow();
  const { zoom } = useViewport();
  
  // Get selected node from Redux
  const selectedNodeId = useAppSelector((state) => state.graph.selectedNodeId);
  
  // Local state for edge highlighting
  const [highlightedEdge, setHighlightedEdge] = useState<string | null>(null);


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

  // Handle connection hover for overlay
  const handleConnectionHover = useCallback((edgeId: string | null) => {
    setHighlightedEdge(edgeId);
  }, []);
  return (
    <div style={flowStyles}>
      <ReactFlow
        nodes={nodes}
        edges={edges}
        nodeTypes={nodeTypes}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        onNodeClick={onNodeClick}
        fitView
        minZoom={0.1}
        maxZoom={4}
        defaultEdgeOptions={{
          type: 'smoothstep',
          animated: true,
          style: { stroke: '#4b5563', strokeWidth: 2 },
        }}
        defaultViewport={{ x: 0, y: 0, zoom: 1 }}
        proOptions={{ hideAttribution: true }}
        selectionKeyCode={null}
      >
        <Background color="#4b5563" gap={16} variant={BackgroundVariant.Dots} />
        <Controls
          className="bg-gray-800 border-gray-700 fill-gray-400"
          showInteractive={true}
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
          onDrag={handleMiniMapDrag}
        />

        {/* Légende */}
        <Legend />
      </ReactFlow>
      
 
    </div>
  );
};

export default memo(GraphFlow);
