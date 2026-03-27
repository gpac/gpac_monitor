import type { AppDispatch } from '@/shared/store';
import type { HistoryEvent } from '../types';
import { dispatchEvent } from './eventDispatcher';

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
  private dispatch: AppDispatch | null = null;
  private nextEventIndex = 0;
  private state: PlayerState = 'idle';
  private animationFrameId: number | null = null;
  private listener?: PlayerListener;

  // Timing
  private playbackStartTimeMs = 0;
  private startEventUs = 0;
  private currentPlaybackTimeUs = 0;

  setListener(listener: PlayerListener) {
    this.listener = listener;
  }

  load(timelineEvents: HistoryEvent[], dispatch: AppDispatch) {
    this.stop();
    this.timelineEvents = timelineEvents;
    this.dispatch = dispatch;
    this.nextEventIndex = 0;
    this.setState('idle');
  }

  play(resetStateFromSnapshot?: () => void) {
    if (!this.timelineEvents.length || !this.dispatch) return;

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
    this.cancelFrame();
    this.nextEventIndex = 0;
    this.currentPlaybackTimeUs = 0;
    this.setState('idle');
  }

  /**
   * Seek to a target timestamp (absolute, same space as event.ts_us).
   * Rehydrates Redux from snapshot then fast-forwards all events up to target.
   */
  seek(targetTimestampUs: number, resetStateFromSnapshot: () => void) {
    if (!this.timelineEvents.length || !this.dispatch) return;

    this.cancelFrame();
    this.setState('seeking');

    resetStateFromSnapshot();

    let i = 0;
    while (
      i < this.timelineEvents.length &&
      this.timelineEvents[i].ts_us <= targetTimestampUs
    ) {
      dispatchEvent(this.timelineEvents[i], this.dispatch);
      i++;
    }
    // start of next event after seek target
    this.nextEventIndex = i;
    this.currentPlaybackTimeUs = targetTimestampUs;
    this.setState('paused');
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
    if (this.state !== 'playing' || !this.dispatch) return;

    const now = this.currentTimeUs();

    while (this.nextEventIndex < this.timelineEvents.length) {
      const event = this.timelineEvents[this.nextEventIndex];
      if (event.ts_us > now) break;
      dispatchEvent(event, this.dispatch);
      this.nextEventIndex++;
    }

    if (this.nextEventIndex >= this.timelineEvents.length) {
      // Freeze position at last event so currentTimeUs() reflects actual end
      this.currentPlaybackTimeUs =
        this.timelineEvents[this.timelineEvents.length - 1].ts_us;
      this.setState('done');
      return;
    }

    this.scheduleFrame();
  }
}
