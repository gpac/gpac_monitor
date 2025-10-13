import { FILTER_SUBSCRIPTION_FIELDS } from '../config.js';
import {
    gpac_filter_to_object,
    gpac_filter_to_minimal_object,
    on_all_connected
} from '../filterUtils.js';
import { PidDataCollector } from './PidDataCollector.js';
import { ArgumentHandler } from './ArgumentHandler.js';

function FilterManager(client, draned_once_ref) {
    this.client = client;
    this.draned_once_ref = draned_once_ref;
    this.details_needed = {};
    this.filterSubscriptions = {};
    this.pidDataCollector = new PidDataCollector();
    this.argumentHandler = new ArgumentHandler(client);

    this.sendAllFilters = function() {
        on_all_connected((all_js_filters) => {
            print("----- all connected -----");

            const minimalFiltersList = all_js_filters.map((f) => {
                return gpac_filter_to_minimal_object(f);
            });
            print("-------------------------");
            print(JSON.stringify(minimalFiltersList, null, 1));

            if (this.client.client) {
                this.client.client.send(JSON.stringify({ 
                    'message': 'filters', 
                    'filters': minimalFiltersList 
                }));
            }

            session.post_task(() => {
                let js_filters = [];
                session.lock_filters(true);
                for (let i = 0; i < session.nb_filters; i++) {
                    let f = session.get_filter(i);
                    js_filters.push(gpac_filter_to_object(f));
                }
                session.lock_filters(false);
                return false;
            });
        }, this.draned_once_ref);
    };

    this.requestDetails = function(idx) {
        this.details_needed[idx] = true;
        this.argumentHandler.sendDetails(idx);
    };

    this.stopDetails = function(idx) {
        this.details_needed[idx] = false;
    };

    this.subscribeToFilter = function(idx, interval) {
        this.filterSubscriptions[idx] = {
            interval: interval || 1000,
            fields: FILTER_SUBSCRIPTION_FIELDS
        };
        this.initializeFilterStatsLoop(idx);
    };

    this.unsubscribeFromFilter = function(idx) {
        delete this.filterSubscriptions[idx];
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
            
            if (fObj && this.client.client) {
                const payload = { idx };
                for (const field of sub.fields) {
                    payload[field] = fObj[field];
                }

                payload.ipids = this.pidDataCollector.collectInputPids(fObj);
                payload.opids = this.pidDataCollector.collectOutputPids(fObj);

                this.client.client.send(JSON.stringify({
                    message: 'filter_stats',
                    ...payload
                }));
            }
            
            return this.filterSubscriptions[idx] ? sub.interval : false;
        });
    };

    this.updateArgument = function(idx, name, argName, newValue) {
        this.argumentHandler.updateArgument(idx, name, argName, newValue);
    };

    this.addPngProbe = function(idx, name) {
        // Implementation for PNG probe functionality
        // This would need to be implemented based on existing add_png_probe logic
    };
}

export { FilterManager };