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
    print("new filter " + f.name);
    f.idx = filter_uid++;
    f.iname = '' + f.idx;
    all_filters.push(f);

    console.log("NEW FILTER ITAG " + f.itag);
    if (f.itag == "NODISPLAY")
        return;

    if (draned_once) {
        sys.sleep(100);
    }
});

session.set_del_filter_fun((f) => {
    print("delete filter " + f.iname + " " + f.name);
    let idx = all_filters.indexOf(f);
    if (idx >= 0)
        all_filters.splice(idx, 1);

    console.log("RM FILTER ITAG " + f.itag);
    if (f.itag == "NODISPLAY")
        return;

     if (draned_once) {
        sys.sleep(100);
    } 
});
/* 
session.set_event_fun((evt) => {
    // print("Event: " + JSON.stringify(evt, null, 2));
    // if (evt.type != GF_FEVT_USER) return 0;
    // print("evt " + evt.name);
}); */


// WEBSOCKET CLIENT HANDLER

sys.rmt_on_new_client = function(client) {
    console.log("rmt on client");
    print(typeof(client));

    let draned_once_ref = { value: draned_once };
    let js_client = new JSClient(++cid, client, all_clients, draned_once_ref);
    all_clients.push(js_client);

    console.log("New ws client ", js_client.id, " gpac peer ", js_client.client.peer_address);

    js_client.client.on_data = (msg) => {
        if (typeof(msg) == "string")
            js_client.on_client_data(msg);
        else {
            let buf = new Uint8Array(msg)
            console.log("Got binary message of type", typeof(msg), "len ", buf.length, "with data:", buf);
        }
    }

    js_client.client.on_close = function() {
        console.log("ON_CLOSE on client ", js_client.id, " ", client.peer_address);

        js_client.cleanup();

        remove_client(js_client.id);
        js_client.client = null;
    }

    // Update draned_once from the reference
    draned_once = draned_once_ref.value;
};