import React, {
  useCallback,
  useEffect,
  useRef,
  useState,
  useMemo,
} from 'react';
import { Virtuoso, VirtuosoHandle } from 'react-virtuoso';
import { RiScrollToBottomLine } from 'react-icons/ri';
import WidgetWrapper from '../../common/WidgetWrapper';
import { useLogs } from './hooks/useLogs';
import { useLogsRedux } from './hooks/useLogsRedux';
import { useAppSelector, useAppDispatch } from '@/shared/hooks/redux';
import {
  selectAllLogCountsByTool,
  selectCriticalLogCountsByTool,
} from '@/shared/store/selectors/logsSelectors';
import { selectCriticalLogsCount } from '@/shared/store/selectors/logsFilterSelectors';
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
  title: string;
}

const LogsFooter = React.memo(({ count }: { count: number }) => (
  <div className="text-center text-xs text-gray-500 py-1">{count} logs</div>
));

const LogsMonitor: React.FC<LogsMonitorProps> = React.memo(({ id, title }) => {
  const [autoScroll, _setAutoScroll] = useState(true);
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

  // Initialize logs subscription (uses config from Redux store via useLogsService)
  useLogs({
    enabled: true,
  });

  // Auto-sync per-tool configuration with backend
  useLogsService();

  const scrollToBottom = useCallback(() => {
    if (autoScroll) {
      virtuosoRef.current?.scrollToIndex({
        index: visibleLogs.length - 1,
        behavior: 'smooth',
      });
    }
  }, [autoScroll, visibleLogs.length]);

  useEffect(() => {
    if (visibleLogs.length > 0) {
      scrollToBottom();
    }
  }, [visibleLogs.length, scrollToBottom]);

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

  const statusBadge = useMemo(
    () => (
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
    ),
    [
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
    ],
  );

  return (
    <WidgetWrapper
      id={id}
      title={title}
      statusBadge={statusBadge}
      customActions={
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
              className={`p-2 rounded-sm shadow-md border-2 transition-transform hover:scale-105
  `}
              title={atBottom ? 'Scroll to top' : 'Scroll to bottom'}
            >
              <RiScrollToBottomLine
                className={`w-5 h-5 transform transition-transform duration-200 ${
                  atBottom ? 'rotate-180' : ''
                }`}
              />
            </Button>
          </div>
          <Virtuoso
            ref={virtuosoRef}
            data={visibleLogs}
            style={{
              height: '100%',
              fontFamily: "'Roboto Mono', 'Courier New', monospace",
              willChange: 'transform',
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
