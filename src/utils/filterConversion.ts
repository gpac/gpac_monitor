import { GraphFilterData, EnrichedFilterOverview, PIDData, SessionFilterStatistics } from '@/types/domain/gpac';
import { SessionFilterStats } from '@/shared/store/slices/sessionStatsSlice';

/**
 * Converts GraphFilterData to EnrichedFilterOverview by adding missing properties
 * and merging with optional session statistics
 */
export function convertGraphFilterToEnriched(
  graphFilter: GraphFilterData,
  sessionStats?: SessionFilterStats
): EnrichedFilterOverview {
  // Convert ipid from simple structure to PIDData structure
  const enrichedIpid: Record<string, PIDData> = Object.fromEntries(
    Object.entries(graphFilter.ipid).map(([key, value]) => [
      key, 
      { 
        ...value, 
        buffer: 0, 
        buffer_total: 0 
      } as PIDData
    ])
  );

  // Convert opid from simple structure to PIDData structure
  const enrichedOpid: Record<string, PIDData> = Object.fromEntries(
    Object.entries(graphFilter.opid).map(([key, value]) => [
      key, 
      { 
        ...value, 
        buffer: 0, 
        buffer_total: 0 
      } as PIDData
    ])
  );

  return {
    // Static data from GraphFilterData
    name: graphFilter.name,
    type: graphFilter.type,
    idx: graphFilter.idx,
    nb_ipid: graphFilter.nb_ipid,
    nb_opid: graphFilter.nb_opid,
    ipid: enrichedIpid,
    opid: enrichedOpid,
    tasks: (graphFilter as any).tasks || 0,
    itag: graphFilter.itag,
    ID: graphFilter.ID,
    errors: (graphFilter as any).errors || 0,
    
    // Dynamic data (session statistics if available, otherwise defaults)
    status: sessionStats?.status || graphFilter.status,
    bytes_done: sessionStats?.bytes_done || (graphFilter as any).bytes_done || 0,
    bytes_sent: sessionStats?.bytes_sent || (graphFilter as any).bytes_sent || 0,
    pck_done: sessionStats?.pck_done || (graphFilter as any).pck_done || 0,
    pck_sent: sessionStats?.pck_sent || (graphFilter as any).pck_sent || 0,
    time: sessionStats?.time || (graphFilter as any).time || 0,
  };
}

/**
 * Converts multiple GraphFilterData to EnrichedFilterOverview array
 */
export function convertGraphFiltersToEnriched(
  graphFilters: GraphFilterData[],
  sessionStats: Record<string, SessionFilterStats> | SessionFilterStatistics[] = {}
): EnrichedFilterOverview[] {
  return graphFilters.map(graphFilter => {
    let matchingSessionStats: SessionFilterStats | undefined;
    
    if (Array.isArray(sessionStats)) {
      // Find matching SessionFilterStatistics by idx
      matchingSessionStats = sessionStats.find(
        filterStat => filterStat.idx === graphFilter.idx
      );
    } else {
      // Find matching SessionFilterStats in Record
      matchingSessionStats = Object.values(sessionStats).find(
        filterStat => filterStat.idx === graphFilter.idx
      );
    }
    
    return convertGraphFilterToEnriched(graphFilter, matchingSessionStats);
  });
}