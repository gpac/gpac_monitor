import type { AppDispatch } from '@/shared/store';
import type { HistorySnapshot, HistoryEvent, LogEvent } from './types';
import { HistoryAdapter } from './integration/historyAdapter';
import { EventPlayer } from './replay/eventPlayer';
import type { PlayerState, PlayerListener } from './replay/eventPlayer';
import { BadgeExpirationController } from './replay/badgeExpirationController';
import type { HistorySource } from './source/types';

/**
 * HistoryController — orchestrates snapshot loading + event replay.
 * Owns the EventPlayer and HistoryAdapter instances.
 */
export class HistoryController {
  private player = new EventPlayer();
  private adapter: HistoryAdapter | null = null;
  private badgeExpiration = new BadgeExpirationController();
  private snapshot: HistorySnapshot | null = null;
  private sessionStartUs = 0;
  private sessionLogs: LogEvent[] = [];

  setListener(listener: PlayerListener) {
    this.player.setListener(listener);
  }

  /** Load from a HistorySource (FileHistorySource or ActiveSessionHistorySource). */
  async load(source: HistorySource, dispatch: AppDispatch) {
    console.log('[HistoryController.load] loading session', source.sessionId);
    const [snapshot, events, logs] = await Promise.all([
      source.loadSnapshot(),
      source.loadEventsRange(),
      source.loadLogs(),
    ]);
    console.log('[HistoryController.load] snapshot ok, events:', events.length, 'logs:', logs.length);

    const sessionStartUs = events[0]?.ts_us ?? 0;
    this.snapshot = snapshot;
    this.sessionStartUs = sessionStartUs;
    this.sessionLogs = logs;
    this.adapter = new HistoryAdapter(dispatch);
    this.adapter.hydrate(snapshot, sessionStartUs);
    this.badgeExpiration.reset();
    this.player.load(
      events,
      (event) => {
        this.adapter!.handleEvent(event);
        this.scheduleBadgeIfNeeded(event);
      },
      (currentTimeUs) => {
        const expired = this.badgeExpiration.tick(currentTimeUs);
        if (expired.length > 0) {
          this.adapter!.clearExpiredBadges(expired);
        }
      },
    );
  }

  seek(targetTimestampUs: number) {
    if (!this.snapshot || !this.adapter) return;
    const { snapshot, adapter, sessionStartUs, sessionLogs } = this;
    this.badgeExpiration.reset();
    adapter.setSilent(true);
    this.player.seek(
      targetTimestampUs,
      () => adapter.hydrate(snapshot, sessionStartUs),
      () => {
        for (const logEvent of sessionLogs) {
          if (logEvent.ts_us > targetTimestampUs) break;
          adapter.handleLogEvent(logEvent);
        }
        adapter.flush(targetTimestampUs);
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

  private scheduleBadgeIfNeeded(event: HistoryEvent): void {
    if (event.message === 'filter_pid_reconfigured') {
      for (const idx of event.indexes) {
        this.badgeExpiration.schedule(idx, 'pid', event.ts_us);
      }
    } else if (event.message === 'filter_arg_updated') {
      for (const idx of event.indexes) {
        this.badgeExpiration.schedule(idx, 'arg', event.ts_us);
      }
    }
  }
}

/** Singleton instance */
export const historyController = new HistoryController();
