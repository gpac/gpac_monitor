import type { AppDispatch } from '@/shared/store';
import type { HistorySnapshot } from './types';
import { hydrateFromSnapshot } from './loader/snapshotHydrator';
import { EventPlayer } from './replay/eventPlayer';
import type { PlayerState, PlayerListener } from './replay/eventPlayer';
import type { SessionFileReader } from './sessionFileReader';

/**
 * HistoryController — orchestrates snapshot loading + event replay.
 * Owns the EventPlayer instance. DataSourceContext delegates to this.
 */
export class HistoryController {
  private player = new EventPlayer();
  private snapshot: HistorySnapshot | null = null;
  private sessionStartUs = 0;
  private dispatch: AppDispatch | null = null;

  setListener(listener: PlayerListener) {
    this.player.setListener(listener);
  }

  /** Load from SessionFileReader (WS or local File API) */
  async loadFromReader(
    reader: SessionFileReader,
    sessionId: string,
    dispatch: AppDispatch,
  ) {
    const snapshot = await reader.readSnapshot(sessionId);
    const events = await reader.readEvents(sessionId);

    this.storeSession(snapshot, dispatch, events[0]?.ts_us ?? 0);
    hydrateFromSnapshot(snapshot, dispatch, this.sessionStartUs);
    this.player.load(events, dispatch);
  }

  seek(targetTimestampUs: number) {
    if (!this.snapshot || !this.dispatch) return;
    const { snapshot, dispatch, sessionStartUs } = this;
    this.player.seek(targetTimestampUs, () => {
      hydrateFromSnapshot(snapshot, dispatch, sessionStartUs);
    });
  }

  private storeSession(
    snapshot: HistorySnapshot,
    dispatch: AppDispatch,
    sessionStartUs: number,
  ) {
    this.snapshot = snapshot;
    this.dispatch = dispatch;
    this.sessionStartUs = sessionStartUs;
  }

  play() {
    if (!this.snapshot || !this.dispatch) {
      this.player.play();
      return;
    }
    const { snapshot, dispatch, sessionStartUs } = this;
    this.player.play(() =>
      hydrateFromSnapshot(snapshot, dispatch, sessionStartUs),
    );
  }

  pause() {
    this.player.pause();
  }

  stop() {
    this.player.stop();
  }

  getState(): PlayerState {
    return this.player.getState();
  }

  currentTimeUs(): number {
    return this.player.currentTimeUs();
  }

  durationUs(): number {
    return this.player.durationUs();
  }

  getSessionStartUs(): number {
    return this.sessionStartUs;
  }
}

/** Singleton instance */
export const historyController = new HistoryController();
