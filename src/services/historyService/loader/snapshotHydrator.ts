import type { AppDispatch } from '@/shared/store';
import { updateGraphData, setLoading } from '@/shared/store/slices/graphSlice';
import { resetAllData } from '@/shared/store/slices/monitoredFilterSlice';
import { resetBandwidthReplay } from '../replay/bandwidthReplay';
import {
  setCommandLine,
  clearSessionDetails,
} from '@/shared/store/slices/sessionDetailsSlice';
import {
  updateSessionStats,
  setFilterPids,
} from '@/shared/store/slices/sessionStatsSlice';
import { hydrateFilterArgs } from '@/shared/store/slices/filterArgumentSlice';
import type {
  SessionFilterStats,
  FilterPids,
} from '@/shared/store/slices/sessionStatsSlice';
import type { GraphFilterData } from '@/types/domain/gpac/model';
import type { PIDproperties } from '@/types/domain/gpac/filter-stats';
import type { GpacArgument } from '@/types/domain/gpac/gpac_args';
import type { HistorySnapshot, HistoryFilter } from '../types';
import { GpacStreamType } from '@/types';

export function toGraphFilterData(f: HistoryFilter): GraphFilterData {
  const ipid: GraphFilterData['ipid'] = {};
  const opid: GraphFilterData['opid'] = {};

  if (f.ipids) {
    for (const [name, pid] of Object.entries(f.ipids)) {
      const p = pid as PIDproperties & { stream_type?: GpacStreamType };
      ipid[name] = {
        source_idx: p.source_idx ?? 0,
        stream_type: p.stream_type ?? p.type,
      };
    }
  }

  if (f.opids) {
    for (const [name, pid] of Object.entries(f.opids)) {
      const p = pid as PIDproperties & { stream_type?: GpacStreamType };
      opid[name] = {
        stream_type: p.stream_type ?? p.type,
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

function toSessionFilterStats(f: HistoryFilter): SessionFilterStats {
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

export function buildPidsByFilter(
  filters: HistoryFilter[],
): Record<string, FilterPids> {
  const result: Record<string, FilterPids> = {};
  for (const f of filters) {
    if (f.ipids || f.opids) {
      result[f.idx.toString()] = { ipids: f.ipids, opids: f.opids };
    }
  }
  return result;
}

export function buildArgsByFilter(
  filters: HistoryFilter[],
): Record<string, GpacArgument[]> {
  const result: Record<string, GpacArgument[]> = {};
  for (const f of filters) {
    if (f.gpac_args) {
      result[f.idx.toString()] = f.gpac_args;
    }
  }
  return result;
}

export function hydrateFromSnapshot(
  snapshot: HistorySnapshot,
  dispatch: AppDispatch,
  sessionStartUs = 0,
): void {
  // Reset per-session state before replaying a new history session
  resetBandwidthReplay(sessionStartUs);
  dispatch(resetAllData());
  dispatch(clearSessionDetails());

  dispatch(updateGraphData(snapshot.filters.map(toGraphFilterData)));
  dispatch(setCommandLine(snapshot.command_line));
  dispatch(updateSessionStats(snapshot.filters.map(toSessionFilterStats)));
  dispatch(setFilterPids(buildPidsByFilter(snapshot.filters)));
  dispatch(hydrateFilterArgs(buildArgsByFilter(snapshot.filters)));
  dispatch(setLoading(false));
}
