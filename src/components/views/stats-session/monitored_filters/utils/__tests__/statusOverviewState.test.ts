import { describe, it, expect } from 'vitest';
import { parseFilterStatus } from '@/workers/filterStatusParser';
import { buildFilterStatusViewModel } from '../statusViewModel';
import { getStatusOverviewState } from '../statusOverviewState';

function stateOf(raw: string) {
  return getStatusOverviewState(
    buildFilterStatusViewModel(parseFilterStatus(raw)),
  );
}

describe('getStatusOverviewState', () => {
  it('empty status → none', () => {
    expect(stateOf('')).toBe('none');
  });

  it('info only → summary (info is never graphable)', () => {
    expect(stateOf('info="importing"')).toBe('summary');
  });

  it('numeric scalar (frames) → graph (type-driven: StatusNum is graphable)', () => {
    expect(stateOf('frames=13')).toBe('graph');
  });

  it('tracks array with numeric scalar → graph', () => {
    expect(stateOf('frames=13 [TK1 type=V pc=96, TK2 type=A pc=4]')).toBe(
      'graph',
    );
  });

  it('graphable metric (fps) → graph', () => {
    expect(stateOf('fps=109.57')).toBe('graph');
  });

  it('graphable wins over info text', () => {
    expect(stateOf('info="encoding" fps=30')).toBe('graph');
  });
});
