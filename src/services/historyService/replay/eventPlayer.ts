import type { HistoryEvent } from '../types';

export type PlayerState = 'idle' | 'playing' | 'paused' | 'done' | 'seeking';
export type PlayerListener = (state: PlayerState, timeUs: number) => void;

/**
 * EventPlayer — replays HistoryEvent[] into Redux via rAF + batch.
 *
 * Processes all events whose ts_us <= current playback time each frame.
 * No drift: playback time is based on wall-clock delta from play start.
 */
export class EventPlayer {
  private timelineEvents: HistoryEvent[] = [];
  private onEvent: ((event: HistoryEvent) => void) | null = null;
  private onTick: ((currentTimeUs: number) => void) | null = null;
  private nextEventIndex = 0;
  private state: PlayerState = 'idle';
  private animationFrameId: number | null = null;
  private seekRequestAnimationFrameId: number | null = null;
  private listener?: PlayerListener;

  // Timing
  private playbackStartTimeMs = 0;
  private startEventUs = 0;
  private currentPlaybackTimeUs = 0;

  setListener(listener: PlayerListener) {
    this.listener = listener;
  }

  load(
    timelineEvents: HistoryEvent[],
    onEvent: (event: HistoryEvent) => void,
    onTick?: (currentTimeUs: number) => void,
  ) {
    this.stop();
    this.timelineEvents = timelineEvents;
    this.onEvent = onEvent;
    this.onTick = onTick ?? null;
    this.nextEventIndex = 0;
    this.setState('idle');
  }

  play(resetStateFromSnapshot?: () => void) {
    if (!this.timelineEvents.length || !this.onEvent) return;

    if (this.state === 'paused') {
      this.playbackStartTimeMs = performance.now();
      this.startEventUs = this.currentPlaybackTimeUs;
    } else {
      // Restarting from idle/done — reset Redux state before replaying
      resetStateFromSnapshot?.();
      this.playbackStartTimeMs = performance.now();
      this.startEventUs = this.timelineEvents[0]?.ts_us ?? 0;
      this.currentPlaybackTimeUs = this.startEventUs;
      this.nextEventIndex = 0;
    }

    this.setState('playing');
    this.scheduleFrame();
  }

  pause() {
    if (this.state !== 'playing') return;
    this.currentPlaybackTimeUs = this.currentTimeUs();
    this.cancelFrame();
    this.setState('paused');
  }

  stop() {
    if (this.seekRequestAnimationFrameId !== null) {
      cancelAnimationFrame(this.seekRequestAnimationFrameId);
      this.seekRequestAnimationFrameId = null;
    }
    this.cancelFrame();
    this.nextEventIndex = 0;
    this.currentPlaybackTimeUs = 0;
    this.setState('idle');
  }

  /**
   * Seek to a target timestamp (absolute, same space as event.ts_us).
   * Processes events in 8ms chunks via rAF to avoid blocking the main thread.
   */
  seek(
    targetTimestampUs: number,
    resetStateFromSnapshot: () => void,
    onComplete?: () => void,
  ) {
    if (!this.timelineEvents.length || !this.onEvent) return;

    if (this.seekRequestAnimationFrameId !== null) {
      cancelAnimationFrame(this.seekRequestAnimationFrameId);
      this.seekRequestAnimationFrameId = null;
    }
    this.cancelFrame();
    this.currentPlaybackTimeUs = targetTimestampUs; // jump immediately for UI
    this.setState('seeking');
    resetStateFromSnapshot();

    let i = 0;
    const processChunk = () => {
      // Limit processing time to ~8ms per frame to avoid blocking the main thread
      const deadline = performance.now() + 8;
      while (
        i < this.timelineEvents.length &&
        this.timelineEvents[i].ts_us <= targetTimestampUs &&
        performance.now() < deadline
      ) {
        this.onEvent!(this.timelineEvents[i]);
        i++;
      }

      if (
        i < this.timelineEvents.length &&
        this.timelineEvents[i].ts_us <= targetTimestampUs
      ) {
        this.seekRequestAnimationFrameId = requestAnimationFrame(processChunk);
      } else {
        this.seekRequestAnimationFrameId = null;
        this.nextEventIndex = i;
        this.currentPlaybackTimeUs = targetTimestampUs;
        onComplete?.();
        this.setState('paused');
      }
    };

    this.seekRequestAnimationFrameId = requestAnimationFrame(processChunk);
  }

  getState(): PlayerState {
    return this.state;
  }

  currentTimeUs(): number {
    if (this.state === 'playing') {
      const elapsedMs = performance.now() - this.playbackStartTimeMs;
      return this.startEventUs + elapsedMs * 1000;
    }
    return this.currentPlaybackTimeUs;
  }

  durationUs(): number {
    if (!this.timelineEvents.length) return 0;
    return (
      this.timelineEvents[this.timelineEvents.length - 1].ts_us -
      this.timelineEvents[0].ts_us
    );
  }

  private setState(state: PlayerState) {
    this.state = state;
    if (this.listener) this.listener(state, this.currentTimeUs());
  }

  private scheduleFrame() {
    this.animationFrameId = requestAnimationFrame(() => this.tick());
  }

  private cancelFrame() {
    if (this.animationFrameId !== null) {
      cancelAnimationFrame(this.animationFrameId);
      this.animationFrameId = null;
    }
  }

  private tick() {
    if (this.state !== 'playing' || !this.onEvent) return;

    const now = this.currentTimeUs();

    while (this.nextEventIndex < this.timelineEvents.length) {
      const event = this.timelineEvents[this.nextEventIndex];
      if (event.ts_us > now) break;
      this.onEvent!(event);
      this.nextEventIndex++;
    }

    this.onTick?.(now);

    if (this.nextEventIndex >= this.timelineEvents.length) {
      this.currentPlaybackTimeUs =
        this.timelineEvents[this.timelineEvents.length - 1].ts_us;
      this.setState('done');
      return;
    }

    this.scheduleFrame();
  }
}
