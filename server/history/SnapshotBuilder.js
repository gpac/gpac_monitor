import { Sys as sys } from 'gpaccore';
import { gpac_filter_to_object } from '../JSClient/filterUtils.js';
import { PidDataCollector } from '../JSClient/Filters/PID/PidDataCollector.js';

/**
 * SnapshotBuilder - Builds enriched filter snapshots for history capture.
 */
function SnapshotBuilder() {
    this.pidCollector = new PidDataCollector();

    /**
     * Build enriched entry for one filter.
     * Collects: all filter fields, gpac_args, enriched ipids/opids.
     * @param {object} f 
     */
    this.buildFilterEntry = function(f) {
     
        const entry = gpac_filter_to_object(f, true);
        delete entry.ipid;
        delete entry.opid;
        entry.ipids = this.pidCollector.collectInputPids(f, true);
        entry.opids = this.pidCollector.collectOutputPids(f);

        return entry;
    };

    /**
     * Build the full snapshot object.
     * Call once, on first graph stabilization.
     * @param {number} graphVersion
     * @param {string|null} commandLine
     */
    this.build = function(graphVersion, commandLine) {
        const filters = [];

        session.lock_filters(true);
        for (let i = 0; i < session.nb_filters; i++) {
            const f = session.get_filter(i);
            if (!f.is_destroyed()) filters.push(this.buildFilterEntry(f));
        }
        session.lock_filters(false);

        return {
            version: 1,
            ts_us: sys.clock_us(),
            command_line: commandLine,
            graph_v: graphVersion,
            filters,
        };
    };
}

export { SnapshotBuilder };
