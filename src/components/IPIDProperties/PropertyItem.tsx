import React from 'react';
import { PidProperty } from '@/types';

interface PropertyItemProps {
  property: PidProperty;
}

/**
 * Single PID property display (read-only)

 */
const PropertyItem: React.FC<PropertyItemProps> = ({ property }) => {
  const formatValue = (value: any, type: string): string => {
    if (value === null || value === undefined) return 'N/A';

    switch (type) {
      case 'boolean':
        return value ? 'true' : 'false';
      case 'fraction':
        return `${value.num}/${value.den}`;
      case 'uint':
      case 'sint':
      case 'ulong':
      case 'slong':
      case 'double':
        return value.toString();
      case 'string':
      case 'name':
        return value;
      case 'pixfmt':
      case 'audiofmt':
      case 'cicp_colr_prim':
      case 'cicp_colr_matrix':
      case 'cicp_colr_transfer':
        return value;
      default:
        return JSON.stringify(value);
    }
  };

  return (
    <div className="px-3 py-2 hover:bg-monitor-hover transition-colors">
      <div className="flex items-start justify-between gap-2">
        <div className="flex-1 min-w-0">
          <div className="text-xs font-medium text-monitor-text-primary truncate">
            {property.name}
          </div>
          <div className="text-xs text-monitor-text-muted mt-0.5">
            {property.type}
          </div>
        </div>
        <div className="text-xs text-monitor-text-secondary font-mono text-right break-all">
          {formatValue(property.value, property.type)}
        </div>
      </div>
    </div>
  );
};

export default PropertyItem;
