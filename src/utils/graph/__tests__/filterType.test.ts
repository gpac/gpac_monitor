import { describe, it, expect } from 'vitest';
import {
  determineFilterSessionType,
  isSource,
  isSink,
  isFilter,
} from '../filterType';

const makeFilter = (nb_ipid: number, nb_opid: number) =>
  ({ nb_ipid, nb_opid }) as any;

describe('determineFilterSessionType', () => {
  it('returns source when no inputs and has outputs', () => {
    expect(determineFilterSessionType(makeFilter(0, 2))).toBe('source');
  });

  it('returns sink when has inputs and no outputs', () => {
    expect(determineFilterSessionType(makeFilter(2, 0))).toBe('sink');
  });

  it('returns filter when has both inputs and outputs', () => {
    expect(determineFilterSessionType(makeFilter(1, 1))).toBe('filter');
  });

  it('returns filter when no inputs and no outputs', () => {
    expect(determineFilterSessionType(makeFilter(0, 0))).toBe('filter');
  });
});

describe('convenience helpers', () => {
  it('isSource returns true only for sources', () => {
    expect(isSource(makeFilter(0, 1))).toBe(true);
    expect(isSource(makeFilter(1, 1))).toBe(false);
  });

  it('isSink returns true only for sinks', () => {
    expect(isSink(makeFilter(1, 0))).toBe(true);
    expect(isSink(makeFilter(1, 1))).toBe(false);
  });

  it('isFilter returns true for bidirectional or isolated', () => {
    expect(isFilter(makeFilter(1, 1))).toBe(true);
    expect(isFilter(makeFilter(0, 0))).toBe(true);
  });
});
