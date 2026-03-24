import type { AppDispatch } from '@/shared/store';
import type { HistoryEvent } from '../types';
import { dispatchEvent } from './eventDispatcher';

export type PlayerState = 'idle' | 'playing' | 'paused' | 'done';
export type PlayerListener = (state: PlayerState, timeUs: number) => void;

/**
 * EventPlayer — replays HistoryEvent[] into Redux via rAF + batch.
 *
 * Processes all events whose ts_us <= current playback time each frame.
 * No drift: playback time is based on wall-clock delta from play start.
 */
export class EventPlayer {
  private events: HistoryEvent[] = [];
  private dispatch: AppDispatch | null = null;
  private nextEventIndex = 0;
  private state: PlayerState = 'idle';
  private animationFrameId: number | null = null;
  private listener?: PlayerListener;

  // Timing
  private playbackStartTimeMs = 0;
  private startEventUs = 0;
  private pausedElapsedUs = 0;

  setListener(listener: PlayerListener) {
    this.listener = listener;
  }

  load(events: HistoryEvent[], dispatch: AppDispatch) {
    this.stop();
    this.events = events;
    this.dispatch = dispatch;
    this.nextEventIndex = 0;
    this.setState('idle');
  }

  play() {
    if (!this.events.length || !this.dispatch) return;

    if (this.state === 'paused') {
      this.playbackStartTimeMs = performance.now();
      this.startEventUs = this.pausedElapsedUs;
    } else {
      this.playbackStartTimeMs = performance.now();
      this.startEventUs = this.events[0]?.ts_us ?? 0;
      this.pausedElapsedUs = this.startEventUs;
      this.nextEventIndex = 0;
    }

    this.setState('playing');
    this.scheduleFrame();
  }

  pause() {
    if (this.state !== 'playing') return;
    this.pausedElapsedUs = this.currentTimeUs();
    this.cancelFrame();
    this.setState('paused');
  }

  stop() {
    this.cancelFrame();
    this.nextEventIndex = 0;
    this.pausedElapsedUs = 0;
    this.setState('idle');
  }

  // TODO (V3): seek is not yet usable.
  //
  // seek(timeUs) repositions the playhead to an absolute event timestamp
  // (same space as event.ts_us — not a relative offset from 0).
  //
  // The cursor and timing vars are updated correctly, but Redux state is NOT
  // reconstructed. After a backward seek, Redux would reflect the future state
  // (e.g. filter A = blue) instead of the correct state at targetTimeUs
  // (e.g. filter A = red).
  //
  // A correct implementation requires one of:
  //   - re-hydrating from snapshot + replaying all events up to targetTimeUs
  //   - using intermediate checkpoints
  //
  // seek(timeUs: number) { ... }

  getState(): PlayerState {
    return this.state;
  }

  currentTimeUs(): number {
    if (this.state === 'playing') {
      const elapsedMs = performance.now() - this.playbackStartTimeMs;
      return this.startEventUs + elapsedMs * 1000;
    }
    return this.pausedElapsedUs;
  }

  durationUs(): number {
    if (!this.events.length) return 0;
    return this.events[this.events.length - 1].ts_us - this.events[0].ts_us;
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

    while (this.nextEventIndex < this.events.length) {
      const event = this.events[this.nextEventIndex];
      if (event.ts_us > now) break;
      dispatchEvent(event, this.dispatch);
      this.nextEventIndex++;
    }

    if (this.nextEventIndex >= this.events.length) {
      this.setState('done');
      return;
    }

    this.scheduleFrame();
  }
}
