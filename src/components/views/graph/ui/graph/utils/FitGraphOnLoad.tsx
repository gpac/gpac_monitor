import { useEffect } from 'react';
import { useReactFlow, useNodesInitialized } from '@xyflow/react';

interface FitGraphOnLoadProps {
  nodeCount: number;
  disabled: boolean;
}

const FitGraphOnLoad = ({ nodeCount, disabled }: FitGraphOnLoadProps) => {
  const { fitView } = useReactFlow();
  const nodesInitialized = useNodesInitialized();

  useEffect(() => {
    if (disabled || !nodesInitialized || nodeCount === 0) return;

    requestAnimationFrame(() => {
      fitView({ padding: 0.2, duration: 300, minZoom: 0.01, maxZoom: 1 });
    });
  }, [disabled, nodesInitialized, nodeCount, fitView]);

  return null;
};

export default FitGraphOnLoad;
