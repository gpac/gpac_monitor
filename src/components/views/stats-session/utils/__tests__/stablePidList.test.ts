import { describe, it, expect } from 'vitest';
import { stablePidList, type PidCache } from '../stablePidList';
import { makePID } from '../../monitored_filters/tabs/hooks/__tests__/fixtures';

describe('stablePidList', () => {
  it('identical values → same references reused', () => {
    const cache: PidCache = new Map();
    const pids = { Video_0: makePID({ name: 'Video_0', buffer: 100 }) };

    const first = stablePidList(cache, pids);
    const second = stablePidList(cache, {
      Video_0: makePID({ name: 'Video_0', buffer: 100 }),
    });

    expect(second[0]).toBe(first[0]);
  });

  it('only the changed PID gets a new reference', () => {
    const cache: PidCache = new Map();
    const pids = {
      Audio_0: makePID({ name: 'Audio_0', buffer: 10 }),
      Video_0: makePID({ name: 'Video_0', buffer: 20 }),
    };

    const first = stablePidList(cache, pids);
    const second = stablePidList(cache, {
      Audio_0: makePID({ name: 'Audio_0', buffer: 10 }),
      Video_0: makePID({ name: 'Video_0', buffer: 999 }),
    });

    expect(second[0]).toBe(first[0]);
    expect(second[1]).not.toBe(first[1]);
  });

  it('output order is sorted by key regardless of payload enumeration order', () => {
    const cache: PidCache = new Map();
    const pids = {
      Video_1: makePID({ name: 'Video_1' }),
      Audio_0: makePID({ name: 'Audio_0' }),
    };

    const result = stablePidList(cache, pids);

    expect(result.map((pid) => pid.name)).toEqual(['Audio_0', 'Video_1']);
  });

  it('removed key is pruned from cache', () => {
    const cache: PidCache = new Map();
    stablePidList(cache, { Video_0: makePID({ name: 'Video_0' }) });

    stablePidList(cache, {});

    expect(cache.has('Video_0')).toBe(false);
  });

  it('undefined map → empty array, cache cleared', () => {
    const cache: PidCache = new Map();
    stablePidList(cache, { Video_0: makePID({ name: 'Video_0' }) });

    const result = stablePidList(cache, undefined);

    expect(result).toEqual([]);
    expect(cache.size).toBe(0);
  });
});
