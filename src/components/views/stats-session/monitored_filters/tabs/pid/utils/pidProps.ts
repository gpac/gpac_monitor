type GpacFracND = { n: number; d: number };
type GpacFracNumDen = { num: number; den: number };

const computeFps = (n: number, d: number): string => {
  if (d === 0) return '—';
  return `${(n / d).toFixed(2)} fps`;
};

export const formatGpacFps = (value: unknown): string => {
  if (value == null) return '—';

  if (typeof value === 'object') {
    if ('n' in (value as object) && 'd' in (value as object)) {
      const frac = value as GpacFracND;
      return computeFps(frac.n, frac.d);
    }
    if ('num' in (value as object) && 'den' in (value as object)) {
      const frac = value as GpacFracNumDen;
      return computeFps(frac.num, frac.den);
    }
  }

  if (typeof value === 'string' && value.includes('/')) {
    const parts = value.split('/');
    const n = Number(parts[0]);
    const d = Number(parts[1]);
    if (!isNaN(n) && !isNaN(d)) return computeFps(n, d);
  }

  return '—';
};
