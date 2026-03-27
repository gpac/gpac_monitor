import { describe, it, expect, vi, beforeEach } from 'vitest';
import { EventPlayer } from '../eventPlayer';
import type { HistoryEvent } from '../../types';

vi.mock('../eventDispatcher', () => ({
  dispatchEvent: vi.fn(),
}));

const mockDispatch = vi.fn() as any;

function makeEvents(timestamps: number[]): HistoryEvent[] {
  return timestamps.map((ts) => ({
    version: 1,
    ts_us: ts,
    message: 'cpu_stats' as const,
    stats: {} as any,
  }));
}

describe('EventPlayer.play', () => {
  let player: EventPlayer;
  const events = makeEvents([100, 200, 300, 400, 500]);

  beforeEach(() => {
    player = new EventPlayer();
    vi.clearAllMocks();
    player.load(events, mockDispatch);
  });

  it('calls resetStateFromSnapshot when starting from idle', () => {
    const reset = vi.fn();
    player.play(reset);
    expect(reset).toHaveBeenCalledOnce();
  });

  it('does NOT call resetStateFromSnapshot when resuming from paused', () => {
    const reset = vi.fn();
    player.play(reset);
    reset.mockClear();

    player.pause();
    player.play(reset);

    expect(reset).not.toHaveBeenCalled();
  });

  it('calls resetStateFromSnapshot when restarting after done', () => {
    const reset = vi.fn();
    // Simulate done state by seeking past all events then re-playing
    player.seek(999, vi.fn());
    // Manually set state to done to simulate end of playback
    (player as any).state = 'done';

    reset.mockClear();
    player.play(reset);

    expect(reset).toHaveBeenCalledOnce();
  });

  it('resets nextEventIndex to 0 when restarting', () => {
    player.play();
    player.pause();
    // Advance index manually
    (player as any).nextEventIndex = 3;

    player.play(vi.fn()); // restart (not from paused — need to set state)
    // From paused, index is NOT reset; set done state to test restart
    (player as any).state = 'done';
    (player as any).nextEventIndex = 3;

    const reset = vi.fn();
    player.play(reset);
    expect((player as any).nextEventIndex).toBe(0);
  });
});

describe('EventPlayer — done state', () => {
  it('freezes currentPlaybackTimeUs at last event ts_us when done', () => {
    const player = new EventPlayer();
    const events = makeEvents([100, 200, 300]);
    player.load(events, mockDispatch);

    // Seek past all events to trigger done indirectly
    player.seek(999, vi.fn());
    // After seek, state is paused at 999 — simulate tick reaching end
    (player as any).nextEventIndex = events.length;
    (player as any).state = 'playing';
    (player as any).tick();

    expect(player.getState()).toBe('done');
    expect(player.currentTimeUs()).toBe(300); // last event ts_us
  });
});
