import { Sys as sys } from 'gpaccore';
import { HistoryWriter } from './HistoryWriter.js';

const RATE_LIMIT_US = 1000 * 1000; // 1s

/**

 * Writes one record per filter per tick (flat format).
 * Grafted into the shared monitoring loop (no own post_task).
 *
 * Usage in server.js:
 *   historyCollector.recordGraph(filters, graphVersion) — on graph stabilization
 *   historyCollector.recordStats(graphVersion)          — on each monitoring tick
 *   historyCollector.close()                            — on session end
 */
function HistoryCollector(historyDir) {
    this.writer = new HistoryWriter(historyDir);
    this.lastRecordUs = 0;

    /** Record a graph topology snapshot */
    this.recordGraph = function(filters, graphVersion) {
        const ts_us = sys.clock_us();
        this.writer.write(JSON.stringify({
            type: 'graph',
            graph_v: graphVersion,
            ts_us,
            filters_json: JSON.stringify(filters),
        }));
    };

    /** Collect and record stats for ALL active filters (rate-limited to 1s) */
    this.recordStats = function(graphVersion) {
        const ts_us = sys.clock_us();
        if (ts_us - this.lastRecordUs < RATE_LIMIT_US) return;
        this.lastRecordUs = ts_us;

        session.lock_filters(true);
        for (let i = 0; i < session.nb_filters; i++) {
            const f = session.get_filter(i);
            if (f.is_destroyed()) continue;
            this.writer.write(JSON.stringify({
                type: 'metric',
                ts_us,
                graph_v: graphVersion,
                idx: f.idx,
                bytes_done: f.bytes_done,
                bytes_sent: f.bytes_sent,
                pck_done: f.pck_done,
                pck_sent: f.pck_sent,
                time: f.time,
                nb_ipid: f.nb_ipid,
                nb_opid: f.nb_opid,
                errors: f.errors,
            }));
        }
        session.lock_filters(false);
    };

    /** Close the history file (call on session end) */
    this.close = function() {
        this.writer.close();
    };
}

export { HistoryCollector };
