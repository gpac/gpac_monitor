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
  FaChevronDown,
} from 'react-icons/fa';
import { Virtuoso, VirtuosoHandle } from 'react-virtuoso';
import WidgetWrapper from '../../common/WidgetWrapper';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '../../ui/dropdown-menu';
import { useLogs } from './hooks/useLogs';
import { useLogsRedux } from './hooks/useLogsRedux';

import {
  GpacLogConfig,
  GpacLogLevel,
  GpacLogTool,
  GpacLogEntry,
} from '@/types/domain/gpac/log-types';

interface LogsMonitorProps {
  id: string;
  title: string;
}

const GPAC_TOOLS = Object.values(GpacLogTool);
const LOG_LEVELS = Object.values(GpacLogLevel);

const LogsMonitor: React.FC<LogsMonitorProps> = React.memo(({ id, title }) => {
  const [autoScroll, setAutoScroll] = useState(true);
  const virtuosoRef = useRef<VirtuosoHandle>(null);

  const { currentTool, globalLevel, visibleLogs, setTool, setGlobalLevel } =
    useLogsRedux();

  // Keep subscription active with current global level
  const globalLogConfig: GpacLogConfig = `all@${globalLevel}`;

   useLogs({
    enabled: true,
    logLevel: globalLogConfig,
  });

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

  return (
    <WidgetWrapper id={id} title={title}>
      <div className="flex flex-col h-full bg-stat stat">
        {/* Filters */}
        <div className="flex gap-2 py-4 mb-2 flex-wrap">
          {/* Tools Dropdown */}
          <DropdownMenu>
            <DropdownMenuTrigger className="px-3 py-1  font-bold border rounded text-sm bg-stat border-gray-600 flex items-center gap-1 hover:bg-gray-700">
              TOOLS: {currentTool.toUpperCase()}
              <FaChevronDown className="w-3 h-3" />
            </DropdownMenuTrigger>
            <DropdownMenuContent className="max-h-60 overflow-y-auto">
              {GPAC_TOOLS.map((tool) => (
                <DropdownMenuItem
                  key={tool}
                  onClick={() => setTool(tool)}
                  className={currentTool === tool ? '!bg-gray-600' : ''}
                >
                  {tool}
                </DropdownMenuItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>

          {/* Levels Radio Buttons */}
          <div className="flex items-center gap-2">
            <span className="text-sm font-bold text-gray-300">LEVELS:</span>
            <div className="flex gap-1">
              {LOG_LEVELS.map((level) => (
                <button
                  key={level}
                  onClick={() => setGlobalLevel(level)}
                  className={`px-3 py-1 text-xs font-medium border rounded transition-colors ${
                    globalLevel === level
                      ? 'bg-orange-800 border-orange-700 text-white'
                      : 'bg-stat border-gray-600 text-gray-300 hover:bg-gray-700 hover:border-gray-500'
                  }`}
                >
                  {level.toUpperCase()}
                </button>
              ))}
            </div>
          </div>
        </div>

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
