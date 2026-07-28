import type { GraphFilterData } from '@/types/domain/gpac/model';
import type { GpacArgument } from '@/types/domain/gpac/gpac_args';
import type {
  SessionFilterStats,
  FilterPids,
} from '@/shared/store/slices/sessionStatsSlice';
import type { HistoryFilter } from '../types';

export function toGraphFilterData(f: HistoryFilter): GraphFilterData {
  return {
    idx: f.idx,
    name: f.name,
    type: f.type,
    status: f.status,
    itag: f.itag ?? null,
    ID: f.ID ?? null,
    nb_ipid: f.nb_ipid,
    nb_opid: f.nb_opid,
    ipid: f.ipids ?? [],
    opid: f.opids ?? [],
  };
}

export function toSessionFilterStats(f: HistoryFilter): SessionFilterStats {
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
    is_eos: false,
  };
}

export function buildPidsByFilter(
  filters: HistoryFilter[],
): Record<string, FilterPids> {
  const result: Record<string, FilterPids> = {};
  for (const f of filters) {
    const ipids = f.properties?.ipids;
    const opids = f.properties?.opids;
    if (ipids || opids) {
      result[f.idx.toString()] = { ipids, opids };
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
