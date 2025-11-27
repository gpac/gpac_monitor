import { memo } from 'react';
import { Badge } from '@/components/ui/badge';
import type { PIDproperties } from '@/types/domain/gpac/filter-stats';

interface PIDMetadataBadgesProps {
  pid: PIDproperties;
}

/**
 * Displays language and role as compact badges for PID identification
 * Technical metadata (ID, trackNumber, serviceID) should be in tooltips
 */
const PIDMetadataBadges = memo(({ pid }: PIDMetadataBadgesProps) => {
  const hasMetadata = pid.language || pid.role;

  if (!hasMetadata) return null;

  return (
    <div className="flex items-center gap-1">
      {pid.language && (
        <Badge
          variant="outline"
          className="text-[9px] px-1.5 py-0 h-4 font-mono uppercase bg-background/40"
        >
          {pid.language}
        </Badge>
      )}
      {pid.role && (
        <Badge
          variant="secondary"
          className="text-[9px] px-1.5 py-0 h-4 bg-blue-900/30 text-blue-300 border-blue-700/50"
        >
          {pid.role}
        </Badge>
      )}
    </div>
  );
});

PIDMetadataBadges.displayName = 'PIDMetadataBadges';

export default PIDMetadataBadges;
