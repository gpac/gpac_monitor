import { describe, it, expect } from 'vitest';
import { Node } from '@xyflow/react';
import {
  annotateNodesStable,
  type NodeAnnotationCache,
} from '../nodeAnnotation';

const graphNode = (id: string, filterIdx: number): Node => ({
  id,
  position: { x: 0, y: 0 },
  data: { idx: filterIdx, name: `filter-${filterIdx}` },
});

describe('annotateNodesStable', () => {
  it('same inputs → same references', () => {
    const cache: NodeAnnotationCache = new Map();
    const nodes = [graphNode('0', 0), graphNode('1', 1)];
    const subscribedSet = new Set<number>([0]);

    const first = annotateNodesStable(cache, nodes, subscribedSet);
    const second = annotateNodesStable(cache, nodes, subscribedSet);

    expect(first.map((node) => node.data.isMonitored)).toEqual([true, false]);
    expect(second[0]).toBe(first[0]);
    expect(second[1]).toBe(first[1]);
  });

  it('subscribedSet membership changes for one node → only its reference changes', () => {
    const cache: NodeAnnotationCache = new Map();
    const nodes = [graphNode('0', 0), graphNode('1', 1)];

    const first = annotateNodesStable(cache, nodes, new Set<number>([]));
    const second = annotateNodesStable(cache, nodes, new Set<number>([1]));

    expect(second[0]).toBe(first[0]);
    expect(second[1]).not.toBe(first[1]);
    expect(second[1].data.isMonitored).toBe(true);
  });

  it('does not mark a node without a filter index as monitored', () => {
    const nodeWithoutIndex: Node = {
      id: 'unindexed',
      position: { x: 0, y: 0 },
      data: { name: 'filter' },
    };

    const annotatedNodes = annotateNodesStable(
      new Map(),
      [nodeWithoutIndex],
      new Set([0]),
    );

    expect(annotatedNodes[0].data.isMonitored).toBe(false);
  });

  it('clears monitoring when the last subscription is removed', () => {
    const cache: NodeAnnotationCache = new Map();
    const nodes = [graphNode('0', 0)];
    const monitoredNodes = annotateNodesStable(cache, nodes, new Set([0]));

    const unsubscribedNodes = annotateNodesStable(cache, nodes, new Set());

    expect(monitoredNodes[0].data.isMonitored).toBe(true);
    expect(unsubscribedNodes[0].data.isMonitored).toBe(false);
    expect(unsubscribedNodes[0]).not.toBe(monitoredNodes[0]);
  });

  it('node removed from input → evicted from cache', () => {
    const cache: NodeAnnotationCache = new Map();
    const subscribedSet = new Set<number>();

    annotateNodesStable(
      cache,
      [graphNode('0', 0), graphNode('1', 1)],
      subscribedSet,
    );
    annotateNodesStable(cache, [graphNode('0', 0)], subscribedSet);

    expect(cache.has('1')).toBe(false);
  });
});
