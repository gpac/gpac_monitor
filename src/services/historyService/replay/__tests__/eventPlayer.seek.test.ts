import { describe, it, expect, vi, beforeEach } from 'vitest';
import { EventPlayer } from '../eventPlayer';
import type { HistoryEvent } from '../../types';

vi.mock('../eventDispatcher', () => ({
  dispatchEvent: vi.fn(),
}));

import { dispatchEvent } from '../eventDispatcher';

const mockDispatch = vi.fn() as any;

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
  const events = makeEvents([100, 200, 300, 400, 500]);

  beforeEach(() => {
    player = new EventPlayer();
    vi.clearAllMocks();
    player.load(events, mockDispatch);
  });

  it('seek forward dispatches events up to target and pauses', () => {
    const reset = vi.fn();
    player.seek(300, reset);

    expect(dispatchEvent).toHaveBeenCalledTimes(3);
    expect(dispatchEvent).toHaveBeenNthCalledWith(1, events[0], mockDispatch);
    expect(dispatchEvent).toHaveBeenNthCalledWith(2, events[1], mockDispatch);
    expect(dispatchEvent).toHaveBeenNthCalledWith(3, events[2], mockDispatch);
    expect(player.getState()).toBe('paused');
  });

  it('seek backward only dispatches events up to earlier target', () => {
    const reset = vi.fn();
    // First seek to 400
    player.seek(400, reset);
    vi.mocked(dispatchEvent).mockClear();

    // Seek backward to 200
    player.seek(200, reset);

    expect(dispatchEvent).toHaveBeenCalledTimes(2);
    expect(dispatchEvent).toHaveBeenNthCalledWith(1, events[0], mockDispatch);
    expect(dispatchEvent).toHaveBeenNthCalledWith(2, events[1], mockDispatch);
    expect(player.getState()).toBe('paused');
  });

  it('calls resetStateFromSnapshot before dispatching events', () => {
    const callOrder: string[] = [];
    const reset = vi.fn(() => callOrder.push('reset'));
    vi.mocked(dispatchEvent).mockImplementation(() => {
      callOrder.push('dispatch');
    });

    player.seek(200, reset);

    expect(callOrder[0]).toBe('reset');
    expect(callOrder.slice(1).every((c) => c === 'dispatch')).toBe(true);
  });

  it('updates currentPlaybackTimeUs to targetTimestampUs', () => {
    player.seek(350, vi.fn());

    expect(player.currentTimeUs()).toBe(350);
  });
});
