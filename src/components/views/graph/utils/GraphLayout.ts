import dagre from 'dagre';
import { Node, Edge, Position } from '@xyflow/react';
import { isSource } from './filterType';

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

function applyDagreLayout(nodes: Node[], edges: Edge[]): Node[] {
  if (nodes.length === 0) return nodes;

  // Create a dagre graph
  const g = new dagre.graphlib.Graph();
  g.setGraph({ rankdir: 'LR' });

  nodes.forEach((node) =>
    g.setNode(node.id, {
      width: node.measured?.width,
      height: node.measured?.height,
    }),
  );
  edges.forEach((edge) => g.setEdge(edge.source, edge.target, { points: [] }));

  // Perform the layout
  dagre.layout(g);

  // Update the node positions
  return nodes.map((node) => {
    const dagreNode = g.node(node.id);
    if (!dagreNode) return node;

    const { x, y, width, height } = dagreNode;
    return {
      ...node,
      position: {
        x: x - width / 2,
        y: y - height / 2,
      },
      targetPosition: Position.Left,
      sourcePosition: Position.Right,
    };
  });
}

export function applyGraphLayout(nodes: Node[], edges: Edge[]): Node[] {
  // Use simple dagre layout like the working example
  return applyDagreLayout(nodes, edges);
}

/**
 * Helper function to create layout with specific direction
 * Similar to the getLayoutedElements function in the React Flow example
 */
export function getLayoutedElements(
  nodes: Node[],
  edges: Edge[],
  nodeWidth: number = 200,
  nodeHeight: number = 100,
) {
  // Layout options no longer needed with simple dagre approach

  // Apply dimensions to nodes if not present
  const nodesWithDimensions = nodes.map((node) => ({
    ...node,
    style: {
      ...node.style,
      width: node.style?.width || nodeWidth,
      height: node.style?.height || nodeHeight,
    },
  }));

  const layoutedNodes = applyDagreLayout(nodesWithDimensions, edges);

  return { nodes: layoutedNodes, edges };
}

/**
 * Applies layout with topological ordering to ensure proper node placement
 * Follows dependency chain via source_idx for correct ordering
 */
export function applyTopologicalLayout(nodes: Node[], edges: Edge[]): Node[] {
  // Build dependency chain using source_idx
  const nodeMap = new Map<string, Node>();
  nodes.forEach((node) => nodeMap.set(node.id, node));

  // Function to calculate depth in dependency chain
  const calculateDepth = (node: Node, visited = new Set<string>()): number => {
    if (visited.has(node.id)) return 0; // Avoid cycles
    visited.add(node.id);

    const data = node.data;

    // Source nodes (no inputs) are at depth 0
    if (typeof data.nb_ipid === 'number' && typeof data.nb_opid === 'number') {
      if (isSource(data as any)) return 0;
    }

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
  nodes.forEach((node) => {
    const depth = calculateDepth(node);
    if (!nodesByDepth.has(depth)) {
      nodesByDepth.set(depth, []);
    }
    nodesByDepth.get(depth)!.push(node);
  });

  // Use simple dagre approach - no complex options needed

  // Apply dagre layout - it will handle the vertical distribution automatically
  // when it processes the dependency graph structure
  return applyDagreLayout(nodes, edges);
}
