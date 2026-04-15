import type { AppDispatch } from '@/shared/store';
import type { HistorySnapshot, HistoryEvent, LogEvent } from './types';
import { isStructuralEvent } from './types';
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
  private nextLogIndex = 0;

  setListener(listener: PlayerListener) {
    this.player.setListener(listener);
  }

  /** Load from a HistorySource (FileHistorySource or ActiveSessionHistorySource). */
  async load(
    source: HistorySource,
    dispatch: AppDispatch,
    fromUs?: number,
    toUs?: number,
  ) {
    const needsBootstrap = fromUs !== undefined && fromUs > 0;

    const [snapshot, events, logs, preWindowEvents] = await Promise.all([
      source.loadSnapshot(),
      source.loadEventsRange(fromUs, toUs),
      source.loadLogs(fromUs, toUs),
      needsBootstrap ? source.loadEventsRange(0, fromUs) : Promise.resolve([]),
    ]);

    const sessionStartUs = events[0]?.ts_us ?? 0;
    this.snapshot = snapshot;
    this.sessionStartUs = sessionStartUs;
    this.sessionLogs = logs;
    this.nextLogIndex = 0;
    this.adapter = new HistoryAdapter(dispatch);

    // Hydrate from snapshot (t=0 base state)
    this.adapter.hydrate(snapshot, sessionStartUs);
    this.badgeExpiration.reset();

    // Bootstrap: apply structural events silently before any replay
    if (needsBootstrap) {
      const bootstrapEvents = preWindowEvents.filter(isStructuralEvent);
      this.adapter.setSilent(true);
      for (const event of bootstrapEvents) {
        this.adapter.handleEvent(event);
      }
      this.adapter.flush(fromUs); // sets silent = false internally
    }

    // Only after bootstrap is complete: load window events
    this.player.load(
      events,
      (event) => {
        this.adapter!.handleEvent(event);
        this.scheduleBadgeIfNeeded(event);
      },
      (currentTimeUs) => {
        while (
          this.nextLogIndex < this.sessionLogs.length &&
          this.sessionLogs[this.nextLogIndex].ts_us <= currentTimeUs
        ) {
          this.adapter!.handleLogEvent(this.sessionLogs[this.nextLogIndex]);
          this.nextLogIndex++;
        }
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
        adapter.flush(targetTimestampUs);
        adapter.hydrateLogsForSeek(sessionLogs, targetTimestampUs);
        this.nextLogIndex = sessionLogs.findIndex(
          (l) => l.ts_us > targetTimestampUs,
        );
        if (this.nextLogIndex === -1) this.nextLogIndex = sessionLogs.length;
      },
    );
  }

  play() {
    if (!this.snapshot || !this.adapter) {
      this.player.play();
      return;
    }
    const { snapshot, adapter, sessionStartUs } = this;
    this.player.play(() => {
      adapter.hydrate(snapshot, sessionStartUs);
      this.nextLogIndex = 0;
    });
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
