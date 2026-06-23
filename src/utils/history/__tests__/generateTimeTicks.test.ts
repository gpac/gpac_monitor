import { describe, it, expect } from 'vitest';
import { generateTimeTicks } from '../generateTimeTicks';

const US = 1_000_000;

describe('generateTimeTicks', () => {
  it('returns empty for non-positive duration', () => {
    expect(generateTimeTicks(0)).toEqual([]);
    expect(generateTimeTicks(-1)).toEqual([]);
  });

  it('first tick is always 00:00 at 0%', () => {
    const ticks = generateTimeTicks(90 * US);
    expect(ticks[0]).toEqual({ positionPercent: 0, label: '00:00' });
  });

  it('never exceeds 8 ticks (excl. endpoint) for a short session (90s)', () => {
    const ticks = generateTimeTicks(90 * US);
    expect(ticks.length).toBeLessThanOrEqual(9);
  });

  it('never exceeds 8 ticks (excl. endpoint) for a long session (3h)', () => {
    const ticks = generateTimeTicks(3 * 3600 * US);
    expect(ticks.length).toBeLessThanOrEqual(9);
  });

  it('formats hours correctly for a 3h session', () => {
    const ticks = generateTimeTicks(3 * 3600 * US);
    expect(ticks.some((tick) => tick.label === '01:00:00')).toBe(true);
  });

  it('last tick does not exceed 100%', () => {
    const ticks = generateTimeTicks(90 * US);
    expect(ticks[ticks.length - 1].positionPercent).toBeLessThanOrEqual(100);
  });
});
