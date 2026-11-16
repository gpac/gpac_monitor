import { describe, it, expect, afterEach } from 'vitest';
import { Sys as sys } from 'gpaccore';
import { buildMonitorConfigPayload } from './buildMonitorConfigPayload.js';
import monitorConfigFixture from '../../src/services/ws/__tests__/fixtures/monitor_config.json';

describe('buildMonitorConfigPayload', () => {
  afterEach(() => {
    delete sys.version_full;
  });

  it('falls back to null without throwing when the binding is missing on an older GPAC binary', () => {
    Object.defineProperty(sys, 'version_full', {
      configurable: true,
      get() {
        throw new Error('version_full not bound on this GPAC binary');
      },
    });

    const payload = buildMonitorConfigPayload();

    expect(payload.gpac_version).toBeNull();
  });

  it('matches the shared monitor_config fixture consumed by the front (src/services/ws/__tests__/fixtures/monitor_config.json)', () => {
    sys.version_full = monitorConfigFixture.gpac_version;

    const payload = buildMonitorConfigPayload();

    expect(payload).toEqual(monitorConfigFixture);
  });
});
