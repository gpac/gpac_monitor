import React, { useEffect, useRef, useState } from 'react';
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

const LogsMonitor: React.FC<LogsMonitorProps> = ({ id, title }) => {
  const [toolFilter, setToolFilter] = useState<GpacLogTool>(GpacLogTool.ALL);
  const [levelFilter, setLevelFilter] = useState<GpacLogLevel>(GpacLogLevel.WARNING);
  const logsEndRef = useRef<HTMLDivElement>(null);

  // Use real logs from GPAC
  const logLevel: GpacLogConfig = `${toolFilter}@${levelFilter}`;
  const { logs, isSubscribed } = useLogs({
    enabled: true,
    logLevel,
  });

  const scrollToBottom = () => {
    logsEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [logs]);

  console.log('[LogsMonitor] Logs received:', logs.length, 'isSubscribed:', isSubscribed);

  const getLevelIcon = (level: number) => {
    // GPAC log levels are numeric
    switch (level) {
      case 0: // quiet (no logs)
        return <FaInfoCircle className="w-4 h-4 text-gray-500" />;
      case 1: // error
        return <FaTimesCircle className="w-4 h-4 text-red-500" />;
      case 2: // warning
        return <FaExclamationTriangle className="w-4 h-4 text-yellow-500" />;
      case 3: // info
        return <FaInfoCircle className="w-4 h-4 text-green-700" />;
      case 4: // debug
        return <FaInfoCircle className="w-4 h-4 text-blue-500" />;
      default:
        return <FaInfoCircle className="w-4 h-4 text-gray-500" />;
    }
  };

  const getLevelStyle = (level: number) => {
    switch (level) {
      case 0: // quiet
        return 'text-gray-500';
      case 1: // error
        return 'text-red-500';
      case 2: // warning
        return 'text-yellow-500';
      case 3: // info
        return 'text-green-600';
      case 4: // debug
        return 'text-blue-500';
      default:
        return 'text-gray-500';
    }
  };

  const getLevelName = (level: number) => {
    switch (level) {
      case 0: return 'QUIET';
      case 1: return 'ERROR';
      case 2: return 'WARNING';
      case 3: return 'INFO';
      case 4: return 'DEBUG';
      default: return 'UNKNOWN';
    }
  };

  return (
    <WidgetWrapper id={id} title={title}>
      <div className="flex flex-col h-full bg-stat stat">
        {/* Filters */}
        <div className="flex gap-2 mb-2 flex-wrap">
          {/* Tools Dropdown */}
          <DropdownMenu>
            <DropdownMenuTrigger className="px-3 py-1 rounded text-sm bg-stat border border-gray-600 flex items-center gap-1 hover:bg-gray-700">
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
            <DropdownMenuTrigger className="px-3 py-1 rounded text-sm bg-stat border border-gray-600 flex items-center gap-1 hover:bg-gray-700 hover:text-gray-300">
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
        <div className="flex-1 overflow-y-auto rounded p-4 font-mono text-sm bg-stat stat">
          {logs.map((log, index) => (
            <div
              key={`${log.timestamp}-${index}`}
              className="flex items-start gap-2 mb-2 hover:bg-gray-900 p-1 rounded"
            >
              {getLevelIcon(log.level)}
              <div className="flex-1 stat">
                <div className="flex items-center gap-2">
                  <span className="text-gray-400 text-xs">
                    {new Date(log.timestamp).toLocaleTimeString()}
                  </span>
                  <span className={`text-xs ${getLevelStyle(log.level)}`}>
                    [{getLevelName(log.level)}]
                  </span>
                  <span className="text-xs text-gray-500">
                    [{log.tool}]
                  </span>
                </div>
                <div className={`mt-1 ${getLevelStyle(log.level)}`}>
                  {log.message}
                </div>
              </div>
            </div>
          ))}
          <div ref={logsEndRef} />
        </div>
      </div>
    </WidgetWrapper>
  );
};

export default LogsMonitor;
