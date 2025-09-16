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
 * GPAC log tools/categories based on GPAC documentation
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
  CTIME = 'ctime',
  DASH = 'dash',
  FILTER = 'filter',
  HTTP = 'http',
  INTERACT = 'interact',
  MEDIA = 'media',
  MEM = 'memory',
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
 * GPAC log entry structure
 */
export interface GpacLogEntry {
  /** Timestamp when the log was generated */
  timestamp: number;
  /** Log tool/category */
  tool: string;
  /** Log level (numeric value from GPAC) */
  level: number;
  /** Log message content */
  message: string;
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
