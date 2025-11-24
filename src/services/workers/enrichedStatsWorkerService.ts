import { GpacNodeData } from '@/types/domain/gpac/model';
import {
  EnrichStatsMessage,
  EnrichedStatsResponse,
  EnrichedFilterData,
} from '@/workers/enrichedStatsWorker';
import EnrichedStatsWorker from '../../workers/enrichedStatsWorker?worker&inline';
import { BaseWorkerService } from './BaseWorkerService';

class EnrichedStatsWorkerService extends BaseWorkerService<
  GpacNodeData[],
  EnrichedFilterData[]
> {
  constructor() {
    super('EnrichedStatsWorkerService', 'ENRICHED_STATS');
  }

  protected createWorker(): Worker {
    return new EnrichedStatsWorker({ name: 'enrichedStatsWorker' });
  }

  protected extractData(
    eventData: EnrichedStatsResponse,
  ): EnrichedFilterData[] {
    return eventData.enrichedFilters;
  }

  protected createMessage(filters: GpacNodeData[]): EnrichStatsMessage {
    return { type: 'ENRICH_STATS', filters };
  }

  // Alias for backward compatibility
  enrichStats(filters: GpacNodeData[]): void {
    this.process(filters);
  }
}

export const enrichedStatsWorkerService = new EnrichedStatsWorkerService();
