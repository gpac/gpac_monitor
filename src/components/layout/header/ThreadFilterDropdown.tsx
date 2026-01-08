import { memo, useState, useCallback } from 'react';
import { FaStream } from 'react-icons/fa';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@radix-ui/react-popover';
import { useAppSelector } from '@/shared/hooks/redux';
import { selectThreadAlerts } from '@/shared/store/selectors/header/headerSelectors';
import { useOpenLogsWidget } from '@/shared/hooks/useOpenLogsWidget';
import { getThreadColor } from '@/components/views/logs/utils/logxUtils';
import { StableNumber } from '@/utils/performance/StableNumber';

/**
 * Convert signed thread ID to unsigned 32-bit for display
 * GPAC displays thread IDs as unsigned in log messages
 */
const toUnsignedThreadId = (threadId: number): number => {
  return threadId >>> 0;
};

export const ThreadFilterDropdown = memo(() => {
  const [isOpen, setIsOpen] = useState(false);
  const openLogsWidget = useOpenLogsWidget();

  const threadAlerts = useAppSelector(selectThreadAlerts);

  const handleThreadClick = useCallback(
    (threadId: number) => {
      openLogsWidget({ filterKeys: [`t:${threadId}`] });
      setIsOpen(false);
    },
    [openLogsWidget],
  );

  if (threadAlerts.length === 0) {
    return null;
  }

  const totalThreadAlerts = threadAlerts.reduce((sum, t) => sum + t.total, 0);
  const formatLogCount = (count: number): string => {
    return count === 100 ? '+100' : String(count);
  };

  return (
    <Popover open={isOpen} onOpenChange={setIsOpen}>
      <PopoverTrigger asChild>
        <button
          className="flex items-center gap-2 px-3 py-1.5 rounded-md font-ui text-sm hover:bg-gray-800/60 cursor-pointer transition-none"
          title={`${totalThreadAlerts} alert(s) across ${threadAlerts.length} thread(s)`}
          aria-label="Filter logs by thread"
        >
          <FaStream className="w-3.5 h-3.5 text-blue-400 transition-none" />
          <StableNumber
            value={threadAlerts.length}
            className="font-medium text-blue-400"
          />
        </button>
      </PopoverTrigger>

      <PopoverContent
        align="end"
        className="bg-monitor-panel border-gray-700 rounded-md shadow-lg z-50 min-w-[220px] max-h-[320px] overflow-hidden"
      >
        <div className="px-3 py-2 text-xs text-gray-400 border-b border-gray-700 font-semibold">
          Threads with Alerts
        </div>
        <div className="max-h-[280px] overflow-y-auto">
          {threadAlerts.map((thread) => {
            const colorClasses = getThreadColor(thread.threadId);
            const displayThreadId = toUnsignedThreadId(thread.threadId);
            return (
              <button
                key={thread.threadId}
                onClick={() => handleThreadClick(thread.threadId)}
                className="w-full px-3 py-2 flex items-center justify-between hover:bg-gray-800 text-left "
              >
                <div className="flex items-center gap-2">
                  <span
                    className={`px-2 py-0.5 rounded text-xs font-mono transition-none ${colorClasses}`}
                  >
                    T{displayThreadId}
                  </span>
                </div>
                <div className="flex items-center gap-2 text-xs">
                  {thread.errors > 0 && (
                    <span className="text-red-400 font-medium">
                      {thread.errors} err
                    </span>
                  )}
                  {thread.warnings > 0 && (
                    <span className="text-amber-400 font-medium transition-noney">
                      {thread.warnings} warn
                    </span>
                  )}
                  {thread.info !== undefined && thread.info > 0 && (
                    <span className="text-info font-medium transition-none">
                      {formatLogCount(thread.info)} info
                    </span>
                  )}
                </div>
              </button>
            );
          })}
        </div>
      </PopoverContent>
    </Popover>
  );
});

ThreadFilterDropdown.displayName = 'ThreadFilterDropdown';
