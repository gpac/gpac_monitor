import type { GPACTypes } from './gpac_args';

/**
 * PID Property structure (same format as FilterArgument)
 * Represents a single property of a PID with its type and value
 */
type BinaryGpacType = 'mem' | 'cmem';

export type PidPropertyValue<T extends keyof GPACTypes> =
  T extends BinaryGpacType ? string | null : GPACTypes[T];

export interface PidProperty<T extends keyof GPACTypes = keyof GPACTypes> {
  name: string;
  type: T;
  value: PidPropertyValue<T>;
}

/**
 * Map of PID properties
 * Key: property name (e.g., "Width", "CodecID", "buffer")
 * Value: PidProperty with type and value
 */
export type PidPropsMap = Record<string, PidProperty>;

/**
 * Information about selected edge for Redux state
 * Used to identify which edge is selected and fetch its IPID properties
 */
export interface SelectedEdgeInfo {
  filterIdx: number; // Destination filter index
  ipidIdx: number; // Input PID index on destination filter
}
