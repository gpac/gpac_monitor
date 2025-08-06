import { Sys as sys } from 'gpaccore';
import { 
    DEFAULT_FILTER_FIELDS, 
    CPU_STATS_FIELDS, 
    FILTER_SUBSCRIPTION_FIELDS 
} from './config.js';
import { 
    gpac_filter_to_object, 
    gpac_filter_to_minimal_object, 
    on_all_connected 
} from './filterUtils.js';

function JSClient(id, client, all_clients, draned_once_ref) {
    this.id = id;
    this.client = client;
    
    // Gpac_args
    this.details_needed = {};

    // Subscription for filter stats
    this.filterSubscriptions = {};

    // Subscription state and session parameters
    this.isSessionSubscribed = false;
    this.sessionInterval = 1000;
    this.sessionFields = [];

    // CPU subscriptions
    this.isCpuStatsSubscribed = false;
    this.cpuStatsInterval = 50;
    this.cpuStatsFields = CPU_STATS_FIELDS;

    this.on_client_data = function(msg) {
        console.log("All clients:");
        for (let jc of all_clients) {
            console.log("Client ", jc.id, jc.client.peer_address);
        }

        console.log("on_client_data on client id ", this.id, " len ", msg.length, msg);
        console.log("this has peer:", this.client.peer_address);

        let text = msg;
        if (text.startsWith("json:")) {
            try {
                let jtext = JSON.parse(text.substr(5));
                if (!('message' in jtext)) return;

                if (jtext['message'] == 'get_all_filters') {
                    print("Sending all filters when ready");
                    this.send_all_filters();
                }

                if (jtext['message'] == 'filter_args_details') {
                    let idx = jtext['idx'];
                    print("Details requested for idx " + idx);
                    this.details_needed[idx] = true;
                    this.send_details(idx);
                }

                if (jtext['message'] == 'stop_filter_args') {
                    let idx = jtext['idx'];
                    console.log("STOP MESSAGE****", jtext['message']);
                    print("Details stopped for idx " + idx);
                    this.details_needed[idx] = false;
                }

                if (jtext['message'] == 'subscribe_session') {
                    print("Subscribing to session");
                    this.isSessionSubscribed = true;
                    this.sessionInterval = jtext['interval'] || 1000;
                    this.sessionFields = jtext['fields'] || DEFAULT_FILTER_FIELDS;
                    this.send_session_stats();
                }

                if (jtext['message'] == 'unsubscribe_session') {
                    print("Unsubscribing to session");
                    this.isSessionSubscribed = false;
                }

                if (jtext.message === 'subscribe_filter') {
                    const idx = jtext.idx;
                    const interval = jtext.interval || 1000;

                    this.filterSubscriptions[idx] = {
                        interval,
                        fields: FILTER_SUBSCRIPTION_FIELDS
                    };
                    this.initializeFilterStatsLoop(idx);
                }

                if (jtext.message === 'unsubscribe_filter') {
                    const idx = jtext.idx;
                    delete this.filterSubscriptions[idx];
                }

                if (jtext['message'] == 'update_arg') {
                    print("Update arguments of ")
                    print(JSON.stringify(jtext));
                    this.update_filter_argument(jtext['idx'], jtext['name'], jtext['argName'], jtext['newValue'])
                }

                if (jtext['message'] == 'get_png') {
                    print("request png of ")
                    print(JSON.stringify(jtext));
                    this.add_png_probe(jtext['idx'], jtext['name']);
                }

                if (jtext['message'] == 'subscribe_cpu_stats') {
                    print("Subscribing to CPU stats");
                    this.isCpuStatsSubscribed = true;
                    this.cpuStatsInterval = jtext['interval'] || 50;
                    this.cpuStatsFields = jtext['fields'] || CPU_STATS_FIELDS;
                    this.send_cpu_stats();
                }

                if (jtext['message'] == 'unsubscribe_cpu_stats') {
                    print("Unsubscribing to CPU stats");
                    this.isCpuStatsSubscribed = false;
                }

            } catch (e) {
                console.log(e);
            }
        }
    };

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
            return this.isSessionSubscribed
                ? this.sessionInterval
                : false;
        });
    };

    this.initializeFilterStatsLoop = function(idx) {
        const sub = this.filterSubscriptions[idx];
        if (!sub) return;
        session.post_task(() => {
            if (!this.filterSubscriptions[idx]) return false;
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
            if (fObj && this.client) {
                const payload = { idx };
                for (const field of sub.fields) {
                    payload[field] = fObj[field];
                }
                this.client.send(JSON.stringify({
                    message: 'filter_stats',
                    ...payload
                }));
            }
            return this.filterSubscriptions[idx] ? sub.interval : false;
        });
    };

    this.send_all_filters = function() {
        on_all_connected((all_js_filters) => {
            print("----- all connected -----");

            const minimalFiltersList = all_js_filters.map((f) => {
                return gpac_filter_to_minimal_object(f);
            });
            print("-------------------------");
            print(JSON.stringify(minimalFiltersList, null, 1));

            if (this.client) {
                this.client.send(JSON.stringify({ 'message': 'filters', 'filters': minimalFiltersList }));
            }

            session.post_task(() => {
                let js_filters = [];
                session.lock_filters(true);
                for (let i = 0; i < session.nb_filters; i++) {
                    let f = session.get_filter(i);
                    js_filters.push(gpac_filter_to_object(f));
                }
                session.lock_filters(false);
                return 1000;
            });
        }, draned_once_ref);
    };

    this.send_cpu_stats = function() {
        session.post_task(() => {
            if (!this.isCpuStatsSubscribed) return false;
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
        session.post_task(() => {
            let Args = [];

            session.lock_filters(true);
            for (let i = 0; i < session.nb_filters; i++) {
                let f = session.get_filter(i);
                if (f.idx == idx) {
                    const fullObj = gpac_filter_to_object(f, true);
                    Args = fullObj.gpac_args;
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
        let filter = session.get_filter('' + idx);

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

export { JSClient };