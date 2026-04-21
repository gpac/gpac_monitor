import type { AppDispatch } from '@/shared/store';
import type { HistorySnapshot, HistoryEvent, LogEvent } from './types';
import { HistoryAdapter } from './integration/historyAdapter';
import { EventPlayer } from './replay/eventPlayer';
import type { PlayerState, PlayerListener } from './replay/eventPlayer';
import { BadgeExpirationController } from './replay/badgeExpirationController';
import type { HistorySource } from './source/types';
import { ChunkLoader } from './chunkLoader';

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
  private loader: ChunkLoader | null = null;

  setListener(listener: PlayerListener) {
    this.player.setListener(listener);
  }

  async load(source: HistorySource, dispatch: AppDispatch) {
    const manifest = await source.getManifest();
    if (!manifest)
      throw new Error('[HistoryController] No manifest for session');

    this.loader = new ChunkLoader(source, source.sessionId, manifest);

    const chunk0 = await this.loader.loadEventChunk(0);
    const logChunks = await this.loader.loadLogChunksInRange(
      chunk0.fromUs,
      chunk0.toUs,
    );
    const snapshot = await source.loadSnapshot();

    this.snapshot = snapshot;
    this.sessionStartUs = manifest.startUs;
    this.sessionLogs = logChunks.flatMap((logChunk) => logChunk.logs);
    this.nextLogIndex = 0;
    this.adapter = new HistoryAdapter(dispatch);
    this.adapter.hydrate(snapshot, manifest.startUs);
    this.badgeExpiration.reset();
    this.player.load(
      chunk0.events,
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
