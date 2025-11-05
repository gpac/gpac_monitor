import React from 'react';
import { WidgetProps } from '../../../types/ui/widget';
import useGraphMonitor from './hooks/state/useGraphMonitor';
import { GraphMonitorUI } from './ui';

const GraphMonitor: React.FC<WidgetProps> = ({ id, config }) => {
  const {
    isLoading,
    connectionError,
    retryConnection,
    localNodes,
    localEdges,
    handleNodesChange,
    handleEdgesChange,
    handleNodeClick,
    handleEdgeClick,
    layoutOptions,
    handleLayoutChange,
    autoLayout,
  } = useGraphMonitor();

  return (
    <GraphMonitorUI
      id={id}
      config={config}
      isLoading={isLoading}
      connectionError={connectionError}
      retryConnection={retryConnection}
      nodes={localNodes}
      edges={localEdges}
      onNodesChange={handleNodesChange}
      onEdgesChange={handleEdgesChange}
      onNodeClick={handleNodeClick}
      onEdgeClick={handleEdgeClick}
      layoutOptions={layoutOptions}
      onLayoutChange={handleLayoutChange}
      onAutoLayout={autoLayout}
    />
  );
};

export default React.memo(GraphMonitor);
