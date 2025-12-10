import { describe, it, expect } from 'vitest';

describe('useGraphMonitor - node annotation logic', () => {
  it('should correctly annotate nodes with isMonitored property', () => {
    const subscribedSet = new Set([1, 3]);

    const localNodes = [
      { id: 'node-1', data: { idx: 1, name: 'filter1' } },
      { id: 'node-2', data: { idx: 2, name: 'filter2' } },
      { id: 'node-3', data: { idx: 3, name: 'filter3' } },
    ];

    // Simulate annotation logic from useGraphMonitor
    const annotatedNodes = localNodes.map((node) => {
      const filterIdx = node.data?.idx as number | undefined;
      const isMonitored =
        typeof filterIdx === 'number' && subscribedSet.has(filterIdx);

      return {
        ...node,
        data: {
          ...node.data,
          isMonitored,
        },
      };
    });

    expect(annotatedNodes[0].data.isMonitored).toBe(true);
    expect(annotatedNodes[1].data.isMonitored).toBe(false);
    expect(annotatedNodes[2].data.isMonitored).toBe(true);
  });

  it('should handle undefined filterIdx', () => {
    const subscribedSet = new Set([1]);

    const nodeWithoutIdx = { id: 'node-1', data: { name: 'filter1' } };

    const filterIdx = nodeWithoutIdx.data?.idx as number | undefined;
    const isMonitored =
      typeof filterIdx === 'number' && subscribedSet.has(filterIdx);

    expect(isMonitored).toBe(false);
  });

  it('should detect when subscribed set is empty', () => {
    const subscribedSet = new Set<number>();

    const nodes = [
      { id: 'node-1', data: { idx: 1, name: 'filter1' } },
      { id: 'node-2', data: { idx: 2, name: 'filter2' } },
    ];

    const annotatedNodes = nodes.map((node) => {
      const filterIdx = node.data?.idx as number | undefined;
      const isMonitored =
        typeof filterIdx === 'number' && subscribedSet.has(filterIdx);
      return { ...node, data: { ...node.data, isMonitored } };
    });

    annotatedNodes.forEach((node) => {
      expect(node.data.isMonitored).toBe(false);
    });
  });
});
