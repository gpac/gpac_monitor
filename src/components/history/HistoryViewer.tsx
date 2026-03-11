import { useState, useMemo, useCallback } from 'react';
import { LuX } from 'react-icons/lu';
import { UplotChart } from '@/components/common/UplotChart';
import * as historyService from '@/services/historyService/index';
import { createHistoryChartOptions } from './historyChartConfig';

interface HistoryViewerProps {
  onClose: () => void;
}

export const HistoryViewer = ({ onClose }: HistoryViewerProps) => {
  const filterIds = useMemo(() => historyService.getFilterIds(), []);
  const filterTypes = useMemo(() => historyService.getFilterTypes(), []);
  const [selectedIdx, setSelectedIdx] = useState<number>(filterIds[0] ?? 0);

  const data = useMemo(
    () => historyService.getFilterStats(selectedIdx),
    [selectedIdx],
  );

  const options = useMemo(() => createHistoryChartOptions(), []);

  const handleClose = useCallback(() => {
    historyService.close();
    onClose();
  }, [onClose]);

  return (
    <div className="flex flex-col w-full h-full bg-monitor-panel rounded-lg p-4">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-4">
          <h2 className="text-sm font-medium text-gray-300">
            Session History
          </h2>
          <select
            value={selectedIdx}
            onChange={(e) => setSelectedIdx(Number(e.target.value))}
            className="bg-gray-800 text-gray-300 text-sm rounded px-2 py-1 border border-gray-600"
          >
            {filterIds.map((idx) => (
              <option key={idx} value={idx}>
                [{idx}] {filterTypes.get(idx) ?? '?'}
              </option>
            ))}
          </select>
        </div>
        <button
          onClick={handleClose}
          className="p-1 text-gray-400 hover:text-white rounded hover:bg-gray-700"
          title="Close history"
        >
          <LuX className="w-4 h-4" />
        </button>
      </div>
      <div className="flex-1 min-h-[300px]">
        <UplotChart data={data} options={options} className="w-full h-full" />
      </div>
    </div>
  );
};
