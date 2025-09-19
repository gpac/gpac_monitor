import React, {
  useCallback,
  useEffect,
  useRef,
  useState,
  useMemo,
} from 'react';
import {
  FaInfoCircle,
  FaExclamationTriangle,
  FaTimesCircle,
} from 'react-icons/fa';
import { Virtuoso, VirtuosoHandle } from 'react-virtuoso';
import WidgetWrapper from '../../common/WidgetWrapper';
import { useLogs } from './hooks/useLogs';
import { useLogsRedux } from './hooks/useLogsRedux';
import { useLogsService } from './hooks/useLogsService';
import { Badge } from '@/components/ui/badge';
import { CustomTooltip } from '@/components/ui/tooltip';
import { ToolSettingsDropdown } from './components/ToolSettingsDropdown';
import { LEVEL_COLORS } from './utils/constants';
import { bgToTextColor, getEffectiveLevel } from './utils/toolUtils';
import { GpacLogEntry } from '@/types/domain/gpac/log-types';

interface LogsMonitorProps {
  id: string;
  title: string;
}

const LogsMonitor: React.FC<LogsMonitorProps> = React.memo(({ id, title }) => {
  const [autoScroll, setAutoScroll] = useState(true);
  const virtuosoRef = useRef<VirtuosoHandle>(null);

  const {
    currentTool,
    levelsByTool,
    defaultAllLevel,
    visibleLogs,
    setTool,
    setToolLevel,
    setDefaultAllLevel: setDefaultLevel,
  } = useLogsRedux();

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

  const levelConfig = useMemo(
    () => ({
      icons: {
        0: <FaInfoCircle className="w-4 h-4 text-gray-500" />,
        1: <FaTimesCircle className="w-4 h-4 text-red-500" />,
        2: <FaExclamationTriangle className="w-4 h-4 text-yellow-500" />,
        3: <FaInfoCircle className="w-4 h-4 text-green-700" />,
        4: <FaInfoCircle className="w-4 h-4 text-blue-300" />,
      },
      styles: {
        0: 'text-gray-500',
        1: 'text-red-500',
        2: 'text-yellow-500',
        3: 'text-green-600',
        4: 'text-blue-300',
      },
      names: {
        0: 'QUIET',
        1: 'ERROR',
        2: 'WARNING',
        3: 'INFO',
        4: 'DEBUG',
      },
    }),
    [],
  );

  const LogEntry = React.memo(
    ({ log }: { log: GpacLogEntry }) => {
      const logData = useMemo(() => {
        const level = log.level;
        return {
          time: new Date(log.timestamp).toLocaleTimeString(),
          icon:
            levelConfig.icons[level as keyof typeof levelConfig.icons] ||
            levelConfig.icons[0],
          style:
            levelConfig.styles[level as keyof typeof levelConfig.styles] ||
            levelConfig.styles[0],
          name:
            levelConfig.names[level as keyof typeof levelConfig.names] ||
            'UNKNOWN',
        };
      }, [log.timestamp, log.level]);

      return (
        <div
          className="flex items-start gap-2 mb-1 p-1"
          style={{ minHeight: '32px' }}
        >
          {logData.icon}
          <div className="flex-1 stat overflow-hidden">
            <div className="flex items-center gap-2 text-xs">
              <span className="text-gray-400 shrink-0">{logData.time}</span>
              <span className={`shrink-0 ${logData.style}`}>
                [{logData.name}]
              </span>
              <span className="text-gray-300 shrink-0">[{log.tool}]</span>
            </div>
            <div className={`text-sm ${logData.style} break-words`}>
              {log.message}
            </div>
          </div>
        </div>
      );
    },
    (prevProps, nextProps) => {
      return (
        prevProps.log.timestamp === nextProps.log.timestamp &&
        prevProps.log.message === nextProps.log.message
      );
    },
  );

  const statusBadge = useMemo(() => {
    const effectiveLevel = getEffectiveLevel(
      currentTool,
      levelsByTool,
      defaultAllLevel,
    );
    const bgColor = LEVEL_COLORS[effectiveLevel];
    const textColor = bgToTextColor(bgColor);
    return (
      <Badge variant="status" className={`text-xs ${textColor}`}>
        {currentTool.toUpperCase()} : {effectiveLevel.toUpperCase()} (
        {visibleLogs.length})
      </Badge>
    );
  }, [currentTool, levelsByTool, defaultAllLevel, visibleLogs.length]);

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
          <div className="absolute top-2 right-2 z-10">
            <button
              onClick={() => setAutoScroll(!autoScroll)}
              className={`px-2 py-1 text-xs rounded border ${
                autoScroll
                  ? 'bg-orange-800  border-orange-600 text-white'
                  : 'bg-gray-700 border-gray-600 text-gray-300'
              }`}
            >
              Auto-scroll: {autoScroll ? 'ON' : 'OFF'}
            </button>
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
            itemContent={(_, log) => <LogEntry log={log} />}
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
                  ? () => (
                      <div className="text-center text-xs text-gray-500 py-1">
                        {visibleLogs.length} logs
                      </div>
                    )
                  : undefined,
            }}
          />
        </div>
      </div>
    </WidgetWrapper>
  );
});

export default LogsMonitor;
