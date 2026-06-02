import { describe, it, expect } from 'vitest';
import { buildFilterStatusViewModel } from '../statusViewModel';
import { parseFilterStatus } from '@/workers/filterStatusParser';
import { formatFractionAsTime } from '@/utils/formatting';

function build(raw: string) {
  return buildFilterStatusViewModel(parseFilterStatus(raw));
}

describe('buildFilterStatusViewModel', () => {
  describe('primaryProgress — prog', () => {
    it('prog fraction → primaryProgress with correct percentage and label', () => {
      const vm = build('prog=57057/90000');
      expect(vm.primaryProgress?.percentage).toBeCloseTo(63.4, 1);
      expect(vm.primaryProgress?.valueLabel).toBe('57057 / 90000');
    });

    it('prog fraction → not in numericMetrics', () => {
      const vm = build('prog=57057/90000');
      expect(vm.numericMetrics.find((m) => m.key === 'prog')).toBeUndefined();
    });

    it('prog simple number → percentage equals value, valueLabel ends with %', () => {
      const vm = build('prog=5');
      expect(vm.primaryProgress?.percentage).toBe(5);
      expect(vm.primaryProgress?.valueLabel).toBe('5%');
    });
  });

  describe('explicit percent — pc', () => {
    it('pc=6 → numericMetrics "6%", no primaryProgress', () => {
      const vm = build('pc=6');
      expect(vm.primaryProgress).toBeUndefined();
      expect(vm.numericMetrics.find((m) => m.key === 'pc')?.value).toBe('6%');
    });

    it('pc=53.6 → value "53.6%"', () => {
      expect(
        build('pc=53.6').numericMetrics.find((m) => m.key === 'pc')?.value,
      ).toBe('53.6%');
    });
  });

  describe('buffer metric', () => {
    it('buffer fraction ms → buffer object, not in numericMetrics', () => {
      const vm = build('buffer=120/200 ms');
      expect(vm.buffer).toEqual({
        key: 'buffer',
        current: 120,
        max: 200,
        unit: 'ms',
        percentage: 60,
      });
      expect(vm.numericMetrics.find((m) => m.key === 'buffer')).toBeUndefined();
    });
  });

  describe('time metric', () => {
    it('time fraction → formatted value with tooltip, no primaryProgress', () => {
      const vm = build('time=57057/90000');
      const metric = vm.numericMetrics.find((m) => m.key === 'time');
      expect(metric?.value).toBe(formatFractionAsTime(57057, 90000));
      expect(metric?.tooltip).toBe('57057/90000');
      expect(vm.primaryProgress).toBeUndefined();
    });
  });

  describe('unknown fraction', () => {
    it('ratio=3/7 → numericMetrics "3 / 7", no primaryProgress, no buffer', () => {
      const vm = build('ratio=3/7');
      expect(vm.numericMetrics.find((m) => m.key === 'ratio')?.value).toBe(
        '3 / 7',
      );
      expect(vm.primaryProgress).toBeUndefined();
      expect(vm.buffer).toBeUndefined();
    });
  });

  describe('array items', () => {
    it('item key equals item name (stable React key)', () => {
      const vm = build('[AS#1.1 prog=0, AS#2.1 prog=0]');
      expect(vm.arrays[0].items[0].key).toBe('AS#1.1');
      expect(vm.arrays[0].items[1].key).toBe('AS#2.1');
    });

    it('prog fraction in item → progress percentage, prog excluded from metrics', () => {
      const vm = build('[AS#1.1 type=V prog=57057/90000 time=57057/90000]');
      const item = vm.arrays[0].items[0];
      expect(item.progress).toBeCloseTo(63.4, 1);
      expect(item.metrics.find((m) => m.key === 'prog')).toBeUndefined();
      expect(item.metrics.find((m) => m.key === 'time')).toBeDefined();
    });

    it('pc fallback in item → progress=6, pc excluded from metrics', () => {
      const vm = build('[TK1 type=V spf=26 pc=6]');
      const item = vm.arrays[0].items[0];
      expect(item.progress).toBe(6);
      expect(item.metrics.find((m) => m.key === 'pc')).toBeUndefined();
      expect(item.metrics.find((m) => m.key === 'spf')).toBeDefined();
    });

    it('no prog/pc → progress undefined', () => {
      expect(
        build('[TK2 type=A spf=0]').arrays[0].items[0].progress,
      ).toBeUndefined();
    });
  });

  describe('rawValue + graphable', () => {
    it('fps → graphable true, rawValue numeric', () => {
      const metric = build('fps=30').numericMetrics.find(
        (m) => m.key === 'fps',
      );
      expect(metric?.graphable).toBe(true);
      expect(metric?.rawValue).toBe(30);
    });

    it('frames → graphable false (cumulative counter)', () => {
      const metric = build('frames=1200').numericMetrics.find(
        (m) => m.key === 'frames',
      );
      expect(metric?.graphable).toBe(false);
      expect(metric?.rawValue).toBe(1200);
    });

    it('time fraction → graphable false, rawValue null', () => {
      const metric = build('time=57057/90000').numericMetrics.find(
        (m) => m.key === 'time',
      );
      expect(metric?.graphable).toBe(false);
      expect(metric?.rawValue).toBeNull();
    });

    it('unknown fraction → rawValue null, graphable false', () => {
      const metric = build('drop=3/100').numericMetrics.find(
        (m) => m.key === 'drop',
      );
      expect(metric?.rawValue).toBeNull();
      expect(metric?.graphable).toBe(false);
    });
  });

  describe('custom filter metrics — unknown keys must not break viewModel', () => {
    it('unknown numeric with unit → in numericMetrics with unit', () => {
      expect(
        build('bitrate=1500 kbps').numericMetrics.find(
          (m) => m.key === 'bitrate',
        )?.value,
      ).toBe('1500 kbps');
    });

    it('unknown bool flag → in stateBadges', () => {
      expect(
        build('custom_flag').stateBadges.find((b) => b.key === 'custom_flag'),
      ).toBeDefined();
    });

    it('unknown quoted string → in textMetrics', () => {
      expect(
        build('status="processing"').textMetrics.find((m) => m.key === 'status')
          ?.value,
      ).toBe('processing');
    });

    it('unknown fraction → numericMetrics "num / den"', () => {
      expect(
        build('drop=3/100').numericMetrics.find((m) => m.key === 'drop')?.value,
      ).toBe('3 / 100');
    });

    it('custom keys mixed with known keys → no crash, all routed correctly', () => {
      const vm = build('prog=5 custom=42 kbps done info="ok"');
      expect(vm.primaryProgress?.percentage).toBe(5);
      expect(vm.numericMetrics.find((m) => m.key === 'custom')?.value).toBe(
        '42 kbps',
      );
      expect(vm.stateBadges.find((b) => b.key === 'done')).toBeDefined();
      expect(vm.info).toBe('ok');
    });
  });
});
