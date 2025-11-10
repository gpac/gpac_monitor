import { MonitoredFilterStats } from '@/types/domain/gpac';
import {
  FilterStatsWorkerMessage,
  FilterStatsWorkerResponse,
} from '@/workers/filterStatsWorker';
import FilterStatsWorker from '../../workers/filterStatsWorker?worker&inline';

export class FilterStatsWorkerService {
  private worker: Worker | null = null;
  private subscribers: Set<(stats: MonitoredFilterStats[]) => void> =
    new Set();

  constructor() {
    this.initWorker();
  }

  private initWorker() {
    try {
      this.worker = new FilterStatsWorker({ name: 'filterStatsWorker' });

      this.worker.onmessage = (
        event: MessageEvent<FilterStatsWorkerResponse>,
      ) => {
        const { type, statsBatch } = event.data;

        if (type === 'PROCESSED_FILTER_STATS') {
          // Notify all subscribers with the batch
          this.subscribers.forEach((callback) => {
            try {
              callback(statsBatch);
            } catch (error) {
              console.error(
                '[FilterStatsWorkerService] Callback error:',
                error,
              );
            }
          });
        }
      };

      this.worker.onerror = (error) => {
        console.error('[FilterStatsWorkerService] Worker error:', error);
      };
    } catch (error) {
      console.error(
        '[FilterStatsWorkerService] Failed to create worker:',
        error,
      );
    }
  }

  // Send stats to Worker for processing
  processStats(stats: MonitoredFilterStats) {
    if (!this.worker) return;

    const message: FilterStatsWorkerMessage = {
      type: 'PROCESS_FILTER_STATS',
      stats,
    };

    this.worker.postMessage(message);
  }

  // Subscribe to processed stats batches
  subscribe(callback: (stats: MonitoredFilterStats[]) => void): () => void {
    this.subscribers.add(callback);

    return () => {
      this.subscribers.delete(callback);
    };
  }

  // Cleanup
  destroy() {
    if (this.worker) {
      this.worker.terminate();
      this.worker = null;
    }
    this.subscribers.clear();
  }
}

// Singleton instance
export const filterStatsWorkerService = new FilterStatsWorkerService();
