import type { AppDispatch } from '@/shared/store';
import type { HistorySnapshot } from './types';
import { loadEventsFile } from './eventLoader';
import { hydrateFromSnapshot } from './snapshotHydrator';
import { EventPlayer } from './eventPlayer';
import type { PlayerState, PlayerListener } from './eventPlayer';

/**
 * HistoryController — orchestrates snapshot loading + event replay.
 * Owns the EventPlayer instance. DataSourceContext delegates to this.
 */
export class HistoryController {
  private player = new EventPlayer();

  setListener(listener: PlayerListener) {
    this.player.setListener(listener);
  }

  async load(snapshotFile: File, eventsFile: File, dispatch: AppDispatch) {
    const snapshot: HistorySnapshot = JSON.parse(await snapshotFile.text());
    hydrateFromSnapshot(snapshot, dispatch);

    const events = await loadEventsFile(eventsFile);
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
