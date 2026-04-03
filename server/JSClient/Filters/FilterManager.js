import { FILTER_SUBSCRIPTION_FIELDS, UPDATE_INTERVALS } from '../config.js';
import {
    gpac_filter_to_minimal_object,
    on_all_connected
} from '../filterUtils.js';
import { PidDataCollector } from './PID/PidDataCollector.js';
import { ArgumentHandler } from './ArgumentHandler.js';
import { cacheManager } from '../Cache/CacheManager.js';

function FilterManager(client) {
    this.client = client;
    this.details_needed = {};
    this.filterSubscriptions = {};
    this.lastSentByFilter = {};
    this.dirtyPidFilters = new Set();
    this.pidDataCollector = new PidDataCollector();
    this.argumentHandler = new ArgumentHandler(client);

    this.sendAllFilters = function() {
        on_all_connected((all_js_filters) => {
            const serialized = cacheManager.getOrSet('all_filters', 100, () => {
                const minimalFiltersList = all_js_filters.map((f) => {
                    return gpac_filter_to_minimal_object(f);
                });
                return JSON.stringify({
                    'message': 'filters',
                    'filters': minimalFiltersList
                });
            });

            if (this.client.client) {
                this.client.client.send(serialized);
            }
        });
    };

    this.requestDetails = function(idx) {
        this.details_needed[idx] = true;
        this.argumentHandler.sendDetails(idx);
    };

    this.stopDetails = function(idx) {
        this.details_needed[idx] = false;
    };

    this.subscribeToFilter = function(idx, interval, pidScope) {
        this.filterSubscriptions[idx] = {
            interval: interval || UPDATE_INTERVALS.FILTER_STATS,
            fields: FILTER_SUBSCRIPTION_FIELDS,
            pidScope: pidScope || 'both'
        };
        this.lastSentByFilter[idx] = 0;
        this.sendInitialProps(idx);
        this.client.ensureMonitoringLoop();
    };

    this.unsubscribeFromFilter = function(idx) {
        delete this.filterSubscriptions[idx];
        delete this.lastSentByFilter[idx];
        this.dirtyPidFilters.delete(idx);
    };

    this.onPidModified = function(filter) {
        if (!this.filterSubscriptions[filter.idx]) return;
        this.dirtyPidFilters.add(filter.idx);
        this.client.ensureMonitoringLoop();
    };

    this.tick = function(now) {
        for (const idxStr in this.filterSubscriptions) {
            const idx = parseInt(idxStr);
            const sub = this.filterSubscriptions[idxStr];
            const lastSent = this.lastSentByFilter[idxStr] || 0;
            const isDirty = this.dirtyPidFilters.has(idx);

            if (!isDirty && now - lastSent < sub.interval) continue;
            if (isDirty) this.dirtyPidFilters.delete(idx);

            const cacheKey = `filter_stats_${idx}`;
            const serialized = cacheManager.getOrSet(cacheKey, 50, () => {
                session.lock_filters(true);
                let fObj = null;
                for (let i = 0; i < session.nb_filters; i++) {
                    const f = session.get_filter(i);
                    if (f.is_destroyed()) continue;
                    if (f.idx === idx) { fObj = f; break; }
                }
                session.lock_filters(false);

                if (!fObj) return null;

                const payload = { idx };
                for (const field of sub.fields) {
                    payload[field] = fObj[field];
                }

                switch (sub.pidScope) {
                    case 'ipid':
                        payload.ipids = this.pidDataCollector.collectInputPids(fObj, true);
                        break;
                    case 'opid':
                        payload.opids = this.pidDataCollector.collectOutputPids(fObj);
                        break;
                    case 'both':
                        payload.ipids = this.pidDataCollector.collectInputPids(fObj, true);
                        payload.opids = this.pidDataCollector.collectOutputPids(fObj);
                        break;
                    default:
                        break;
                }

                return JSON.stringify({ message: 'filter_stats', ...payload });
            });

            if (serialized && this.client.client) {
                this.client.client.send(serialized);
                this.lastSentByFilter[idxStr] = now;
            }
        }
    };

    this.sendInitialProps = function(idx) {
        session.post_task(() => {
            session.lock_filters(true);
            let fObj = null;
            for (let i = 0; i < session.nb_filters; i++) {
                const f = session.get_filter(i);
                if (!f.is_destroyed() && f.idx === idx) { fObj = f; break; }
            }
            session.lock_filters(false);

            if (!fObj || !this.client.client) return false;
            const sub = this.filterSubscriptions[idx];
            if (!sub) return false;

            const payload = { idx };
            switch (sub.pidScope) {
                case 'ipid':
                    payload.ipids = this.pidDataCollector.collectInputPids(fObj, true);
                    break;
                case 'opid':
                    payload.opids = this.pidDataCollector.collectOutputPids(fObj);
                    break;
                default:
                    payload.ipids = this.pidDataCollector.collectInputPids(fObj, true);
                    payload.opids = this.pidDataCollector.collectOutputPids(fObj);
            }
            this.client.client.send(JSON.stringify({ message: 'filter_stats', ...payload }));
            return false;
        });
    };

    this.cleanup = function() {
        this.filterSubscriptions = {};
        this.lastSentByFilter = {};
        this.dirtyPidFilters.clear();
    };

    this.handleSessionEnd = function() {
        this.filterSubscriptions = {};
        this.lastSentByFilter = {};
        this.dirtyPidFilters.clear();
    };

    this.updateArgument = function(idx, name, argName, newValue) {
        this.argumentHandler.updateArgument(idx, name, argName, newValue);
    };
}

export { FilterManager };
