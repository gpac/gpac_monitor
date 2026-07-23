import { describe, it, expect, vi, beforeEach } from 'vitest';
import { HistoryAdapter } from '../historyAdapter';
import type { HistoryFilter, HistorySnapshot } from '../../types';
import { restoreConfig } from '@/shared/store/slices/logsSlice';

const baseFilter: HistoryFilter = {
  idx: 0,
  name: 'src',
  type: 'input',
  status: 'connected',
  nb_ipid: 0,
  nb_opid: 1,
  ipids: [],
  opids: [],
  gpac_args: [],
};

const makeSnapshot = (
  overrides?: Partial<HistorySnapshot>,
): HistorySnapshot => ({
  version: 1,
  ts_us: 0,
  command_line: null,
  graph_v: 1,
  filters: [baseFilter],
  ...overrides,
});

describe('HistoryAdapter.hydrate — recorded CLI log config', () => {
  let dispatch: ReturnType<typeof vi.fn>;
  let adapter: HistoryAdapter;

  beforeEach(() => {
    dispatch = vi.fn();
    adapter = new HistoryAdapter(dispatch as any);
  });

  const restoreConfigActions = () =>
    dispatch.mock.calls
      .map(([action]) => action)
      .filter((action) => action.type === restoreConfig.type);

  it('applies snapshot.log_config to the logs config on hydrate', () => {
    adapter.hydrate(makeSnapshot({ log_config: 'all@warning' }), 0);

    const actions = restoreConfigActions();
    expect(actions).toHaveLength(1);
    expect(actions[0].payload.defaultAllLevel).toBe('warning');
  });

  it('does not touch the logs config when log_config is absent (older sessions)', () => {
    adapter.hydrate(makeSnapshot(), 0);

    expect(restoreConfigActions()).toHaveLength(0);
  });
});
