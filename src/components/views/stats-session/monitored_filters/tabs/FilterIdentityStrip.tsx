import { memo } from 'react';
import { LuSettings } from 'react-icons/lu';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { formatTime } from '@/utils/formatting';
import type { HealthInfo } from '../utils/statusHelpers';

interface FilterIdentityStripProps {
  type: string;
  idx: number;
  time: number;
  healthLabel: string;
  healthVariant: HealthInfo['variant'];
  onOpenProperties?: () => void;
}

const FilterIdentityStrip = memo(
  ({
    type,
    idx,
    time,
    healthLabel,
    healthVariant,
    onOpenProperties,
  }: FilterIdentityStripProps) => (
    <div className="flex items-center gap-2 px-3 py-2 bg-monitor-panel/40 rounded border-b border-monitor-line/10 text-xs shrink-0">
      {onOpenProperties && (
        <Button
          variant="outline"
          size="sm"
          onClick={onOpenProperties}
          className="h-6 px-1.5 py-0"
          title="Display filter arguments"
        >
          <LuSettings className="h-3.5 w-3.5" />
        </Button>
      )}
      <span className="font-medium text-muted-foreground">
        [{type || 'unknown'}]
      </span>
      <Badge variant={healthVariant} className="text-xs py-0 px-1.5 h-fit">
        ● {healthLabel}
      </Badge>
      <span className="text-muted-foreground/50">·</span>
      <span className="text-muted-foreground">Index: {idx}</span>
      <span className="text-muted-foreground/50">·</span>
      <span className="text-muted-foreground">
        Uptime:{' '}
        <span className="font-medium tabular-nums">{formatTime(time)}</span>
      </span>
      <span className="ml-auto text-muted-foreground/70">
        Live <span className="text-error">⏺</span>
      </span>
    </div>
  ),
);

FilterIdentityStrip.displayName = 'FilterIdentityStrip';

export default FilterIdentityStrip;
