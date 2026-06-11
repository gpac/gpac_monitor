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

  // Dynamic session fields must be compared too: a filter whose status string
  // never changes would otherwise be served from cache with frozen stats.
  if (
    cached &&
    cached.idx === filter.idx &&
    cached.name === filter.name &&
    cached.status === filter.status &&
    cached.errors === filter.errors &&
    cached.bytes_done === filter.bytes_done &&
    cached.bytes_sent === filter.bytes_sent &&
    cached.pck_done === filter.pck_done &&
    cached.pck_sent === filter.pck_sent &&
    cached.time === filter.time &&
    cached.is_eos === filter.is_eos &&
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
