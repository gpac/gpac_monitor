import { Sys as sys } from 'gpaccore'

let all_filters = [];
let all_connected = false;

const DEFAULT_FILTER_FIELDS = [
    "idx", "bytes_done", "bytes_sent", "pck_sent", "pck_done", "time", "nb_ipid", "nb_opid"
  ];

const CPU_STATS_FIELDS = ["total_cpu_usage", "process_cpu_usage",
    "process_memory", "physical_memory", "physical_memory_avail",
    "gpac_memory", "thread_count",];

session.reporting(true);

function on_all_connected(cb) {
session.post_task(() => {
let local_connected = true;
let all_filters_instances = [];

session.lock_filters(true);
    for (let i = 0; i < session.nb_filters; i++) {
        const f = session.get_filter(i);
        if (f.is_destroyed()) continue;

        all_filters_instances.push(f);
    }
    session.lock_filters(false);

    if (local_connected) {

        cb(all_filters_instances);

        draned_once = true;
        return false;
    }
    return 2000;
});


}

let filter_props_lite = ['name', 'status', 'bytes_done', 'type', 'ID', 'nb_ipid', 'nb_opid', 'idx', 'itag','pck_sent','pck_done','time']
let filter_args_lite = []
let pid_props_lite = []

function gpac_filter_to_object(f, full=false) {
let jsf = {};

for (let prop in f) {
    if (full || filter_props_lite.includes(prop))
        jsf[prop] = f[prop];
}

jsf['gpac_args'] = [] ; // filtrer par type de filtre ?

if (full) {		//TODO: remove tmp hack to avoid pfmt error on ffenc
    // let all_args = f.all_args(false); // full args
    let all_args = f.all_args(true); // full args => error in js interface (param is reverse of value_only)
    // console.log(JSON.stringify(all_args));
    for (let arg of all_args) {
        if (arg && (full || filter_args_lite.includes(arg.name)))
            jsf['gpac_args'].push(arg)

    }
}

jsf['ipid'] = {};
jsf['opid'] = {};

for (let d=0; d<f.nb_ipid; d++) {
    let pidname = f.ipid_props(d, "name");
    let jspid = {};

    f.ipid_props(d, (name, type, val) => {
        if (full || pid_props_lite.includes(name))
            jspid[name] = {'type': type, 'val': val};

    });
    jspid["buffer"] = f.ipid_props(d, "buffer");
    jspid["buffer_total"] = f.ipid_props(d, "buffer_total");
    jspid['source_idx'] = f.ipid_source(d).idx;

    jsf['ipid'][pidname] = jspid;
}

for (let d=0; d<f.nb_opid; d++) {
    let pidname = f.opid_props(d, "name");
    let jspid = {};

    f.opid_props(d, (name, type, val) => {
        if (full || pid_props_lite.includes(name))
            jspid[name] = {'type': type, 'val': val};

    });
    jspid["buffer"] = f.opid_props(d, "buffer");
    jspid["buffer_total"] = f.opid_props(d, "buffer_total");
    jsf['opid'][pidname] = jspid;
}

return jsf;
}
function gpac_filter_to_minimal_object(f) {
const minimalFilters = {
idx: f.idx,
name: f.name,
type: f.type,
status: f.status,
itag: f.itag || null,
ID:       f.ID || null,
nb_ipid:  f.nb_ipid,
nb_opid:  f.nb_opid,
ipid:     {},
opid:     {}
};

for(let i = 0; i < f.nb_ipid; i++) {
    const pidName = f.ipid_props(i, "name");
    minimalFilters.ipid[pidName] = {
        source_idx: f.ipid_source(i).idx,
    };
}
for (let o = 0; o < f.nb_opid; o++) {
    const pidName = f.opid_props(o, "name");
    minimalFilters.opid[pidName] = {};
  }

return minimalFilters;


}
let filter_uid = 0;
let draned_once = false;

session.set_new_filter_fun( (f) => {
print("new filter " + f.name);
f.idx = filter_uid++;
f.iname = ''+f.idx;
// let jsf = gpac_filter_to_object(f);
// print(JSON.stringify(jsf, null, 2));
all_filters.push(f);

console.log("NEW FILTER ITAG " + f.itag);
    if (f.itag == "NODISPLAY")
        return

    if (draned_once) {
        sys.sleep(100);
        //send_all_filters(); //TODO: broadcast
    }


} );

session.set_del_filter_fun( (f) => {
print("delete filter " + f.iname + " " + f.name);
let idx = all_filters.indexOf(f);
if (idx>=0)
all_filters.splice(idx, 1);

console.log("RM FILTER ITAG " + f.itag);
if (f.itag == "NODISPLAY")
    return

if (draned_once) {
    sys.sleep(100);
    //send_all_filters(); //TODO: broadcast
}


});

session.set_event_fun( (evt) => {
// print("Event: " + JSON.stringify(evt, null, 2));
// if (evt.type != GF_FEVT_USER) return 0;
//print("evt " + evt.name);
});

let all_clients = [];
let cid = 0;

let remove_client = function(client_id)  {
for (let i = 0; i<all_clients.length; i++) {
if (all_clients[i].id == client_id) {
all_clients.splice(i,1);
return
}
}
}



function JSClient(id, client) {
    this.id = id;
    this.client = client;
    // Gpac_args
    this.details_needed = {};

    // Subscription for filter stats
    this.filterSubscriptions = {};

    //subscription state and session parameters
    this.isSessionSubscribed = false;
    this.sessionInterval = 1000;
    this.sessionFields   = [];

    // CPU subscriptions
    this.isCpuStatsSubscribed = false;
    this.cpuStatsInterval = 50;
    this.cpuStatsFields = CPU_STATS_FIELDS;

    this.on_client_data = function(msg) {

        console.log("All clients:");
        for (let jc of all_clients) {
            console.log("Client ", jc.id, jc.client.peer_address );
            // console.log("Client ", jc.id, typeof(jc.gpac) );

        }

        console.log("on_client_data on client id ", this.id, " len ", msg.length, msg);
   
        console.log("this has peer:", this.client.peer_address);


        //js_client.gpac.send("reply from this function on client" + js_client.id + " orig: " + msg);

        let text = msg;
        if (text.startsWith("json:")) {
            try {
                let jtext = JSON.parse(text.substr(5));
                if (!('message' in jtext)) return;

                if ( jtext['message'] == 'get_all_filters' ) {
                    print("Sending all filters when ready");
                    this.send_all_filters();
                }

                if ( jtext['message'] == 'filter_args_details' ) {
                    let idx = jtext['idx'];
                    print("Details requested for idx " + idx);
                    this.details_needed[idx] = true;
                    this.send_details(idx);
                }

                if ( jtext['message'] == 'stop_filter_args' ) {
                    let idx = jtext['idx'];
                    console.log("STOP MESSAGE****",jtext['message']);
                    print("Details stopped for idx " + idx);
                    this.details_needed[idx] = false;
                }

                if ( jtext['message'] == 'subscribe_session' ) {
                    print("Subscribing to session");
                    this.isSessionSubscribed = true;
                    this.sessionInterval = jtext['interval'] || 1000;
                    this.sessionFields = jtext['fields'] || DEFAULT_FILTER_FIELDS;

                 
                    this.send_session_stats();
                }
                if ( jtext['message'] == 'unsubscribe_session' ) {
                    print("Unsubscribing to session");
                    this.isSessionSubscribed = false;
                }
                if (jtext.message === 'subscribe_filter') {
                    const idx      = jtext.idx;
                    const interval = jtext.interval || 1000;
       

                    this.filterSubscriptions[idx] = { interval};
                    this.initializeFilterStatsLoop(idx);
                }

                if (jtext.message === 'unsubscribe_filter') {
                    const idx = jtext.idx;
                    delete this.filterSubscriptions[idx];
                }

                if ( jtext['message'] == 'update_arg' ) {
                    print("Update arguments of ")
                    print(JSON.stringify(jtext));
                    this.update_filter_argument(jtext['idx'], jtext['name'], jtext['argName'], jtext['newValue'])
                }

                if ( jtext['message'] == 'get_png' ) {
                    print("request png of ")
                    print(JSON.stringify(jtext));

                    this.add_png_probe(jtext['idx'], jtext['name']);
                }

                if ( jtext['message'] == 'subscribe_cpu_stats' ) {
                    print("Subscribing to CPU stats");
                    this.isCpuStatsSubscribed = true;
                    this.cpuStatsInterval = jtext['interval'] || 50;
                    this.cpuStatsFields = jtext['fields'] || CPU_STATS_FIELDS;
                    this.send_cpu_stats();
                }
                if ( jtext['message'] == 'unsubscribe_cpu_stats' ) {
                    print("Unsubscribing to CPU stats");
                    this.isCpuStatsSubscribed = false;
                }

            } catch(e) {
                console.log(e);
            }
        }
    }; // Fin de on_client_data

    this.send_session_stats = function() {
        session.post_task(() => {
            const stats = [];

            session.lock_filters(true);
            for (let i = 0; i < session.nb_filters; i++) {
                const f = session.get_filter(i);
                if (f.is_destroyed()) continue;
                const obj = {};
                for (const field of this.sessionFields) {
                    obj[field] = f[field];
                }
                stats.push(obj);
            }
            session.lock_filters(false);
            if (this.client) {
                this.client.send(JSON.stringify({
                    message: 'session_stats',
                    stats
                }));
            }
            // Schedule the next update
            return this.isSessionSubscribed
                ? this.sessionInterval
                : false;
        });
    };

    this.initializeFilterStatsLoop = function(idx) {
        const sub = this.filterSubscriptions[idx];
        if (!sub) return;
        session.post_task(() => {
            if(!this.filterSubscriptions[idx]) return false;
            session.lock_filters(true);
            let fObj = null;
            for (let i = 0; i < session.nb_filters; i++) {
                const f = session.get_filter(i);
                if (f.is_destroyed()) continue;
                if (f.idx == idx) {
                    fObj = f;
                    break;
                }
            }
            session.lock_filters(false);
            if(fObj && this.client) {
                const payload =  { idx} ;
                for (const field of sub.fields) {
                    payload[field] = fObj[field];
                }
                this.client.send(JSON.stringify({
                    message: 'filter_stats',
                    ...payload
                }));
            }
            return this.filterSubscriptions[idx]? sub.interval : false;
        });
    };

    this.send_all_filters = function () {
        on_all_connected( (all_js_filters) => {
            print("----- all connected -----");

            const minimalFiltersList = all_js_filters.map((f) => {
                return gpac_filter_to_minimal_object(f);
            });
            print("-------------------------");
            print(JSON.stringify(minimalFiltersList, null, 1));

            if (this.client) {
                this.client.send(JSON.stringify({ 'message': 'filters', 'filters': minimalFiltersList}));
            }

            session.post_task( ()=> {
                let js_filters = [];
                session.lock_filters(true);
                for (let i=0; i<session.nb_filters; i++) {
                    let f = session.get_filter(i);
                    js_filters.push(gpac_filter_to_object(f));
                }
                session.lock_filters(false);
                /*   if (this.client) {
                        this.client.send(JSON.stringify({ 'message': 'update', 'filters': js_filters }));
                    }
                */
                return 1000;
            });
        });
    };

    this.send_cpu_stats = function() {
        session.post_task(() => {
            if(!this.isCpuStatsSubscribed) return false;
            const now = Date.now();
            const cpuStats = {
                timestamp: now,
                total_cpu_usage: sys.total_cpu_usage,
                process_cpu_usage: sys.process_cpu_usage,
                process_memory: sys.process_memory,
                physical_memory: sys.physical_memory,
                physical_memory_avail: sys.physical_memory_avail,
                gpac_memory: sys.gpac_memory,
                nb_cores: sys.nb_cores,
                thread_count: sys.thread_count,

                memory_usage_percent: 0,
                process_memory_percent: 0,
                gpac_memory_percent: 0,
                cpu_efficiency: 0
            };


            if (sys.physical_memory > 0) {
                cpuStats.memory_usage_percent =
                    ((sys.physical_memory - sys.physical_memory_avail) / sys.physical_memory) * 100;
                cpuStats.process_memory_percent =
                    (sys.process_memory / sys.physical_memory) * 100;
                cpuStats.gpac_memory_percent =
                    (sys.gpac_memory / sys.physical_memory) * 100;
            }

            if (sys.total_cpu_usage > 0) {
                cpuStats.cpu_efficiency =
                    (sys.process_cpu_usage / sys.total_cpu_usage) * 100;
            }

            if (this.client) {

                this.client.send(JSON.stringify({
                    message: 'cpu_stats',
                    stats: cpuStats
                }));
            }
            return this.isCpuStatsSubscribed
                ? this.cpuStatsInterval
                : false;
        });
    };


    this.send_details = function(idx) {
        session.post_task( ()=> {
            let Args = [];

            session.lock_filters(true);
            for (let i=0; i<session.nb_filters; i++) {
                let f = session.get_filter(i);
                if (f.idx == idx) {
                    const fullObj = gpac_filter_to_object(f, true);
                    Args= fullObj.gpac_args;
                    break;
                }
            }
            session.lock_filters(false);

            if (this.client) {
                this.client.send(JSON.stringify({
                    message: 'details',
                    idx: idx,
                    gpac_args: Args
                }));
            }
            return false;
        });
    };


    this.update_filter_argument = function(idx, name, argName, newValue) {
        let filter = session.get_filter(''+idx); // force get by iname

        if (!filter) {
            print("Error: Filter with idx " + idx + " not found for update_arg.");
            return;
        }

        if (filter.name != name) {

            print("Warning: Discrepancy in filter names for idx " + idx + ". Expected '" + name + "', found '" + filter.name + "'. Proceeding with update.");
        }

        print("Updating filter " + idx + " (" + filter.name + "), argument '" + argName + "' to '" + newValue + "'");
        filter.update(argName, newValue);
    };

}

sys.rmt_on_new_client = function(client) {
    console.log("rmt on client");
    print(typeof(client));

    let js_client = new JSClient(++cid, client);
    all_clients.push(js_client);

    

    console.log("New ws client ", js_client.id, " gpac peer ", js_client.client.peer_address);

    js_client.client.on_data = (msg) =>  {
        if (typeof(msg) == "string")
            js_client.on_client_data(msg);
        else {
            let buf = new Uint8Array(msg)
            console.log("Got binary message of type", typeof(msg), "len ", buf.length, "with data:", buf);
        }
    }

    js_client.client.on_close = function() {
        console.log("ON_CLOSE on client ", js_client.id, " ", client.peer_address);
        remove_client(js_client.id);
        js_client.client = null;
}
}
