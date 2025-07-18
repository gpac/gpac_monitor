import { Edge } from '@xyflow/react';
import { GpacNodeData } from '@/types/domain/gpac';
import { FilterType } from '@/types/domain/gpac';
import { formatProcessingRate } from '@/utils/filterMonitorUtils';

/**
 * Enum representing different levels of data throughput for visualization
 */
export enum ThroughputLevel {
  VERY_HIGH = 'very_high',
  HIGH = 'high',
  MEDIUM = 'medium',
  LOW = 'low',
  VERY_LOW = 'very_low',
}

/**
 * Interface for throughput metrics between connected filters
 */
export interface ThroughputMetric {
  sourceId: string;
  targetId: string;
  pidName: string;
  bytesPerSecond: number;
  level: ThroughputLevel;
  bufferPercentage?: number;
  filterType?: FilterType;
}

/**
 * Calculate a throughput level based on bytes per second rate
 */
export function calculateThroughputLevel(bytesPerSecond: number, filterType?: FilterType): ThroughputLevel {
  // If we have a filter type but no throughput data, make estimates based on media type
  if (bytesPerSecond === 0 && filterType) {
    switch (filterType) {
      case 'video':
        return ThroughputLevel.HIGH;
      case 'audio':
        return ThroughputLevel.MEDIUM;
      case 'text':
        return ThroughputLevel.LOW;
      case 'image':
        return ThroughputLevel.MEDIUM;
      default:
        return ThroughputLevel.MEDIUM;
    }
  }

  // Calculate level based on bytes per second (adjust thresholds as needed)
  if (bytesPerSecond > 5000000) return ThroughputLevel.VERY_HIGH;
  if (bytesPerSecond > 1000000) return ThroughputLevel.HIGH;
  if (bytesPerSecond > 100000) return ThroughputLevel.MEDIUM;
  if (bytesPerSecond > 10000) return ThroughputLevel.LOW;
  return ThroughputLevel.VERY_LOW;
}

/**
 * Extract throughput metrics for all connections in the graph
 */
export function extractThroughputMetrics(filters: GpacNodeData[]): ThroughputMetric[] {
  const metrics: ThroughputMetric[] = [];
  
  // Process each filter to extract connection metrics
  filters.forEach(filter => {
    if (!filter.ipid) return;
    
    // Examine each input PID to calculate throughput metrics
    Object.entries(filter.ipid).forEach(([pidName, pid]: [string, any]) => {
      if (pid.source_idx === undefined) return;
      
      const sourceId = pid.source_idx.toString();
      const targetId = filter.idx.toString();
      
      // Find source filter to get more data
      const sourceFilter = filters.find(f => f.idx.toString() === sourceId);
      if (!sourceFilter) return;
      
      // Try to calculate bytes per second based on available metrics
      let bytesPerSecond = 0;
      
      // If we have both byte counts and timestamps, we can calculate throughput
      if (filter.bytes_done && filter.last_ts && filter.start_ts) {
        const timeDiffSeconds = (filter.last_ts as number  - (filter.start_ts as number)) / 1000000; // Convert to seconds
        if (timeDiffSeconds > 0) {
          bytesPerSecond = filter.bytes_done / timeDiffSeconds;
        }
      } else if (pid.buffer && pid.buffer_total) {
        // If no direct throughput metrics, estimate from buffer usage
        const bufferRatio = pid.buffer / pid.buffer_total;
        // Higher buffer utilization often indicates higher throughput
        bytesPerSecond = bufferRatio * 1000000; // Just a heuristic estimate
      }
      
      // Determine filter type for the connection
      const filterType = determineConnectionType(sourceFilter, filter);
      
      // Calculate throughput level
      const level = calculateThroughputLevel(bytesPerSecond, filterType);
      
      // Calculate buffer percentage if data is available
      const bufferPercentage = pid.buffer_total > 0 
        ? (pid.buffer / pid.buffer_total) * 100 
        : undefined;
      
      // Add metric to results
      metrics.push({
        sourceId,
        targetId,
        pidName,
        bytesPerSecond,
        level,
        bufferPercentage,
        filterType
      });
    });
  });
  
  return metrics;
}

/**
 * Determine the type of connection between two filters
 */
function determineConnectionType(sourceFilter: GpacNodeData, targetFilter: GpacNodeData): FilterType {
  // Try to analyze PID properties to determine type
  const sourcePIDs = sourceFilter.opid || {};
  const sourceNames = Object.keys(sourcePIDs);
  
  for (const name of sourceNames) {
    const pid = sourcePIDs[name];
    
    // Check codec or format hints
    if (pid.codec) {
      const codec = pid.codec.toLowerCase();
      if (codec.includes('avc') || codec.includes('hevc') || codec.includes('vp9')) return 'video';
      if (codec.includes('aac') || codec.includes('opus') || codec.includes('mp3')) return 'audio';
      if (codec.includes('subt') || codec.includes('text')) return 'text';
    }
    
    // Check dimensions (presence of width/height usually indicates video)
    if (pid.width && pid.height) return 'video';
    
    // Check audio properties
    if (pid.samplerate || pid.channels) return 'audio';
  }
  
  // Fall back to source filter name analysis if we couldn't determine from PIDs
  const sourceName = sourceFilter.name.toLowerCase();
  const targetName = targetFilter.name.toLowerCase();
  
  if (sourceName.includes('video') || targetName.includes('video')) return 'video';
  if (sourceName.includes('audio') || targetName.includes('audio')) return 'audio';
  if (sourceName.includes('text') || targetName.includes('text') || 
      sourceName.includes('subt') || targetName.includes('subt')) return 'text';
  if (sourceName.includes('image') || targetName.includes('image')) return 'image';
  
  return 'other';
}

/**
 * Enhance edges with throughput data from metrics
 */
export function enhanceEdgesWithThroughput(edges: Edge[], metrics: ThroughputMetric[]): Edge[] {
  return edges.map(edge => {
    // Find matching metric for this edge
    const metric = metrics.find(
      m => m.sourceId === edge.source && m.targetId === edge.target
    );
    
    if (!metric) return edge;
    
    // Format throughput using the existing utility function
    const formattedThroughput = formatProcessingRate(metric.bytesPerSecond);
    
    // Enhance edge with throughput data
    return {
      ...edge,
      animated: true, // Ensure animation is enabled
      data: {
        ...edge.data,
        throughput: metric.bytesPerSecond / 1024, // Legacy format (KB/s) for backward compatibility
        formattedThroughput, // Add the formatted throughput with appropriate units
        throughputLevel: metric.level,
        bufferPercentage: metric.bufferPercentage,
        filterType: metric.filterType,
        pidName: metric.pidName
      }
    };
  });
}