import { GpacNodeData } from '@/types/domain/gpac/model';
import {
  EnrichStatsMessage,
  EnrichedStatsResponse,
  EnrichedFilterData,
} from '@/workers/enrichedStatsWorker';
import type { MetricDefinitionMap } from '@/workers/metricDefinitionParser';
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

  private definitions: MetricDefinitionMap = {};

  setDefinitions(definitions: MetricDefinitionMap): void {
    this.definitions = definitions;
  }

  protected createMessage(filters: GpacNodeData[]): EnrichStatsMessage {
    return { type: 'ENRICH_STATS', filters, definitions: this.definitions };
  }

  enrichStats(filters: GpacNodeData[]): void {
    this.process(filters);
  }
}

export const enrichedStatsWorkerService = new EnrichedStatsWorkerService();
