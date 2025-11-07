import React, { memo } from 'react';
import { PidProperty } from '@/types';
import PropertyItem from './PropertyItem';

interface IPIDPropertiesContentProps {
  properties: PidProperty[];
}

/**
 * Display IPID properties in a scrollable list_-
 */
const IPIDPropertiesContent: React.FC<IPIDPropertiesContentProps> = memo(
  ({ properties }) => {
    if (!properties || properties.length === 0) {
      return (
        <div className="text-center text-monitor-text-muted py-6 text-xs">
          Loading properties...
        </div>
      );
    }

    return (
      <div className="divide-y divide-monitor-divider bg-monitor-panel overflow-y-auto">
        {properties.map((prop) => (
          <PropertyItem key={prop.name} property={prop} />
        ))}
      </div>
    );
  },
);

IPIDPropertiesContent.displayName = 'IPIDPropertiesContent';

export default IPIDPropertiesContent;
