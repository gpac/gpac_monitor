import { formatCompactTime } from '@/utils/formatting/time';

interface SessionTimeIndicatorProps {
  elapsedUs: number;
  durationUs: number;
  label?: string;
  className?: string;
}

const SessionTimeIndicator = ({
  elapsedUs,
  durationUs,
  label = 'Session time',
  className = '',
}: SessionTimeIndicatorProps) => (
  <div
    className={`flex flex-col items-start gap-0.5 px-3 py-1.5 2xl:px-4 2xl:py-2  border border-white/10 bg-white/[0.03] ${className}`}
  >
    <span className="text-xs 2xl:text-sm capitalize tracking-wide text-gray-500">
      {label}
    </span>
    <span className="flex items-baseline gap-1 font-mono tabular-nums">
      <span className="text-xl 2xl:text-3xl leading-none text-white">
        {formatCompactTime(elapsedUs)}
      </span>
      <span className="text-xs 2xl:text-base text-gray-400">
        / {formatCompactTime(durationUs)}
      </span>
    </span>
  </div>
);

export default SessionTimeIndicator;
