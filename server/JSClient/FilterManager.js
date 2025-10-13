import { FILTER_SUBSCRIPTION_FIELDS } from '../config.js';
import { 
    gpac_filter_to_object, 
    gpac_filter_to_minimal_object, 
    on_all_connected 
} from '../filterUtils.js';
import { PidDataCollector } from './PidDataCollector.js';

function FilterManager(client, draned_once_ref) {
    this.client = client;
    this.draned_once_ref = draned_once_ref;
    this.details_needed = {};
    this.filterSubscriptions = {};
    this.pidDataCollector = new PidDataCollector();

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
        this.sendDetails(idx);
    };

    this.stopDetails = function(idx) {
        this.details_needed[idx] = false;
    };

    this.sendDetails = function(idx) {
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

            if (this.client.client) {
                this.client.client.send(JSON.stringify({
                    message: 'details',
                    filter: {
                        idx: idx,
                        gpac_args: Args
                    }
                }));
            }
            return false;
        });
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
        let filter = session.get_filter('' + idx);

        if (!filter) {
            const errorMsg = "Filter with idx " + idx + " not found";
            print("Error: " + errorMsg);

            // Send error response to client
            if (this.client.client) {
                this.client.client.send(JSON.stringify({
                    message: 'update_arg_response',
                    idx: idx,
                    argName: argName,
                    requestedValue: newValue,
                    actualValue: null,
                    success: false,
                    error: errorMsg
                }));
            }
            return;
        }

        if (filter.name != name) {
            print("Warning: Discrepancy in filter names for idx " + idx + ". Expected '" + name + "', found '" + filter.name + "'. Proceeding with update.");
        }

        try {
            print("Updating filter " + idx + " (" + filter.name + "), argument '" + argName + "' to '" + newValue + "'");

            // Apply the update
            filter.update(argName, newValue);

            // Read-after-write: verify the value was actually set
            let actualValue = filter.get_arg(argName);

            // Normalize actualValue for serialization
            // GPAC returns objects for fractions {n, d}, booleans, etc.
            let normalizedValue = actualValue;
            if (actualValue !== null && typeof actualValue === 'object') {
                // Handle fraction objects - GPAC uses 'n' and 'd' properties
                if ('n' in actualValue && 'd' in actualValue) {
                    normalizedValue = actualValue.n + '/' + actualValue.d;
                } else if ('num' in actualValue && 'den' in actualValue) {
                    // Fallback for alternate format
                    normalizedValue = actualValue.num + '/' + actualValue.den;
                } else {
                    // For other objects, try to stringify
                    normalizedValue = JSON.stringify(actualValue);
                }
            } else if (typeof actualValue === 'boolean') {
                normalizedValue = actualValue ? 'true' : 'false';
            } else {
                normalizedValue = String(actualValue);
            }

            print("Read-after-write: argument '" + argName + "' actual value is '" + normalizedValue + "'");

            // Send success response with actual value
            if (this.client.client) {
                this.client.client.send(JSON.stringify({
                    message: 'update_arg_response',
                    idx: idx,
                    argName: argName,
                    requestedValue: newValue,
                    actualValue: normalizedValue,
                    success: true,
                    error: null
                }));
            }
        } catch (e) {
            const errorMsg = "Failed to update argument: " + e.toString();
            print("Error: " + errorMsg);

            // Send error response
            if (this.client.client) {
                this.client.client.send(JSON.stringify({
                    message: 'update_arg_response',
                    idx: idx,
                    argName: argName,
                    requestedValue: newValue,
                    actualValue: null,
                    success: false,
                    error: errorMsg
                }));
            }
        }
    };

    this.addPngProbe = function(idx, name) {
        // Implementation for PNG probe functionality
        // This would need to be implemented based on existing add_png_probe logic
    };
}

export { FilterManager };