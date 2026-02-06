import { Sys as sys } from 'gpaccore';
import { JSClient } from './JSClient/index.js';

// GLOBAL STATE

let all_connected = false;
let all_clients = [];
let cid = 0;
let filter_uid = 0;
let draned_once = false;
let all_filters = [];


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

    if (f.itag == "NODISPLAY")
        return;

    if (draned_once) {
        sys.sleep(100);
    }
});

session.set_del_filter_fun((f) => {
    let idx = all_filters.indexOf(f);
    if (idx >= 0)
        all_filters.splice(idx, 1);

    if (f.itag == "NODISPLAY")
        return;

     if (draned_once) {
        sys.sleep(100);
    } 
});


// WEBSOCKET CLIENT HANDLER

sys.rmt_on_new_client = function(client) {
    let draned_once_ref = { value: draned_once };
    let js_client = new JSClient(++cid, client, all_clients, draned_once_ref);
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

    // Update draned_once from the reference
    draned_once = draned_once_ref.value;
};