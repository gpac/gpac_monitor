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
      <div className="flex items-start justify-between gap-2">
        <div className="flex-1 min-w-0">
          <div className="text-xs font-cond text-monitor-text-primary truncate">
            {property.name}
          </div>
          <div className="text-xs text-monitor-text-muted mt-0.5">
            {property.type}
          </div>
        </div>
        <div className="text-xs text-info font-cond text-right break-all">
          {formatGpacValue(property.value, property.type)}
        </div>
      </div>
    </div>
  );
});

PropertyItem.displayName = 'PropertyItem';

export default PropertyItem;
