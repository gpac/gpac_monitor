import { memo } from 'react';
import { LuX } from 'react-icons/lu';
import { useAppDispatch, useAppSelector } from '@/shared/hooks/redux';
import { selectSelectedPidTargets } from '@/shared/store/selectors';
import { toggleSelectedPid } from '@/shared/store/slices/monitoredFilterSlice';
import { PID_SELECTION_COLORS } from './utils/pidColors';
import type { PIDGraphTarget } from '../../../types/pid';

interface PIDChipProps {
  target: PIDGraphTarget;
  color: string;
  onRemove: () => void;
  onHover: (active: boolean) => void;
}

const PIDChip = ({ target, color, onRemove, onHover }: PIDChipProps) => {
  const label = target.streamTypeLabel
    ? `${target.streamTypeLabel}·${target.pidIndex}`
    : `#${target.pidIndex}`;

  return (
    <div
      className="flex items-center gap-1 px-1.5 py-0.5 rounded text-xs border cursor-default transition-colors"
      style={{ borderColor: `${color}60`, background: `${color}15` }}
      onMouseEnter={() => onHover(true)}
      onMouseLeave={() => onHover(false)}
    >
      <span
        className="w-3 h-0.5 rounded-full flex-shrink-0"
        style={{ background: color }}
      />
      <span className="font-mono font-medium" style={{ color }}>
        {label}
      </span>
      <button
        onClick={onRemove}
        className="text-muted-foreground hover:text-white transition-colors focus:outline-none"
        title="Deselect PID"
      >
        <LuX className="h-2.5 w-2.5" />
      </button>
    </div>
  );
};

interface PIDChipsStripProps {
  onHoverPid: (key: string | null) => void;
}

const PIDChipsStrip = memo(({ onHoverPid }: PIDChipsStripProps) => {
  const dispatch = useAppDispatch();
  const targets = useAppSelector(selectSelectedPidTargets);

  if (targets.length === 0) return null;

  return (
    <div className="flex flex-wrap gap-1">
      {targets.map((target, index) => {
        const pidKey = `${target.filterIdx}:${target.direction}:${target.pidIndex}`;
        return (
          <PIDChip
            key={pidKey}
            target={target}
            color={PID_SELECTION_COLORS[index]}
            onRemove={() => dispatch(toggleSelectedPid(target))}
            onHover={(active) => onHoverPid(active ? pidKey : null)}
          />
        );
      })}
    </div>
  );
});

PIDChipsStrip.displayName = 'PIDChipsStrip';

export default PIDChipsStrip;
