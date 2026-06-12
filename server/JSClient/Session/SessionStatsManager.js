import { DEFAULT_FILTER_FIELDS, UPDATE_INTERVALS } from '../config.js';
import { cacheManager } from '../Cache/CacheManager.js';
import { buildSessionStatsPayload } from './buildSessionStatsPayload.js';

/**
 * SessionStatsManager - Manages session statistics collection
 *
 * Responsibilities:
 * - Subscribe/unsubscribe to session stats
 * - Send session_stats messages to client
 */
function SessionStatsManager(client) {
    this.client = client;
    this.isSubscribed = false;
    this.interval = UPDATE_INTERVALS.SESSION_STATS;
    this.fields = [];
    this.lastSentMetrics = '';

    this.subscribe = function(fields) {
        this.isSubscribed = true;
        this.interval = UPDATE_INTERVALS.SESSION_STATS;
        this.fields = fields || DEFAULT_FILTER_FIELDS;
    };

    this.unsubscribe = function() {
        this.isSubscribed = false;
    };

    /**
     * Collect session statistics and send to client
     * Called by SessionManager on each tick
     */
    this.tick = function(now) {
        if (!this.isSubscribed) return;

        // Use cache to avoid redundant serialization for multiple clients
        const serialized = cacheManager.getOrSet('session_stats', 50, () => {
            const { all_packets_done, stats } = buildSessionStatsPayload(session, this.fields);
            return JSON.stringify({ message: 'session_stats', all_packets_done, stats });
        });

        if (this.client.client) {
            this.client.client.send(serialized);
        }

        const sessionMetrics = session.session_metrics;
        if (sessionMetrics && sessionMetrics !== this.lastSentMetrics && this.client.client) {
            this.lastSentMetrics = sessionMetrics;
            this.client.client.send(JSON.stringify({
                message: 'session_metrics',
                data: sessionMetrics
            }));
            print('Sent session_metrics to client');
        }
    };

    this.cleanup = function() {
        this.isSubscribed = false;
        this.lastSentMetrics = '';
    };

    this.handleSessionEnd = function() {
        this.unsubscribe();
    };
}

export { SessionStatsManager };
