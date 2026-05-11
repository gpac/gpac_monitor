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

const PIDChip = ({ target, color, onRemove, onHover }: PIDChipProps) => (
  <div
    className="flex items-center gap-1 px-2 py-0.5 rounded-full text-xs bg-white/5 border cursor-default"
    style={{ borderColor: `${color}60` }}
    onMouseEnter={() => onHover(true)}
    onMouseLeave={() => onHover(false)}
  >
    <span
      className="w-2 h-2 rounded-full flex-shrink-0"
      style={{ background: color }}
    />
    <span className="text-muted-foreground truncate max-w-[120px]">
      {target.label ?? `PID ${target.pidIndex}`}
    </span>
    <button
      onClick={onRemove}
      className="ml-0.5 text-muted-foreground hover:text-white transition-colors focus:outline-none"
      title="Deselect PID"
    >
      <LuX className="h-3 w-3" />
    </button>
  </div>
);

interface PIDChipsStripProps {
  onHoverPid: (key: string | null) => void;
}

const PIDChipsStrip = memo(({ onHoverPid }: PIDChipsStripProps) => {
  const dispatch = useAppDispatch();
  const targets = useAppSelector(selectSelectedPidTargets);

  if (targets.length === 0) return null;

  return (
    <div className="flex flex-wrap gap-1.5 px-2 py-1.5 border-b border-white/5">
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
