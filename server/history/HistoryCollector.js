import { HistoryWriter } from './HistoryWriter.js';
import { DEFAULT_FILTER_FIELDS } from '../JSClient/config.js';

/**
 * HistoryCollector - Autonomous session history recorder
 *
 * Collects ALL filters stats independently of client subscriptions.
 * Grafted into the shared monitoring loop (no own post_task).
 *
 * Usage in server.js:
 *   historyCollector.recordGraph(filtersMsg)  — on graph stabilization
 *   historyCollector.recordStats()            — on each monitoring tick
 *   historyCollector.close()                  — on session end
 */
function HistoryCollector(historyDir) {
    this.writer = new HistoryWriter(historyDir);

    /** Record a graph topology snapshot (already serialized) */
    this.recordGraph = function(filtersJsonString) {
        this.writer.write(filtersJsonString);
    };

    /** Collect and record stats for ALL active filters */
    this.recordStats = function() {
        const stats = [];
        session.lock_filters(true);
        for (let i = 0; i < session.nb_filters; i++) {
            const f = session.get_filter(i);
            if (f.is_destroyed()) continue;
            const obj = {};
            for (const field of DEFAULT_FILTER_FIELDS) {
                obj[field] = f[field];
            }
            stats.push(obj);
        }
        session.lock_filters(false);

        if (stats.length > 0) {
            this.writer.write(JSON.stringify({
                message: 'session_stats',
                stats
            }));
        }
    };

    /** Close the history file (call on session end) */
    this.close = function() {
        this.writer.close();
    };
}

export { HistoryCollector };
