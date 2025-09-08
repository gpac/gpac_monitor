import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
  FaInfoCircle,
  FaExclamationTriangle,
  FaTimesCircle,
  FaChevronDown,
} from 'react-icons/fa';
import WidgetWrapper from '../../common/WidgetWrapper';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '../../ui/dropdown-menu';
import { useLogs } from './hooks/useLogs';
import { GpacLogConfig, GpacLogLevel, GpacLogTool } from '@/types/domain/gpac/log-types';

interface LogsMonitorProps {
  id: string;
  title: string;
}

const GPAC_TOOLS = Object.values(GpacLogTool);
const LOG_LEVELS = Object.values(GpacLogLevel);

const LogsMonitor: React.FC<LogsMonitorProps> = React.memo(({ id, title }) => {
  const [toolFilter, setToolFilter] = useState<GpacLogTool>(GpacLogTool.ALL);
  const [levelFilter, setLevelFilter] = useState<GpacLogLevel>(GpacLogLevel.INFO);
  const viewRef = useRef<HTMLDivElement>(null);

  // Use real logs from GPAC
  const logLevel: GpacLogConfig = `${toolFilter}@${levelFilter}`;
  const { logs } = useLogs({
    enabled: true,
    logLevel,
  });

  const scrollToBottom = useCallback(() => {
    viewRef.current?.scrollTo({ top: viewRef.current.scrollHeight, behavior: 'smooth' });
  }, []);

  useEffect(() => {
    scrollToBottom();
  }, [logs, scrollToBottom]);



  const levelIcons = useRef({
    0: <FaInfoCircle className="w-4 h-4 text-gray-500" />,
    1: <FaTimesCircle className="w-4 h-4 text-red-500" />,
    2: <FaExclamationTriangle className="w-4 h-4 text-yellow-500" />,
    3: <FaInfoCircle className="w-4 h-4 text-green-700" />,
    4: <FaInfoCircle className="w-4 h-4 text-blue-300" />
  }).current;

  const getLevelIcon = useCallback((level: number) => {
    return levelIcons[level as keyof typeof levelIcons] || levelIcons[0];
  }, [levelIcons]);

  const levelStyles = useRef({
    0: 'text-gray-500',
    1: 'text-red-500', 
    2: 'text-yellow-500',
    3: 'text-green-600',
    4: 'text-blue-300'
  }).current;

  const getLevelStyle = useCallback((level: number) => {
    return levelStyles[level as keyof typeof levelStyles] || levelStyles[0];
  }, [levelStyles]);

  const levelNames = useRef({
    0: 'QUIET',
    1: 'ERROR',
    2: 'WARNING', 
    3: 'INFO',
    4: 'DEBUG'
  }).current;

  const getLevelName = useCallback((level: number) => {
    return levelNames[level as keyof typeof levelNames] || 'UNKNOWN';
  }, [levelNames]);

  return (
    <WidgetWrapper id={id} title={title}>
      <div className="flex flex-col h-full bg-stat stat">
        {/* Filters */}
        <div className="flex gap-2 mb-2 flex-wrap">
          {/* Tools Dropdown */}
          <DropdownMenu>
            <DropdownMenuTrigger className="px-3 py-1  font-bold border rounded text-sm bg-stat border-gray-600 flex items-center gap-1 hover:bg-gray-700">
              TOOLS: {toolFilter.toUpperCase()}
              <FaChevronDown className="w-3 h-3" />
            </DropdownMenuTrigger>
            <DropdownMenuContent className="max-h-60 overflow-y-auto">
              {GPAC_TOOLS.map((tool) => (
                <DropdownMenuItem
                  key={tool}
                  onClick={() => setToolFilter(tool)}
                  className={toolFilter === tool ? '!bg-gray-600' : ''}
                >
                  {tool}
                </DropdownMenuItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>

          {/* Levels Dropdown */}
          <DropdownMenu>
            <DropdownMenuTrigger className="px-3 py-1  font-bold border rounded text-sm bg-stat border-gray-600 flex items-center gap-1 hover:bg-gray-700">
              LEVELS: {levelFilter.toUpperCase()}
              <FaChevronDown className="w-3 h-3" />
            </DropdownMenuTrigger>
            <DropdownMenuContent>
              {LOG_LEVELS.map((level) => (
                <DropdownMenuItem
                  key={level}
                  onClick={() => setLevelFilter(level)}
                  className={levelFilter === level ? '!bg-gray-600' : ''}
                >
                  {level}
                </DropdownMenuItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>
        </div>

        {/* Logs */}
        <div ref={viewRef} className="flex-1 overflow-y-auto rounded p-4 text-sm bg-stat stat" style={{ fontFamily: "'Roboto Mono', 'Courier New', monospace" }}>
          {logs.map((log, index) => {
            const formattedTime = new Date(log.timestamp).toLocaleTimeString();
            const levelStyle = getLevelStyle(log.level);
            const levelName = getLevelName(log.level);
            const levelIcon = getLevelIcon(log.level);
            
            return (
              <div
                key={`${log.timestamp}-${index}`}
                className="flex items-start gap-2 mb-2 hover:bg-gray-900 p-1 rounded"
              >
                {levelIcon}
                <div className="flex-1 stat">
                  <div className="flex items-center gap-2">
                    <span className="text-gray-400 text-xs">
                      {formattedTime}
                    </span>
                    <span className={`text-xs ${levelStyle}`}>
                      [{levelName}]
                    </span>
                    <span className="text-xs text-gray-300">
                      [{log.tool}]
                    </span>
                  </div>
                  <div className={`mt-1 ${levelStyle}`}>
                    {log.message}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </WidgetWrapper>
  );
});

export default LogsMonitor;
