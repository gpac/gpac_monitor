import React, { useState } from 'react';
import WidgetWrapper from '../../../common/WidgetWrapper';
import { useOptimizedResize } from '@/shared/hooks/useOptimizedResize';
import LoadingState from '../../../common/LoadingState';
import ConnectionErrorState from '../../../common/ConnectionErrorState';
import GraphFlow from './GraphFlow';
import { WidgetProps } from '../../../../types/ui/widget';
import { Node, Edge, NodeMouseHandler } from '@xyflow/react';
import { LayoutOptions } from '../utils/GraphLayout';

interface GraphMonitorUIProps extends WidgetProps {
  isLoading: boolean;
  connectionError: string | null;
  retryConnection: () => void;
  nodes: Node[];
  edges: Edge[];
  onNodesChange: (changes: any[]) => void;
  onEdgesChange: (changes: any[]) => void;
  onNodeClick?: NodeMouseHandler;
  layoutOptions: LayoutOptions;
  onLayoutChange: (options: LayoutOptions) => void;
  onAutoLayout: () => void;
}

const GraphMonitorUI: React.FC<GraphMonitorUIProps> = ({
  id,
  title,
  isLoading,
  connectionError,
  retryConnection,
  nodes,
  edges,
  onNodesChange,
  onEdgesChange,
  onNodeClick,
}) => {
  const [isResizing, setIsResizing] = useState(false);

  // Optimize ReactFlow during resize - very important for complex graphs
  const { ref } = useOptimizedResize({
    onResizeStart: () => setIsResizing(true),
    onResizeEnd: () => setIsResizing(false),
    debounce: 24, // Slightly higher for heavy graph operations
    throttle: true,
  }) as { ref: React.RefObject<HTMLElement> };
  const containerRef = ref as React.RefObject<HTMLDivElement>;
  if (isLoading) {
    return <LoadingState id={id} title={title} message="Connexion à GPAC..." />;
  }

  if (connectionError) {
    return (
      <ConnectionErrorState
        id={id}
        title={title}
        errorMessage={connectionError}
        onRetry={retryConnection}
      />
    );
  }

  return (
    <WidgetWrapper id={id} title={title}>
      <div
        ref={containerRef}
        className={`relative h-full w-full ${isResizing ? 'contain-layout contain-style pointer-events-none' : ''}`}
      >
        <GraphFlow
          nodes={nodes}
          edges={edges}
          onNodesChange={onNodesChange}
          onEdgesChange={onEdgesChange}
          onNodeClick={onNodeClick}
          isResizing={isResizing}
        />
      </div>
    </WidgetWrapper>
  );
};

export default React.memo(GraphMonitorUI);
