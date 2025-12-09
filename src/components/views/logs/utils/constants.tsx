import { GpacLogLevel, GpacLogTool } from '@/types/domain/gpac/log-types';
import {
  FaInfoCircle,
  FaExclamationTriangle,
  FaTimesCircle,
} from 'react-icons/fa';

export const TOOL_DISPLAY_NAMES: Record<GpacLogTool, string> = {
  [GpacLogTool.AUDIO]: 'Audio',
  [GpacLogTool.CACHE]: 'Cache',
  [GpacLogTool.CODEC]: 'Codec',
  [GpacLogTool.CODING]: 'Coding',
  [GpacLogTool.COMPOSE]: 'Compose',
  [GpacLogTool.CONSOLE]: 'Console',
  [GpacLogTool.CONTAINER]: 'Container',
  [GpacLogTool.CORE]: 'Core',
  [GpacLogTool.CTIME]: 'CTime',
  [GpacLogTool.DASH]: 'DASH',
  [GpacLogTool.FILTER]: 'Filter',
  [GpacLogTool.HTTP]: 'HTTP',
  [GpacLogTool.INTERACT]: 'Interact',
  [GpacLogTool.MEDIA]: 'Media',
  [GpacLogTool.MEM]: 'Mem',
  [GpacLogTool.MMIO]: 'MMIO',
  [GpacLogTool.MODULE]: 'Module',
  [GpacLogTool.MUTEX]: 'Mutex',
  [GpacLogTool.NETWORK]: 'Network',
  [GpacLogTool.PARSER]: 'Parser',
  [GpacLogTool.RMTWS]: 'RMTWS',
  [GpacLogTool.ROUTE]: 'Route',
  [GpacLogTool.RTI]: 'RTI',
  [GpacLogTool.RTP]: 'RTP',
  [GpacLogTool.SCENE]: 'Scene',
  [GpacLogTool.SCHED]: 'Sched',
  [GpacLogTool.SCRIPT]: 'Script',
  [GpacLogTool.ALL]: 'All',
};

export const LEVEL_COLORS: Record<GpacLogLevel, string> = {
  [GpacLogLevel.QUIET]: 'bg-gray-500',
  [GpacLogLevel.ERROR]: 'bg-red-500',
  [GpacLogLevel.WARNING]: 'bg-yellow-500/60',
  [GpacLogLevel.INFO]: 'bg-green-700/60',
  [GpacLogLevel.DEBUG]: 'bg-blue-400',
};

// Pre-baked CSS classes for performance (avoid dynamic style injection)
export const LEVEL_BADGE_CLASSES: Record<GpacLogLevel, string> = {
  [GpacLogLevel.QUIET]: 'bg-gray-500 text-gray-100 hover:opacity-80',
  [GpacLogLevel.ERROR]: 'bg-red-500 text-red-100 hover:opacity-80',
  [GpacLogLevel.WARNING]: 'bg-yellow-500/60 text-yellow-100 hover:opacity-80',
  [GpacLogLevel.INFO]: 'bg-green-700/60 text-green-100 hover:opacity-80',
  [GpacLogLevel.DEBUG]: 'bg-blue-400 text-blue-100 hover:opacity-80',
};
export const EXCLUDED_LOG_CONFIGS = new Set(['mutex@debug', 'scheduler@debug']);

/**
 * Log level visual configuration for log entries
 * Maps numeric GPAC log levels (0-4) to icon components, styles, and names
 */
export const LOG_ENTRY_CONFIG = {
  iconComponents: {
    0: FaInfoCircle,
    1: FaTimesCircle,
    2: FaExclamationTriangle,
    3: FaInfoCircle,
    4: FaInfoCircle,
  },
  iconClasses: {
    0: 'text-gray-500 shrink-0 mt-1',
    1: 'text-red-500 shrink-0 mt-1',
    2: 'text-yellow-500 shrink-0 mt-1',
    3: 'text-emerald-300/90 shrink-0 mt-1',
    4: 'text-blue-300 shrink-0 mt-1',
  },
  styles: {
    0: 'text-gray-500',
    1: 'text-red-500',
    2: 'text-yellow-500',
    3: 'text-emerald-300/90',
    4: 'text-blue-300',
  },
  names: {
    0: 'QUIET',
    1: 'ERROR',
    2: 'WARNING',
    3: 'INFO',
    4: 'DEBUG',
  },
} as const;
