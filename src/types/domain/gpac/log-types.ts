/** Unique identifier for a log entry */
export type LogId = string;

/**
 * GPAC log levels enumeration
 */
export enum GpacLogLevel {
  QUIET = 'quiet',
  ERROR = 'error',
  WARNING = 'warning',
  INFO = 'info',
  DEBUG = 'debug',
}

/**
 * GPAC log tools/categories
 */
export enum GpacLogTool {
  AUDIO = 'audio',
  CACHE = 'cache',
  CODEC = 'codec',
  CODING = 'coding',
  COMPOSE = 'compose',
  CONSOLE = 'console',
  CONTAINER = 'container',
  CORE = 'core',
  CTIME = 'comptime',
  DASH = 'dash',
  FILTER = 'filter',
  HTTP = 'http',
  INTERACT = 'interact',
  MEDIA = 'media',
  MEM = 'mem',
  MMIO = 'mmio',
  MODULE = 'module',
  MUTEX = 'mutex',
  NETWORK = 'network',
  PARSER = 'parser',
  RMTWS = 'rmtws',
  ROUTE = 'route',
  RTI = 'rti',
  RTP = 'rtp',
  SCENE = 'scene',
  SCHED = 'sched',
  SCRIPT = 'script',
  ALL = 'all',
}

/**
 * Log configuration string builder helper
 * Format: "tool@level" (e.g., "all@warning", "core@debug")
 */
export type GpacLogConfig = `${GpacLogTool}@${GpacLogLevel}`;

/**
 * Multiple log configurations string
 * Format: "tool1@level1,tool2@level2,..." (e.g., "core@info,demux@warning,all@quiet")
 */
export type GpacLogConfigString = string;

/**
 * GPAC log entry structure (logx mode)
 */
export interface GpacLogEntry {
  /** Timestamp when the log was generated (microseconds from sys.clock_us) */
  timestamp: number;
  /** Absolute timestamp (milliseconds from Date.now) for long sessions */
  timestampMs?: number;
  /** Log tool/category */
  tool: string;
  /** Log level (numeric value from GPAC) */
  level: number;
  /** Log message content */
  message: string;
  /** Thread ID that emitted the log (logx mode) */
  thread_id?: number;
  /** Caller identifier: filter type, idx, or name (logx mode) */
  caller?: string | number | null;
}

/**
 * Log manager status information
 */
export interface LogManagerStatus {
  /** Whether log capturing is active */
  isSubscribed: boolean;
  /** Current log level configuration */
  logLevel: GpacLogConfig;
  /** Number of cached log entries */
  logCount: number;
  /** Current GPAC log configuration */
  currentLogConfig: string;
}

/**
 * Log subscription message payload
 */
export interface LogSubscriptionMessage {
  message: 'subscribe_logs';
  /** Optional log level override (defaults to "all@warning") */
  logLevel?: GpacLogConfig;
}

/**
 * Log unsubscription message payload
 */
export interface LogUnsubscriptionMessage {
  message: 'unsubscribe_logs';
}

/**
 * Log level update message payload
 */
export interface LogLevelUpdateMessage {
  message: 'update_log_level';
  /** New log level configuration */
  logLevel: GpacLogConfig;
}

/**
 * Log status request message payload
 */
export interface LogStatusRequestMessage {
  message: 'get_log_status';
}

/**
 * Log entry notification message
 */
export interface LogEntryMessage {
  message: 'log_entry';
  /** The log entry data */
  log: GpacLogEntry;
}

/**
 * Log history message (sent on subscription)
 */
export interface LogHistoryMessage {
  message: 'log_history';
  /** Array of recent log entries */
  logs: GpacLogEntry[];
}

/**
 * Log status response message
 */
export interface LogStatusMessage {
  message: 'log_status';
  /** Current log manager status */
  status: LogManagerStatus;
}

/**
 * Log configuration changed notification
 */
export interface LogConfigChangedMessage {
  message: 'log_config_changed';
  /** New log level configuration */
  logLevel: GpacLogConfig;
}

/**
 * Union type for all log-related messages
 */
export type GpacLogMessage =
  | LogSubscriptionMessage
  | LogUnsubscriptionMessage
  | LogLevelUpdateMessage
  | LogStatusRequestMessage
  | LogEntryMessage
  | LogHistoryMessage
  | LogStatusMessage
  | LogConfigChangedMessage;

/**
 * Log level numeric mapping for comparison operations
 */
export const LOG_LEVEL_VALUES: Record<GpacLogLevel, number> = {
  [GpacLogLevel.QUIET]: 0,
  [GpacLogLevel.ERROR]: 1,
  [GpacLogLevel.WARNING]: 2,
  [GpacLogLevel.INFO]: 3,
  [GpacLogLevel.DEBUG]: 4,
} as const;

/**
 * Utility functions for log level operations
 */
export const LogLevelUtils = {
  /**
   * Get numeric value for a log level
   */
  getNumericValue: (level: GpacLogLevel): number => LOG_LEVEL_VALUES[level],

  /**
   * Check if a requested level requires more verbosity than current level
   * @param currentLevel - Currently configured level
   * @param requestedLevel - Requested level
   * @returns true if backend call is needed (requested > current)
   */
  needsBackendCall: (
    currentLevel: GpacLogLevel,
    requestedLevel: GpacLogLevel,
  ): boolean => {
    return LOG_LEVEL_VALUES[requestedLevel] > LOG_LEVEL_VALUES[currentLevel];
  },

  /**
   * Check if a requested level can be satisfied by frontend filtering
   * @param currentLevel - Currently configured level
   * @param requestedLevel - Requested level
   * @returns true if frontend filtering is sufficient (requested <= current)
   */
  canUseFrontendFiltering: (
    currentLevel: GpacLogLevel,
    requestedLevel: GpacLogLevel,
  ): boolean => {
    return LOG_LEVEL_VALUES[requestedLevel] <= LOG_LEVEL_VALUES[currentLevel];
  },

  /**
   * Compare two log levels
   * @returns negative if level1 < level2, 0 if equal, positive if level1 > level2
   */
  compare: (level1: GpacLogLevel, level2: GpacLogLevel): number => {
    return LOG_LEVEL_VALUES[level1] - LOG_LEVEL_VALUES[level2];
  },
} as const;
