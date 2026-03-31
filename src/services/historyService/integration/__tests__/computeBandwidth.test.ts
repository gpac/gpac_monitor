import { describe, it, expect } from 'vitest';
import { computeBandwidthPoints } from '../computeBandwidth';
import type { SessionStatsEvent } from '../../types';

/** Real session_stats events from server/history/1774943115615/events.jsonl */
const realEvent1: SessionStatsEvent = {
  version: 1,
  message: 'session_stats',
  ts_us: 1237805,
  all_packets_done: false,
  stats: [
    {
      idx: 0,
      status: '',
      bytes_done: 727528,
      bytes_sent: 727528,
      pck_sent: 167,
      pck_done: 167,
      time: 4967,
      nb_ipid: 2,
      nb_opid: 2,
      is_eos: false,
      last_ts_sent: { n: 73, d: 30 },
    },
    {
      idx: 1,
      status: '1280x720',
      bytes_done: 29030400,
      bytes_sent: 0,
      pck_sent: 0,
      pck_done: 21,
      time: 170076,
      nb_ipid: 1,
      nb_opid: 0,
      is_eos: false,
      last_ts_sent: null,
    },
    {
      idx: 4,
      status: '',
      bytes_done: 5000,
      bytes_sent: 757176,
      pck_sent: 169,
      pck_done: 2,
      time: 3078,
      nb_ipid: 1,
      nb_opid: 2,
      is_eos: true,
      last_ts_sent: { n: 78, d: 30 },
    },
  ],
};

const realEvent2: SessionStatsEvent = {
  version: 1,
  message: 'session_stats',
  ts_us: 2238647,
  all_packets_done: false,
  stats: [
    {
      idx: 0,
      status: '',
      bytes_done: 1194464,
      bytes_sent: 1194464,
      pck_sent: 245,
      pck_done: 245,
      time: 5416,
      nb_ipid: 2,
      nb_opid: 2,
      is_eos: false,
      last_ts_sent: { n: 103, d: 30 },
    },
    {
      idx: 1,
      status: '1280x720',
      bytes_done: 71884800,
      bytes_sent: 0,
      pck_sent: 0,
      pck_done: 52,
      time: 253332,
      nb_ipid: 1,
      nb_opid: 0,
      is_eos: false,
      last_ts_sent: null,
    },
    {
      idx: 4,
      status: '',
      bytes_done: 5000,
      bytes_sent: 1229222,
      pck_sent: 247,
      pck_done: 2,
      time: 5118,
      nb_ipid: 1,
      nb_opid: 2,
      is_eos: true,
      last_ts_sent: { n: 108, d: 30 },
    },
  ],
};

describe('computeBandwidthPoints', () => {
  it('returns zero values on first event (no previous reference)', () => {
    const prevBandwidth: Record<string, any> = {};
    const points = computeBandwidthPoints(realEvent1, 0, prevBandwidth);

    expect(points).toMatchSnapshot();
  });

  it('computes correct bandwidth deltas between two real events', () => {
    const prevBandwidth: Record<string, any> = {};
    computeBandwidthPoints(realEvent1, 0, prevBandwidth);
    const points = computeBandwidthPoints(realEvent2, 0, prevBandwidth);

    expect(points).toMatchSnapshot();
  });

  it('updates prevBandwidth references after each call', () => {
    const prevBandwidth: Record<string, any> = {};
    computeBandwidthPoints(realEvent1, 0, prevBandwidth);

    expect(Object.keys(prevBandwidth)).toEqual(['0', '1', '4']);
    expect(prevBandwidth['0']).toMatchSnapshot();
  });
});
