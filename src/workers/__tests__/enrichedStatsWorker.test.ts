import { describe, it, expect } from 'vitest';
import { enrichFilter } from '../enrichedStatsWorker';
import type { EnrichedFilterData } from '../enrichedStatsWorker';
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

describe('enrichFilter — definitions cache invalidation', () => {
  it('re-parses parsedStatus when definitions arrive after first tick', () => {
    // Scenario: session.custom_metrics arrives AFTER the first filter_stats tick.
    // A metric like 'state=1' looks numeric without definitions, but is declared
    // t=str in custom_metrics. The cache must not serve stale parsedStatus.

    const cache = new Map<string | number, EnrichedFilterData>();
    const filter = makeFilter('state=1');

    // tick 1: no definitions yet → '1' parsed as num
    const tick1 = enrichFilter(filter, undefined, cache);
    expect(tick1.parsedStatus.entries[0]).toMatchObject({
      type: 'num',
      key: 'state',
      value: 1,
    });

    // tick 2: same filter.status, definitions now declare state as str
    const definitions = {
      state: { type: 'str' as const, label: 'State', freg: 'test' },
    };
    const tick2 = enrichFilter(filter, definitions, cache);

    // Expected: parsedStatus reflects the definition → type 'str'
    // Bug: cache hit returns tick1 result → still type 'num'  ← test is RED here
    expect(tick2.parsedStatus.entries[0]).toMatchObject({
      type: 'str',
      key: 'state',
      value: '1',
    });
  });
});
