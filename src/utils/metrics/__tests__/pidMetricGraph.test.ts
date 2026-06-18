import { describe, it, expect } from 'vitest';
import type { PIDproperties, PIDStats } from '../../../types';
import { buildPIDSamplesFromFilterStats } from '../pidMetricGraph';

function makePID(stats: Partial<PIDStats> = {}, buffer = 0): PIDproperties {
  return {
    buffer,
    stats: {
      disconnected: false,
      average_process_rate: 0,
      max_process_rate: 0,
      average_bitrate: 0,
      max_bitrate: 0,
      nb_processed: 0,
      max_process_time: 0,
      total_process_time: 0,
      ...stats,
    },
  } as PIDproperties;
}

const filterBase = { idx: 2 };

describe('buildPIDSamplesFromFilterStats', () => {
  const pid = makePID({ average_bitrate: 1000, last_process_time: 5 }, 200);

  it('returns [] when ts_us is undefined', () => {
    expect(
      buildPIDSamplesFromFilterStats(
        { ...filterBase, ipids: { '0': pid } },
        undefined,
        1000,
      ),
    ).toEqual([]);
  });

  it('returns [] when ts_us is null', () => {
    expect(
      buildPIDSamplesFromFilterStats(
        { ...filterBase, ipids: { '0': pid } },
        null,
        1000,
      ),
    ).toEqual([]);
  });

  it('returns [] when sessionStartUs is null', () => {
    expect(
      buildPIDSamplesFromFilterStats(
        { ...filterBase, ipids: { '0': pid } },
        6000,
        null,
      ),
    ).toEqual([]);
  });

  it('returns [] when no ipids or opids', () => {
    expect(buildPIDSamplesFromFilterStats(filterBase, 6000, 1000)).toEqual([]);
  });

  it('produces sessionTimeUs = ts_us - sessionStartUs', () => {
    const samples = buildPIDSamplesFromFilterStats(
      { ...filterBase, ipids: { '0': pid } },
      6000,
      1000,
    );
    expect(samples[0].sample.sessionTimeUs).toBe(5000);
  });

  it('keys ipids as filterIdx:input:pidIdx', () => {
    const samples = buildPIDSamplesFromFilterStats(
      { idx: 3, ipids: { a: pid, b: pid } },
      6000,
      1000,
    );
    expect(samples.map((s) => s.key)).toEqual(['3:input:0', '3:input:1']);
  });

  it('keys opids as filterIdx:output:pidIdx', () => {
    const samples = buildPIDSamplesFromFilterStats(
      { idx: 3, opids: { a: pid } },
      6000,
      1000,
    );
    expect(samples[0].key).toBe('3:output:0');
  });

  it('maps stats fields to sample', () => {
    const richPid = makePID({
      average_bitrate: 512,
      buffer_time: 300,
      average_process_time: 12.5,
      average_process_rate: 200,
      last_process_time: 99,
    });
    const [sample] = buildPIDSamplesFromFilterStats(
      { ...filterBase, ipids: { '0': richPid } },
      6000,
      1000,
    );
    expect(sample.sample).toMatchObject({
      averageBitrate: 512,
      bufferTime: 300,
      processTime: 12.5,
      processRate: 200,
      ts: 99,
    });
  });
});
