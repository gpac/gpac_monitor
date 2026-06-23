import { describe, it, expect } from 'vitest';
import { generateTimeTicks } from '../generateTimeTicks';

const US = 1_000_000;

describe('generateTimeTicks', () => {
  it('returns empty major and minor for non-positive duration', () => {
    expect(generateTimeTicks(0)).toEqual({ major: [], minor: [] });
    expect(generateTimeTicks(-1)).toEqual({ major: [], minor: [] });
  });

  it('first major tick is always 00:00 at 0%', () => {
    const { major } = generateTimeTicks(90 * US);
    expect(major[0]).toEqual({ positionPercent: 0, label: '00:00' });
  });

  it('major ticks never exceed MAX_TICKS for a short session (90s)', () => {
    const { major } = generateTimeTicks(90 * US);
    expect(major.length).toBeLessThanOrEqual(17);
  });

  it('major ticks never exceed MAX_TICKS for a long session (3h)', () => {
    const { major } = generateTimeTicks(3 * 3600 * US);
    expect(major.length).toBeLessThanOrEqual(17);
  });

  it('formats hours correctly for a 3h session', () => {
    const { major } = generateTimeTicks(3 * 3600 * US);
    expect(major.some((tick) => tick.label === '01:00:00')).toBe(true);
  });

  it('last major tick does not exceed 100%', () => {
    const { major } = generateTimeTicks(90 * US);
    expect(major[major.length - 1].positionPercent).toBeLessThanOrEqual(100);
  });

  it('minor ticks appear between major ticks for intervals >= 5s', () => {
    const { major, minor } = generateTimeTicks(90 * US);
    expect(minor.length).toBeGreaterThan(0);
    const majorPositions = new Set(major.map((t) => t.positionPercent));
    minor.forEach((tick) => {
      expect(majorPositions.has(tick.positionPercent)).toBe(false);
    });
  });

  it('no minor ticks for very short intervals (2s major)', () => {
    const { minor } = generateTimeTicks(10 * US);
    expect(minor.length).toBe(0);
  });
});
