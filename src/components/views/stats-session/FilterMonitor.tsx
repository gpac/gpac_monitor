import React, { useEffect } from 'react';
import { useAppDispatch, useAppSelector } from '@/shared/hooks/redux';


import { WidgetProps } from '../../../types/ui/widget';
import {
  MetricCardProps,

} from './types';
import WidgetWrapper from '../../common/WidgetWrapper';

import { formatBytes } from '../../../utils/filterMonitorUtils';

const MetricCard: React.FC<MetricCardProps> = ({
  title,
  value,
  total,
  unit,
  className = '',
}) => (
  <div className={`bg-gray-700 p-4 rounded ${className}`}>
    <h3 className="text-sm text-gray-400 mb-1">{title}</h3>
    <div className="flex items-baseline gap-2">
      <span className="text-2xl font-semibold">
        {unit === 'bytes' ? formatBytes(value) : value.toLocaleString()}
      </span>
      {total && (
        <span className="text-sm text-gray-400">
          / {unit === 'bytes' ? formatBytes(total) : total.toLocaleString()}
        </span>
      )}
      {unit && unit !== 'bytes' && (
        <span className="text-sm text-gray-400">{unit}</span>
      )}
    </div>
  </div>
);


const FilterMonitor: React.FC<WidgetProps> = ({ id, title }) => {
  const dispatch = useAppDispatch();
  const selectedFilter = useAppSelector(
    (state ) => state.graph.selectedFilterDetails,
  );


  useEffect(() => {
    if (selectedFilter) {



    }
  }, [selectedFilter, dispatch]);

  if (!selectedFilter) {
    return (
      <WidgetWrapper id={id} title={title}>
        <div className="flex items-center justify-center h-full  text-gray-400">
          Select a filter in the Graph Monitor to view details
        </div>
      </WidgetWrapper>
    );
  }

  return (
    <WidgetWrapper id={id} title={title}>
      <div className="flex flex-col h-full p-2 space-y-2 ">
        {/* Informations du filtre */}
        <div className="grid grid-cols-2 gap-4">
          <div className="bg-gray-700 p-1 rounded">
            <h3 className="text-sm text-gray-400 mb-1">Filter Name</h3>
            <div className="font-medium text-lg">{selectedFilter.name}</div>
            <div className="text-sm text-gray-400 mt-1">
              {selectedFilter.type}
            </div>
          </div>
          <div className="bg-gray-700 p-1 rounded">
            <h3 className="text-sm text-gray-400 mb-1">Status</h3>
            <div className="font-medium break-words">
              {selectedFilter.status || 'No status available'}
            </div>
          </div>
        </div>

        {/* Métriques */}
        <div className="grid grid-cols-3 gap-4">
          <MetricCard
            title="Data Processed"
            value={selectedFilter.bytes_done || 0}
            unit="bytes"
            className="bg-blue-900/20"
          />
          <MetricCard
            title="Packets Sent"
            value={selectedFilter.pck_sent || 0}
            unit="pkts"
            className="bg-green-900/20"
          />
          <MetricCard
            title="Packets Done"
            value={selectedFilter.pck_done || 0}
            unit="pkts"
            className="bg-yellow-900/20"
          />
        </div>


      </div>
    </WidgetWrapper>
  );
};

export default React.memo(FilterMonitor);
