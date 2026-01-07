import { GpacServiceState } from './service.types';
import {
  SubscriptionCallback,
  SubscriptionConfig,
  SubscriptionType,
} from '@/types/communication/subscription';
import { GpacLogConfig } from '@/types/domain/gpac/log-types';
import { generateID } from '@/utils/core';

export const subscriptionMethods = {
  /**
   * Get log handler (for direct access)
   */
  getLogs(state: GpacServiceState) {
    return state.messageHandler.getLogHandler();
  },

  /**
   * Subscribe to GPAC data updates
   * Supports SESSION_STATS, FILTER_STATS, CPU_STATS, LOGS, FILTER_ARGS_DETAILS
   */
  async subscribe<T = unknown>(
    state: GpacServiceState,
    config: SubscriptionConfig,
    callback: SubscriptionCallback<T>,
    isLoaded: () => boolean,
  ): Promise<() => void> {
    if (!isLoaded()) {
      throw new Error('Service not loaded');
    }

    const subscriptionId = generateID();

    switch (config.type) {
      case SubscriptionType.SESSION_STATS:
        return state.messageHandler
          .getSessionStatsHandler()
          .subscribeToSessionStats((data) => {
            callback({
              data: data as T,
              timestamp: Date.now(),
              subscriptionId,
            });
          });

      case SubscriptionType.FILTER_STATS: {
        if (config.filterIdx === undefined) {
          throw new Error(
            'filterIdx is required for FILTER_STATS subscription',
          );
        }
        const filterIdx = config.filterIdx;
        state.filterSubscriptionsStore.addFilter(filterIdx);
        const unsubscribeFromFilterStats = state.messageHandler
          .getFilterStatsHandler()
          .subscribeToFilterStatsUpdates(filterIdx, (data) => {
            callback({
              data: data as T,
              timestamp: Date.now(),
              subscriptionId,
            });
          });
        return () => {
          state.filterSubscriptionsStore.removeFilter(filterIdx);
          unsubscribeFromFilterStats();
        };
      }

      case SubscriptionType.CPU_STATS:
        return state.messageHandler
          .getCPUStatsHandler()
          .subscribeToCPUStatsUpdates((data) => {
            callback({
              data: data as T,
              timestamp: Date.now(),
              subscriptionId,
            });
          });

      case SubscriptionType.LOGS:
        return state.messageHandler
          .getLogHandler()
          .subscribeToLogEntries((data) => {
            callback({
              data: data as T,
              timestamp: Date.now(),
              subscriptionId,
            });
          }, config.logLevel as GpacLogConfig);

      case SubscriptionType.FILTER_ARGS_DETAILS:
        if (typeof config.filterIdx !== 'number') {
          throw new Error(
            'filterIdx is required for FILTER_ARGS_DETAILS subscription',
          );
        }
        return state.messageHandler
          .getFilterArgsHandler()
          .subscribeToFilterArgsDetails(
            config.filterIdx,
            (data) => {
              callback({
                data: data as T,
                timestamp: Date.now(),
                subscriptionId,
              });
            },
            config.interval || 1000,
          );

      default:
        throw new Error(`Unsupported subscription type: ${config.type}`);
    }
  },
};
