import { Sys as sys } from 'gpaccore';
import { HistoryWriter } from './HistoryWriter.js';

const RATE_LIMIT_US = 1000 * 1000; // 1s
const EVENT_VERSION = 1;

/**
 * HistoryCollector - Records session history into snapshot.json + events.jsonl
 *
 * Grafted into the shared monitoring loop (no own post_task).
 *
 * Usage in server.js:
 *   historyCollector.writeSnapshot(data)          — once, on first graph stabilization
 *   historyCollector.recordGraph(filters, gv)     — on each graph change
 *   historyCollector.recordSessionStats(payload)  — on each monitoring tick
 *   historyCollector.recordCpuStats(payload)      — on each monitoring tick
 *   historyCollector.close()                      — on session end
 */
function HistoryCollector(historyDir) {
    this.writer = new HistoryWriter(historyDir);
    this.snapshotWritten = false;
    this.lastRecordUs = 0;

    /** Write enriched snapshot once (call from stabilizeGraph on first stabilization) */
    this.writeSnapshot = function(data) {
        if (this.snapshotWritten) return;
        this.writer.writeSnapshot(data);
        this.snapshotWritten = true;
    };

    /** Record graph topology change as WS-format event */
    this.recordGraph = function(filters, graphVersion) {
        const ts_us = sys.clock_us();
        this.writer.writeEvent(JSON.stringify({
            version: EVENT_VERSION,
            message: 'filters',
            ts_us,
            graph_v: graphVersion,
            filters,
        }));
    };

    /** Record session_stats as WS-format event (rate-limited to 1s) */
    this.recordSessionStats = function(payload) {
        const ts_us = sys.clock_us();
        if (ts_us - this.lastRecordUs < RATE_LIMIT_US) return;
        this.lastRecordUs = ts_us;
        this.writer.writeEvent(JSON.stringify({
            version: EVENT_VERSION,
            message: 'session_stats',
            ts_us,
            ...payload,
        }));
    };

    /** Record cpu_stats as WS-format event */
    this.recordCpuStats = function(payload) {
        this.writer.writeEvent(JSON.stringify({
            version: EVENT_VERSION,
            message: 'cpu_stats',
            ts_us: sys.clock_us(),
            ...payload,
        }));
    };

    /** Record a filter argument update */
    this.recordFilterArgsUpdate = function(filterIdx, argName, newValue) {
        this.writer.writeEvent(JSON.stringify({
            version: EVENT_VERSION,
            message: 'filter_args_update',
            ts_us: sys.clock_us(),
            payload: { filter_idx: filterIdx, arg_name: argName, value: newValue },
        }));
    };

    /** Close the history file (call on session end) */
    this.close = function() {
        this.writer.close();
    };
}

export { HistoryCollector };
