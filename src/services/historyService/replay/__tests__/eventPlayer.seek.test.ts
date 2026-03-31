import { describe, it, expect, vi, beforeEach } from 'vitest';
import { EventPlayer } from '../eventPlayer';
import type { HistoryEvent } from '../../types';

/** Real cpu_stats timestamps from server/history/1774943115615/events.jsonl */
const realTimestamps = [237464, 1237805, 1238238, 2238647, 3239100];

function makeEvents(timestamps: number[]): HistoryEvent[] {
  return timestamps.map((tsUs) => ({
    version: 1,
    ts_us: tsUs,
    message: 'cpu_stats' as const,
    stats: { total_cpu_usage: 0, process_cpu_usage: 8 } as any,
  }));
}

describe('EventPlayer.seek onComplete callback', () => {
  let player: EventPlayer;
  let onEvent: ReturnType<typeof vi.fn>;
  const events = makeEvents(realTimestamps);

  beforeEach(() => {
    player = new EventPlayer();
    onEvent = vi.fn();
    player.load(events, onEvent);
  });

  it('calls onComplete when seek finishes', async () => {
    const onComplete = vi.fn();
    const resetSnapshot = vi.fn();

    player.seek(3239100, resetSnapshot, onComplete);

    // Wait for rAF to process
    await new Promise((resolve) => setTimeout(resolve, 50));

    expect(onComplete).toHaveBeenCalledOnce();
    expect(onEvent).toHaveBeenCalledTimes(5);
  });

  it('calls onComplete before setting state to paused', async () => {
    const callOrder: string[] = [];

    player.setListener((state) => {
      if (state === 'paused') callOrder.push('paused');
    });

    const onComplete = vi.fn(() => callOrder.push('onComplete'));

    player.seek(3239100, vi.fn(), onComplete);

    await new Promise((resolve) => setTimeout(resolve, 50));

    expect(callOrder).toEqual(['onComplete', 'paused']);
  });

  it('works without onComplete (backward compat)', async () => {
    player.seek(2238647, vi.fn());

    await new Promise((resolve) => setTimeout(resolve, 50));

    expect(player.getState()).toBe('paused');
    // 4 events have ts_us <= 2238647 (inclusive)
    expect(onEvent).toHaveBeenCalledTimes(4);
  });
});
