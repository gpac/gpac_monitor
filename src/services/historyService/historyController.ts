import type { AppDispatch } from '@/shared/store';
import type { HistorySnapshot, HistoryEvent, LogEvent } from './types';
import { HistoryAdapter } from './integration/historyAdapter';
import { EventPlayer } from './replay/eventPlayer';
import type { PlayerState, PlayerListener } from './replay/eventPlayer';
import {
  BadgeExpirationController,
  BADGE_DURATION_US,
} from './replay/badgeExpirationController';
import { ChunkPreloadController } from './replay/chunkPreloadController';
import type { AppendLogsCallback } from './replay/chunkPreloadController';
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
  private preloader: ChunkPreloadController | null = null;

  setListener(listener: PlayerListener) {
    this.player.setListener(listener);
  }

  private handleReplayEvent = (event: HistoryEvent): void => {
    this.adapter!.handleEvent(event);
    this.scheduleBadgeIfNeeded(event);
  };

  private flushVisibleLogs(currentTimeUs: number): void {
    if (!this.adapter) return;
    let dispatched = 0;
    while (
      dispatched < 50 &&
      this.nextLogIndex < this.sessionLogs.length &&
      this.sessionLogs[this.nextLogIndex].ts_us <= currentTimeUs
    ) {
      this.adapter.handleLogEvent(this.sessionLogs[this.nextLogIndex]);
      this.nextLogIndex++;
      dispatched++;
    }
  }

  private handlePlaybackTick = (currentTimeUs: number): void => {
    this.flushVisibleLogs(currentTimeUs);
    const expired = this.badgeExpiration.tick(currentTimeUs);
    if (expired.length > 0) {
      this.adapter!.clearExpiredBadges(expired);
    }
    if (this.manifest && this.preloader) {
      this.preloader.updatePlayingChunkIndex(currentTimeUs);
    }
    this.preloader?.ensureOneChunkAhead();
  };

  private appendLogs: AppendLogsCallback = async (
    chunk: EventChunk,
    isStale: () => boolean,
  ): Promise<void> => {
    if (!this.loader) return;
    try {
      const logChunks = await this.loader.loadLogChunksInRange(
        chunk.fromUs,
        chunk.toUs,
      );
      if (isStale()) return;
      const lastTs =
        this.sessionLogs.length > 0
          ? this.sessionLogs[this.sessionLogs.length - 1].ts_us
          : 0;
      const nextLogs = logChunks
        .flatMap((logChunk) => logChunk.logs)
        .filter((log) => log.ts_us > lastTs)
        .sort((leftLog, rightLog) => leftLog.ts_us - rightLog.ts_us);
      this.sessionLogs = [...this.sessionLogs, ...nextLogs];
    } catch (error) {
      console.warn('[HistoryController] log preload failed', error);
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

    this.preloader?.reset(0);
    this.loadedChunkIndex = 0;
    this.preloader?.ensureOneChunkAhead();
  }

  async load(source: HistorySource, dispatch: AppDispatch) {
    const manifest = await source.getManifest();
    if (!manifest)
      throw new Error('[HistoryController] No manifest for session');

    this.manifest = manifest;
    this.loader = new ChunkLoader(source, manifest);
    this.preloader = new ChunkPreloadController(
      this.loader,
      manifest,
      this.player,
      this.appendLogs,
    );

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
    this.preloader?.invalidate();
    if (!this.manifest || !this.loader || !this.adapter || !this.preloader)
      return;
    const { manifest, loader, adapter, preloader } = this;
    const version = preloader.getVersion();

    const chunkIndex = findEventChunkIndex(manifest, tsUs);
    const cp = findNearestCheckpoint(manifest, chunkIndex);
    adapter.resetTemporalState();
    adapter.clearTimeSeriesData();
    if (cp) {
      const checkpoint = await loader.loadCheckpoint(cp.file);
      if (version !== preloader.getVersion()) return;
      console.log(checkpoint);
      if (checkpoint) adapter.hydrateCheckpoint(checkpoint);
    }
    this.badgeExpiration.reset();

    const currentChunk = await loader.loadEventChunk(chunkIndex);
    if (version !== preloader.getVersion()) return;

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

    preloader.reset(chunkIndex);
    this.loadedChunkIndex = chunkIndex;
    preloader.ensureOneChunkAhead();
  }

  async play(): Promise<void> {
    if (this.loadedChunkIndex === null) {
      await this.loadInitialPlaybackChunk();
    }
    this.player.play(() => {
      console.warn('[HistoryController] player restart callback called', {
        currentTimeUs: this.player.currentTimeUs(),
        loadedChunkIndex: this.loadedChunkIndex,
      });
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
