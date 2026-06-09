import { describe, it, expect } from 'vitest';
import { parseFilterStatus } from '../filterStatusParser';
import type { MetricDefinitionMap } from '../metricDefinitionParser';

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

    it('does not consume state flags as numeric units', () => {
      const result = parseFilterStatus('custom=42 kbps done info="ok"');
      expect(result.entries).toHaveLength(3);
      const num = result.entries[0];
      expect(num.type).toBe('num');
      if (num.type === 'num') {
        expect(num.key).toBe('custom');
        expect(num.unit).toBe('kbps');
      }
      expect(result.entries[1]).toEqual({ type: 'bool', key: 'done' });
      expect(result.entries[2]).toEqual({
        type: 'str',
        key: 'info',
        value: 'ok',
        quoted: true,
      });
    });

    it('does not overwrite an already-attached unit', () => {
      const result = parseFilterStatus('buffer=120/200 ms fps');
      const entry = result.entries[0];
      expect(entry.type).toBe('num');
      if (entry.type === 'num') expect(entry.unit).toBe('ms');
      expect(result.entries).toHaveLength(2);
    });

    it('regression 5a22c9fe: skips redundant unit token when defUnit already attached', () => {
      const defs: MetricDefinitionMap = {
        buffer: { type: 'num', unit: 'ms', label: 'Buffer', freg: '*' },
      };
      const result = parseFilterStatus('buffer=120/200 ms fps=25', defs);
      const spurious = result.entries.find(
        (e) => e.type === 'bool' && (e as { key: string }).key === 'ms',
      );
      expect(
        spurious,
        'ms must not appear as a bool when defUnit already set',
      ).toBeUndefined();
      expect(result.entries).toHaveLength(2);
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

  describe('real snapshot — output sink (vout/aout)', () => {
    it('parses video sink: quoted info with space + time fraction + buffer+ms + fps', () => {
      const result = parseFilterStatus(
        'info="640x480 yuv420" time=152064/12800 buffer=101/100 ms fps=25.08',
      );
      expect(result.entries).toHaveLength(4);
      expect(result.entries[0]).toEqual({
        type: 'str',
        key: 'info',
        value: '640x480 yuv420',
        quoted: true,
      });
      expect(result.entries[1]).toMatchObject({
        type: 'num',
        key: 'time',
        fraction: { num: 152064, den: 12800 },
      });
      const buffer = result.entries[2];
      expect(buffer.type).toBe('num');
      if (buffer.type === 'num') {
        expect(buffer.key).toBe('buffer');
        expect(buffer.fraction).toEqual({ num: 101, den: 100 });
        expect(buffer.unit).toBe('ms');
      }
      expect(result.entries[3]).toMatchObject({ type: 'num', key: 'fps' });
    });

    it('parses audio sink: multi-word quoted info + time fraction + buffer+ms', () => {
      const result = parseFilterStatus(
        'info="48000 Hz 6 ch s32" time=579584/48000 buffer=229/200 ms',
      );
      expect(result.entries).toHaveLength(3);
      expect(result.entries[0]).toEqual({
        type: 'str',
        key: 'info',
        value: '48000 Hz 6 ch s32',
        quoted: true,
      });
      expect(result.entries[1]).toMatchObject({
        type: 'num',
        key: 'time',
        fraction: { num: 579584, den: 48000 },
      });
      const buffer = result.entries[2];
      expect(buffer.type).toBe('num');
      if (buffer.type === 'num') {
        expect(buffer.unit).toBe('ms');
        expect(buffer.fraction).toEqual({ num: 229, den: 200 });
      }
    });
  });

  describe('real snapshot — rfnalu (unknown keys as plain counters)', () => {
    it('parses all-integer counter metrics with unknown keys', () => {
      const result = parseFilterStatus(
        'NALU=62 I=3 P=18 B=34 SI=0 SP=0 IDR=3 CRA=0 SEI=1',
      );
      expect(result.entries).toHaveLength(9);
      for (const entry of result.entries) {
        expect(entry.type).toBe('num');
      }
      expect(result.entries[0]).toEqual({
        type: 'num',
        key: 'NALU',
        value: 62,
      });
      expect(result.entries[6]).toEqual({ type: 'num', key: 'IDR', value: 3 });
    });
  });

  describe('real snapshot — DASH demux', () => {
    it('parses time=4.09s as bare string, not a fraction', () => {
      const result = parseFilterStatus('period=1 time=4.09s prog=0');
      expect(result.entries[1]).toEqual({
        type: 'str',
        key: 'time',
        value: '4.09s',
        quoted: false,
      });
    });

    it('parses prog=0 as plain integer (no fraction)', () => {
      const result = parseFilterStatus('prog=0');
      expect(result.entries[0]).toEqual({ type: 'num', key: 'prog', value: 0 });
    });

    it('parses array with item names containing # and .', () => {
      const result = parseFilterStatus(
        '[AS#1.1 type=A seg=5 prog=3824/44100, AS#2.1 type=V seg=3]',
      );
      const array = result.entries[0];
      expect(array.type).toBe('array');
      if (array.type === 'array') {
        expect(array.items[0].name).toBe('AS#1.1');
        expect(array.items[1].name).toBe('AS#2.1');
        expect(array.items[0].entries).toContainEqual({
          type: 'str',
          key: 'type',
          value: 'A',
          quoted: false,
        });
        expect(array.items[0].entries).toContainEqual(
          expect.objectContaining({
            type: 'num',
            key: 'prog',
            fraction: { num: 3824, den: 44100 },
          }),
        );
      }
    });

    it('parses full DASH status: array + scalars after (scalars emitted before array)', () => {
      const raw =
        '[AS#1.1 type=A seg=5 prog=3824/44100, AS#2.1 type=V seg=3 prog=0/12800] period=1 time=4.09s prog=0';
      const result = parseFilterStatus(raw);
      expect(result.entries).toHaveLength(4);
      expect(result.entries[0]).toEqual({
        type: 'num',
        key: 'period',
        value: 1,
      });
      expect(result.entries[1]).toEqual({
        type: 'str',
        key: 'time',
        value: '4.09s',
        quoted: false,
      });
      expect(result.entries[2]).toEqual({ type: 'num', key: 'prog', value: 0 });
      const array = result.entries[3];
      expect(array.type).toBe('array');
      if (array.type === 'array') {
        expect(array.items).toHaveLength(2);
        expect(array.items[0].name).toBe('AS#1.1');
      }
    });

    it('parses prog fraction + explicit pc float', () => {
      const result = parseFilterStatus('prog=350000/652932 pc=53.60');
      expect(result.entries[0]).toMatchObject({
        type: 'num',
        key: 'prog',
        fraction: { num: 350000, den: 652932 },
      });
      const pc = result.entries[1];
      expect(pc.type).toBe('num');
      if (pc.type === 'num') expect(pc.value).toBeCloseTo(53.6);
    });
  });

  describe('real snapshot — mp4mx / mux', () => {
    it('parses info="importing" (quoted single word) + array', () => {
      const result = parseFilterStatus(
        'info="importing" [TK2 type=A pc=20, TK1 type=V pc=14]',
      );
      expect(result.entries[0]).toEqual({
        type: 'str',
        key: 'info',
        value: 'importing',
        quoted: true,
      });
      const array = result.entries[1];
      expect(array.type).toBe('array');
      if (array.type === 'array') {
        expect(array.items.map((i) => i.name)).toEqual(['TK2', 'TK1']);
      }
    });

    it('parses segs + frags + next float + array', () => {
      const result = parseFilterStatus(
        'segs=4 frags=1 next=5.000 [TK2 type=A spf=10 pc=0]',
      );
      expect(result.entries).toHaveLength(4);
      expect(result.entries[0]).toEqual({ type: 'num', key: 'segs', value: 4 });
      expect(result.entries[1]).toEqual({
        type: 'num',
        key: 'frags',
        value: 1,
      });
      expect(result.entries[2]).toMatchObject({ type: 'num', key: 'next' });
      expect(result.entries[3].type).toBe('array');
    });

    it('parses custom s_bytes metric', () => {
      const result = parseFilterStatus(
        'info="video_dash_track1_2.m4s" s_bytes=145225',
      );
      expect(result.entries[0]).toEqual({
        type: 'str',
        key: 'info',
        value: 'video_dash_track1_2.m4s',
        quoted: true,
      });
      expect(result.entries[1]).toEqual({
        type: 'num',
        key: 's_bytes',
        value: 145225,
      });
    });
  });

  describe('custom developer metrics — any unknown key must parse', () => {
    it('parses unknown numeric key', () => {
      const result = parseFilterStatus('my_metric=42');
      expect(result.entries).toEqual([
        { type: 'num', key: 'my_metric', value: 42 },
      ]);
    });

    it('parses unknown bool flag', () => {
      const result = parseFilterStatus('my_flag');
      expect(result.entries).toEqual([{ type: 'bool', key: 'my_flag' }]);
    });

    it('parses unknown bare-word enum', () => {
      const result = parseFilterStatus('codec=h264');
      expect(result.entries).toEqual([
        { type: 'str', key: 'codec', value: 'h264', quoted: false },
      ]);
    });

    it('parses unknown quoted string', () => {
      const result = parseFilterStatus('status_msg="processing input data"');
      expect(result.entries).toEqual([
        {
          type: 'str',
          key: 'status_msg',
          value: 'processing input data',
          quoted: true,
        },
      ]);
    });

    it('parses mix of custom and standard metrics — bool must come before numerics to avoid unit annotation', () => {
      const result = parseFilterStatus('active fps=30 my_rate=100');
      expect(result.entries).toHaveLength(3);
      expect(result.entries[0]).toEqual({ type: 'bool', key: 'active' });
      expect(result.entries[1]).toMatchObject({ type: 'num', key: 'fps' });
      expect(result.entries[2]).toEqual({
        type: 'num',
        key: 'my_rate',
        value: 100,
      });
    });

    it('bare word after a num entry is consumed as unit (pure positional rule)', () => {
      const result = parseFilterStatus('fps=30 my_rate=100 active');
      expect(result.entries).toHaveLength(2);
      const myRate = result.entries[1];
      expect(myRate.type).toBe('num');
      if (myRate.type === 'num') {
        expect(myRate.key).toBe('my_rate');
        expect(myRate.unit).toBe('active');
      }
    });

    it('accepts any string as unit — not limited to known units', () => {
      const result = parseFilterStatus('count=5 packets');
      expect(result.entries).toHaveLength(1);
      const entry = result.entries[0];
      expect(entry.type).toBe('num');
      if (entry.type === 'num') {
        expect(entry.key).toBe('count');
        expect(entry.unit).toBe('packets');
      }
    });

    it('parses custom array with unknown item names and bool entries', () => {
      const result = parseFilterStatus(
        '[worker_1 tasks=5 done, worker_2 tasks=3]',
      );
      const array = result.entries[0];
      expect(array.type).toBe('array');
      if (array.type === 'array') {
        expect(array.items[0].name).toBe('worker_1');
        expect(array.items[0].entries).toContainEqual({
          type: 'num',
          key: 'tasks',
          value: 5,
        });
        expect(array.items[0].entries).toContainEqual({
          type: 'bool',
          key: 'done',
        });
      }
    });
  });

  describe('MetricDefinitionMap — type override', () => {
    it('period=1 without definitions → StatusNum (value-based inference)', () => {
      const result = parseFilterStatus('period=1');
      expect(result.entries[0]).toEqual({
        type: 'num',
        key: 'period',
        value: 1,
      });
    });

    it('period=1 with t=str definition → StatusStr (definition wins)', () => {
      const definitions = {
        period: { type: 'str' as const, label: 'Period ID', freg: 'dasher' },
      };
      const result = parseFilterStatus('period=1', definitions);
      expect(result.entries[0]).toEqual({
        type: 'str',
        key: 'period',
        value: '1',
        quoted: false,
      });
    });

    it('seg=5 with t=num definition → StatusNum (no change)', () => {
      const definitions = {
        seg: { type: 'num' as const, label: 'Segment Number', freg: 'dasher' },
      };
      const result = parseFilterStatus('seg=5', definitions);
      expect(result.entries[0]).toEqual({ type: 'num', key: 'seg', value: 5 });
    });

    it('undefined key without matching definition → value-based inference unchanged', () => {
      const definitions = {
        period: { type: 'str' as const, label: 'Period ID', freg: 'dasher' },
      };
      const result = parseFilterStatus('fps=30', definitions);
      expect(result.entries[0]).toEqual({ type: 'num', key: 'fps', value: 30 });
    });

    it('full DASH status with definitions → period is StatusStr', () => {
      const definitions = {
        period: { type: 'str' as const, label: 'Period ID', freg: 'dasher' },
      };
      const raw = 'period=1 time=4.09s prog=0';
      const result = parseFilterStatus(raw, definitions);
      expect(result.entries[0]).toEqual({
        type: 'str',
        key: 'period',
        value: '1',
        quoted: false,
      });
    });

    it('ohead=25 with u=pc definition → StatusNum with unit "pc"', () => {
      const definitions = {
        ohead: {
          type: 'num' as const,
          unit: 'pc',
          label: 'Overhead',
          freg: '*',
        },
      };
      const result = parseFilterStatus('ohead=25', definitions);
      // Bug: parser attaches type override from definitions but not unit
      expect(result.entries[0]).toMatchObject({
        type: 'num',
        key: 'ohead',
        value: 25,
        unit: 'pc',
      });
    });
  });
});
