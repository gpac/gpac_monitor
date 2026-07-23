import {
  parseFilterStatus,
  ParsedFilterStatus,
} from '@/utils/metrics/filterStatusParser';
import type { MetricDefinitionMap } from '@/utils/metrics/metricDefinitionParser';

export interface FilterStatusInput {
  idx: number;
  status?: string;
}

export interface ParsedStatusEntry {
  filterIdx: number;
  parsedStatus: ParsedFilterStatus;
}

export function extractParsedStatuses(
  entries: FilterStatusInput[],
  definitions?: MetricDefinitionMap,
): ParsedStatusEntry[] {
  return entries.map((entry) => ({
    filterIdx: entry.idx,
    parsedStatus: parseFilterStatus(entry.status ?? '', definitions),
  }));
}
