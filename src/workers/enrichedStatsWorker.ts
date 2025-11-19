import { GpacNodeData } from '@/types/domain/gpac/model';

// Lightweight versions of utility functions
const calculateBufferUsage = (ipid: Record<string, any> = {}): number => {
  const pidEntries = Object.values(ipid);
  if (pidEntries.length === 0) return 0;

  const totalBuffer = pidEntries.reduce(
    (sum, pid) => sum + (pid.buffer || 0),
    0,
  );
  const totalMaxBuffer = pidEntries.reduce(
    (sum, pid) => sum + (pid.max_buffer || 0),
    0,
  );

  if (totalMaxBuffer === 0) return 0;
  return Math.min(100, Math.round((totalBuffer / totalMaxBuffer) * 100));
};

// Calculate packet rate (packets per second)
const calculatePacketRate = (
  pckDone: number = 0,
  timeUs: number = 0,
): number => {
  if (timeUs <= 0) return 0;
  const timeSeconds = timeUs / 1_000_000;
  return Math.round(pckDone / timeSeconds);
};

// Activity level based on byte rate (real data throughput)
// Thresholds to adjust based on actual streaming context
const getActivityLevel = (
  bytesDone: number = 0,
  elapsedMs: number = 0,
): string => {
  if (elapsedMs <= 0) return 'idle';

  const elapsedSeconds = elapsedMs / 1000;
  const byteRate = bytesDone / elapsedSeconds; // bytes per second

  const BYTE_RATE_IDLE = 100_000; // ~0.8 Mbps
  const BYTE_RATE_LOW = 1_000_000; // ~8 Mbps
  const BYTE_RATE_MEDIUM = 5_000_000; // ~40 Mbps

  if (byteRate < BYTE_RATE_IDLE) return 'idle';
  if (byteRate < BYTE_RATE_LOW) return 'low';
  if (byteRate < BYTE_RATE_MEDIUM) return 'medium';
  return 'high';
};

const getActivityColorClass = (activityLevel: string): string => {
  switch (activityLevel) {
    case 'high':
      return 'bg-danger';
    case 'medium':
      return 'bg-info';
    case 'low':
      return 'bg-warning';
    default:
      return 'bg-slate-500/50';
  }
};

const getActivityLabel = (activityLevel: string): string => {
  switch (activityLevel) {
    case 'high':
      return 'High';
    case 'medium':
      return 'Medium';
    case 'low':
      return 'Low';
    default:
      return 'Idle';
  }
};

const determineFilterSessionType = (filter: GpacNodeData): string => {
  const hasInputs = filter.nb_ipid && filter.nb_ipid > 0;
  const hasOutputs = filter.nb_opid && filter.nb_opid > 0;

  if (!hasInputs && hasOutputs) return 'source';
  if (hasInputs && !hasOutputs) return 'sink';
  return 'process';
};

const formatBytes = (bytes: number = 0): string => {
  if (bytes === 0) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${(bytes / Math.pow(k, i)).toFixed(2)} ${sizes[i]}`;
};

const formatTime = (ms: number = 0): string => {
  if (ms === 0) return '0ms';
  if (ms < 1000) return `${ms}ms`;
  const seconds = ms / 1000;
  if (seconds < 60) return `${seconds.toFixed(1)}s`;
  const minutes = Math.floor(seconds / 60);
  const remainingSeconds = Math.floor(seconds % 60);
  return `${minutes}m ${remainingSeconds}s`;
};

const formatNumber = (num: number = 0): string => {
  if (num < 1000) return num.toString();
  if (num < 1000000) return `${(num / 1000).toFixed(1)}K`;
  return `${(num / 1000000).toFixed(1)}M`;
};

const formatPacketRate = (rate: number): string => {
  if (rate === 0) return '0 pkt/s';
  if (rate < 1000) return `${rate} pkt/s`;
  return `${(rate / 1000).toFixed(1)}K pkt/s`;
};

// Enriched filter data with pre-computed values
export interface EnrichedFilterData extends GpacNodeData {
  computed: {
    bufferUsage: number;
    activityLevel: string;
    activityColor: string;
    activityLabel: string;
    sessionType: string;
    formattedBytes: string;
    formattedTime: string;
    formattedPackets: string;
    // Real-time performance metric
    packetRate: number;
    formattedPacketRate: string;
  };
}

export interface EnrichStatsMessage {
  type: 'ENRICH_STATS';
  filters: GpacNodeData[];
}

export interface EnrichedStatsResponse {
  type: 'ENRICHED_STATS';
  enrichedFilters: EnrichedFilterData[];
}

// Cache for enriched filters to prevent unnecessary re-creation
const enrichedCache = new Map<string | number, EnrichedFilterData>();

// Process incoming filters and enrich them
self.addEventListener('message', (event: MessageEvent<EnrichStatsMessage>) => {
  const { type, filters } = event.data;

  if (type === 'ENRICH_STATS') {
    const enrichedFilters: EnrichedFilterData[] = filters.map((filter) => {
      const key = filter.idx ?? filter.ID ?? filter.name;
      const cached = enrichedCache.get(key);

      const bufferUsage = calculateBufferUsage(filter.ipid);
      const activityLevel = getActivityLevel(filter.bytes_done, filter.time);
      const sessionType = determineFilterSessionType(filter);
      const formattedBytes = formatBytes(filter.bytes_done);
      const formattedTime = formatTime(filter.time);
      const formattedPackets = formatNumber(filter.pck_done);
      const activityColor = getActivityColorClass(activityLevel);
      const activityLabel = getActivityLabel(activityLevel);

      // Real-time performance metric
      const packetRate = calculatePacketRate(filter.pck_done, filter.time);
      const formattedPacketRate = formatPacketRate(packetRate);

      // Check if computed values changed
      if (
        cached &&
        cached.idx === filter.idx &&
        cached.name === filter.name &&
        cached.errors === filter.errors &&
        cached.computed.bufferUsage === bufferUsage &&
        cached.computed.activityLevel === activityLevel &&
        cached.computed.activityColor === activityColor &&
        cached.computed.activityLabel === activityLabel &&
        cached.computed.sessionType === sessionType &&
        cached.computed.formattedBytes === formattedBytes &&
        cached.computed.formattedTime === formattedTime &&
        cached.computed.formattedPackets === formattedPackets &&
        cached.computed.packetRate === packetRate &&
        cached.computed.formattedPacketRate === formattedPacketRate
      ) {
        // Return cached object to maintain reference equality
        return cached;
      }

      // Create new enriched object only if data changed
      const enriched: EnrichedFilterData = {
        ...filter,
        computed: {
          bufferUsage,
          activityLevel,
          activityColor,
          activityLabel,
          sessionType,
          formattedBytes,
          formattedTime,
          formattedPackets,
          packetRate,
          formattedPacketRate,
        },
      };

      enrichedCache.set(key, enriched);
      return enriched;
    });

    self.postMessage({
      type: 'ENRICHED_STATS',
      enrichedFilters,
    } as EnrichedStatsResponse);
  }
});

export default null;
