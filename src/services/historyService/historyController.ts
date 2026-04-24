import type { AppDispatch } from '@/shared/store';
import type { HistorySnapshot, HistoryEvent, LogEvent } from './types';
import { HistoryAdapter } from './integration/historyAdapter';
import { EventPlayer } from './replay/eventPlayer';
import type { PlayerState, PlayerListener } from './replay/eventPlayer';
import {
  BadgeExpirationController,
  BADGE_DURATION_US,
} from './replay/badgeExpirationController';
import type { HistoryManifest, HistorySource } from './source/types';
import { ChunkLoader } from './chunkLoader';
import { findEventChunkIndex, findNearestCheckpoint } from './manifestParser';

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
  private manifest: HistoryManifest | null = null;
  private lastSeekUs: number | null = null;

  setListener(listener: PlayerListener) {
    this.player.setListener(listener);
  }

  async load(source: HistorySource, dispatch: AppDispatch) {
    const manifest = await source.getManifest();
    if (!manifest)
      throw new Error('[HistoryController] No manifest for session');

    this.manifest = manifest;
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
    this.lastSeekUs = null;
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

  async seek(tsUs: number): Promise<void> {
    if (!this.manifest || !this.loader || !this.adapter) return;
    const { manifest, loader, adapter } = this;

    const chunkIndex = findEventChunkIndex(manifest, tsUs);
    const cp = findNearestCheckpoint(manifest, chunkIndex);
    adapter.resetTemporalState();
    adapter.clearTimeSeriesData();
    if (cp) {
      const checkpoint = await loader.loadCheckpoint(cp.file);
      console.log(checkpoint);
      if (checkpoint) adapter.hydrateCheckpoint(checkpoint);
    }
    this.lastSeekUs = tsUs;
    this.badgeExpiration.reset();

    const currentChunk = await loader.loadEventChunk(chunkIndex);
    const logChunks = await loader.loadLogChunksInRange(
      currentChunk.fromUs,
      currentChunk.toUs,
    );
    this.sessionLogs = logChunks.flatMap((lc) => lc.logs);
    this.nextLogIndex = this.sessionLogs.findIndex((l) => l.ts_us > tsUs);
    if (this.nextLogIndex === -1) this.nextLogIndex = this.sessionLogs.length;
    adapter.hydrateLogsForSeek(this.sessionLogs, tsUs);

    const eventsBeforeSeek = currentChunk.events.filter(
      (event) => event.ts_us < tsUs,
    );
    if (eventsBeforeSeek.length > 0) {
      adapter.setSilent(true);
      for (const event of eventsBeforeSeek) {
        adapter.handleEvent(event);
      }
      adapter.flush(tsUs);
      // Re-schedule expiry for events inside the badge window so ticks can clear them.
      const badgeWindowStart = tsUs - BADGE_DURATION_US;
      for (const event of eventsBeforeSeek) {
        if (event.ts_us >= badgeWindowStart) {
          this.scheduleBadgeIfNeeded(event);
        }
      }
    }

    this.player.load(
      currentChunk.events.filter((e) => e.ts_us >= tsUs),
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
        if (expired.length > 0) this.adapter!.clearExpiredBadges(expired);
      },
      tsUs,
    );
  }

  play() {
    if (!this.snapshot || !this.adapter) {
      this.player.play();
      return;
    }
    if (this.lastSeekUs !== null) {
      this.seek(this.lastSeekUs)
        .then(() => this.player.play())
        .catch(console.error);
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
    if (this.manifest) return this.manifest.endUs - this.manifest.startUs;
    return this.player.durationUs();
  }

  getSessionStartUs(): number {
    return this.sessionStartUs;
  }

  // Registers badge expiry for structural events; ticks call clearExpiredBadges when due.
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
