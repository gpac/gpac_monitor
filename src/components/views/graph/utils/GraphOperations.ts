import { FilterType, GraphFilterData } from '@/types/domain/gpac';
import { Node, Edge, MarkerType } from '@xyflow/react';
import { isSource } from './filterType';

const determineFilterType = (filter: GraphFilterData): FilterType => {
  // Use server-provided stream_type from PIDs for robust typing
  const streamTypes = new Set<string>();

  // Collect stream types from output PIDs
  if (filter.opid) {
    Object.values(filter.opid).forEach((pid) => {
      if (pid.stream_type) streamTypes.add(pid.stream_type.toLowerCase());
    });
  }

  // Fallback to input PIDs if no output
  if (streamTypes.size === 0 && filter.ipid) {
    Object.values(filter.ipid).forEach((pid) => {
      if (pid.stream_type) streamTypes.add(pid.stream_type.toLowerCase());
    });
  }

  // Map GPAC stream types to UI filter types
  if (streamTypes.has('visual')) return 'video';
  if (streamTypes.has('audio')) return 'audio';
  if (streamTypes.has('text')) return 'text';
  if (streamTypes.has('file')) return 'file';
  return 'file';
};

const getFilterColor = (filterType: FilterType): string => {
  const colors = {
    video: '#3b82f6',
    audio: '#10b981',
    text: '#f59e0b',
    file: '#E11D48',
  };
  return colors[filterType];
};

// Create a node from a filter object
export function createNodeFromFilter(
  filter: GraphFilterData,
  index: number,
  existingNodes: Node[],
  allFilters?: GraphFilterData[], // Add this parameter to calculate proper positioning
): Node {
  const existingNode = existingNodes.find(
    (n) => n.id === filter.idx.toString(),
  );
  const filterType = determineFilterType(filter);

  // Calculate topological position if allFilters is provided
  let topologicalX = 150 + index * 300; // Default fallback

  if (allFilters) {
    // Calculate dependency depth for proper ordering
    const calculateDepth = (
      currentFilter: GraphFilterData,
      visited = new Set<number>(),
    ): number => {
      if (visited.has(currentFilter.idx)) return 0; // Avoid cycles
      visited.add(currentFilter.idx);

      // Source nodes (no inputs) are at depth 0
      if (isSource(currentFilter)) return 0;

      // Find maximum depth among all source dependencies
      let maxDepth = 0;
      if (currentFilter.ipid) {
        Object.values(currentFilter.ipid).forEach((pid: any) => {
          if (pid.source_idx !== undefined && pid.source_idx !== null) {
            const sourceFilter = allFilters.find(
              (f) => f.idx === pid.source_idx,
            );
            if (sourceFilter && !visited.has(sourceFilter.idx)) {
              const sourceDepth = calculateDepth(
                sourceFilter,
                new Set(visited),
              );
              maxDepth = Math.max(maxDepth, sourceDepth);
            }
          }
        });
      }

      return maxDepth + 1;
    };

    // Sort filters by dependency depth for correct ordering
    const sortedFilters = [...allFilters].sort((a, b) => {
      const depthA = calculateDepth(a);
      const depthB = calculateDepth(b);

      if (depthA !== depthB) return depthA - depthB;
      return a.idx - b.idx; // Stable sort by idx
    });

    // Find the position of current filter in sorted array
    const sortedIndex = sortedFilters.findIndex((f) => f.idx === filter.idx);
    topologicalX = 150 + sortedIndex * 300;
  }

  return {
    id: filter.idx.toString(),
    type: 'gpacer',
    data: {
      label: filter.name,
      filterType,
      ...filter,
    },

    position: existingNode?.position || {
      x: topologicalX,
      y: 100,
    },

    className: `transition-all duration-200 ${
      existingNode?.selected
        ? 'ring-2 ring-offset-2 ring-blue-500 shadow-lg scale-105'
        : ''
    }`,

    selected: existingNode?.selected,

    style: {
      width: 220,
      height: 'auto',
    },
  };
}

// Create edges from a list of filters
export function createEdgesFromFilters(
  filters: GraphFilterData[],
  existingEdges: Edge[],
): Edge[] {
  const newEdges: Edge[] = [];

  filters.forEach((filter) => {
    if (filter.ipid) {
      Object.entries(filter.ipid).forEach(
        ([pidName, pid]: [string, any], ipidIndex: number) => {
          if (pid.source_idx !== undefined && pid.source_idx !== null) {
            // Use numeric ipidIndex for stable edge ID (not pidName which may change)
            const edgeId = `${pid.source_idx}-${filter.idx}-${ipidIndex}`;
            const existingEdge = existingEdges.find((e) => e.id === edgeId);

            // Use stream_type from PID for edge color
            const streamType = pid.stream_type?.toLowerCase() || '';
            const filterType: FilterType =
              streamType === 'visual'
                ? 'video'
                : streamType === 'audio'
                  ? 'audio'
                  : streamType === 'text'
                    ? 'text'
                    : streamType === 'file'
                      ? 'file'
                      : 'file';

            const filterColor = getFilterColor(filterType);

            // Precise mapping of sourceHandle
            const sourceFilter = filters.find((f) => f.idx === pid.source_idx);
            let sourceHandle: string | undefined;

            if (sourceFilter?.opid) {
              // If the PID has an explicit source_pid
              if (pid.source_pid) {
                sourceHandle = pid.source_pid;
              }
              // If only one output PID, use it
              else if (Object.keys(sourceFilter.opid).length === 1) {
                sourceHandle = Object.keys(sourceFilter.opid)[0];
              }
              // Search by similar name
              else {
                const matchingOutputPid = Object.keys(sourceFilter.opid).find(
                  (opid) =>
                    opid === pidName ||
                    opid.includes(pidName) ||
                    pidName.includes(opid),
                );
                sourceHandle =
                  matchingOutputPid || Object.keys(sourceFilter.opid)[0];
              }
            }

            // Skip virtual connections
            const isVirtual = pid.virtual || false;
            if (isVirtual) return;

            newEdges.push({
              id: edgeId,
              source: pid.source_idx.toString(),
              target: filter.idx.toString(),
              sourceHandle: sourceHandle,
              targetHandle: pidName,
              type: 'simplebezier',
              data: {
                filterType,
              },
              animated: true,
              style: {
                stroke: filterColor,
                strokeWidth: 3,
                opacity: 0.9,
              },
              markerEnd: {
                type: MarkerType.ArrowClosed,
                color: filterColor,
              },
              selected: existingEdge?.selected,
            });
          }
        },
      );
    }
  });
  console.log('New edges created:', newEdges);
  return newEdges;
}

// Helper function to create nodes with proper topological ordering
export function createNodesFromFilters(
  filters: GraphFilterData[],
  existingNodes: Node[] = [],
): Node[] {
  return filters.map((filter, index) =>
    createNodeFromFilter(filter, index, existingNodes, filters),
  );
}
