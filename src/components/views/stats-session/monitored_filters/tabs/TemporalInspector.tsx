import { memo } from 'react';
import { useAppSelector } from '@/shared/hooks/redux';
import { selectSelectedPidTargets } from '@/shared/store/selectors';
import PIDChipsStrip from './pid/PIDChipsStrip';

interface TemporalInspectorProps {
  onHoverPid: (key: string | null) => void;
}

const TemporalInspector = memo(({ onHoverPid }: TemporalInspectorProps) => {
  const targets = useAppSelector(selectSelectedPidTargets);

  return (
    <div className="flex flex-col border border-white/5 rounded-md min-h-[200px]">
      {targets.length === 0 ? (
        <div className="flex-1 flex items-center justify-center text-xs text-muted-foreground/30 select-none">
          Select a PID to inspect
        </div>
      ) : (
        <>
          <PIDChipsStrip onHoverPid={onHoverPid} />
          <div className="flex-1 flex items-center justify-center text-xs text-muted-foreground/30 select-none">
            Graph — T9
          </div>
        </>
      )}
    </div>
  );
});

TemporalInspector.displayName = 'TemporalInspector';

export default TemporalInspector;
