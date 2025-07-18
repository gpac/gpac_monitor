import dagre from 'dagre';
import { Node, Edge } from '@xyflow/react';

export enum LayoutType {
  HORIZONTAL = 'horizontal',
  VERTICAL = 'vertical',
  DAGRE = 'dagre',
  FORCE = 'force', 
  RADIAL = 'radial',
}

export interface LayoutOptions {
  type: LayoutType;
  direction?: 'LR' | 'RL' | 'TB' | 'BT';
  nodeSeparation?: number;
  rankSeparation?: number;
  respectExistingPositions?: boolean;
  align?: 'UL' | 'UR' | 'DL' | 'DR' | 'CENTER'; 
  nodeFilter?: (node: Node) => boolean; 
  paddingX?: number;
  paddingY?: number;

}


function applyHorizontalLayout(nodes: Node[]): Node[] {
  return nodes.map((node, index) => ({
    ...node,
    position: {
      x: 150 + index * 300,
      y: 100,
    },
  }));
}

function applyVerticalLayout(nodes: Node[]): Node[] {
  return nodes.map((node, index) => ({
    ...node,
    position: {
      x: 150,
      y: 100 + index * 150,
    },
  }));
}

function applyDagreLayout(
  nodes: Node[],
  edges: Edge[],
  options: LayoutOptions,
): Node[] {
  // Create a new directed graph
  const g = new dagre.graphlib.Graph();

  // Set graph direction and spacing options
  g.setGraph({
    rankdir: 'LR',
    nodesep: options.nodeSeparation || 80,
    ranksep: options.rankSeparation || 200,
    marginx: options.paddingX || 20,
    marginy: options.paddingY || 20,
    align: options.align,
  });

  g.setDefaultEdgeLabel(() => ({}));

  // Add nodes to the graph with node dimensions
  nodes.forEach((node) => {
    // Only apply layout to nodes that pass the filter (if provided)
    if (options.nodeFilter && !options.nodeFilter(node)) {
      return;
    }
      g.setNode(node.id, {
     
      width: node.measured?.width || node.style?.width || 180,
      height: node.measured?.height || node.style?.height || 60,
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

    const dagreNode = g.node(node.id) ;
    
    // Skip if the node wasn't processed by dagre
    if (!dagreNode) {
      return nodeWithPosition;
    }
   const width = node.measured?.width || 
      (typeof node.style?.width === 'number' 
        ? node.style.width 
        : parseInt(node.style?.width ?? '', 10) || 180);
  
    const height = node.measured?.height ||
      (typeof node.style?.height === 'number'
        ? node.style.height
        : parseInt(node.style?.height ?? '', 10) || 60);

    // ✅ GPACER STANDARD: Centrage avec offset width/height
    nodeWithPosition.position = {
      x: dagreNode.x - width / 2,
      y: dagreNode.y - height / 2,
    };
    
    return nodeWithPosition;
  });
}

// Add new radial layout function
function applyRadialLayout(nodes: Node[]): Node[] {
  const centerX = 500;
  const centerY = 400;
  const radius = Math.min(nodes.length * 40, 350);
  
  return nodes.map((node, index) => {
    const angle = (index / nodes.length) * 2 * Math.PI;
    
    return {
      ...node,
      position: {
        x: centerX + radius * Math.cos(angle),
        y: centerY + radius * Math.sin(angle),
      },
    };
  });
}

// Helper function to detect graph complexity
export function detectGraphComplexity(nodes: Node[], _edges: Edge[]): LayoutType {
  // For simple graphs with few nodes, horizontal might be sufficient
  if (nodes.length <= 5) {
    return LayoutType.HORIZONTAL;
  }
  
  // Count input and output nodes
  const inputNodes = nodes.filter(n => n.data?.nb_ipid === 0);
  const outputNodes = nodes.filter(n => n.data?.nb_opid === 0);
  
  // For graphs with multiple inputs or outputs, dagre works better
  if (inputNodes.length > 1 || outputNodes.length > 1) {
    return LayoutType.DAGRE;
  }
  
  // For larger graphs, use dagre as well
  if (nodes.length > 10) {
    return LayoutType.DAGRE;
  }
  
  // Default to horizontal for simpler graphs
  return LayoutType.HORIZONTAL;
}

// Helper to suggest optimal layout options based on graph structure
export function suggestLayoutOptions(nodes: Node[], edges: Edge[]): LayoutOptions {
  const layoutType = detectGraphComplexity(nodes, edges);
  
  if (layoutType === LayoutType.DAGRE) {
    return {
      type: LayoutType.DAGRE,
      direction: 'LR',
      nodeSeparation: 100,
      rankSeparation: 200,
      respectExistingPositions: false,
  
    };
  }
  
  return { type: layoutType };
}

export function applyGraphLayout(
  nodes: Node[],
  edges: Edge[],
  options: LayoutOptions = { type: LayoutType.HORIZONTAL },
): Node[] {
  switch (options.type) {
    case LayoutType.DAGRE:
      return applyDagreLayout(nodes, edges, options);
    case LayoutType.VERTICAL:
      return applyVerticalLayout(nodes);
    case LayoutType.RADIAL:
      return applyRadialLayout(nodes);
    case LayoutType.FORCE:
      // For simplicity, use dagre as a fallback for force layout
      // In a real implementation, you'd use a force-directed algorithm
      return applyDagreLayout(nodes, edges, options);
    case LayoutType.HORIZONTAL:
    default:
      return applyHorizontalLayout(nodes);
  }
}