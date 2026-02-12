import { Sys as sys } from 'gpaccore';
import { JSClient } from './JSClient/index.js';
import { gpac_filter_to_minimal_object } from './JSClient/filterUtils.js';

// GLOBAL STATE

let all_connected = false;
let all_clients = [];
let cid = 0;
let filter_uid = 0;
let all_filters = [];

// GRAPH CHANGE DETECTION (event-driven with debounce)
const GRAPH_DEBOUNCE_US = 500 * 1000;  // 500ms stabilization
const GRAPH_MAX_WAIT_US = 3000 * 1000; // 2s max cap
let graphDirty = false;
let graphVersion = 0;
let lastGraphEventTime = 0;
let firstGraphEventTime = 0;
let debounceRunning = false;

function onGraphEvent() {
    if (!all_clients.length) return;
    const now = sys.clock_us();
    graphDirty = true;
    lastGraphEventTime = now;
    if (!firstGraphEventTime) firstGraphEventTime = now;

    if (!debounceRunning) {
        debounceRunning = true;
        session.post_task(() => {
            const now = sys.clock_us();
            const sinceLast = now - lastGraphEventTime;
            const sinceFirst = now - firstGraphEventTime;

            if (sinceLast >= GRAPH_DEBOUNCE_US || sinceFirst >= GRAPH_MAX_WAIT_US) {
                stabilizeGraph();
                debounceRunning = false;
                firstGraphEventTime = 0;
                return false;
            }
            return 100; // check again in 100ms
        });
    }
}

function stabilizeGraph() {
    graphDirty = false;
    graphVersion++;

    session.lock_filters(true);
    const filters = [];
    for (let i = 0; i < session.nb_filters; i++) {
        const f = session.get_filter(i);
        if (!f.is_destroyed()) {
            filters.push(gpac_filter_to_minimal_object(f));
        }
    }
    session.lock_filters(false);

    const filtersMsg = JSON.stringify({ message: 'filters', filters });
    const notifMsg = JSON.stringify({
        message: 'notification', type: 'graph_changed', graphVersion
    });

    for (const client of all_clients) {
        if (client.client) {
            client.client.send(filtersMsg);
            client.client.send(notifMsg);
        }
    }
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
    print("new filter " + f.name);
    f.idx = filter_uid++;
    f.iname = '' + f.idx;
    all_filters.push(f);
    if (f.itag == "NODISPLAY") return;
    onGraphEvent();
});

session.set_del_filter_fun((f) => {
    print("delete filter " + f.iname + " " + f.name);
    let idx = all_filters.indexOf(f);
    if (idx >= 0) all_filters.splice(idx, 1);
    if (f.itag == "NODISPLAY") return;
    onGraphEvent();
});


// WEBSOCKET CLIENT HANDLER

sys.rmt_on_new_client = function(client) {
    let js_client = new JSClient(++cid, client, all_clients);
    all_clients.push(js_client);

    js_client.client.on_data = (msg) => {
        if (typeof(msg) == "string")
            js_client.on_client_data(msg);
    }

    js_client.client.on_close = function() {
        js_client.cleanup();
        remove_client(js_client.id);
        js_client.client = null;
    }
};