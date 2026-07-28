import { Sys as sys } from 'gpaccore';
import { gpac_filter_to_minimal_object, on_all_connected } from './JSClient/filterUtils.js';
import { SnapshotBuilder } from './history/SnapshotBuilder.js';

const GRAPH_DEBOUNCE_US = 500 * 1000;  
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
    let graphBuildStartTime = 0;
    let debounceRunning = false;

    const snapshotBuilder = new SnapshotBuilder();

    this.getGraphVersion = function() { return graphVersion; };

    this.onGraphEvent = function() {
        const now = sys.clock_us();
        graphDirty = true;
        lastGraphEventTime = now;
        if (!graphBuildStartTime) graphBuildStartTime = now;

        ensureMonitoringLoop();

        if (debounceRunning) return;

        debounceRunning = true;
        session.post_task(() => {
            const now = sys.clock_us();
            const sinceLast = now - lastGraphEventTime;
            const sinceBuildStart = now - graphBuildStartTime;
            const graphStable = sinceLast >= GRAPH_DEBOUNCE_US;
            const maxBuildWaitReached = sinceBuildStart >= GRAPH_MAX_WAIT_US;

            if (graphStable || maxBuildWaitReached) {
                this._stabilize();
                debounceRunning = false;
                graphBuildStartTime = 0;
                return false;
            }
            return 100;
        });
    };

    this._stabilize = function() {
        graphDirty = false;
        graphVersion++;
     

        on_all_connected((allFilterInstances) => {

            session.lock_filters(true);
            const filters = allFilterInstances.map(f => gpac_filter_to_minimal_object(f));
            session.lock_filters(false);

            // History: write enriched snapshot once on first stabilization
            if (!historyCollector.snapshotWritten) {
                let commandLine = null;
                try { commandLine = sys.args ? sys.args.join(' ') : null; } catch (_e) {}
                const snapshot = snapshotBuilder.build(graphVersion, commandLine);
                historyCollector.writeSnapshot(snapshot);
            }

            historyCollector.recordGraph(filters, allFilterInstances, graphVersion);
            const filtersMsg = JSON.stringify({ message: 'filters', filters });
            const notifMsg = JSON.stringify({
                message: 'notification', type: 'graph_changed',
                graphVersion: graphVersion
            });

            for (const client of getClients()) {
                if (client.client) {
                    client.client.send(filtersMsg);
                    client.client.send(notifMsg);
                }
            }
        });
    };
}

export { GraphManager };
