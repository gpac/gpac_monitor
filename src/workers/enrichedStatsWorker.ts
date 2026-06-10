import { GpacNodeData } from '@/types/domain/gpac/model';
import { parseFilterStatus, ParsedFilterStatus } from './filterStatusParser';
import type { MetricDefinitionMap } from './metricDefinitionParser';

export interface EnrichedFilterData extends GpacNodeData {
  parsedStatus: ParsedFilterStatus;
}

export interface EnrichStatsMessage {
  type: 'ENRICH_STATS';
  filters: GpacNodeData[];
  definitions?: MetricDefinitionMap;
}

export interface EnrichedStatsResponse {
  type: 'ENRICHED_STATS';
  enrichedFilters: EnrichedFilterData[];
}

const enrichedCache = new Map<string | number, EnrichedFilterData>();

export function enrichFilter(
  filter: GpacNodeData,
  definitions: MetricDefinitionMap | undefined,
  cache: Map<string | number, EnrichedFilterData>,
): EnrichedFilterData {
  const key = filter.idx ?? filter.ID ?? filter.name;
  const cached = cache.get(key);

  const parsedStatus = parseFilterStatus(filter.status ?? '', definitions);

  if (
    cached &&
    cached.idx === filter.idx &&
    cached.name === filter.name &&
    cached.status === filter.status &&
    cached.errors === filter.errors &&
    JSON.stringify(cached.parsedStatus.entries) ===
      JSON.stringify(parsedStatus.entries)
  ) {
    return cached;
  }

  const enriched: EnrichedFilterData = { ...filter, parsedStatus };
  cache.set(key, enriched);
  return enriched;
}

self.addEventListener('message', (event: MessageEvent<EnrichStatsMessage>) => {
  const { type, filters, definitions } = event.data;

  if (type === 'ENRICH_STATS') {
    const enrichedFilters = filters.map((filter) =>
      enrichFilter(filter, definitions, enrichedCache),
    );

    self.postMessage({
      type: 'ENRICHED_STATS',
      enrichedFilters,
    } as EnrichedStatsResponse);
  }
});

export default null;
