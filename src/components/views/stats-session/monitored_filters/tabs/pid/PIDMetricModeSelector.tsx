import { cn } from '@/utils/core';
import type { PIDMetricMode } from '../../../types/pid';

const MODES: { value: PIDMetricMode; label: string }[] = [
  { value: 'buffer', label: 'Buffer' },
  { value: 'bitrate', label: 'Avg Bitrate' },
  { value: 'processTime', label: 'Proc.' },
  { value: 'processRate', label: 'Proc. Rate' },
  { value: 'ts', label: 'TS' },
];

interface PIDMetricModeSelectorProps {
  mode: PIDMetricMode;
  onChange: (mode: PIDMetricMode) => void;
}

const PIDMetricModeSelector = ({
  mode,
  onChange,
}: PIDMetricModeSelectorProps) => (
  <div className="flex gap-0.5 p-0.5 bg-white/5 rounded-md">
    {MODES.map(({ value, label }) => (
      <button
        key={value}
        onClick={() => onChange(value)}
        className={cn(
          'px-2 py-0.5 text-xs rounded transition-colors',
          mode === value
            ? 'bg-white/15 text-white'
            : 'text-muted-foreground hover:text-white',
        )}
      >
        {label}
      </button>
    ))}
  </div>
);

export default PIDMetricModeSelector;
