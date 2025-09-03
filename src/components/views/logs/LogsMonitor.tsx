import React, { useEffect, useRef, useState } from 'react';
import { FaInfoCircle, FaExclamationTriangle, FaTimesCircle, FaChevronDown } from 'react-icons/fa';
import WidgetWrapper from '../../common/WidgetWrapper';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '../../ui/dropdown-menu';

interface LogsMonitorProps {
  id: string;
  title: string;
}

interface LogEntry {
  id: string;
  timestamp: Date;
  level: 'info' | 'warning' | 'error' | 'debug';
  message: string;
  tool?: string;
}

const GPAC_TOOLS = [
  'all',
  'core',
  'mutex',
  'mem',
  'module',
  'filter',
  'sched',
  'codec',
  'coding',
  'container',
  'network',
  'http',
  'cache',
  'rtp',
  'dash',
  'route',
  'media',
  'parser',
  'mmio',
  'audio',
  'script',
  'console',
  'scene',
  'compose',
  'ctime',
  'interact',
  'rti'
] as const;

const LOG_LEVELS = ['all', 'debug', 'info', 'warning', 'error'] as const;

const LogsMonitor: React.FC<LogsMonitorProps> = ({ id, title }) => {
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [filter, _setFilter] = useState<'all' | 'info' | 'warning' | 'error' | 'debug'>('all');
  const [toolFilter, setToolFilter] = useState<typeof GPAC_TOOLS[number]>('all');
  const [levelFilter, setLevelFilter] = useState<typeof LOG_LEVELS[number]>('all');
  const logsEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    logsEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [logs]);

  // Simuler l'arrivée de nouveaux logs
  useEffect(() => {
    const sampleLogs = [
      'Filter video_decoder started successfully',
      'High CPU usage detected on transcoding process',
      'Failed to connect to remote stream',
      'Buffer overflow warning in audio stream',
      'Network latency increased above threshold',
      'Stream reconnected successfully',
    ];

    const interval = setInterval(() => {
      const randomLog =
        sampleLogs[Math.floor(Math.random() * sampleLogs.length)];
      const levels: Array<'info' | 'warning' | 'error' | 'debug'> = [
        'debug',
        'info',
        'warning',
        'error',
      ];
      const randomLevel = levels[Math.floor(Math.random() * levels.length)];
      const randomTool = GPAC_TOOLS[Math.floor(Math.random() * (GPAC_TOOLS.length - 1)) + 1];

      setLogs((prev) =>
        [
          ...prev,
          {
            id: Date.now().toString(),
            timestamp: new Date(),
            level: randomLevel,
            message: randomLog,
            tool: randomTool,
          },
        ].slice(-100),
      );
    }, 3000);

    return () => clearInterval(interval);
  }, []);

  const filteredLogs = logs.filter((log) => {
    const levelMatch = levelFilter === 'all' ? true : log.level === levelFilter;
    const toolMatch = toolFilter === 'all' ? true : log.tool === toolFilter;
    const oldFilterMatch = filter === 'all' ? true : log.level === filter;
    return levelMatch && toolMatch && oldFilterMatch;
  });

  const getLevelIcon = (level: 'info' | 'warning' | 'error' | 'debug') => {
    switch (level) {
      case 'debug':
        return <FaInfoCircle className="w-4 h-4 text-blue-500" />;
      case 'info':
        return <FaInfoCircle className="w-4 h-4 text-green-600" />;
      case 'warning':
        return <FaExclamationTriangle className="w-4 h-4 text-yellow-500" />;
      case 'error':
        return <FaTimesCircle className="w-4 h-4 text-red-500" />;
    }
  };

  const getLevelStyle = (level: 'info' | 'warning' | 'error' | 'debug') => {
    switch (level) {
      case 'debug':
        return 'text-blue-500';
      case 'info':
        return 'text-green-600';
      case 'warning':
        return 'text-yellow-500';
      case 'error':
        return 'text-red-500';
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
          {filteredLogs.map((log) => (
            <div
              key={log.id}
              className="flex items-start gap-2 mb-2 hover:bg-gray-900 p-1 rounded"
            >
              {getLevelIcon(log.level)}
              <div className="flex-1  stat">
                <div className="flex items-center gap-2 ">
                  <span className="text-gray-400 text-xs">
                    {log.timestamp.toLocaleTimeString()}
                  </span>
                  <span className={getLevelStyle(log.level)}>
                    [{log.level.toUpperCase()}]
                  </span>
                </div>
                <div className={`mt-1 ${getLevelStyle(log.level)}`}>{log.message}</div>
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
