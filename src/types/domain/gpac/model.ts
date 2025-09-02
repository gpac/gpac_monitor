import { Node, Edge, EdgeProps } from '@xyflow/react';
import { GpacArgument } from '../../../components/filtersArgs/types';





// MONITORING

export interface SessionFilterStatistics extends Record<string, unknown> {
  idx: number;
  status: string;
  bytes_done: number;
  bytes_sent: number;
  pck_sent: number;
  pck_done: number;
  time: number;
  nb_ipid: number;
  nb_opid: number;
}
export interface MonitoredFilterStats {
  idx: number;
  status: string;
  bytes_done: number;
  bytes_sent: number;
  pck_sent: number;
  pck_done: number;
  time: number;
  nb_ipid: number;
  nb_opid: number;
}
export interface EnrichedFilterOverview extends Record<string, unknown> {
  // STATIC GRAPH DATA
  name: string;
  type: string;
  idx: number;
  ID: string | null;
  itag: string | null;
  nb_ipid: number;
  nb_opid: number;
  tasks?: number;
  errors?: number;
  ipid: Record<string, PIDData>;
  opid: Record<string, PIDData>;
  gpac_args?: GpacArgument[];
  class?: string;
  codec?: string;
  streamtype?: string;
  last_ts_sent?: TimeFraction;

  // Dynamic session data (updated from SessionFilterStatistics)
  status: string;
  bytes_done: number;
  bytes_sent: number;
  pck_done: number;
  pck_sent: number;
  time: number;
}

export interface GpacNodeData extends EnrichedFilterOverview {}

export type GpacNode = Node<GpacNodeData>;
export interface CompleteFilterData extends Record<string, unknown> {
  name: string;
  type: string;
  idx: number;
  ID: string | null;
  itag: string | null;
  nb_ipid: number;
  nb_opid: number;
  status: string;
  bytes_done: number;
  bytes_sent: number;
  pck_sent: number;
  pck_done: number;
  time: number;
  tasks?: number;
  errors?: number;
  ipid: Record<string, PIDData>;
  opid: Record<string, PIDData>;
  gpac_args: GpacArgument[];
  class?: string;
  codec?: string;
  streamtype?: string;
  last_ts_sent?: TimeFraction;
}
export interface FilterMetadata {
  CodecID?: string;
  AvgFrameSize?: number;
  Bitrate?: number;
  ClockID?: number;
  Duration?: number;
  Extension?: string;
  Height?: number;
  Width?: number;
  ISOBrand?: string;
  Language?: string;
  MIMEType?: string;
  MovieTime?: number;
  MaxFrameSize?: number;
}


export interface PIDPropertyValue {
  type: string;
  val: number | string | TimeFraction;
}


export interface PIDData {
  // Direct properties from server
  buffer: number;
  buffer_total: number;
  source_idx?: number;

  // Properties stored as objects with type/val structure
  [key: string]: PIDPropertyValue | number | string | undefined;

  // Common decoded properties for convenience
  codec?: string;
  width?: number;
  height?: number;
  FPS?: string;
  samplerate?: number;
  channels?: number;
  format?: string;
}
export interface TimeFraction {
  num: number;
  den: number;
}


// GRAPH

export interface GraphFilterData {
  idx: number;
  name: string;
  type: string;
  status: string;
  itag: string | null;
  ID: string | null;
  nb_ipid: number;
  nb_opid: number;
  ipid: Record<string, { source_idx: number }>;
  opid: Record<string, {}>;
}
export type FilterType = 'video' | 'audio' | 'text' | 'image' | 'other';

export interface EdgeData extends Record<string, unknown> {
  id: string;
  source: string;
  target: string;
  filterType: FilterType;
  bufferPercentage: number;
  pidName: string;
}

export type GpacEdge = Edge<EdgeData>;

export interface GpacEdgeProps extends EdgeProps<EdgeData> {
  data: EdgeData;
}
