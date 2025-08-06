import { EnrichedFilterOverview } from '@/types/domain/gpac/model';
import { OverviewTabData, BuffersTabData, TabPIDData, NetworkTabData } from '@/types/domain/gpac/filter-stats';
import { getBufferProgressColor } from '@/utils/helper';

export interface FilterTabsData {
  overviewData: OverviewTabData;
  networkData: NetworkTabData;
  buffersData: BuffersTabData;
  inputPids: TabPIDData[];
  outputPids: TabPIDData[];
}

/**
 * Transform EnrichedFilterOverview to the new specific tab data types
 */
export function transformFilterToTabsData(filter: EnrichedFilterOverview): FilterTabsData {
  const overviewData: OverviewTabData = {
    idx: filter.idx,
    name: filter.name,
    type: filter.type,
    status: filter.status,
    tasks: filter.tasks,
    time: filter.time,
    pck_done: filter.pck_done,
    pck_sent: filter.pck_sent,
    pck_ifce_sent: (filter as any).pck_ifce_sent,
    bytes_done: filter.bytes_done,
    bytes_sent: filter.bytes_sent,
    nb_ipid: filter.nb_ipid,
    nb_opid: filter.nb_opid
  };

  const networkData: NetworkTabData = {
    bytesSent: filter.bytes_sent || 0,
    bytesReceived: filter.bytes_done || 0,
    packetsSent: filter.pck_sent || 0,
    packetsReceived: filter.pck_done || 0
  };

  const buffersData: BuffersTabData = (() => {
    if (!filter.ipid || Object.keys(filter.ipid).length === 0) {
      return {
        name: filter.name,
        inputBuffers: [],
        totalBufferInfo: { totalBuffer: 0, totalCapacity: 0, averageUsage: 0 }
      };
    }

    const inputBuffers = Object.entries(filter.ipid).map(([pidName, pidData]) => {
      const bufferUsage = pidData.buffer_total > 0 
        ? (pidData.buffer / pidData.buffer_total) * 100 
        : 0;
      
      return {
        name: pidName,
        buffer: pidData.buffer,
        bufferTotal: pidData.buffer_total,
        usage: bufferUsage,
        color: getBufferProgressColor(bufferUsage),
        sourceIdx: pidData.source_idx
      };
    });

    const totalBuffer = inputBuffers.reduce((sum, info) => sum + info.buffer, 0);
    const totalCapacity = inputBuffers.reduce((sum, info) => sum + info.bufferTotal, 0);
    const averageUsage = inputBuffers.length > 0 
      ? inputBuffers.reduce((sum, info) => sum + info.usage, 0) / inputBuffers.length 
      : 0;

    return {
      name: filter.name,
      inputBuffers,
      totalBufferInfo: { totalBuffer, totalCapacity, averageUsage }
    };
  })();

  const inputPids: TabPIDData[] = !filter.ipid ? [] : Object.entries(filter.ipid).map(([name, data]) => ({
    name,
    buffer: data.buffer,
    buffer_total: data.buffer_total,
    source_idx: data.source_idx,
    codec: (data as any).Codec?.val || (data as any).codec,
    width: (data as any).Width?.val,
    height: (data as any).Height?.val,
    fps: (data as any).FPS?.val,
    samplerate: (data as any).SampleRate?.val,
    channels: (data as any).Channels?.val,
    format: (data as any).StreamFormat?.val,
    bitrate: (data as any).Bitrate?.val,
    duration: (data as any).Duration?.val,
    parentFilter: {
      name: filter.name,
      codec: filter.codec,
      status: filter.status,
      pck_done: filter.pck_done,
      bytes_done: filter.bytes_done,
      pck_sent: filter.pck_sent,
      time: filter.time
    }
  }));

  const outputPids: TabPIDData[] = !filter.opid ? [] : Object.entries(filter.opid).map(([name, data]) => ({
    name,
    buffer: data.buffer || 0,
    buffer_total: data.buffer_total || 0,
    source_idx: data.source_idx,
    codec: (data as any).Codec?.val || (data as any).codec,
    width: (data as any).Width?.val,
    height: (data as any).Height?.val,
    fps: (data as any).FPS?.val,
    samplerate: (data as any).SampleRate?.val,
    channels: (data as any).Channels?.val,
    format: (data as any).StreamFormat?.val,
    bitrate: (data as any).Bitrate?.val,
    duration: (data as any).Duration?.val,
    parentFilter: {
      name: filter.name,
      codec: filter.codec,
      status: filter.status,
      pck_done: filter.pck_done,
      bytes_done: filter.bytes_done,
      pck_sent: filter.pck_sent,
      time: filter.time
    }
  }));

  return {
    overviewData,
    networkData,
    buffersData,
    inputPids,
    outputPids
  };
}