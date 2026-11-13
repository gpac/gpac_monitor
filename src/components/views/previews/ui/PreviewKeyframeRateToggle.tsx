import type { PreviewKeyframeRate } from '@/shared/store/slices/monitorConfigSlice';

const RATES: PreviewKeyframeRate[] = [10, 30];

interface PreviewKeyframeRateToggleProps {
  value: PreviewKeyframeRate;
  onChange: (rate: PreviewKeyframeRate) => void;
}

export function PreviewKeyframeRateToggle({
  value,
  onChange,
}: PreviewKeyframeRateToggleProps) {
  return (
    <div
      className="flex items-center gap-1 text-[0.786rem] text-monitor-text-muted"
      title="Applied to previews opened next"
    >
      <span>Keyframes/s</span>
      {RATES.map((rate) => (
        <button
          key={rate}
          type="button"
          aria-pressed={rate === value}
          onClick={() => onChange(rate)}
          className={`px-1 tabular-nums transition-colors ${
            rate === value ? 'text-info' : 'hover:text-info'
          }`}
        >
          {rate}
        </button>
      ))}
    </div>
  );
}
