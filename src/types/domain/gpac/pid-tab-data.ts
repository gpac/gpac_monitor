import type { PIDproperties } from './filter-stats';

/**
 * Base PID data type (alias for PIDproperties)
 */
export type BasePIDData = PIDproperties;

/**
 * Input PID data for InputsTab display

 */
export interface InputPIDData extends BasePIDData {
  buffer: number;
  buffer_total?: number;
  max_buffer?: number;
  eos: boolean;
  playing: boolean | null;
  nb_pck_queued: number | null;

  // Present but not functionally used (inherited from PIDproperties)
  would_block: boolean | null;
}

/**
 * Output PID data for OutputsTab display
 *

 */
export interface OutputPIDData extends BasePIDData {
  would_block: boolean | null;

  // Essential output monitoring stats
  buffer: number;
  buffer_total?: number;
  max_buffer?: number;
  playing: boolean | null;
  nb_pck_queued: number | null;
}
