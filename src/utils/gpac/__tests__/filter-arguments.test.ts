import { describe, it, expect } from 'vitest';
import { convertArgumentValue } from '../filter-arguments';

describe('convertArgumentValue', () => {
  it('returns null for null/undefined', () => {
    expect(convertArgumentValue(null, 'bool')).toBeNull();
    expect(convertArgumentValue(undefined, 'uint')).toBeNull();
  });

  describe('bool', () => {
    it('converts boolean values', () => {
      expect(convertArgumentValue(true, 'bool')).toBe('true');
      expect(convertArgumentValue(false, 'bool')).toBe('false');
    });

    it('converts string values', () => {
      expect(convertArgumentValue('true', 'bool')).toBe('true');
      expect(convertArgumentValue('1', 'bool')).toBe('true');
      expect(convertArgumentValue('false', 'bool')).toBe('false');
      expect(convertArgumentValue('0', 'bool')).toBe('false');
    });

    it('converts truthy/falsy values', () => {
      expect(convertArgumentValue(1, 'bool')).toBe('true');
      expect(convertArgumentValue(0, 'bool')).toBe('false');
    });
  });

  describe('integer types', () => {
    it.each(['uint', 'sint', 'luint', 'lsint'])(
      '%s parses integers',
      (type) => {
        expect(convertArgumentValue(42, type)).toBe('42');
        expect(convertArgumentValue('42', type)).toBe('42');
      },
    );

    it('returns 0 for invalid integer', () => {
      expect(convertArgumentValue('abc', 'uint')).toBe('0');
    });
  });

  describe('float types', () => {
    it.each(['flt', 'dbl'])('%s parses floats', (type) => {
      expect(convertArgumentValue(3.14, type)).toBe('3.14');
      expect(convertArgumentValue('3.14', type)).toBe('3.14');
    });

    it('returns 0.0 for invalid float', () => {
      expect(convertArgumentValue('abc', 'flt')).toBe('0.0');
    });
  });

  describe('fraction types', () => {
    it('passes through string fractions', () => {
      expect(convertArgumentValue('24000/1001', 'frac')).toBe('24000/1001');
    });

    it('converts object {num, den}', () => {
      expect(convertArgumentValue({ num: 30, den: 1 }, 'frac')).toBe('30/1');
    });

    it('adds /1 default denominator', () => {
      expect(convertArgumentValue(25, 'frac')).toBe('25/1');
    });
  });

  describe('list types', () => {
    it.each(['strl', 'uintl', 'sintl', '4ccl'])('%s joins arrays', (type) => {
      expect(convertArgumentValue(['a', 'b', 'c'], type)).toBe('a,b,c');
    });

    it('converts single value to string', () => {
      expect(convertArgumentValue('single', 'strl')).toBe('single');
    });
  });

  describe('default', () => {
    it('converts unknown types to trimmed string', () => {
      expect(convertArgumentValue(' hello ', 'unknown')).toBe('hello');
    });
  });
});
