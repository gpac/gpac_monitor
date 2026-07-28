import { describe, it, expect, vi, beforeEach } from 'vitest';
import { EventPlayer } from '../eventPlayer';
import type { HistoryEvent } from '../../types';

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
  let onEvent: ReturnType<typeof vi.fn>;
  const events = makeEvents([100, 200, 300, 400, 500]);

  beforeEach(() => {
    player = new EventPlayer();
    onEvent = vi.fn();
    vi.clearAllMocks();
    player.load(events, onEvent);
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
    (player as any).state = 'done';

    player.play(reset);

    expect(reset).toHaveBeenCalledOnce();
  });

  it('resets nextEventIndex to 0 when restarting', () => {
    player.play();
    player.pause();
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
    player.load(events, vi.fn());

    (player as any).nextEventIndex = events.length;
    (player as any).state = 'playing';
    (player as any).tick();

    expect(player.getState()).toBe('done');
    expect(player.currentTimeUs()).toBe(300);
  });
});
