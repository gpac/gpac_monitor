import { describe, it, expect } from 'vitest';
import {
  selectSelectedPidTargetsByFilter,
  selectAllSelectedPidSamplesByFilter,
} from '../monitoredFilter';
import { clearSelectedPidsByFilter } from '../../slices/monitoredFilterSlice';
import monitoredFilterReducer, {
  type MonitoredFilterState,
} from '../../slices/monitoredFilterSlice';
import type { RootState } from '../../index';
import type { PIDGraphTarget } from '@/components/views/stats-session/types/pid';
import { GpacStreamType } from '@/types/domain/gpac';

const makePidTarget = (
  filterIdx: number,
  pidIndex: number,
  direction: 'input' | 'output' = 'output',
  streamType?: GpacStreamType,
): PIDGraphTarget => ({
  filterIdx,
  pidIndex,
  direction,
  label: `PID ${pidIndex}`,
  streamTypeLabel: undefined,
  streamType,
});

const makeState = (partial: Partial<MonitoredFilterState>): RootState =>
  ({
    monitoredFilter: {
      dataByFilter: {},
      maxPoints: 600,
      maxPidSamples: 300,
      selectedPidTargets: [],
      pidSamples: {},
      ...partial,
    },
  }) as unknown as RootState;

describe('selectSelectedPidTargetsByFilter', () => {
  it('returns only targets for the given filterIdx', () => {
    const state = makeState({
      selectedPidTargets: [
        makePidTarget(0, 1),
        makePidTarget(1, 2),
        makePidTarget(0, 3),
      ],
    });

    expect(selectSelectedPidTargetsByFilter(state, 0)).toHaveLength(2);
    expect(selectSelectedPidTargetsByFilter(state, 1)).toHaveLength(1);
  });

  it('returns empty when no PID selected for that filter', () => {
    const state = makeState({
      selectedPidTargets: [makePidTarget(1, 0)],
    });

    expect(selectSelectedPidTargetsByFilter(state, 0)).toHaveLength(0);
  });

  it('two detached filters see independent selections', () => {
    const state = makeState({
      selectedPidTargets: [makePidTarget(0, 1), makePidTarget(1, 2)],
    });

    const filter0Targets = selectSelectedPidTargetsByFilter(state, 0);
    const filter1Targets = selectSelectedPidTargetsByFilter(state, 1);

    expect(filter0Targets.map((t) => t.pidIndex)).toEqual([1]);
    expect(filter1Targets.map((t) => t.pidIndex)).toEqual([2]);
  });
});

describe('selectAllSelectedPidSamplesByFilter', () => {
  it('returns only samples for the given filterIdx', () => {
    const sample0 = {
      sessionTimestampUs: 1000,
      averageBitrate: 100,
      bufferTime: 0,
      processTime: 0,
      processRate: 0,
    };
    const sample1 = {
      sessionTimestampUs: 2000,
      averageBitrate: 200,
      bufferTime: 0,
      processTime: 0,
      processRate: 0,
    };

    const state = makeState({
      selectedPidTargets: [makePidTarget(0, 1), makePidTarget(1, 2)],
      pidSamples: {
        '0:output:1': [sample0],
        '1:output:2': [sample1],
      },
    });

    const result0 = selectAllSelectedPidSamplesByFilter(state, 0);
    const result1 = selectAllSelectedPidSamplesByFilter(state, 1);

    expect(result0).toHaveLength(1);
    expect(result0[0].pidHistory).toEqual([sample0]);
    expect(result1).toHaveLength(1);
    expect(result1[0].pidHistory).toEqual([sample1]);
  });

  it('chart for filter A is not polluted by PIDs selected in filter B', () => {
    const sampleA = {
      sessionTimestampUs: 1000,
      averageBitrate: 500,
      bufferTime: 0,
      processTime: 10,
      processRate: 0,
    };
    const sampleB = {
      sessionTimestampUs: 1000,
      averageBitrate: 800,
      bufferTime: 0,
      processTime: 5,
      processRate: 0,
    };

    const state = makeState({
      selectedPidTargets: [makePidTarget(0, 1), makePidTarget(1, 0, 'input')],
      pidSamples: {
        '0:output:1': [sampleA],
        '1:input:0': [sampleB],
      },
    });

    const filterAChart = selectAllSelectedPidSamplesByFilter(state, 0);
    const filterBChart = selectAllSelectedPidSamplesByFilter(state, 1);

    expect(filterAChart).toHaveLength(1);
    expect(filterAChart[0].pidHistory[0].averageBitrate).toBe(500);

    expect(filterBChart).toHaveLength(1);
    expect(filterBChart[0].pidHistory[0].averageBitrate).toBe(800);
  });

  it('returns empty pidHistory when no samples exist for target', () => {
    const state = makeState({
      selectedPidTargets: [makePidTarget(0, 1)],
      pidSamples: {},
    });

    const result = selectAllSelectedPidSamplesByFilter(state, 0);
    expect(result[0].pidHistory).toEqual([]);
  });
});

describe('selectAllSelectedPidSamplesByFilter — streamType preserved', () => {
  it('target.streamType is passed through to chart entries', () => {
    const state = makeState({
      selectedPidTargets: [
        makePidTarget(0, 0, 'output', GpacStreamType.Audio),
        makePidTarget(0, 1, 'output', GpacStreamType.Visual),
      ],
      pidSamples: {},
    });

    const entries = selectAllSelectedPidSamplesByFilter(state, 0);

    expect(entries[0].target.streamType).toBe(GpacStreamType.Audio);
    expect(entries[1].target.streamType).toBe(GpacStreamType.Visual);
  });

  it('audio PID at index 0 keeps GpacStreamType.Audio (not overridden by position)', () => {
    const state = makeState({
      selectedPidTargets: [makePidTarget(0, 3, 'output', GpacStreamType.Audio)],
      pidSamples: {},
    });

    const entries = selectAllSelectedPidSamplesByFilter(state, 0);

    expect(entries[0].target.streamType).toBe(GpacStreamType.Audio);
  });
});

describe('clearSelectedPidsByFilter reducer', () => {
  it('removes only PIDs belonging to the given filter', () => {
    const initial: MonitoredFilterState = {
      dataByFilter: {},
      maxPoints: 600,
      maxPidSamples: 300,
      selectedPidTargets: [
        makePidTarget(0, 1),
        makePidTarget(1, 2),
        makePidTarget(0, 3),
      ],
      pidSamples: {},
    };

    const next = monitoredFilterReducer(initial, clearSelectedPidsByFilter(0));

    expect(next.selectedPidTargets).toHaveLength(1);
    expect(next.selectedPidTargets[0].filterIdx).toBe(1);
  });

  it('does not affect other filters when clearing one', () => {
    const initial: MonitoredFilterState = {
      dataByFilter: {},
      maxPoints: 600,
      maxPidSamples: 300,
      selectedPidTargets: [makePidTarget(0, 1), makePidTarget(1, 2)],
      pidSamples: {},
    };

    const next = monitoredFilterReducer(initial, clearSelectedPidsByFilter(1));

    expect(next.selectedPidTargets).toHaveLength(1);
    expect(next.selectedPidTargets[0].filterIdx).toBe(0);
  });
});
