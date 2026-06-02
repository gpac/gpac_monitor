import { PID_SELECTION_COLORS } from '../../tabs/pid/utils/pidColors';

export const STATUS_METRIC_COLOR = PID_SELECTION_COLORS[0];

export const makeStatusValueFormatter =
  (unit?: string) =>
  (value: number): string => {
    const formatted = Number.isInteger(value)
      ? String(value)
      : value.toFixed(2);
    return unit ? `${formatted} ${unit}` : formatted;
  };
