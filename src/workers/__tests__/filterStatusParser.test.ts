import { describe, it, expect } from 'vitest';
import { parseFilterStatus } from '../filterStatusParser';

describe('parseFilterStatus', () => {
  it('returns empty entries for empty string', () => {
    expect(parseFilterStatus('')).toEqual({ raw: '', entries: [] });
  });

  it('returns empty entries for whitespace-only string', () => {
    const result = parseFilterStatus('   ');
    expect(result.entries).toEqual([]);
  });

  it('preserves raw string', () => {
    const raw = 'fps=109.57 frames=13';
    expect(parseFilterStatus(raw).raw).toBe(raw);
  });

  describe('bool flags', () => {
    it('parses standalone bool flag', () => {
      const result = parseFilterStatus('done');
      expect(result.entries).toEqual([{ type: 'bool', key: 'done' }]);
    });

    it('parses multiple bool flags', () => {
      const result = parseFilterStatus('done wait');
      expect(result.entries).toEqual([
        { type: 'bool', key: 'done' },
        { type: 'bool', key: 'wait' },
      ]);
    });
  });

  describe('numeric values', () => {
    it('parses integer', () => {
      const result = parseFilterStatus('frames=13');
      expect(result.entries).toEqual([
        { type: 'num', key: 'frames', value: 13 },
      ]);
    });

    it('parses float', () => {
      const result = parseFilterStatus('fps=109.57');
      const entry = result.entries[0];
      expect(entry.type).toBe('num');
      if (entry.type === 'num') {
        expect(entry.value).toBeCloseTo(109.57);
      }
    });

    it('parses fraction', () => {
      const result = parseFilterStatus('prog=5000/9840497');
      expect(result.entries).toEqual([
        {
          type: 'num',
          key: 'prog',
          value: 5000 / 9840497,
          fraction: { num: 5000, den: 9840497 },
        },
      ]);
    });

    it('parses fraction with zero denominator as value 0', () => {
      const result = parseFilterStatus('x=1/0');
      const entry = result.entries[0];
      expect(entry.type).toBe('num');
      if (entry.type === 'num') {
        expect(entry.value).toBe(0);
        expect(entry.fraction).toEqual({ num: 1, den: 0 });
      }
    });
  });

  describe('string values', () => {
    it('parses quoted string', () => {
      const result = parseFilterStatus('info="dispatch canceled"');
      expect(result.entries).toEqual([
        { type: 'str', key: 'info', value: 'dispatch canceled', quoted: true },
      ]);
    });

    it('parses bare-word string', () => {
      const result = parseFilterStatus('type=V');
      expect(result.entries).toEqual([
        { type: 'str', key: 'type', value: 'V', quoted: false },
      ]);
    });

    it('parses LAT=B as bare-word string', () => {
      const result = parseFilterStatus('PT=B');
      expect(result.entries).toEqual([
        { type: 'str', key: 'PT', value: 'B', quoted: false },
      ]);
    });
  });

  describe('unit annotation', () => {
    it('attaches unit token to preceding numeric entry', () => {
      const result = parseFilterStatus('buffer=1240/100 ms');
      expect(result.entries).toHaveLength(1);
      const entry = result.entries[0];
      expect(entry.type).toBe('num');
      if (entry.type === 'num') {
        expect(entry.key).toBe('buffer');
        expect(entry.unit).toBe('ms');
        expect(entry.fraction).toEqual({ num: 1240, den: 100 });
      }
    });

    it('does not attach unit token if preceding entry is not num', () => {
      const result = parseFilterStatus('done ms');
      expect(result.entries).toHaveLength(2);
      expect(result.entries[0]).toEqual({ type: 'bool', key: 'done' });
      expect(result.entries[1]).toEqual({ type: 'bool', key: 'ms' });
    });

    it('attaches unit to simple numeric entry', () => {
      const result = parseFilterStatus('rate=42 kbps');
      expect(result.entries).toHaveLength(1);
      const entry = result.entries[0];
      expect(entry.type).toBe('num');
      if (entry.type === 'num') {
        expect(entry.unit).toBe('kbps');
      }
    });
  });

  describe('array parsing', () => {
    it('parses array section', () => {
      const result = parseFilterStatus('[TK1 type=V spf=13, TK2 type=A spf=0]');
      expect(result.entries).toHaveLength(1);
      const array = result.entries[0];
      expect(array.type).toBe('array');
      if (array.type === 'array') {
        expect(array.items).toHaveLength(2);
        expect(array.items[0].name).toBe('TK1');
        expect(array.items[1].name).toBe('TK2');
        expect(array.items[0].entries).toContainEqual({
          type: 'str',
          key: 'type',
          value: 'V',
          quoted: false,
        });
        expect(array.items[0].entries).toContainEqual({
          type: 'num',
          key: 'spf',
          value: 13,
        });
      }
    });

    it('preserves scalar entries before array', () => {
      const result = parseFilterStatus('frags=3 [TK1 type=V]');
      expect(result.entries).toHaveLength(2);
      expect(result.entries[0]).toEqual({
        type: 'num',
        key: 'frags',
        value: 3,
      });
      expect(result.entries[1].type).toBe('array');
    });
  });

  describe('real GPAC status strings', () => {
    it('parses ffenc status', () => {
      const result = parseFilterStatus(
        'fps=109.57 frames=13 time=13/30 Q=1180 PT=B LAT=56',
      );
      expect(result.entries).toHaveLength(6);
      expect(result.entries[0].type).toBe('num');
      expect(result.entries[4]).toEqual({
        type: 'str',
        key: 'PT',
        value: 'B',
        quoted: false,
      });
      expect(result.entries[5]).toEqual({
        type: 'num',
        key: 'LAT',
        value: 56,
      });
    });

    it('parses fin status with done flag and quoted info', () => {
      const result = parseFilterStatus(
        'done info="dispatch canceled" prog=5000/9840497',
      );
      expect(result.entries[0]).toEqual({ type: 'bool', key: 'done' });
      expect(result.entries[1]).toEqual({
        type: 'str',
        key: 'info',
        value: 'dispatch canceled',
        quoted: true,
      });
      expect(result.entries[2].type).toBe('num');
    });

    it('parses mp4mx status with array', () => {
      const result = parseFilterStatus(
        'frags=3 next=3.000 [TK1 type=V spf=13 pc=7, TK2 type=A spf=0 pc=6]',
      );
      expect(result.entries).toHaveLength(3);
      const array = result.entries[2];
      expect(array.type).toBe('array');
      if (array.type === 'array') {
        expect(array.items[0].name).toBe('TK1');
        expect(array.items[1].name).toBe('TK2');
      }
    });

    it('parses buffer with ms unit from out_audio pattern', () => {
      const result = parseFilterStatus('buffer=1240/100 ms fps=18111.46');
      expect(result.entries).toHaveLength(2);
      const buffer = result.entries[0];
      expect(buffer.type).toBe('num');
      if (buffer.type === 'num') {
        expect(buffer.key).toBe('buffer');
        expect(buffer.unit).toBe('ms');
      }
      expect(result.entries[1]).toMatchObject({ type: 'num', key: 'fps' });
    });
  });
});
