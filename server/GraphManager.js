import { Sys as sys } from 'gpaccore';
import { gpac_filter_to_minimal_object } from './JSClient/filterUtils.js';
import { SnapshotBuilder } from './history/SnapshotBuilder.js';

const GRAPH_DEBOUNCE_US = 500 * 1000;  // 500ms stabilization
const GRAPH_MAX_WAIT_US = 3000 * 1000; // 3s max cap

/**
 * GraphManager - Graph change detection and stabilization.
 *
 * Detects filter add/remove events, debounces them,
 * then calls stabilizeGraph() once the graph is stable.
 *
 * @param {object} deps
 * @param {Function} deps.getClients    - () => JSClient[]
 * @param {object}  deps.historyCollector
 * @param {Function} deps.ensureMonitoringLoop
 */
function GraphManager(deps) {
    const { getClients, historyCollector, ensureMonitoringLoop } = deps;

    let graphVersion = 0;
    let graphDirty = false;
    let lastGraphEventTime = 0;
    let firstGraphEventTime = 0;
    let debounceRunning = false;

    const snapshotBuilder = new SnapshotBuilder();

    this.getGraphVersion = function() { return graphVersion; };

    this.onGraphEvent = function() {
        const now = sys.clock_us();
        graphDirty = true;
        lastGraphEventTime = now;
        if (!firstGraphEventTime) firstGraphEventTime = now;

        ensureMonitoringLoop();

        if (!debounceRunning) {
            debounceRunning = true;
            session.post_task(() => {
                const now = sys.clock_us();
                const sinceLast = now - lastGraphEventTime;
                const sinceFirst = now - firstGraphEventTime;

                if (sinceLast >= GRAPH_DEBOUNCE_US || sinceFirst >= GRAPH_MAX_WAIT_US) {
                    this._stabilize();
                    debounceRunning = false;
                    firstGraphEventTime = 0;
                    return false;
                }
                return 100;
            });
        }
    };

    this._stabilize = function() {
        graphDirty = false;
        graphVersion++;

        session.lock_filters(true);
        const filters = [];
        for (let i = 0; i < session.nb_filters; i++) {
            const f = session.get_filter(i);
            if (!f.is_destroyed()) filters.push(gpac_filter_to_minimal_object(f));
        }
        session.lock_filters(false);

        const filtersMsg = JSON.stringify({ message: 'filters', filters });
        const notifMsg = JSON.stringify({
            message: 'notification', type: 'graph_changed', graphVersion
        });

        // History: write enriched snapshot once on first stabilization
        if (!historyCollector.snapshotWritten) {
            let commandLine = null;
            try { commandLine = sys.args ? sys.args.join(' ') : null; } catch (_e) {}
            const snapshot = snapshotBuilder.build(graphVersion, commandLine);
            historyCollector.writeSnapshot(snapshot);
        }

        // History: record topology change
        historyCollector.recordGraph(filters, graphVersion);

        for (const client of getClients()) {
            if (client.client) {
                client.client.send(filtersMsg);
                client.client.send(notifMsg);
            }
        }
    };
}

export { GraphManager };
