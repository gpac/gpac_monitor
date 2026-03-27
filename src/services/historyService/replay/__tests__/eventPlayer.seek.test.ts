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

describe('EventPlayer.seek', () => {
  let player: EventPlayer;
  let onEvent: ReturnType<typeof vi.fn>;
  const events = makeEvents([100, 200, 300, 400, 500]);

  beforeEach(() => {
    player = new EventPlayer();
    onEvent = vi.fn();
    vi.clearAllMocks();
    player.load(events, onEvent);
  });

  it('seek forward dispatches events up to target and pauses', () => {
    const reset = vi.fn();
    player.seek(300, reset);

    expect(onEvent).toHaveBeenCalledTimes(3);
    expect(onEvent).toHaveBeenNthCalledWith(1, events[0]);
    expect(onEvent).toHaveBeenNthCalledWith(2, events[1]);
    expect(onEvent).toHaveBeenNthCalledWith(3, events[2]);
    expect(player.getState()).toBe('paused');
  });

  it('seek backward only dispatches events up to earlier target', () => {
    const reset = vi.fn();
    player.seek(400, reset);
    onEvent.mockClear();

    player.seek(200, reset);

    expect(onEvent).toHaveBeenCalledTimes(2);
    expect(onEvent).toHaveBeenNthCalledWith(1, events[0]);
    expect(onEvent).toHaveBeenNthCalledWith(2, events[1]);
    expect(player.getState()).toBe('paused');
  });

  it('calls resetStateFromSnapshot before dispatching events', () => {
    const callOrder: string[] = [];
    const reset = vi.fn(() => callOrder.push('reset'));
    onEvent.mockImplementation(() => callOrder.push('event'));

    player.seek(200, reset);

    expect(callOrder[0]).toBe('reset');
    expect(callOrder.slice(1).every((c) => c === 'event')).toBe(true);
  });

  it('updates currentPlaybackTimeUs to targetTimestampUs', () => {
    player.seek(350, vi.fn());

    expect(player.currentTimeUs()).toBe(350);
  });
});
