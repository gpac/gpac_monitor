import dagre from 'dagre';
import { Node, Edge, Position } from '@xyflow/react';

export enum LayoutType {
  DAGRE = 'dagre',
 
}

export interface LayoutOptions {
  type?: LayoutType;
  direction?: 'LR' | 'RL' | 'TB' | 'BT';
  nodeSeparation?: number;
  rankSeparation?: number;
  nodeFilter?: (node: Node) => boolean;
  paddingX?: number;
  paddingY?: number;
  respectExistingPositions?: boolean;
}

function applyDagreLayout(
  nodes: Node[],
  edges: Edge[],
  options: LayoutOptions = {},
): Node[] {
  // Create a new directed graph
  const g = new dagre.graphlib.Graph();

  // Determine if layout is horizontal
  const direction = options.direction || 'LR';
  const isHorizontal = direction === 'LR' || direction === 'RL';

  // Set graph direction and spacing options with better alignment
  g.setGraph({
    rankdir: direction,
    align: 'UL', // Upper-left alignment for better node positioning
    nodesep: options.nodeSeparation || 50,
    ranksep: options.rankSeparation || 100,
    marginx: options.paddingX || 20,
    marginy: options.paddingY || 20
  });

  g.setDefaultEdgeLabel(() => ({}));

  // Add nodes to the graph with node dimensions
  nodes.forEach((node) => {
    // Only apply layout to nodes that pass the filter (if provided)
    if (options.nodeFilter && !options.nodeFilter(node)) {
      return;
    }
    g.setNode(node.id, {
      width: node.measured?.width || 200,
      height: node.measured?.height || 100,
    });
  });

  // Add edges to the graph
  edges.forEach((edge) => {
    g.setEdge(edge.source, edge.target);
  });

  // Calculate the layout
  dagre.layout(g);

  // Apply the calculated layout to the nodes
  return nodes.map((node) => {
    const nodeWithPosition = { ...node };

    // Skip nodes that don't pass the filter
    if (options.nodeFilter && !options.nodeFilter(node)) {
      return nodeWithPosition;
    }

    const dagreNode = g.node(node.id);

    // Skip if the node wasn't processed by dagre
    if (!dagreNode) {
      return nodeWithPosition;
    }

    const { x, y, width, height } = dagreNode;

    // Set source and target positions based on layout direction
    if (isHorizontal) {
      nodeWithPosition.targetPosition = Position.Left;
      nodeWithPosition.sourcePosition = Position.Right;
    } else {
      nodeWithPosition.targetPosition = Position.Top;
      nodeWithPosition.sourcePosition = Position.Bottom;
    }

    // Center positioning with width/height offset
    // We shift the dagre node position (anchor=center center) to the top left
    // so it matches the React Flow node anchor point (top left).
    nodeWithPosition.position = {
      x: x - width / 2,
      y: y - height / 2,
    };

    return nodeWithPosition;
  });
}

export function applyGraphLayout(
  nodes: Node[],
  edges: Edge[],
  options: LayoutOptions = {},
): Node[] {
  // Use topological layout by default for better ordering
  return applyTopologicalLayout(nodes, edges, options);
}

/**
 * Helper function to create layout with specific direction
 * Similar to the getLayoutedElements function in the React Flow example
 */
export function getLayoutedElements(
  nodes: Node[],
  edges: Edge[],
  direction: 'TB' | 'LR' | 'BT' | 'RL' = 'LR',
  nodeWidth: number = 200,
  nodeHeight: number = 100
) {
  const layoutOptions: LayoutOptions = {
    direction,
    nodeSeparation: 50,
    rankSeparation: direction === 'LR' || direction === 'RL' ? 150 : 100,
  };

  // Apply dimensions to nodes if not present
  const nodesWithDimensions = nodes.map(node => ({
    ...node,
    style: {
      ...node.style,
      width: node.style?.width || nodeWidth,
      height: node.style?.height || nodeHeight,
    }
  }));

  const layoutedNodes = applyDagreLayout(nodesWithDimensions, edges, layoutOptions);
  
  return { nodes: layoutedNodes, edges };
}

/**
 * Applies layout with topological ordering to ensure proper node placement
 * Follows dependency chain via source_idx for correct ordering
 */
export function applyTopologicalLayout(
  nodes: Node[],
  edges: Edge[],
  options: LayoutOptions = {}
): Node[] {
  // Build dependency chain using source_idx
  const nodeMap = new Map<string, Node>();
  nodes.forEach(node => nodeMap.set(node.id, node));
  
  // Function to calculate depth in dependency chain
  const calculateDepth = (node: Node, visited = new Set<string>()): number => {
    if (visited.has(node.id)) return 0; // Avoid cycles
    visited.add(node.id);
    
    const data = node.data;
    
    // Source nodes (no inputs) are at depth 0
    if (data.nb_ipid === 0) return 0;
    
    // Find maximum depth among all source dependencies
    let maxDepth = 0;
    if (data.ipid) {
      Object.values(data.ipid).forEach((pid: any) => {
        if (pid.source_idx !== undefined && pid.source_idx !== null) {
          const sourceNode = nodeMap.get(pid.source_idx.toString());
          if (sourceNode && !visited.has(sourceNode.id)) {
            const sourceDepth = calculateDepth(sourceNode, new Set(visited));
            maxDepth = Math.max(maxDepth, sourceDepth);
          }
        }
      });
    }
    
    return maxDepth + 1;
  };
  
  // Group nodes by depth and organize them for better vertical distribution
  const nodesByDepth = new Map<number, Node[]>();
  nodes.forEach(node => {
    const depth = calculateDepth(node);
    if (!nodesByDepth.has(depth)) {
      nodesByDepth.set(depth, []);
    }
    nodesByDepth.get(depth)!.push(node);
  });
  
  // Create a more balanced layout by ensuring better vertical spacing
  // Configure dagre for vertical distribution of nodes at same depth
  const dagreOptions: LayoutOptions = {
    ...options,
    direction: options.direction || 'LR',
    nodeSeparation: options.nodeSeparation || 80, // Increased for better vertical spacing
    rankSeparation: options.rankSeparation || 150,
  };
  
  // Apply dagre layout - it will handle the vertical distribution automatically
  // when it processes the dependency graph structure
  return applyDagreLayout(nodes, edges, dagreOptions);
}

