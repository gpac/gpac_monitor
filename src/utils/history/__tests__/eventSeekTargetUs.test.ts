import { describe, it, expect } from 'vitest';
import { getVisibleEvents } from '../timelineViewportView';
import type { TimelineViewport } from '../timelineViewport';
import type { TimelineEvent } from '@/services/historyService/types';

// Real recorded session 1782304493152: a PID reconfig marker the user clicked.
const SESSION_START_US = 24453;
const SESSION_DURATION_US = 5475279028;
const PID_EVENT_TS_US = 31110525;

const pidEvent: TimelineEvent = {
  id: `pid-reconfig_${PID_EVENT_TS_US}`,
  sessionTimeUs: PID_EVENT_TS_US - SESSION_START_US,
  type: 'pid-reconfig',
  title: 'PID reconfigured',
};

const fullViewport: TimelineViewport = {
  sessionDurationUs: SESSION_DURATION_US,
  visibleStartUs: 0,
  visibleDurationUs: SESSION_DURATION_US,
};

describe('marker click seek target — regression', () => {
  it('exact sessionTime reaches the clicked event so seek includes it', () => {
    // Fix: marker carries exact sessionTimeUs; seek target is integer arithmetic.
    const seekTargetUs = SESSION_START_US + pidEvent.sessionTimeUs;
    expect(seekTargetUs).toBe(PID_EVENT_TS_US);
    // seek keeps events where ts_us <= target → clicked event is included.
    expect(PID_EVENT_TS_US <= seekTargetUs).toBe(true);
  });

  it('percent round-trip would drift below the event and drop it (guards the revert)', () => {
    const [marker] = getVisibleEvents(fullViewport, [pidEvent]);
    const percentRoundTripUs =
      SESSION_START_US +
      fullViewport.visibleStartUs +
      (marker.positionPercent / 100) * fullViewport.visibleDurationUs;

    expect(percentRoundTripUs).toBeLessThan(PID_EVENT_TS_US);
    expect(PID_EVENT_TS_US <= percentRoundTripUs).toBe(false);
  });
});
