import React from 'react';
import { WidgetProps } from '../../../types/ui/widget';
import useGraphMonitor from './hooks/state/useGraphMonitor';
import GraphMonitorUI from '../graph/ui/GraphMonitorUI';

const GraphMonitor: React.FC<WidgetProps> = ({ id, title, config }) => {
  const {
    isLoading,
    connectionError,
    retryConnection,
    localNodes,
    localEdges,
    handleNodesChange,
    handleEdgesChange,
    handleNodeClick,
    layoutOptions,
    handleLayoutChange,
    autoLayout,
  } = useGraphMonitor();

  return (
    <GraphMonitorUI
      id={id}
      title={title}
      config={config}
      isLoading={isLoading}
      connectionError={connectionError}
      retryConnection={retryConnection}
      nodes={localNodes}
      edges={localEdges}
      onNodesChange={handleNodesChange}
      onEdgesChange={handleEdgesChange}
      onNodeClick={handleNodeClick}
      layoutOptions={layoutOptions}
      onLayoutChange={handleLayoutChange}
      onAutoLayout={autoLayout}
    />
  );
};

export default React.memo(GraphMonitor);
