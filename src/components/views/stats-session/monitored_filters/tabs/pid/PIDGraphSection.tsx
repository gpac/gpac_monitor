import { memo, useState } from 'react';
import { useAppSelector } from '@/shared/hooks/redux';
import { selectSelectedPidTargets } from '@/shared/store/selectors';
import type { PIDMetricMode } from '../../../types/pid';
import PIDChipsStrip from './PIDChipsStrip';
import PIDMetricModeSelector from './PIDMetricModeSelector';
import PIDGraphPanel from './PIDGraphPanel';

interface PIDGraphSectionProps {
  onHoverPid: (key: string | null) => void;
}

const PIDGraphSection = memo(({ onHoverPid }: PIDGraphSectionProps) => {
  const [mode, setMode] = useState<PIDMetricMode>('bitrate');
  const targets = useAppSelector(selectSelectedPidTargets);

  if (targets.length === 0) return null;

  return (
    <div className="flex flex-col border border-white/5 rounded-md">
      <div className="flex items-center justify-between gap-2 px-2 py-1.5 border-b border-white/5">
        <PIDChipsStrip onHoverPid={onHoverPid} />
        <PIDMetricModeSelector mode={mode} onChange={setMode} />
      </div>
      <PIDGraphPanel mode={mode} />
    </div>
  );
});

PIDGraphSection.displayName = 'PIDGraphSection';

export default PIDGraphSection;
