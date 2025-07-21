import React from 'react';
import { useMultiFilterMonitor } from './hooks/useMultiFilterMonitor';
import WidgetWrapper from '../../../common/WidgetWrapper';
import { WidgetProps } from '../../../../types/ui/widget';
import FilterCard from './components/FilterCard';

const MultiFilterMonitor: React.FC<WidgetProps> = React.memo(
  ({ id, title }) => {
    const { selectedFilters, isLoading, handleCloseMonitor, sessionStats } =
      useMultiFilterMonitor();

    if (isLoading) {
      return (
        <WidgetWrapper id={id} title={title}>
          <div className="flex items-center justify-center h-full">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500" />
          </div>
        </WidgetWrapper>
      );
    }

    if (selectedFilters.length === 0) {
      // Show session stats when no specific filters are selected
      const sessionFiltersArray = Object.values(sessionStats);
      
      if (sessionFiltersArray.length === 0) {
        return (
          <WidgetWrapper id={id} title={title}>
            <div className="flex flex-col items-center justify-center h-full p-4 text-gray-400">
              <p>No session data available</p>
              <p className="text-sm mt-2">
                Waiting for session statistics...
              </p>
            </div>
          </WidgetWrapper>
        );
      }

      return (
        <WidgetWrapper id={id} title="Session Overview">
          <div className="h-full overflow-auto p-4">
            <div className="grid gap-4 grid-cols-1 lg:grid-cols-2 xl:grid-cols-3">
              {sessionFiltersArray.map((filterStats) => (
                <div key={filterStats.idx} className="bg-gray-800 rounded-lg p-4 border">
                  <div className="flex justify-between items-center mb-2">
                    <h3 className="font-semibold">Filter {filterStats.idx}</h3>
                    <span className={`px-2 py-1 rounded text-xs ${
                      filterStats.status === 'stopped' ? 'bg-red-900 text-red-300' :
                      filterStats.status === 'running' ? 'bg-green-900 text-green-300' :
                      'bg-yellow-900 text-yellow-300'
                    }`}>
                      {filterStats.status}
                    </span>
                  </div>
                  <div className="space-y-1 text-sm">
                    <div>Bytes done: {filterStats.bytes_done.toLocaleString()}</div>
                    <div>Bytes sent: {filterStats.bytes_sent.toLocaleString()}</div>
                    <div>Packets sent: {filterStats.pck_sent.toLocaleString()}</div>
                    <div>Packets done: {filterStats.pck_done.toLocaleString()}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </WidgetWrapper>
      );
    }

    return (
      <WidgetWrapper id={id} title={title}>
        <div className="h-full flex flex-col overflow-hidden">
          <div className="flex-1 overflow-auto p-4">
            <div
              className="grid gap-6 auto-rows-[600px] grid-cols-1 xl:grid-cols-2 2xl:grid-cols-3"
              style={{
                minHeight: 'min-content',
                height: '100%',
              }}
            >
              {selectedFilters.map((filter) => (
                <div key={filter.id} className="h-full">
                  <FilterCard filter={filter} onClose={handleCloseMonitor} />
                </div>
              ))}
            </div>
          </div>
        </div>
      </WidgetWrapper>
    );
  },
);

MultiFilterMonitor.displayName = 'MultiFilterMonitor';

export default MultiFilterMonitor;
