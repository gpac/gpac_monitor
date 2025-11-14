import { FilterType, GraphFilterData } from '@/types/domain/gpac';

/**
 * Determine filter type based on PID stream types
 * Extracted from GraphOperations for reusability
 */
const determineFilterType = (filter: GraphFilterData): FilterType => {
  // Use server-provided stream_type from PIDs for robust typing
  const streamTypes = new Set<string>();

  // Collect stream types from output PIDs
  if (filter.opid) {
    Object.values(filter.opid).forEach((pid) => {
      if (pid.stream_type) streamTypes.add(pid.stream_type.toLowerCase());
    });
  }

  // Fallback to input PIDs if no output
  if (streamTypes.size === 0 && filter.ipid) {
    Object.values(filter.ipid).forEach((pid) => {
      if (pid.stream_type) streamTypes.add(pid.stream_type.toLowerCase());
    });
  }

  // Map GPAC stream types to UI filter types
  if (streamTypes.has('visual')) return 'video';
  if (streamTypes.has('audio')) return 'audio';
  if (streamTypes.has('text')) return 'text';
  if (streamTypes.has('file')) return 'file';
  return 'file';
};

export { determineFilterType };
