export enum SubscriptionType {
  SESSION_STATS = 'session_stats',
  FILTER_STATS = 'filter_stats',
  CPU_STATS = 'cpu_stats',
  FILTER_ARGS_DETAILS = 'filter_args_details',
  ALL_FILTERS = 'all_filters',
  BUSY_STATE = 'busy_state',
  GRAPH_RECALCULATION_EVENTS = 'graph_recalculation_events',
  FILTER_ARGUMENT_UPDATES = 'filter_argument_updates',
}

export interface SubscriptionConfig {
  type: SubscriptionType;
  interval?: number;
  filterIdx?: number;
  filterName?: string;
  argumentName?: string;
}

export interface SubscriptionResult<T = unknown> {
  data: T;
  timestamp: number;
  subscriptionId: string;
}
export type SubscriptionCallback<T = unknown> = (
  result: SubscriptionResult<T>,
) => void;
