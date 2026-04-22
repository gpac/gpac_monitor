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
    this.lastCpuRecordUs = 0;
    this.pendingLogs = [];
    this.logBatchTimer = null;
    this._latestStructural = null;
    this._currentPidState = null;
    this._chunkNeedsCheckpoint = false;
  
    this._writeCheckpointIfNeeded = function(tsUs) {
        if (!this._latestStructural) return;
        const chunkIndex = this.writer.getCurrentChunkIndex();
        this.writer.writeCheckpoint(chunkIndex, {
            version: this._latestStructural.version,
            ts_us: tsUs,
            graph_v: this._latestStructural.graph_v,
            filters: this._latestStructural.filters,
        });
    };

    this._onChunkRotated = function(tsUs) {
     this._writeCheckpointIfNeeded(tsUs);
};

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

        if (!this.snapshotWritten) {
            this.writeSnapshot({
                version: EVENT_VERSION,
                ts_us: filtersTsUs,
                command_line: null,
                graph_v: graphVersion,
                filters: normalizedFilters,
            });
        }

        const rotated = this.writer.writeEvent(JSON.stringify({
            version: EVENT_VERSION,
            message: 'filters',
            ts_us: filtersTsUs,
            graph_v: graphVersion,
            filters: normalizedFilters,
        }), filtersTsUs);
        this._latestStructural = { version: EVENT_VERSION, graph_v: graphVersion, filters: normalizedFilters };
        this._currentPidState = normalizedFilters.reduce((acc, filter) => {
            acc[filter.idx] = {
                ipids: filter.properties?.ipids ?? filter.ipids ?? {},
            };
            return acc;
        }, {});
        this._chunkNeedsCheckpoint = true;
        if (rotated) this._onChunkRotated(filtersTsUs);
    };

    this.recordSessionStats = function(payload, force) {
        const ts_us = sys.clock_us();
        if (!force && ts_us - this.lastRecordUs < RATE_LIMIT_US) return;
        this.lastRecordUs = ts_us;
        const rotated = this.writer.writeEvent(JSON.stringify({
            version: EVENT_VERSION,
            message: 'session_stats',
            ts_us,
            ...payload,
        }), ts_us);
    if (rotated) this._onChunkRotated(ts_us);
    };

    this.recordCpuStats = function(payload) {
        const cpuTsUs = sys.clock_us();
        if (cpuTsUs - this.lastCpuRecordUs < RATE_LIMIT_US) return;
        this.lastCpuRecordUs = cpuTsUs;
        const rotated = this.writer.writeEvent(JSON.stringify({
            version: EVENT_VERSION,
            message: 'cpu_stats',
            ts_us: cpuTsUs,
            ...payload,
        }), cpuTsUs);
        if (rotated) this._onChunkRotated(cpuTsUs);
    };

    this.recordPidReconfigured = function(indexes, pidsByFilter) {
        const tsUs = sys.clock_us();
        for (const idx of indexes) {
            if (pidsByFilter[idx]) {
                this._currentPidState[idx] = { ipids: pidsByFilter[idx].ipids ?? {} };
            }
        }
        this._chunkNeedsCheckpoint = true;
        const rotated = this.writer.writeEvent(JSON.stringify({
            version: EVENT_VERSION,
            message: 'filter_pid_reconfigured',
            ts_us: tsUs,
            indexes,
            pidsByFilter,
        }), tsUs);
       if (rotated) this._onChunkRotated(tsUs);
    };

    this.recordArgUpdated = function(indexes, argsByFilter) {
        const tsUs = sys.clock_us();
        const rotated = this.writer.writeEvent(JSON.stringify({
            version: EVENT_VERSION,
            message: 'filter_arg_updated',
            ts_us: tsUs,
            indexes,
            argsByFilter,
        }), tsUs);
       if (rotated) this._onChunkRotated(tsUs);
    };

    this.recordFilterArgsUpdate = function(filterIdx, argName, newValue) {
        const argsTsUs = sys.clock_us();
        const rotated = this.writer.writeEvent(JSON.stringify({
            version: EVENT_VERSION,
            message: 'filter_args_update',
            ts_us: argsTsUs,
            payload: { filter_idx: filterIdx, arg_name: argName, value: newValue },
        }), argsTsUs);
        if (rotated) this._onChunkRotated(argsTsUs);
    };

    this.recordLogConfigChanged = function(logLevel) {
        const tsUs = sys.clock_us();
        this.writer.writeLog(JSON.stringify({
            version: EVENT_VERSION,
            message: 'log_config_changed',
            ts_us: tsUs,
            logLevel,
        }), tsUs);
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
            }), tsUs);
            this.pendingLogs = [];
        }
        this.logBatchTimer = null;
    };

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
