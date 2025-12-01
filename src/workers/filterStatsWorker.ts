import { MonitoredFilterStats } from '@/types/domain/gpac';

// Types for communication with the Worker
export type FilterStatsWorkerMessage =
  | {
      type: 'PROCESS_FILTER_STATS';
      stats: MonitoredFilterStats;
    }
  | {
      type: 'CLEANUP';
    };

export interface FilterStatsWorkerResponse {
  type: 'PROCESSED_FILTER_STATS';
  statsBatch: MonitoredFilterStats[];
  count: number;
}

// Worker configuration
const BATCH_SIZE = 50; // Max stats per batch
const FLUSH_INTERVAL = 300; // Flush interval in ms
const MAX_BUFFER_PER_FILTER = 10; // Circuit breaker per filter

class FilterStatsProcessor {
  // Buffer per filter (idx → stats[])
  private buffersByFilter = new Map<number, MonitoredFilterStats[]>();
  private flushTimeout: ReturnType<typeof setTimeout> | null = null;

  constructor() {
    this.startFlushTimer();
  }

  addStats(stats: MonitoredFilterStats) {
    const idx = stats.idx;

    // Get or create buffer for this filter
    if (!this.buffersByFilter.has(idx)) {
      this.buffersByFilter.set(idx, []);
    }

    const buffer = this.buffersByFilter.get(idx)!;

    // Circuit breaker - keep only the most recent stats
    if (buffer.length >= MAX_BUFFER_PER_FILTER) {
      buffer.shift(); // Remove oldest
    }

    buffer.push(stats);

    // Check total size across all filters
    const totalSize = Array.from(this.buffersByFilter.values()).reduce(
      (sum, buf) => sum + buf.length,
      0,
    );

    if (totalSize >= BATCH_SIZE) {
      this.flush();
    }
  }

  private flush() {
    const allStats: MonitoredFilterStats[] = [];

    // Collect all buffered stats
    for (const buffer of this.buffersByFilter.values()) {
      allStats.push(...buffer);
    }

    if (allStats.length === 0) return;

    // Clear all buffers
    this.buffersByFilter.clear();

    // Send to main thread
    self.postMessage({
      type: 'PROCESSED_FILTER_STATS',
      statsBatch: allStats,
      count: allStats.length,
    } as FilterStatsWorkerResponse);

    this.clearFlushTimeout();
  }

  private clearFlushTimeout() {
    if (this.flushTimeout) {
      clearTimeout(this.flushTimeout);
      this.flushTimeout = null;
    }
  }

  private flushIntervalId: NodeJS.Timeout | null = null;

  private startFlushTimer() {
    // Periodic flush to prevent stats from getting stuck
    this.flushIntervalId = setInterval(() => {
      const hasData = Array.from(this.buffersByFilter.values()).some(
        (buf) => buf.length > 0,
      );

      if (hasData && !this.flushTimeout) {
        this.flush();
      }
    }, FLUSH_INTERVAL);
  }

  public cleanup() {
    if (this.flushIntervalId) {
      clearInterval(this.flushIntervalId);
      this.flushIntervalId = null;
    }
    this.clearFlushTimeout();
    this.buffersByFilter.clear();
  }
}

// Processor instance
const processor = new FilterStatsProcessor();

// Listen for messages from the main thread
self.addEventListener(
  'message',
  (event: MessageEvent<FilterStatsWorkerMessage>) => {
    const { type } = event.data;

    switch (type) {
      case 'PROCESS_FILTER_STATS':
        processor.addStats(event.data.stats);
        break;
      case 'CLEANUP':
        processor.cleanup();
        break;
    }
  },
);

// Export type for TypeScript
export default null;
