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
import type { EventChunk } from './chunkLoader';
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
  private loadedChunkIndex: number | null = null;

  setListener(listener: PlayerListener) {
    this.player.setListener(listener);
  }

  private handleReplayEvent = (event: HistoryEvent): void => {
    this.adapter!.handleEvent(event);
    this.scheduleBadgeIfNeeded(event);
  };

  private flushVisibleLogs(currentTimeUs: number): void {
    if (!this.adapter) return;
    while (
      this.nextLogIndex < this.sessionLogs.length &&
      this.sessionLogs[this.nextLogIndex].ts_us <= currentTimeUs
    ) {
      this.adapter.handleLogEvent(this.sessionLogs[this.nextLogIndex]);
      this.nextLogIndex++;
    }
  }

  private handlePlaybackTick = (currentTimeUs: number): void => {
    this.flushVisibleLogs(currentTimeUs);
    const expired = this.badgeExpiration.tick(currentTimeUs);
    if (expired.length > 0) {
      this.adapter!.clearExpiredBadges(expired);
    }
  };

  private async loadLogsForChunk(chunk: EventChunk): Promise<void> {
    if (!this.loader)
      throw new Error('[HistoryController] Loader not initialized');

    const logChunks = await this.loader.loadLogChunksInRange(
      chunk.fromUs,
      chunk.toUs,
    );

    this.sessionLogs = logChunks
      .flatMap((logChunk) => logChunk.logs)
      .sort((leftLog, rightLog) => leftLog.ts_us - rightLog.ts_us);

    this.nextLogIndex = 0;
  }

  private async loadInitialPlaybackChunk(): Promise<void> {
    if (!this.loader)
      throw new Error('[HistoryController] Loader not initialized');

    const firstChunk = await this.loader.loadEventChunk(0);

    await this.loadLogsForChunk(firstChunk);

    this.player.load(
      firstChunk.events,
      this.handleReplayEvent,
      this.handlePlaybackTick,
    );

    this.loader.preloadEventChunk(1).catch((error) => {
      console.warn('[HistoryController] Failed to preload chunk 1', error);
    });

    this.loadedChunkIndex = 0;
  }

  async load(source: HistorySource, dispatch: AppDispatch) {
    const manifest = await source.getManifest();
    if (!manifest)
      throw new Error('[HistoryController] No manifest for session');

    this.manifest = manifest;
    this.loader = new ChunkLoader(source, manifest);

    const snapshot = await source.loadSnapshot();

    this.snapshot = snapshot;
    this.sessionStartUs = manifest.startUs;
    this.sessionLogs = [];
    this.nextLogIndex = 0;
    this.loadedChunkIndex = null;
    this.adapter = new HistoryAdapter(dispatch);
    this.adapter.hydrate(snapshot, manifest.startUs);
    this.badgeExpiration.reset();
    this.player.load([], this.handleReplayEvent, this.handlePlaybackTick);
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
    this.badgeExpiration.reset();

    const currentChunk = await loader.loadEventChunk(chunkIndex);

    await this.loadLogsForChunk(currentChunk);
    this.nextLogIndex = this.getNextLogIndexFromTimestamp(tsUs);
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
      currentChunk.events.filter((event) => event.ts_us >= tsUs),
      this.handleReplayEvent,
      this.handlePlaybackTick,
      tsUs,
    );

    this.loadedChunkIndex = chunkIndex;
  }

  async play(): Promise<void> {
    if (this.loadedChunkIndex === null) {
      await this.loadInitialPlaybackChunk();
    }
    this.player.play(() => {
      if (this.adapter && this.snapshot) {
        this.adapter.hydrate(this.snapshot, this.sessionStartUs);
        this.nextLogIndex = 0;
      }
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

  private getNextLogIndexFromTimestamp(timestampUs: number): number {
    const firstReplayableLogIndex = this.sessionLogs.findIndex(
      (log) => log.ts_us >= timestampUs,
    );

    return firstReplayableLogIndex === -1
      ? this.sessionLogs.length
      : firstReplayableLogIndex;
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
