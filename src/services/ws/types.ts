import { SessionFilterStatistics, GraphFilterData } from '@/types/domain/gpac';
import {
  GpacLogEntry,
  LogManagerStatus,
  GpacLogConfig,
} from '@/types/domain/gpac/log-types';

// Base interface for all messages
export interface BaseWSMessage {
  type: WSMessageType;
  id: string;
}

// Base interface for all responses
export interface BaseWSResponse {
  type: WSResponseType;
  id: string;
  success: boolean;
  error?: string;
}

export interface ResponseWithMessage extends BaseWSResponse {
  message?: string;
}

export interface WSServerMessage {
  message: string;
  id: string;
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
}

// Types of messages we receive from the server
export enum WSResponseType {
  ERROR = 'ERROR',
  FILTERS_LIST = 'filters',
  FILTER_ARGS_DETAILS = 'details',
  /*  FILTERS_UPDATE = "update", */
  SESSION_STATS = 'session_stats',
  FILTER_STATS_UPDATE = 'filter_stats',
  FILE_DELETED = 'FILE_DELETED',
  CPU_STATS = 'cpu_stats',
  LOG_ENTRY = 'log_entry',
  LOG_HISTORY = 'log_history',
  LOG_STATUS = 'log_status',
  LOG_CONFIG_CHANGED = 'log_config_changed',
}

export interface GetAllFiltersMessage extends BaseWSMessage {
  type: WSMessageType.GET_ALL_FILTERS;
}

// Specialized response for the 'filters' message type
export interface FiltersListResponse extends BaseWSResponse {
  message: 'filters';
  filters: GraphFilterData[];
}

export interface SessionStatsResponse extends BaseWSResponse {
  message: 'session_stats';
  stats: SessionFilterStatistics[];
}

export interface SubscribeSessionMessage extends BaseWSMessage {
  type: WSMessageType.SUBSCRIBE_SESSION;
  interval?: number;
  fields?: string[];
}

export interface UnsubscribeSessionMessage extends BaseWSMessage {
  type: WSMessageType.UNSUBSCRIBE_SESSION;
}

//details
export interface GetArgsDetailsMessage extends BaseWSMessage {
  type: WSMessageType.FILTER_ARGS_DETAILS;
  idx: number;
}

export interface StopArgsDetailsMessage extends BaseWSMessage {
  type: WSMessageType.STOP_FILTER_ARGS;
  idx: number;
}

export interface GetPngMessage extends BaseWSMessage {
  type: WSMessageType.GET_PNG;
  idx: number;
  name: string;
}

export interface UpdateArgMessage extends BaseWSMessage {
  type: WSMessageType.UPDATE_ARG;
  idx: number;
  name: string;
  argName: string;
  newValue: string | number | boolean;
}

// Specific response types
export interface ErrorResponse extends BaseWSResponse {
  type: WSResponseType.ERROR;
  message: string;
}

export interface SubscribeFilterStatsMessage extends BaseWSMessage {
  type: WSMessageType.SUBSCRIBE_FILTER_STATS;
  idx: number;
  interval?: number;
  fields?: string[];
}

export interface UnsubscribeFilterStatsMessage extends BaseWSMessage {
  type: WSMessageType.UNSUBSCRIBE_FILTER_STATS;
  idx: number;
}

export interface SubscribeCPUStatsMessage extends BaseWSMessage {
  type: WSMessageType.SUBSCRIBE_CPU_STATS;
  interval?: number;
  fields?: string[];
}
export interface UnsubscribeCPUStatsMessage extends BaseWSMessage {
  type: WSMessageType.UNSUBSCRIBE_CPU_STATS;
}

export interface SubscribeLogsMessage extends BaseWSMessage {
  type: WSMessageType.SUBSCRIBE_LOGS;
  logLevel?: GpacLogConfig;
}

export interface UnsubscribeLogsMessage extends BaseWSMessage {
  type: WSMessageType.UNSUBSCRIBE_LOGS;
}

export interface UpdateLogLevelMessage extends BaseWSMessage {
  type: WSMessageType.UPDATE_LOG_LEVEL;
  logLevel: GpacLogConfig;
}

export interface GetLogStatusMessage extends BaseWSMessage {
  type: WSMessageType.GET_LOG_STATUS;
}

export interface LogEntryResponse extends BaseWSResponse {
  message: 'log_entry';
  log: GpacLogEntry;
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

export type WSMessage =
  | GetAllFiltersMessage
  | GetArgsDetailsMessage
  | StopArgsDetailsMessage
  | GetPngMessage
  | UpdateArgMessage
  | SubscribeSessionMessage
  | UnsubscribeSessionMessage
  | SubscribeFilterStatsMessage
  | UnsubscribeFilterStatsMessage
  | SubscribeCPUStatsMessage
  | UnsubscribeCPUStatsMessage
  | SubscribeLogsMessage
  | UnsubscribeLogsMessage
  | UpdateLogLevelMessage
  | GetLogStatusMessage;

export type WSResponse = ErrorResponse | FiltersListResponse;
