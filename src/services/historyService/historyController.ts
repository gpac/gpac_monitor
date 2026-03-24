import type { AppDispatch } from '@/shared/store';
import type { HistorySnapshot } from './types';
import { loadEventsFile } from './loader/eventLoader';
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

  setListener(listener: PlayerListener) {
    this.player.setListener(listener);
  }

  /** Load from File objects (V2 compat) */
  async load(snapshotFile: File, eventsFile: File, dispatch: AppDispatch) {
    const snapshot: HistorySnapshot = JSON.parse(await snapshotFile.text());
    const events = await loadEventsFile(eventsFile);

    const sessionStartUs = events[0]?.ts_us ?? 0;
    hydrateFromSnapshot(snapshot, dispatch, sessionStartUs);

    this.player.load(events, dispatch);
  }

  /** Load from SessionFileReader (V3 WS, V4/V5 File API) */
  async loadFromReader(
    reader: SessionFileReader,
    sessionId: string,
    dispatch: AppDispatch,
  ) {
    const snapshot = await reader.readSnapshot(sessionId);
    const events = await reader.readEvents(sessionId);

    const sessionStartUs = events[0]?.ts_us ?? 0;
    hydrateFromSnapshot(snapshot, dispatch, sessionStartUs);

    this.player.load(events, dispatch);
  }

  play() {
    this.player.play();
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
}

/** Singleton instance */
export const historyController = new HistoryController();
