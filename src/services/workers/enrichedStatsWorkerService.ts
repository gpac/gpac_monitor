import { GpacNodeData } from '@/types/domain/gpac/model';
import {
  EnrichStatsMessage,
  EnrichedStatsResponse,
  EnrichedFilterData,
} from '@/workers/enrichedStatsWorker';
import EnrichedStatsWorker from '../../workers/enrichedStatsWorker?worker&inline';

export class EnrichedStatsWorkerService {
  private worker: Worker | null = null;
  private subscribers: Set<(filters: EnrichedFilterData[]) => void> = new Set();

  constructor() {
    this.initWorker();
  }

  private initWorker() {
    try {
      this.worker = new EnrichedStatsWorker({ name: 'enrichedStatsWorker' });

      this.worker.onmessage = (event: MessageEvent<EnrichedStatsResponse>) => {
        const { type, enrichedFilters } = event.data;

        if (type === 'ENRICHED_STATS') {
          this.subscribers.forEach((callback) => {
            try {
              callback(enrichedFilters);
            } catch (error) {
              console.error(
                '[EnrichedStatsWorkerService] Callback error:',
                error,
              );
            }
          });
        }
      };

      this.worker.onerror = (error) => {
        console.error('[EnrichedStatsWorkerService] Worker error:', error);
      };
    } catch (error) {
      console.error(
        '[EnrichedStatsWorkerService] Failed to create worker:',
        error,
      );
    }
  }

  enrichStats(filters: GpacNodeData[]) {
    if (!this.worker) return;

    const message: EnrichStatsMessage = {
      type: 'ENRICH_STATS',
      filters,
    };

    this.worker.postMessage(message);
  }

  subscribe(callback: (filters: EnrichedFilterData[]) => void): () => void {
    this.subscribers.add(callback);

    return () => {
      this.subscribers.delete(callback);
    };
  }

  destroy() {
    if (this.worker) {
      this.worker.terminate();
      this.worker = null;
    }
    this.subscribers.clear();
  }
}

export const enrichedStatsWorkerService = new EnrichedStatsWorkerService();
