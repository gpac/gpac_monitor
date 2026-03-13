import { describe, it, expect } from 'vitest';
import reducer, {
  setCommandLine,
  setSystemStats,
  hydrateSessionDetails,
  clearSessionDetails,
  SessionDetailsState,
} from '../sessionDetailsSlice';
import type { CPUStats } from '@/types/domain/system';

const initialState: SessionDetailsState = {
  commandLine: null,
  systemStats: null,
};

const mockStats: CPUStats = {
  timestamp: 1000,
  total_cpu_usage: 20,
  process_cpu_usage: 5,
  process_memory: 100,
  physical_memory: 8000,
  physical_memory_avail: 4000,
  gpac_memory: 50,
  nb_cores: 8,
  thread_count: 12,
  memory_usage_percent: 50,
  process_memory_percent: 1.25,
  gpac_memory_percent: 0.6,
  cpu_efficiency: 95,
};

describe('sessionDetailsSlice', () => {
  it('should return initial state', () => {
    expect(reducer(undefined, { type: '@@INIT' })).toEqual(initialState);
  });

  it('setCommandLine sets the command line', () => {
    const state = reducer(initialState, setCommandLine('gpac -i src.mp4'));
    expect(state.commandLine).toBe('gpac -i src.mp4');
  });

  it('setCommandLine accepts null', () => {
    const state = reducer(
      { ...initialState, commandLine: 'foo' },
      setCommandLine(null),
    );
    expect(state.commandLine).toBeNull();
  });

  it('setSystemStats updates systemStats', () => {
    const state = reducer(initialState, setSystemStats(mockStats));
    expect(state.systemStats).toEqual(mockStats);
  });

  it('hydrateSessionDetails sets both fields', () => {
    const state = reducer(
      initialState,
      hydrateSessionDetails({
        commandLine: 'gpac -i x.mp4',
        systemStats: mockStats,
      }),
    );
    expect(state.commandLine).toBe('gpac -i x.mp4');
    expect(state.systemStats).toEqual(mockStats);
  });

  it('hydrateSessionDetails is partial — omitted fields unchanged', () => {
    const base = { commandLine: 'existing', systemStats: mockStats };
    const state = reducer(base, hydrateSessionDetails({ commandLine: 'new' }));
    expect(state.commandLine).toBe('new');
    expect(state.systemStats).toEqual(mockStats);
  });

  it('clearSessionDetails resets to initial state', () => {
    const populated = { commandLine: 'gpac', systemStats: mockStats };
    const state = reducer(populated, clearSessionDetails());
    expect(state).toEqual(initialState);
  });
});
