import { useState, useCallback, useEffect, MutableRefObject } from 'react';
import { Node, Edge } from '@xyflow/react';
import dagre from 'dagre';
import {
  LayoutType,
  LayoutOptions,
} from '../utils/GraphLayout';

interface UseGraphLayoutProps {
  localNodes: Node[];
  localEdges: Edge[];
  setLocalNodes: (nodes: Node[]) => void;
  nodesRef: MutableRefObject<Node[]>;
  isApplyingLayout: MutableRefObject<boolean>;
}

/**
 * Hook for managing graph layout operations
 * Handles layout calculations, options, and persistence
 */
export const useGraphLayout = ({
  localNodes,
  localEdges,
  setLocalNodes,
  nodesRef,
  isApplyingLayout,
}: UseGraphLayoutProps) => {
  // Layout state
  const [layoutOptions, setLayoutOptions] = useState<LayoutOptions>(() => {
    // Try to load saved layout from localStorage
    try {
      const savedLayout = localStorage.getItem('gpacMonitorLayout');
      if (savedLayout) {
        return JSON.parse(savedLayout) as LayoutOptions;
      }
    } catch (e) {
      console.error('Failed to load layout preferences:', e);
    }

    // Default layout options - optimized for nodes with multiple inputs/outputs
    return {
      type: LayoutType.DAGRE,
      direction: 'LR', // Left to Right for better readability
      nodeSeparation: 150, // Increased spacing between nodes on same rank
      rankSeparation: 250, // Increased spacing between ranks to prevent overlap
      respectExistingPositions: true,
    };
  });

  // Apply layout with current options - integrated dagre like colleague's code
  const applyLayout = useCallback(
    () => {
      console.log('🔥 applyLayout - START');
      console.log('📊 localNodes count:', localNodes.length);
      console.log('🔗 localEdges count:', localEdges.length);
      
      if (localNodes.length === 0) {
        console.log('❌ No nodes, returning early');
        return;
      }
      if (localNodes.some((node) => !node.measured)) {
        console.log('❌ Some nodes not measured, returning early');
        return;
      }

      // Set flag to prevent state overrides during layout application
      isApplyingLayout.current = true;
      console.log('🚀 Layout application started');

      // Create a dagre graph - 
      const g = new dagre.graphlib.Graph();
      g.setGraph({ rankdir: "LR" });

      // Set the nodes and edges with sink identification
      console.log('📝 Adding nodes to dagre:');
      localNodes.forEach((node) => {
        console.log(`  - Node ${node.id}: ${node.data?.name} (${node.measured?.width || 200}x${node.measured?.height || 100})`);
        g.setNode(node.id, { 
          width: node.measured?.width || 200, 
          height: node.measured?.height || 100 
        });
      });
      
      console.log('🔗 Adding edges to dagre:');
      localEdges.forEach((edge) => {
        console.log(`  - Edge: ${edge.source} -> ${edge.target}`);
        g.setEdge(edge.source, edge.target, { points: [] });
      });

      // Force parallel nodes to same rank using JSON data
      const sinkNodes: string[] = [];   // nb_opid = 0 (no outputs)
      const sourceNodes: string[] = []; // nb_ipid = 0 (no inputs)
      
      console.log('🎯 Analyzing nodes for sinks and sources:');
      localNodes.forEach((node) => {
        const nodeData = node.data;
        console.log(`  - Node ${node.id} (${nodeData?.name}): nb_ipid = ${nodeData?.nb_ipid}, nb_opid = ${nodeData?.nb_opid}`);
        
        if (nodeData && typeof nodeData.nb_opid === 'number' && nodeData.nb_opid === 0) {
          sinkNodes.push(node.id);
          console.log(`    ✅ SINK DETECTED: ${node.id} (${nodeData.name})`);
        }
        
        if (nodeData && typeof nodeData.nb_ipid === 'number' && nodeData.nb_ipid === 0) {
          sourceNodes.push(node.id);
          console.log(`    ✅ SOURCE DETECTED: ${node.id} (${nodeData.name})`);
        }
      });

      console.log('🎯 Sink nodes found:', sinkNodes);
      console.log('🎯 Source nodes found:', sourceNodes);

      // Create invisible edges between sink nodes to force same rank (rightmost)
      if (sinkNodes.length > 1) {
        console.log('🔗 Creating invisible edges between sinks:');
        for (let i = 0; i < sinkNodes.length - 1; i++) {
          console.log(`  - Invisible edge: ${sinkNodes[i]} -> ${sinkNodes[i + 1]}`);
          g.setEdge(sinkNodes[i], sinkNodes[i + 1], { 
            minlen: 0, 
            weight: 0 
          });
        }
      } else {
        console.log('⚠️ Not enough sinks for invisible edges');
      }

      // Create invisible edges between source nodes to force same rank (leftmost)
      if (sourceNodes.length > 1) {
        console.log('🔗 Creating invisible edges between sources:');
        for (let i = 0; i < sourceNodes.length - 1; i++) {
          console.log(`  - Invisible edge: ${sourceNodes[i]} -> ${sourceNodes[i + 1]}`);
          g.setEdge(sourceNodes[i], sourceNodes[i + 1], { 
            minlen: 0, 
            weight: 0 
          });
        }
      } else {
        console.log('⚠️ Not enough sources for invisible edges');
      }

      // Perform the layout
      console.log('⚡ Running dagre.layout()...');
      dagre.layout(g);

      // Update the node positions -
      console.log('📍 Updating node positions:');
      const layoutedNodes = localNodes.map((node) => {
        const dagreNode = g.node(node.id);
        if (!dagreNode) {
          console.log(`  - Node ${node.id}: NO DAGRE DATA`);
          return node;
        }
        
        const { x, y, width, height } = dagreNode;
        const newPosition = {
          x: x - width / 2, 
          y: y - height / 2 
        };
        console.log(`  - Node ${node.id} (${node.data?.name}): dagre(${x}, ${y}) -> position(${newPosition.x}, ${newPosition.y})`);
        
        return { 
          ...node, 
          position: newPosition
        };
      });

      console.log('🔄 Calling setLocalNodes with new positions');
      setLocalNodes(layoutedNodes);
      nodesRef.current = layoutedNodes;

      // Reset flag after React has processed state updates
      setTimeout(() => {
        isApplyingLayout.current = false;
        console.log('✅ Layout application completed');
      }, 100);
    },
    [
      localNodes,
      localEdges,
      setLocalNodes,
      nodesRef,
      isApplyingLayout,
    ],
  );

  // Auto-layout function - use same dagre code as applyLayout
  const autoLayout = useCallback(() => {
    console.log('🔥 autoLayout - START');
    console.log('📊 localNodes count:', localNodes.length);
    
    if (localNodes.length === 0) {
      console.log('❌ autoLayout: No nodes, returning early');
      return;
    }
    if (localNodes.some((node) => !node.measured)) {
      console.log('❌ autoLayout: Some nodes not measured, returning early');
      return;
    }

    // Set flag to prevent state overrides
    isApplyingLayout.current = true;

    // Create a dagre graph - exactly like colleague's implementation
    const g = new dagre.graphlib.Graph();
    g.setGraph({ rankdir: "LR" });

    // Set the nodes and edges with sink/source identification
    localNodes.forEach((node) => 
      g.setNode(node.id, { 
        width: node.measured?.width || 200, 
        height: node.measured?.height || 100 
      })
    );
    localEdges.forEach((edge) => 
      g.setEdge(edge.source, edge.target, { points: [] })
    );

    // Force parallel nodes to same rank using JSON data
    const sinkNodes: string[] = [];   // nb_opid = 0 (no outputs)
    const sourceNodes: string[] = []; // nb_ipid = 0 (no inputs)
    
    localNodes.forEach((node) => {
      const nodeData = node.data;
      if (nodeData && typeof nodeData.nb_opid === 'number' && nodeData.nb_opid === 0) {
        sinkNodes.push(node.id);
      }
      if (nodeData && typeof nodeData.nb_ipid === 'number' && nodeData.nb_ipid === 0) {
        sourceNodes.push(node.id);
      }
    });

    // Create invisible edges between sink nodes to force same rank (rightmost)
    if (sinkNodes.length > 1) {
      for (let i = 0; i < sinkNodes.length - 1; i++) {
        g.setEdge(sinkNodes[i], sinkNodes[i + 1], { 
          minlen: 0, 
          weight: 0 
        });
      }
    }

    // Create invisible edges between source nodes to force same rank (leftmost)
    if (sourceNodes.length > 1) {
      for (let i = 0; i < sourceNodes.length - 1; i++) {
        g.setEdge(sourceNodes[i], sourceNodes[i + 1], { 
          minlen: 0, 
          weight: 0 
        });
      }
    }

    // Perform the layout
    dagre.layout(g);

    // Update the node positions - exactly like colleague's implementation
    const layoutedNodes = localNodes.map((node) => {
      const dagreNode = g.node(node.id);
      if (!dagreNode) return node;
      
      const { x, y, width, height } = dagreNode;
      return { 
        ...node, 
        position: { 
          x: x - width / 2, 
          y: y - height / 2 
        }
      };
    });

    setLocalNodes(layoutedNodes);
    nodesRef.current = layoutedNodes;

    // Reset flag after React has processed state updates
    setTimeout(() => {
      isApplyingLayout.current = false;
    }, 100);
  }, [localNodes, localEdges, setLocalNodes, nodesRef, isApplyingLayout]);

  // Handle layout option changes - use same dagre code
  const handleLayoutChange = useCallback(
    (newOptions: LayoutOptions) => {
      if (localNodes.length === 0) return;
      if (localNodes.some((node) => !node.measured)) return;

      // Set flag to prevent state overrides
      isApplyingLayout.current = true;

      setLayoutOptions(newOptions);

      // Create a dagre graph - exactly like colleague's implementation
      const g = new dagre.graphlib.Graph();
      g.setGraph({ rankdir: "LR" });

      // Set the nodes and edges with sink identification
      localNodes.forEach((node) => 
        g.setNode(node.id, { 
          width: node.measured?.width || 200, 
          height: node.measured?.height || 100 
        })
      );
      localEdges.forEach((edge) => 
        g.setEdge(edge.source, edge.target, { points: [] })
      );

      // Force parallel nodes to same rank using JSON data
      const sinkNodes: string[] = [];  // nb_opid = 0 (no outputs)
      const sourceNodes: string[] = []; // nb_ipid = 0 (no inputs)
      
      localNodes.forEach((node) => {
        const nodeData = node.data;
        if (nodeData && typeof nodeData.nb_opid === 'number' && typeof nodeData.nb_ipid === 'number') {
          if (nodeData.nb_opid === 0) {
            sinkNodes.push(node.id);
            console.log(`    ✅ SINK DETECTED: ${node.id} (${nodeData.name})`);
          }
          if (nodeData.nb_ipid === 0) {
            sourceNodes.push(node.id);
            console.log(`    ✅ SOURCE DETECTED: ${node.id} (${nodeData.name})`);
          }
        }
      });

      console.log('🎯 Sink nodes found:', sinkNodes);
      console.log('🎯 Source nodes found:', sourceNodes);

      // Create invisible edges between sink nodes to force same rank (rightmost)
      if (sinkNodes.length > 1) {
        console.log('🔗 Creating invisible edges between sinks:');
        for (let i = 0; i < sinkNodes.length - 1; i++) {
          console.log(`  - Invisible edge: ${sinkNodes[i]} -> ${sinkNodes[i + 1]}`);
          g.setEdge(sinkNodes[i], sinkNodes[i + 1], { 
            minlen: 0, 
            weight: 0 
          });
        }
      }

      // Create invisible edges between source nodes to force same rank (leftmost)  
      if (sourceNodes.length > 1) {
        console.log('🔗 Creating invisible edges between sources:');
        for (let i = 0; i < sourceNodes.length - 1; i++) {
          console.log(`  - Invisible edge: ${sourceNodes[i]} -> ${sourceNodes[i + 1]}`);
          g.setEdge(sourceNodes[i], sourceNodes[i + 1], { 
            minlen: 0, 
            weight: 0 
          });
        }
      }

      // Perform the layout
      dagre.layout(g);

      // Update the node positions - exactly like colleague's implementation
      const layoutedNodes = localNodes.map((node) => {
        const dagreNode = g.node(node.id);
        if (!dagreNode) return node;
        
        const { x, y, width, height } = dagreNode;
        return { 
          ...node, 
          position: { 
            x: x - width / 2, 
            y: y - height / 2 
          }
        };
      });

      setLocalNodes(layoutedNodes);
      nodesRef.current = layoutedNodes;

      // Reset flag after React has processed state updates
      setTimeout(() => {
        isApplyingLayout.current = false;
      }, 100);
    },
    [localNodes, localEdges, setLocalNodes, nodesRef, isApplyingLayout],
  );

  // Save layout preferences
  useEffect(() => {
    try {
      if (layoutOptions.type) {
        localStorage.setItem(
          'gpacMonitorLayout',
          JSON.stringify(layoutOptions),
        );
      }
    } catch (e) {
      console.error('Failed to save layout preferences:', e);
    }
  }, [layoutOptions]);

  return {
    layoutOptions,
    handleLayoutChange,
    autoLayout,
    applyLayout,
  };
};
