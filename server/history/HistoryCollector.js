import { Sys as sys } from 'gpaccore';
import { HistoryWriter } from './HistoryWriter.js';
import { PidDataCollector } from '../JSClient/Filters/PID/PidDataCollector.js';
import { logHub } from '../JSClient/Sys/Utils/LogHub.js';

const RATE_LIMIT_US = 1000 * 1000;
const EVENT_VERSION = 1;
const LOG_ID = '_hist_';

function HistoryCollector(historyDir) {
    this.writer = new HistoryWriter(historyDir);
    this.snapshotWritten = false;
    this.lastRecordUs = 0;
    this.pendingLogs = [];
    this.logBatchTimer = null;

    this.startLogCapture = function() {
        logHub.add(LOG_ID, this);
    };

    this.writeSnapshot = function(data) {
        if (this.snapshotWritten) return;
        this.writer.writeSnapshot(data);
        this.snapshotWritten = true;
    };

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

    this.recordSessionStats = function(payload, force) {
        const ts_us = sys.clock_us();
        if (!force && ts_us - this.lastRecordUs < RATE_LIMIT_US) return;
        this.lastRecordUs = ts_us;
        this.writer.writeEvent(JSON.stringify({
            version: EVENT_VERSION,
            message: 'session_stats',
            ts_us,
            ...payload,
        }), ts_us);
    };

    this.recordCpuStats = function(payload) {
        const cpuTsUs = sys.clock_us();
        this.writer.writeEvent(JSON.stringify({
            version: EVENT_VERSION,
            message: 'cpu_stats',
            ts_us: cpuTsUs,
            ...payload,
        }), cpuTsUs);
    };

    this.recordFilterArgsUpdate = function(filterIdx, argName, newValue) {
        const argsTsUs = sys.clock_us();
        this.writer.writeEvent(JSON.stringify({
            version: EVENT_VERSION,
            message: 'filter_args_update',
            ts_us: argsTsUs,
            payload: { filter_idx: filterIdx, arg_name: argName, value: newValue },
        }), argsTsUs);
    };

    this.recordLogConfigChanged = function(logLevel) {
        const tsUs = sys.clock_us();
        this.writer.writeLog(JSON.stringify({
            version: EVENT_VERSION,
            message: 'log_config_changed',
            ts_us: tsUs,
            logLevel,
        }));
    };

    this.handleLog = function(tool, level, message, thread_id, caller) {
        this.pendingLogs.push({
            timestamp: sys.clock_us(),
            tool, level,
            message: message?.length > 500 ? message.substring(0, 500) + '...' : message,
            thread_id,
            caller: caller?.idx !== undefined ? caller.idx : (caller?.name || null),
        });
        if (!this.logBatchTimer) {
            this.logBatchTimer = true;
            session.post_task(() => { this.flushLogs(); return false; });
        }
    };

    this.flushLogs = function() {
        if (this.pendingLogs.length) {
            const tsUs = sys.clock_us();
            this.writer.writeLog(JSON.stringify({
                version: EVENT_VERSION,
                message: 'log_batch',
                ts_us: tsUs,
                logs: this.pendingLogs,
            }));
            this.pendingLogs = [];
        }
        this.logBatchTimer = null;
    };

    /** LogHub subscriber interface — called on config changes */
    this.sendToClient = function(data) {
        if (data.message === 'log_config_changed') {
            this.recordLogConfigChanged(data.logLevel);
        }
    };

    this.close = function() {
        logHub.remove(LOG_ID);
        this.flushLogs();
        this.writer.close();
    };
}

export { HistoryCollector };
