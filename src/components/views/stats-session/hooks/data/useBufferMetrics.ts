import { useMemo } from 'react';
import { BuffersTabData } from '@/types/domain/gpac/filter-stats';
import { formatBytes, formatBufferTime } from '@/utils/formatting';
import { getBufferHealthColor } from '@/utils/metrics';

export interface BufferInfo {
  name: string;
  sourceIdx?: string | number;
  buffer: number;
  bufferTotal: number;
  usage: number;
  health: {
    color: string;
    status: string;
    variant: 'default' | 'secondary' | 'destructive';
  };
  formattedBuffer: string;
  formattedBufferTotal: string;
  bufferTimeMs: string;
}

export interface BufferMetrics {
  processedBuffers: BufferInfo[];
  totalBufferInfo: {
    totalBuffer: number;
    totalCapacity: number;
    averageUsage: number;
  };
  hasBuffers: boolean;
}

export const useBufferMetrics = (data: BuffersTabData): BufferMetrics => {
  const { inputBuffers, totalBufferInfo } = data;

  // Process buffer information with health status
  const processedBuffers = useMemo(() => {
    return inputBuffers.map((info) => {
      const bufferTimeMs = info.buffer / 1000;
      const bufferHealth = getBufferHealthColor(bufferTimeMs);

      return {
        name: info.name,
        sourceIdx: info.sourceIdx,
        buffer: info.buffer,
        bufferTotal: info.bufferTotal,
        usage: info.usage,
        health: bufferHealth,
        formattedBuffer: formatBytes(info.buffer),
        formattedBufferTotal: formatBytes(info.bufferTotal),
        bufferTimeMs: formatBufferTime(info.buffer),
      };
    });
  }, [inputBuffers]);

  const hasBuffers = inputBuffers.length > 0;

  return {
    processedBuffers,
    totalBufferInfo,
    hasBuffers,
  };
};
