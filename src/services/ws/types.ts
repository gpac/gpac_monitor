import {
  GpacLogEntry,
  LogManagerStatus,
  GpacLogConfig,
} from '@/types/domain/gpac/log-types';

// Base interface for all responses
interface BaseWSResponse {
  type: WSResponseType;
  id: string;
  success: boolean;
  error?: string;
}

// Types of messages we send to the server
export enum WSMessageType {
  GET_ALL_FILTERS = 'get_all_filters',
  FILTER_ARGS_DETAILS = 'filter_args_details',
  STOP_FILTER_ARGS = 'stop_filter_args',
  UPDATE_ARG = 'update_arg',
  SUBSCRIBE_SESSION = 'subscribe_session',
  UNSUBSCRIBE_SESSION = 'unsubscribe_session',
  SUBSCRIBE_FILTER_STATS = 'subscribe_filter',
  UNSUBSCRIBE_FILTER_STATS = 'unsubscribe_filter',
  SUBSCRIBE_CPU_STATS = 'subscribe_cpu_stats',
  UNSUBSCRIBE_CPU_STATS = 'unsubscribe_cpu_stats',
  SUBSCRIBE_LOGS = 'subscribe_logs',
  UNSUBSCRIBE_LOGS = 'unsubscribe_logs',
  UPDATE_LOG_LEVEL = 'update_log_level',
  GET_LOG_STATUS = 'get_log_status',
  GET_PNG = 'get_png',
  GET_COMMAND_LINE = 'get_command_line',
}

// Types of messages we receive from the server
enum WSResponseType {
  ERROR = 'ERROR',
  FILTERS_LIST = 'filters',
  FILTER_ARGS_DETAILS = 'details',
  SESSION_STATS = 'session_stats',
  FILTER_STATS_UPDATE = 'filter_stats',
  FILE_DELETED = 'FILE_DELETED',
  CPU_STATS = 'cpu_stats',
  LOG_ENTRY = 'log_entry',
  LOG_HISTORY = 'log_history',
  LOG_STATUS = 'log_status',
  LOG_CONFIG_CHANGED = 'log_config_changed',
  COMMAND_LINE_RESPONSE = 'command_line_response',
  SESSION_END = 'session_end',
}

export interface LogBatchResponse extends BaseWSResponse {
  message: 'log_batch';
  logs: GpacLogEntry[];
}

export interface LogHistoryResponse extends BaseWSResponse {
  message: 'log_history';
  logs: GpacLogEntry[];
}

export interface LogStatusResponse extends BaseWSResponse {
  message: 'log_status';
  status: LogManagerStatus;
}

export interface LogConfigChangedResponse extends BaseWSResponse {
  message: 'log_config_changed';
  logLevel: GpacLogConfig;
}
