import { memo, useCallback } from 'react';
import { PidProperty } from '@/types';
import { useSearchFilter } from '@/shared/hooks/useSearchFilter';
import PropertyItem from './PropertyItem';

interface IPIDPropertiesContentProps {
  properties: PidProperty[];
  searchQuery?: string;
}

/**
 * Display IPID properties in a scrollable list_-
 */
const IPIDPropertiesContent = memo(
  ({ properties, searchQuery = '' }: IPIDPropertiesContentProps) => {
    const filteredProperties = useSearchFilter(
      properties,
      searchQuery,
      useCallback(
        (prop: PidProperty) => [prop.name, String(prop.value ?? '')],
        [],
      ),
    );

    if (!properties || properties.length === 0) {
      return (
        <div className="text-center text-monitor-text-muted py-6 text-xs">
          Loading properties...
        </div>
      );
    }

    if (filteredProperties.length === 0 && searchQuery) {
      return (
        <div className="text-center text-monitor-text-muted py-6 text-xs">
          No properties match your search.
        </div>
      );
    }

    return (
      <div className="divide-y divide-monitor-divider bg-monitor-panel overflow-y-auto">
        {filteredProperties.map((prop) => (
          <PropertyItem key={prop.name} property={prop} />
        ))}
      </div>
    );
  },
);

IPIDPropertiesContent.displayName = 'IPIDPropertiesContent';

export default IPIDPropertiesContent;
