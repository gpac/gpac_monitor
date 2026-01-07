import { RiGlobalFill } from 'react-icons/ri';
import { LogsUIFilter } from '@/shared/store/slices/logs/logs.types';
import { StableNumber } from '@/utils/performance/StableNumber';

/**
 * Render the global filter badge (pure function returning JSX)
 */
export const renderGlobalFilterBadge = (
  uiFilter: LogsUIFilter | null,
  visibleLogsCount: number,
) => {
  const levelStr =
    uiFilter?.levels && uiFilter.levels.length === 1
      ? uiFilter.levels[0].toLowerCase()
      : null;

  const colorClasses = {
    error: 'text-danger',
    warning: 'text-warning',
    info: 'text-emerald-300/90',
    debug: 'text-debug',
    quiet: 'text-muted',
  };

  // Check if filtering by thread
  const threadId =
    uiFilter?.filterKeys?.length === 1 &&
    uiFilter.filterKeys[0].startsWith('t:')
      ? parseInt(uiFilter.filterKeys[0].substring(2), 10) >>> 0
      : null;

  return (
    <div className="flex items-center gap-2 px-3 py-1 rounded-md border border-gray-700 bg-monitor-panel font-ui">
      <span className="text-xs">
        <RiGlobalFill className="w-4 h-4" />
      </span>
      <span
        className={`text-sm font-medium ${
          levelStr
            ? colorClasses[levelStr as keyof typeof colorClasses]
            : 'text-info'
        }`}
      >
        {levelStr ? `all@${levelStr}` : 'filtered'}
      </span>
      {threadId !== null && (
        <span className="text-sm font-medium text-blue-400">T{threadId}</span>
      )}
      <span className="text-xs text-muted">
        (<StableNumber value={visibleLogsCount} />)
      </span>
    </div>
  );
};
