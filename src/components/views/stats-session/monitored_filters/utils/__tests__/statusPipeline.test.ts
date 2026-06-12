import { describe, it, expect } from 'vitest';
import { parseMetricDefinitions } from '@/workers/metricDefinitionParser';
import { parseFilterStatus } from '@/workers/filterStatusParser';
import {
  buildFilterStatusViewModel,
  type FilterStatusViewModel,
} from '../statusViewModel';

const NEW_FILTER_DEFINITIONS = `freg=mycustom;wdg=Widgets;i=Number of widgets processed;u=widgets
freg=mycustom;fill=Fill level;t=frac;u=ms
freg=mycustom;mode=Run mode;t=str;v=[F:Fast, S:Slow]
freg=mycustom;res=Resolution;t=str;i="Output resolution; width*height"
freg=*;uptime=Uptime;u=s`;

const NEW_FILTER_STATUS = 'mode=F wdg=1234 fill=50/100 res=1920*1080 uptime=42';
const NEW_FILTER_STATUS_KEYS = ['fill', 'mode', 'res', 'uptime', 'wdg'];

function collectVisibleKeys(viewModel: FilterStatusViewModel): string[] {
  return [
    ...(viewModel.info ? ['info'] : []),
    ...(viewModel.primaryProgress ? [viewModel.primaryProgress.key] : []),
    ...(viewModel.buffer ? ['buffer'] : []),
    ...viewModel.numericMetrics.map((metric) => metric.key),
    ...viewModel.textMetrics.map((metric) => metric.key),
    ...viewModel.stateBadges.map((badge) => badge.key),
  ];
}

describe('status display pipeline — new developer filter', () => {
  it('parses all definitions of the new filter', () => {
    const definitions = parseMetricDefinitions(NEW_FILTER_DEFINITIONS);
    expect(Object.keys(definitions).sort()).toEqual(NEW_FILTER_STATUS_KEYS);
    expect(definitions['uptime']?.freg).toBe('*');
    expect(definitions['res']?.info).toBe('Output resolution; width*height');
  });

  it('every status metric reaches a visible channel (with definitions)', () => {
    const definitions = parseMetricDefinitions(NEW_FILTER_DEFINITIONS);
    const viewModel = buildFilterStatusViewModel(
      parseFilterStatus(NEW_FILTER_STATUS, definitions),
    );
    expect(collectVisibleKeys(viewModel).sort()).toEqual(
      NEW_FILTER_STATUS_KEYS,
    );
  });

  it('every status metric reaches a visible channel (no definitions — old GPAC build)', () => {
    const viewModel = buildFilterStatusViewModel(
      parseFilterStatus(NEW_FILTER_STATUS),
    );
    expect(collectVisibleKeys(viewModel).sort()).toEqual(
      NEW_FILTER_STATUS_KEYS,
    );
  });

  it('routes each metric to the expected channel', () => {
    const definitions = parseMetricDefinitions(NEW_FILTER_DEFINITIONS);
    const viewModel = buildFilterStatusViewModel(
      parseFilterStatus(NEW_FILTER_STATUS, definitions),
    );
    expect(viewModel.stateBadges).toEqual([
      { key: 'mode', label: 'F', styleKey: 'f' },
    ]);
    expect(
      viewModel.numericMetrics.find((metric) => metric.key === 'wdg')?.value,
    ).toBe('1234 widgets');
    expect(
      viewModel.numericMetrics.find((metric) => metric.key === 'fill')?.value,
    ).toBe('50 / 100 ms');
    expect(
      viewModel.numericMetrics.find((metric) => metric.key === 'uptime')?.value,
    ).toBe('42 s');
    expect(
      viewModel.textMetrics.find((metric) => metric.key === 'res'),
    ).toEqual({ key: 'res', value: '1920*1080', quoted: false });
  });

  it('a status key missing from definitions is still displayed', () => {
    const definitions = parseMetricDefinitions(NEW_FILTER_DEFINITIONS);
    const viewModel = buildFilterStatusViewModel(
      parseFilterStatus(`${NEW_FILTER_STATUS} extra=7`, definitions),
    );
    expect(
      viewModel.numericMetrics.find((metric) => metric.key === 'extra')?.value,
    ).toBe('7');
  });

  describe('resolution special case — number*number is a string (GPAC doc)', () => {
    it('res=1920*1080 with t=str definition → string, never numeric', () => {
      const definitions = parseMetricDefinitions(NEW_FILTER_DEFINITIONS);
      const parsed = parseFilterStatus('res=1920*1080', definitions);
      expect(parsed.entries).toEqual([
        { type: 'str', key: 'res', value: '1920*1080', quoted: false },
      ]);
    });

    it('res=1920*1080 without definition → string by value inference', () => {
      const parsed = parseFilterStatus('res=1920*1080');
      expect(parsed.entries).toEqual([
        { type: 'str', key: 'res', value: '1920*1080', quoted: false },
      ]);
    });

    it('resolution lands in textMetrics, never in numericMetrics', () => {
      const viewModel = buildFilterStatusViewModel(
        parseFilterStatus('res=1920*1080'),
      );
      expect(
        viewModel.numericMetrics.find((metric) => metric.key === 'res'),
      ).toBeUndefined();
      expect(
        viewModel.textMetrics.find((metric) => metric.key === 'res')?.value,
      ).toBe('1920*1080');
    });
  });
});
