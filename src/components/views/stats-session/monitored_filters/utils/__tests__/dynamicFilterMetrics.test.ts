import { describe, it, expect } from 'vitest';
import { parseMetricDefinitions } from '@/utils/metrics/metricDefinitionParser';
import { parseFilterStatus } from '@/utils/metrics/filterStatusParser';
import {
  buildFilterStatusViewModel,
  type FilterStatusViewModel,
} from '../statusViewModel';

const INITIAL_SESSION_METRICS = `freg=*;done=Done;u=bool
freg=*;buffer=Buffer occupancy;t=frac;u=ms`;

const UPDATED_SESSION_METRICS = `${INITIAL_SESSION_METRICS}
freg=mydyn;cnt=Item count;u=items
freg=mydyn;track=Track ID;t=str
freg=mydyn;state=Run state;t=str;v=[R:Running, P:Paused]`;

const DYNAMIC_FILTER_STATUS = 'state=R cnt=12 track=5';
const DYNAMIC_FILTER_STATUS_KEYS = ['cnt', 'state', 'track'];

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

describe('dynamically loaded filter — definitions arrive after startup', () => {
  it('initial session_metrics does not contain the dynamic filter keys', () => {
    const initialDefinitions = parseMetricDefinitions(INITIAL_SESSION_METRICS);
    expect(Object.keys(initialDefinitions).sort()).toEqual(['buffer', 'done']);
  });

  it('status is fully displayed before definitions arrive (inference only)', () => {
    const initialDefinitions = parseMetricDefinitions(INITIAL_SESSION_METRICS);
    const viewModel = buildFilterStatusViewModel(
      parseFilterStatus(DYNAMIC_FILTER_STATUS, initialDefinitions),
    );
    expect(collectVisibleKeys(viewModel).sort()).toEqual(
      DYNAMIC_FILTER_STATUS_KEYS,
    );
  });

  it('updated session_metrics is a full snapshot — replacement keeps initial keys', () => {
    const updatedDefinitions = parseMetricDefinitions(UPDATED_SESSION_METRICS);
    expect(Object.keys(updatedDefinitions).sort()).toEqual([
      'buffer',
      'cnt',
      'done',
      'state',
      'track',
    ]);
    expect(updatedDefinitions['buffer']?.unit).toBe('ms');
    expect(updatedDefinitions['cnt']?.freg).toBe('mydyn');
  });

  it('late definitions enrich metrics with unit and label', () => {
    const updatedDefinitions = parseMetricDefinitions(UPDATED_SESSION_METRICS);
    const viewModel = buildFilterStatusViewModel(
      parseFilterStatus(DYNAMIC_FILTER_STATUS, updatedDefinitions),
    );
    expect(
      viewModel.numericMetrics.find((metric) => metric.key === 'cnt')?.value,
    ).toBe('12 items');
    expect(updatedDefinitions['cnt']?.label).toBe('Item count');
  });

  it('late t=str definition reroutes a numeric-looking value out of the graphable channel', () => {
    const initialDefinitions = parseMetricDefinitions(INITIAL_SESSION_METRICS);
    const beforeUpdate = buildFilterStatusViewModel(
      parseFilterStatus(DYNAMIC_FILTER_STATUS, initialDefinitions),
    );
    expect(
      beforeUpdate.numericMetrics.find((metric) => metric.key === 'track'),
    ).toBeDefined();

    const updatedDefinitions = parseMetricDefinitions(UPDATED_SESSION_METRICS);
    const afterUpdate = buildFilterStatusViewModel(
      parseFilterStatus(DYNAMIC_FILTER_STATUS, updatedDefinitions),
    );
    expect(
      afterUpdate.numericMetrics.find((metric) => metric.key === 'track'),
    ).toBeUndefined();
    expect(
      afterUpdate.textMetrics.find((metric) => metric.key === 'track'),
    ).toEqual({ key: 'track', value: '5', quoted: false });
  });

  it('enum state renders as badge before and after the definitions update', () => {
    const initialDefinitions = parseMetricDefinitions(INITIAL_SESSION_METRICS);
    const updatedDefinitions = parseMetricDefinitions(UPDATED_SESSION_METRICS);
    for (const definitions of [initialDefinitions, updatedDefinitions]) {
      const viewModel = buildFilterStatusViewModel(
        parseFilterStatus(DYNAMIC_FILTER_STATUS, definitions),
      );
      expect(viewModel.stateBadges).toEqual([
        { key: 'state', label: 'R', styleKey: 'r' },
      ]);
    }
  });
});
