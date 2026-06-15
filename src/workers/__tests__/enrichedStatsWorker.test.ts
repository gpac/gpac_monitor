import { describe, it, expect, beforeEach } from 'vitest';
import { enrichFilter, enrichedCache } from '../enrichedStatsWorker';
import type { GpacNodeData } from '@/types/domain/gpac/model';

const makeFilter = (status: string): GpacNodeData =>
  ({
    idx: 0,
    name: 'ffenc',
    status,
    bytes_done: 0,
    pck_done: 0,
    time: 0,
    errors: 0,
    nb_ipid: 1,
    nb_opid: 1,
  }) as GpacNodeData;

beforeEach(() => {
  enrichedCache.clear();
});

describe('enrichFilter — definitions cache invalidation', () => {
  it('re-parses parsedStatus when definitions arrive after first tick', () => {
    const filter = makeFilter('state=1');

    const tick1 = enrichFilter(filter, undefined);
    expect(tick1.parsedStatus.entries[0]).toMatchObject({
      type: 'num',
      key: 'state',
      value: 1,
    });

    const definitions = {
      state: { type: 'str' as const, label: 'State', freg: 'test' },
    };
    const tick2 = enrichFilter(filter, definitions);

    expect(tick2.parsedStatus.entries[0]).toMatchObject({
      type: 'str',
      key: 'state',
      value: '1',
    });
  });
});

describe('enrichFilter — session stats cache invalidation', () => {
  it('returns updated stats when only dynamic fields change (status unchanged)', () => {
    const tick1 = enrichFilter(makeFilter(''), undefined);
    expect(tick1.bytes_done).toBe(0);

    const tick2Input = {
      ...makeFilter(''),
      bytes_done: 1024,
      pck_done: 42,
      time: 500_000,
    } as GpacNodeData;
    const tick2 = enrichFilter(tick2Input, undefined);

    expect(tick2.bytes_done).toBe(1024);
    expect(tick2.pck_done).toBe(42);
    expect(tick2.time).toBe(500_000);
    expect(tick2).not.toBe(tick1);
  });

  it('returns cached object when nothing changed (reference equality preserved)', () => {
    const tick1 = enrichFilter(makeFilter('done'), undefined);
    const tick2 = enrichFilter(makeFilter('done'), undefined);

    expect(tick2).toBe(tick1);
  });
});
