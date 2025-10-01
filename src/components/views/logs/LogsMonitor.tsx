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
import { selectLogCountsByTool } from '@/shared/store/selectors/logsSelectors';
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
  const [autoScroll, setAutoScroll] = useState(true);
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

  // Get log counts by tool for performance monitoring
  const logCountsByTool = useAppSelector(selectLogCountsByTool);

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
        visibleLogsCount={visibleLogs.length}
        logCountsByTool={logCountsByTool}
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
      visibleLogs.length,
      logCountsByTool,
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
          <div className="absolute top-2 right-1 z-10 flex gap-2">
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
              variant="destructive"
              onClick={() => setAutoScroll(!autoScroll)}
              className={`px-1 py-1 text-xs rounded border ${
                autoScroll
                  ? 'bg-red-700/45  border-orange-600 text-white'
                  : 'bg-gray-700 border-gray-600 text-gray-300'
              }`}
            >
              <RiScrollToBottomLine className="w-4 h-4" />
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
            followOutput={autoScroll ? 'smooth' : false}
            atBottomStateChange={(atBottom: boolean) => {
              if (atBottom && !autoScroll) {
                setAutoScroll(true);
              }
            }}
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
