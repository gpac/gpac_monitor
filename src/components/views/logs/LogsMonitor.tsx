import React, { useCallback, useRef, useState, useMemo } from 'react';
import { Virtuoso, VirtuosoHandle } from 'react-virtuoso';
import { RiGlobalFill, RiScrollToBottomLine } from 'react-icons/ri';
import WidgetWrapper from '../../Widget/WidgetWrapper';
import { useLogs } from './hooks/useLogs';
import { useLogsRedux } from './hooks/useLogsRedux';
import { useAppSelector, useAppDispatch } from '@/shared/hooks/redux';
import {
  selectAllLogCountsByTool,
  selectCriticalLogCountsByTool,
  selectUIFilter,
  selectViewMode,
} from '@/shared/store/selectors/logs/logsSelectors';
import { selectCriticalLogsCount } from '@/shared/store/selectors/logs/logsFilterSelectors';
import { clearUIFilter } from '@/shared/store/slices/logsSlice';
import { useLogsService } from './hooks/useLogsService';
import { CustomTooltip } from '@/components/ui/tooltip';
import { ToolSettingsDropdown } from './components/Tool/ToolSettingsDropdown';
import { ToolSwitcher } from './components/Tool/ToolSwitcher';
import { LogEntryItem } from './components/LogEntryItem';
import { generateLogId } from './utils/logIdentifier';
import { setHighlightedLog } from '@/shared/store/slices/logsSlice';
import { Button } from '@/components/ui/button';

interface LogsMonitorProps {
  id: string;
}

const LogsFooter = React.memo(({ count }: { count: number }) => (
  <div className="text-center text-xs text-gray-500 py-1">{count} logs</div>
));

const LogsMonitor: React.FC<LogsMonitorProps> = React.memo(({ id }) => {
  const virtuosoRef = useRef<VirtuosoHandle>(null);
  const dispatch = useAppDispatch();

  const {
    currentTool,
    levelsByTool,
    defaultAllLevel,
    visibleToolsFilter,
    visibleLogs,
    setTool,
    setToolLevel,
    setDefaultAllLevel: setDefaultLevel,
    toggleToolFilter,
    clearFilter,
    selectAllTools,
  } = useLogsRedux();

  // Get highlighted log ID from Redux
  const highlightedLogId = useAppSelector(
    (state) => state.logs.highlightedLogId,
  );
  const [atBottom, setAtBottom] = useState(true);
  const [_atTop, setAtTop] = useState(false);

  // Get all log counts by tool (to determine which tools have logs)
  const allLogCountsByTool = useAppSelector(selectAllLogCountsByTool);

  // Get critical log counts by tool (for badge display)
  const criticalLogCountsByTool = useAppSelector(selectCriticalLogCountsByTool);

  // Get critical logs count (warnings + errors only)
  const criticalLogsCount = useAppSelector(selectCriticalLogsCount);

  // Get UI filter (if active)
  const uiFilter = useAppSelector(selectUIFilter);
  const viewMode = useAppSelector(selectViewMode);
  const isUIFilterActive =
    uiFilter &&
    ((uiFilter.levels && uiFilter.levels.length > 0) ||
      (uiFilter.filterKeys && uiFilter.filterKeys.length > 0));

  // Initialize logs subscription (uses config from Redux store via useLogsService)
  useLogs({
    enabled: true,
  });

  // Auto-sync per-tool configuration with backend
  useLogsService();

  // Handler for toggling highlight on a log
  const handleToggleHighlight = useCallback(
    (logId: string | null) => {
      dispatch(setHighlightedLog(logId));
    },
    [dispatch],
  );

  // Handler to scroll to highlighted log
  const scrollToHighlightedLog = useCallback(() => {
    if (highlightedLogId && virtuosoRef.current && visibleLogs.length > 0) {
      const index = visibleLogs.findIndex(
        (log) => generateLogId(log) === highlightedLogId,
      );
      if (index !== -1) {
        virtuosoRef.current.scrollToIndex({
          index,
          behavior: 'smooth',
          align: 'center',
        });
      }
    }
  }, [highlightedLogId, visibleLogs]);

  const statusBadge = useMemo(() => {
    // Global Filter mode: show "all@level" badge with distinctive styling
    if (viewMode === 'globalFilter' && isUIFilterActive) {
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
          <span className="text-xs tabular-nums text-muted">
            ({visibleLogs.length})
          </span>
        </div>
      );
    }

    // Per-tool mode: show normal ToolSwitcher
    return (
      <ToolSwitcher
        currentTool={currentTool}
        levelsByTool={levelsByTool}
        defaultAllLevel={defaultAllLevel}
        visibleLogsCount={criticalLogsCount}
        allLogCountsByTool={allLogCountsByTool}
        criticalLogCountsByTool={criticalLogCountsByTool}
        visibleToolsFilter={visibleToolsFilter}
        onToolSelect={setTool}
        onToggleToolFilter={toggleToolFilter}
        onClearFilter={clearFilter}
        onSelectAllTools={selectAllTools}
      />
    );
  }, [
    viewMode,
    uiFilter,
    isUIFilterActive,
    visibleLogs.length,
    currentTool,
    levelsByTool,
    defaultAllLevel,
    criticalLogsCount,
    allLogCountsByTool,
    criticalLogCountsByTool,
    visibleToolsFilter,
    setTool,
    toggleToolFilter,
    clearFilter,
    selectAllTools,
  ]);

  return (
    <WidgetWrapper
      id={id}
      statusBadge={statusBadge}
      customActions={
        <div className="flex items-center gap-2">
          {isUIFilterActive && (
            <CustomTooltip content="Clear UI filter" side="bottom">
              <button
                onClick={() => dispatch(clearUIFilter())}
                className="px-2 py-1 text-xs rounded bg-red-900/30 border border-red-800/50 text-red-200 hover:bg-red-900/50 "
              >
                Clear Filter
              </button>
            </CustomTooltip>
          )}
          <CustomTooltip
            content="Configure log levels for each tool"
            side="bottom"
          >
            <ToolSettingsDropdown
              levelsByTool={levelsByTool}
              defaultAllLevel={defaultAllLevel}
              currentTool={currentTool}
              onToolLevelChange={setToolLevel}
              onDefaultAllLevelChange={setDefaultLevel}
              onToolNavigate={setTool}
            />
          </CustomTooltip>
        </div>
      }
    >
      <div className="flex flex-col h-full bg-stat stat">
        {/* Logs */}
        <div className="flex-1 relative">
          <div className="absolute bottom-4 right-4 z-20 flex flex-col items-center gap-3 pointer-events-auto">
            {/* Scroll to highlighted log button */}
            {highlightedLogId && (
              <button
                onClick={scrollToHighlightedLog}
                className="px-2 py-1 text-xs rounded border bg-gray-800 border-yellow-600 text-white hover:opacity-80"
                title="Scroll to highlighted log"
              >
                📌
              </button>
            )}

            {/* Auto-scroll toggle */}
            <Button
              onClick={() => {
                if (atBottom) {
                  virtuosoRef.current?.scrollToIndex({
                    index: 0,
                    behavior: 'smooth',
                  });
                } else {
                  virtuosoRef.current?.scrollToIndex({
                    index: visibleLogs.length - 1,
                    behavior: 'smooth',
                  });
                }
              }}
              className={`p-2 rounded-sm shadow-md border-2  hover:scale-105
  `}
              title={atBottom ? 'Scroll to top' : 'Scroll to bottom'}
            >
              <RiScrollToBottomLine
                className={`w-5 h-5 transform  duration-200 ${
                  atBottom ? 'rotate-180' : ''
                }`}
              />
            </Button>
          </div>
          <Virtuoso
            ref={virtuosoRef}
            data={visibleLogs}
            followOutput={atBottom ? 'auto' : false}
            computeItemKey={(_, log) => generateLogId(log)}
            style={{
              height: '100%',
              fontFamily: "'Roboto Mono', 'Courier New', monospace",
              willChange: 'transform',
              contain: 'layout paint',
            }}
            className="rounded px-2 py-1 text-sm bg-stat stat"
            itemContent={(_, log) => {
              const logId = generateLogId(log);
              return (
                <LogEntryItem
                  log={log}
                  logId={logId}
                  isHighlighted={logId === highlightedLogId}
                  onToggleHighlight={handleToggleHighlight}
                />
              );
            }}
            atBottomStateChange={setAtBottom}
            atTopStateChange={setAtTop}
            overscan={20}
            increaseViewportBy={200}
            components={{
              Footer:
                visibleLogs.length > 100
                  ? () => <LogsFooter count={visibleLogs.length} />
                  : undefined,
            }}
          />
        </div>
      </div>
    </WidgetWrapper>
  );
});

export default LogsMonitor;
