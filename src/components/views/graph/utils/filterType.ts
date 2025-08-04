import { GraphFilterData, EnrichedFilterOverview } from '@/types/domain/gpac';

export type FilterSessionType = 'source' | 'sink' | 'filter';

export function determineFilterSessionType(
  filter: GraphFilterData | EnrichedFilterOverview
): FilterSessionType {
  const hasInputs = filter.nb_ipid > 0;
  const hasOutputs = filter.nb_opid > 0;
  
  if (!hasInputs && hasOutputs) {
    return 'source';
  }
  
  if (hasInputs && !hasOutputs) {
    return 'sink';
  }
  
  return 'filter';
}

export function isSource(filter: GraphFilterData | EnrichedFilterOverview): boolean {
  return determineFilterSessionType(filter) === 'source';
}

export function isSink(filter: GraphFilterData | EnrichedFilterOverview): boolean {
  return determineFilterSessionType(filter) === 'sink';
}

export function isFilter(filter: GraphFilterData | EnrichedFilterOverview): boolean {
  return determineFilterSessionType(filter) === 'filter';
}