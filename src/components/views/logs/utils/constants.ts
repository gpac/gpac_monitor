import { GpacLogLevel, GpacLogTool } from '@/types/domain/gpac/log-types';

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
