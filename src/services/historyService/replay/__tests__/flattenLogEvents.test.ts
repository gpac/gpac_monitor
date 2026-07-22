import { describe, it, expect } from 'vitest';
import { flattenLogEvents } from '../flattenLogEvents';
import type { LogEvent } from '../../types';

describe('flattenLogEvents', () => {
  it("splits a multi-entry log_batch into one single-entry batch per line, at the line's own timestamp", () => {
    const logEvents: LogEvent[] = [
      {
        version: 1,
        message: 'log_batch',
        ts_us: 1533744, // flush time, later than any individual line below
        logs: [
          {
            timestamp: 1523463,
            tool: 'core',
            level: 1,
            message: 'Unsupported audio format 0',
            thread_id: -1,
            caller: null,
          },
          {
            timestamp: 1527685,
            tool: 'core',
            level: 1,
            message: 'Unsupported audio format 0',
            thread_id: -1,
            caller: null,
          },
        ],
      },
    ];

    const flattened = flattenLogEvents(logEvents);

    expect(flattened).toHaveLength(2);
    expect(flattened[0]).toMatchObject({
      ts_us: 1523463,
      message: 'log_batch',
    });
    expect(flattened[1]).toMatchObject({
      ts_us: 1527685,
      message: 'log_batch',
    });
    expect((flattened[0] as { logs: unknown[] }).logs).toHaveLength(1);
  });

  it('passes log_config_changed events through unchanged', () => {
    const logEvents: LogEvent[] = [
      {
        version: 1,
        message: 'log_config_changed',
        ts_us: 42,
        logLevel: 'all@info',
      },
    ];

    expect(flattenLogEvents(logEvents)).toEqual(logEvents);
  });

  it('lets a seek target land exactly on a line whose batch flush time is later', () => {
    const logEvents: LogEvent[] = [
      {
        version: 1,
        message: 'log_batch',
        ts_us: 1533744,
        logs: [
          {
            timestamp: 1523463,
            tool: 'core',
            level: 1,
            message: 'Unsupported audio format 0',
            thread_id: -1,
            caller: null,
          },
        ],
      },
    ];

    const targetUs = 1523463; // the exact line's own timestamp, before the batch's flush time
    const included = flattenLogEvents(logEvents).filter(
      (event) => event.ts_us <= targetUs,
    );

    expect(included).toHaveLength(1);
  });
});
