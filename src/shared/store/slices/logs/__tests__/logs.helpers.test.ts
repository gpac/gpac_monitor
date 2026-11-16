import { describe, it, expect } from 'vitest';
import { GpacLogEntry } from '@/types/domain/gpac/log-types';
import { trimBuffer } from '../logs.helpers';

const makeLog = (level: number, id: number): GpacLogEntry => ({
  timestamp: id,
  tool: 'filter',
  level,
  message: `msg-${id}`,
});

describe('trimBuffer', () => {
  it('removes debug/info before warning/error', () => {
    const buffer = [
      makeLog(1, 1), // error
      makeLog(2, 2), // warning
      makeLog(3, 3), // info
      makeLog(4, 4), // debug
    ];
    const removed = trimBuffer(buffer, 2);
    expect(removed.map((l) => l.level)).toEqual([3, 4]);
    expect(buffer.map((l) => l.level)).toEqual([1, 2]);
  });

  it('removes warnings before errors when no info/debug left', () => {
    const buffer = [
      makeLog(1, 1), // error
      makeLog(2, 2), // warning
      makeLog(2, 3), // warning
    ];
    const removed = trimBuffer(buffer, 2);
    expect(removed.map((l) => l.level)).toEqual([2, 2]);
    expect(buffer).toHaveLength(1);
    expect(buffer[0].level).toBe(1);
  });

  it('falls back to removing errors only when buffer is all errors', () => {
    const buffer = Array.from({ length: 5 }, (_, i) => makeLog(1, i));
    const removed = trimBuffer(buffer, 2);
    expect(removed).toHaveLength(2);
    expect(buffer).toHaveLength(3);
  });
});
