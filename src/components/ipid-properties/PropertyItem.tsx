import { memo } from 'react';
import { PidProperty, formatGpacValue } from '@/types';

interface PropertyItemProps {
  property: PidProperty;
}

/**
 * Single PID property display (read-only)
 */
const PropertyItem = memo(({ property }: PropertyItemProps) => {
  return (
    <div className="px-3 py-2 hover:bg-monitor-hover transition-colors">
      <div className="flex flex-col gap-1">
        <div className="flex items-center justify-between gap-2">
          <div className="text-xs font-cond text-monitor-text-primary">
            {property.name}
          </div>
          <div className="text-xs text-monitor-text-muted">{property.type}</div>
        </div>
        <div className="text-xs text-info font-cond break-all max-h-32 overflow-y-auto">
          {formatGpacValue(property.value, property.type)}
        </div>
      </div>
    </div>
  );
});

PropertyItem.displayName = 'PropertyItem';

export default PropertyItem;
