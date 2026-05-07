import type { PIDproperties, PIDStats } from '@/types/domain/gpac/filter-stats';
import { GpacStreamType } from '@/types/domain/gpac/stream-types';

export const makeStats = (overrides: Partial<PIDStats> = {}): PIDStats => ({
  disconnected: false,
  average_process_rate: 0,
  max_process_rate: 0,
  average_bitrate: 0,
  max_bitrate: 0,
  nb_processed: 0,
  max_process_time: 0,
  total_process_time: 0,
  ...overrides,
});

export const makePID = (
  overrides: Partial<PIDproperties> = {},
): PIDproperties => ({
  name: 'pid-0',
  buffer: 0,
  nb_pck_queued: null,
  would_block: null,
  eos: false,
  bitrate: null,
  playing: null,
  timescale: 1000,
  codec: '',
  type: GpacStreamType.Visual,
  width: null,
  height: null,
  pixelformat: null,
  samplerate: null,
  channels: null,
  source_idx: 0,
  stats: makeStats(),
  ...overrides,
});
