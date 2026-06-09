import { describe, it, expect } from 'vitest';
import { BUILTIN_STATUS_METRICS } from '../builtinStatusMetrics';

const SPEC_KEYS = [
  'prog',
  'done',
  'pc',
  'info',
  'type',
  'time',
  'r_rate',
  'r_bytes',
  'r_pck',
  's_rate',
  's_bytes',
  's_pck',
  'ohead',
  'ohead_pck',
  'twnd',
  'wait',
  'buffer',
  'fps',
];

describe('BUILTIN_STATUS_METRICS', () => {
  it('contains the 18 spec-defined metrics', () => {
    for (const key of SPEC_KEYS) {
      expect(BUILTIN_STATUS_METRICS[key], `missing: ${key}`).toBeDefined();
    }
    expect(Object.keys(BUILTIN_STATUS_METRICS)).toHaveLength(18);
  });

  it('all entries have a label', () => {
    for (const [key, def] of Object.entries(BUILTIN_STATUS_METRICS)) {
      expect(def.label, `${key} must have a label`).toBeTruthy();
    }
  });

  it('all entries have freg="*"', () => {
    for (const [key, def] of Object.entries(BUILTIN_STATUS_METRICS)) {
      expect(def.freg, `${key}.freg`).toBe('*');
    }
  });

  it('buffer is frac with unit ms', () => {
    expect(BUILTIN_STATUS_METRICS['buffer']?.type).toBe('frac');
    expect(BUILTIN_STATUS_METRICS['buffer']?.unit).toBe('ms');
  });

  it('r_rate and s_rate have unit kbps', () => {
    expect(BUILTIN_STATUS_METRICS['r_rate']?.unit).toBe('kbps');
    expect(BUILTIN_STATUS_METRICS['s_rate']?.unit).toBe('kbps');
  });

  it('fps has unit fps', () => {
    expect(BUILTIN_STATUS_METRICS['fps']?.unit).toBe('fps');
  });

  it('type metric has 4 enum values V/A/T/M', () => {
    const values = BUILTIN_STATUS_METRICS['type']?.values;
    expect(values).toHaveLength(4);
    expect(values?.map((v) => v.code)).toEqual(['V', 'A', 'T', 'M']);
  });

  it('ohead has unit pc', () => {
    expect(BUILTIN_STATUS_METRICS['ohead']?.unit).toBe('pc');
  });
});
