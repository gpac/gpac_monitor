import { describe, it, expect } from 'vitest';
import { parseEventsJsonl } from '../eventLoader';

/** Real logs.jsonl content from server/history/1775129444476/logs.jsonl */
const LOGS_JSONL = [
  '{"version":1,"message":"log_config_changed","ts_us":10418,"logLevel":"all@warning"}',
  '{"version":1,"message":"log_batch","ts_us":1105411,"logs":[{"timestamp":1054016,"tool":"core","level":1,"message":"Unsupported audio format 0\\n","thread_id":761459520,"caller":null},{"timestamp":1054029,"tool":"core","level":2,"message":"Unsupported cicp audio layout for channel layout 0\\n","thread_id":761459520,"caller":null}]}',
].join('\n');

describe('logs.jsonl parsing', () => {
  it('parses log_config_changed and log_batch events', () => {
    const events = parseEventsJsonl(LOGS_JSONL);

    expect(events).toHaveLength(2);
    expect(events[0].message).toBe('log_config_changed');
    expect(events[1].message).toBe('log_batch');
  });

  it('log_config_changed structure matches snapshot', () => {
    const events = parseEventsJsonl(LOGS_JSONL);
    expect(events[0]).toMatchSnapshot();
  });

  it('log_batch structure matches snapshot', () => {
    const events = parseEventsJsonl(LOGS_JSONL);
    const batch = events[1];
    expect(batch).toMatchSnapshot();
  });

  it('log_batch contains expected log entries', () => {
    const events = parseEventsJsonl(LOGS_JSONL);
    const batch = events[1] as { logs: unknown[] };

    expect(batch.logs).toHaveLength(2);
    expect(batch.logs[0]).toMatchObject({
      tool: 'core',
      level: 1,
      timestamp: expect.any(Number),
    });
    expect(batch.logs[1]).toMatchObject({
      tool: 'core',
      level: 2,
      timestamp: expect.any(Number),
    });
  });
});
