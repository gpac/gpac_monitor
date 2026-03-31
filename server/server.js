import { Sys as sys } from 'gpaccore';
import { JSClient } from './JSClient/index.js';
import { HistoryCollector } from './history/HistoryCollector.js';
import { GraphManager } from './GraphManager.js';
import { buildSessionStatsPayload } from './JSClient/Session/buildSessionStatsPayload.js';
import { buildCpuStatsPayload } from './JSClient/Sys/buildCpuStatsPayload.js';

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
            // Record final state before closing so history captures all EOS flags
            historyCollector.recordSessionStats(buildSessionStatsPayload(session), true);
            historyCollector.recordCpuStats(buildCpuStatsPayload());
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
        historyCollector.recordSessionStats(buildSessionStatsPayload(session));
        historyCollector.recordCpuStats(buildCpuStatsPayload());

        // Keep loop alive for history even without active client subscriptions
        return active ? interval : 1000;
    });
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
