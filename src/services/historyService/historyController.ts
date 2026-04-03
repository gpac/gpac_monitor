import type { AppDispatch } from '@/shared/store';
import type { HistorySnapshot, LogEvent } from './types';
import { HistoryAdapter } from './integration/historyAdapter';
import { EventPlayer } from './replay/eventPlayer';
import type { PlayerState, PlayerListener } from './replay/eventPlayer';
import type { HistorySource } from './source/types';

/**
 * HistoryController — orchestrates snapshot loading + event replay.
 * Owns the EventPlayer and HistoryAdapter instances.
 */
export class HistoryController {
  private player = new EventPlayer();
  private adapter: HistoryAdapter | null = null;
  private snapshot: HistorySnapshot | null = null;
  private sessionStartUs = 0;
  private sessionLogs: LogEvent[] = [];

  setListener(listener: PlayerListener) {
    this.player.setListener(listener);
  }

  /** Load from a HistorySource (FileHistorySource or ActiveSessionHistorySource). */
  async load(source: HistorySource, dispatch: AppDispatch) {
    const [snapshot, events, logs] = await Promise.all([
      source.loadSnapshot(),
      source.loadEventsRange(),
      source.loadLogs(),
    ]);

    const sessionStartUs = events[0]?.ts_us ?? 0;
    this.snapshot = snapshot;
    this.sessionStartUs = sessionStartUs;
    this.sessionLogs = logs;
    this.adapter = new HistoryAdapter(dispatch);
    this.adapter.hydrate(snapshot, sessionStartUs);
    this.player.load(events, (event) => this.adapter!.handleEvent(event));
  }

  seek(targetTimestampUs: number) {
    if (!this.snapshot || !this.adapter) return;
    const { snapshot, adapter, sessionStartUs, sessionLogs } = this;
    adapter.setSilent(true);
    this.player.seek(
      targetTimestampUs,
      () => adapter.hydrate(snapshot, sessionStartUs),
      () => {
        adapter.flush();
        for (const logEvent of sessionLogs) {
          if (logEvent.ts_us > targetTimestampUs) break;
          adapter.handleLogEvent(logEvent);
        }
      },
    );
  }

  play() {
    if (!this.snapshot || !this.adapter) {
      this.player.play();
      return;
    }
    const { snapshot, adapter, sessionStartUs } = this;
    this.player.play(() => adapter.hydrate(snapshot, sessionStartUs));
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
