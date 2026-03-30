import { Sys as sys } from 'gpaccore';
import { HistoryWriter } from './HistoryWriter.js';
import { PidDataCollector } from '../JSClient/Filters/PID/PidDataCollector.js';

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

    /** Record graph topology change as WS-format event.
     *  Normalizes ipid/opid (singular, from gpac_filter_to_minimal_object)
     *  to ipids/opids (plural) — consistent with snapshot.json format. */
    this.recordGraph = function(filters, filterInstances, graphVersion) {
        const pidCollector = graphVersion > 1 ? new PidDataCollector() : null;
        const normalizedFilters = filters.map((f, i) => {
            const { ipid, opid, ...rest } = f;
            const entry = { ...rest, ipids: ipid ?? {}, opids: opid ?? {} };
            if (pidCollector) {
                const inst = filterInstances[i];
                entry.properties = {
                    ipids: pidCollector.collectInputPids(inst),
                    opids: pidCollector.collectOutputPids(inst),
                };
                entry.gpac_args = inst.all_args(true).filter(Boolean);
            }
            return entry;
        });
        const filtersTsUs = sys.clock_us();
        this.writer.writeEvent(JSON.stringify({
            version: EVENT_VERSION,
            message: 'filters',
            ts_us: filtersTsUs,
            graph_v: graphVersion,
            filters: normalizedFilters,
        }), filtersTsUs);
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
