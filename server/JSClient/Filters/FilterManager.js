import { FILTER_SUBSCRIPTION_FIELDS, UPDATE_INTERVALS } from '../config.js';
import {
    gpac_filter_to_object,
    gpac_filter_to_minimal_object,
    on_all_connected
} from '../filterUtils.js';
import { PidDataCollector } from './PID/PidDataCollector.js';
import { ArgumentHandler } from './ArgumentHandler.js';
import { cacheManager } from '../Cache/CacheManager.js';

function FilterManager(client, draned_once_ref) {
    this.client = client;
    this.draned_once_ref = draned_once_ref;
    this.details_needed = {};
    this.filterSubscriptions = {};
    this.lastSentByFilter = {};
    this.pidDataCollector = new PidDataCollector();
    this.argumentHandler = new ArgumentHandler(client);

    this.sendAllFilters = function() {
        on_all_connected((all_js_filters) => {
            print("----- all connected -----");

            // Cache serialized data (100ms TTL) to avoid redundant JSON.stringify for concurrent clients
            const serialized = cacheManager.getOrSet('all_filters', 100, () => {
                const minimalFiltersList = all_js_filters.map((f) => {
                    return gpac_filter_to_minimal_object(f);
                });
                print("-------------------------");
                print(JSON.stringify(minimalFiltersList, null, 1));

                return JSON.stringify({
                    'message': 'filters',
                    'filters': minimalFiltersList
                });
            });

            if (this.client.client) {
                this.client.client.send(serialized);
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

    this.subscribeToFilter = function(idx, interval,pidScope) {
        this.filterSubscriptions[idx] = {
            interval: interval || UPDATE_INTERVALS.FILTER_STATS,
            fields: FILTER_SUBSCRIPTION_FIELDS,pidScope: pidScope || 'both'
        };
        this.lastSentByFilter[idx] = 0;

        this.client.sessionManager.startMonitoringLoop();
    };

    this.unsubscribeFromFilter = function(idx) {
        delete this.filterSubscriptions[idx];
        delete this.lastSentByFilter[idx];
    };

    this.tick = function(now) {
        for (const idxStr in this.filterSubscriptions) {
            const idx = parseInt(idxStr);
            const sub = this.filterSubscriptions[idxStr];
            const lastSent = this.lastSentByFilter[idxStr] || 0;

            if (now - lastSent < sub.interval) continue;

            // Cache serialized data (50ms TTL) to avoid redundant JSON.stringify for concurrent clients
            const cacheKey = `filter_stats_${idx}`;
            const serialized = cacheManager.getOrSet(cacheKey, 50, () => {
                session.lock_filters(true);
                let fObj = null;
                for (let i = 0; i < session.nb_filters; i++) {
                    const f = session.get_filter(i);
                    if (f.is_destroyed()) continue;
                    if (f.idx === idx) {
                        fObj = f;
                        break;
                    }
                }
                session.lock_filters(false);

                if (!fObj) return null;

                const payload = { idx };
                for (const field of sub.fields) {
                    payload[field] = fObj[field];
                }

                // Switch based on pidScope
                switch (sub.pidScope) {
                    case 'ipid':
                        payload.ipids = this.pidDataCollector.collectInputPids(fObj);
                        break;
                    case 'opid':
                        payload.opids = this.pidDataCollector.collectOutputPids(fObj);
                        break;
                    case 'both':
                        payload.ipids = this.pidDataCollector.collectInputPids(fObj);
                        payload.opids = this.pidDataCollector.collectOutputPids(fObj);
                        break;
                    default:
                        break;
                }

                return JSON.stringify({
                    message: 'filter_stats',
                    ...payload
                });
            });

            if (serialized && this.client.client) {
                this.client.client.send(serialized);
                this.lastSentByFilter[idxStr] = now;
            }
        }
    };

    this.handleSessionEnd = function() {
        this.filterSubscriptions = {};
        this.lastSentByFilter = {};
    };

    this.updateArgument = function(idx, name, argName, newValue) {
        this.argumentHandler.updateArgument(idx, name, argName, newValue);
    };
}

export { FilterManager };