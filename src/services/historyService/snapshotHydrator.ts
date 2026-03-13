import type { AppDispatch } from '@/shared/store';
import { updateGraphData, setLoading } from '@/shared/store/slices/graphSlice';
import { setCommandLine } from '@/shared/store/slices/sessionDetailsSlice';
import { updateSessionStats } from '@/shared/store/slices/sessionStatsSlice';
import type { SessionFilterStats } from '@/shared/store/slices/sessionStatsSlice';
import type { GraphFilterData } from '@/types/domain/gpac/model';
import type { PIDproperties } from '@/types/domain/gpac/filter-stats';
import type { HistorySnapshot, HistorySnapshotFilter } from './types';

function toGraphFilterData(f: HistorySnapshotFilter): GraphFilterData {
  const ipid: GraphFilterData['ipid'] = {};
  const opid: GraphFilterData['opid'] = {};

  if (f.ipids) {
    for (const [name, pid] of Object.entries(f.ipids)) {
      ipid[name] = {
        source_idx: (pid as PIDproperties).source_idx ?? 0,
        stream_type: (pid as PIDproperties).type,
      };
    }
  }

  if (f.opids) {
    for (const [name, pid] of Object.entries(f.opids)) {
      opid[name] = {
        stream_type: (pid as PIDproperties).type,
      };
    }
  }

  return {
    idx: f.idx,
    name: f.name,
    type: f.type,
    status: f.status,
    itag: f.itag ?? null,
    ID: f.ID ?? null,
    nb_ipid: f.nb_ipid,
    nb_opid: f.nb_opid,
    ipid,
    opid,
  };
}

function toSessionFilterStats(f: HistorySnapshotFilter): SessionFilterStats {
  return {
    idx: f.idx,
    status: f.status,
    bytes_done: (f.bytes_done as number) ?? 0,
    bytes_sent: (f.bytes_sent as number) ?? 0,
    pck_sent: (f.pck_sent as number) ?? 0,
    pck_done: (f.pck_done as number) ?? 0,
    time: (f.time as number) ?? 0,
    nb_ipid: f.nb_ipid,
    nb_opid: f.nb_opid,
  };
}

export function hydrateFromSnapshot(
  snapshot: HistorySnapshot,
  dispatch: AppDispatch,
): Map<number, HistorySnapshotFilter> {
  const graphData = snapshot.filters.map(toGraphFilterData);
  dispatch(updateGraphData(graphData));
  dispatch(setCommandLine(snapshot.command_line));
  dispatch(updateSessionStats(snapshot.filters.map(toSessionFilterStats)));
  dispatch(setLoading(false));

  return new Map(snapshot.filters.map((f) => [f.idx, f]));
}
