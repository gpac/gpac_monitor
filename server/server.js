import { Sys as sys } from 'gpaccore';
import { JSClient } from './JSClient/index.js';
import { HistoryCollector } from './history/HistoryCollector.js';
import { GraphManager } from './GraphManager.js';
import { DEFAULT_FILTER_FIELDS } from './JSClient/config.js';

// HISTORY
const historyCollector = new HistoryCollector();

// GLOBAL STATE
let all_clients = [];
let cid = 0;
let filter_uid = 0;
let all_filters = [];

// GRAPH MANAGER
const graphManager = new GraphManager({
    getClients: () => all_clients,
    historyCollector,
    ensureMonitoringLoop,
});

// SHARED MONITORING LOOP (single post_task for all clients)
let monitoringRunning = false;

function ensureMonitoringLoop() {
    if (monitoringRunning) return;
    monitoringRunning = true;

    session.post_task(() => {
        const now = sys.clock_us();

        if (session.last_task) {
            for (const client of all_clients) client.sessionManager.handleSessionEnd(now);
            historyCollector.close();
            monitoringRunning = false;
            return false;
        }

        let active = false;
        let interval = 1000;
        for (const client of all_clients) {
            client.sessionManager.tick(now);
            if (client.sessionManager.hasActiveSubscriptions()) {
                active = true;
                interval = Math.min(interval, client.sessionManager.getMinInterval());
            }
        }

        // History: record session stats and cpu stats
        historyCollector.recordSessionStats(collectSessionStatsPayload());
        historyCollector.recordCpuStats(collectCpuStatsPayload());

        // Keep loop alive for history even without active client subscriptions
        return active ? interval : 1000;
    });
}

function collectSessionStatsPayload() {
    const stats = [];
    const filters = [];

    session.lock_filters(true);
    for (let i = 0; i < session.nb_filters; i++) {
        const f = session.get_filter(i);
        if (f.is_destroyed()) continue;
        filters.push(f);

        const obj = {};
        for (const field of DEFAULT_FILTER_FIELDS) obj[field] = f[field];

        let allInputsEos = f.nb_ipid > 0;
        for (let j = 0; j < f.nb_ipid; j++) {
            if (!f.ipid_props(j, 'eos')) { allInputsEos = false; break; }
        }
        obj.is_eos = allInputsEos;
        obj.last_ts_sent = f.last_ts_sent || null;

        stats.push(obj);
    }

    let allFiltersEos = filters.length > 0;
    for (const f of filters) {
        if (f.nb_ipid === 0) continue;
        for (let i = 0; i < f.nb_ipid; i++) {
            if (!f.ipid_props(i, 'eos')) { allFiltersEos = false; break; }
        }
    }
    const all_packets_done = session.last_task && allFiltersEos;
    session.lock_filters(false);

    return { all_packets_done, stats };
}

function collectCpuStatsPayload() {
    return {
        stats: {
            total_cpu_usage: sys.total_cpu_usage,
            process_cpu_usage: sys.process_cpu_usage,
            process_memory: sys.process_memory,
            physical_memory: sys.physical_memory,
            physical_memory_avail: sys.physical_memory_avail,
            gpac_memory: sys.gpac_memory,
            nb_cores: sys.nb_cores,
            thread_count: sys.thread_count,
        }
    };
}

// SESSION CONFIGURATION
session.reporting(true);

// CLIENT MANAGEMENT
let remove_client = function(client_id) {
    for (let i = 0; i < all_clients.length; i++) {
        if (all_clients[i].id == client_id) {
            all_clients.splice(i, 1);
            return;
        }
    }
};

// FILTER EVENT HANDLERS
session.set_new_filter_fun((f) => {
    f.idx = filter_uid++;
    f.iname = '' + f.idx;
    all_filters.push(f);
    if (f.itag == "NODISPLAY") return;
    graphManager.onGraphEvent();
});

session.set_del_filter_fun((f) => {
    let idx = all_filters.indexOf(f);
    if (idx >= 0) all_filters.splice(idx, 1);
    if (f.itag == "NODISPLAY") return;
    graphManager.onGraphEvent();
});

// WEBSOCKET CLIENT HANDLER
sys.rmt_on_new_client = function(client) {
    let js_client = new JSClient(++cid, client, all_clients, ensureMonitoringLoop, historyCollector);
    all_clients.push(js_client);

    js_client.client.on_data = (msg) => {
        if (typeof(msg) == "string")
            js_client.on_client_data(msg);
    };

    js_client.client.on_close = function() {
        js_client.cleanup();
        remove_client(js_client.id);
        js_client.client = null;
    };
};
