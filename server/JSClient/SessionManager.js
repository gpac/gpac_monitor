import { DEFAULT_FILTER_FIELDS } from '../config.js';

/**
 * SessionManager - Manages session statistics and EOS monitoring
 *
**/
function SessionManager(client) {
    this.client = client;
    this.isSubscribed = false;
    this.interval = 1000;
    this.fields = [];

    this.subscribe = function(interval, fields) {
        this.isSubscribed = true;
        this.interval = interval || 1000;
        this.fields = fields || DEFAULT_FILTER_FIELDS;
        this.sendStats();
    };

    this.unsubscribe = function() {
        this.isSubscribed = false;
    };

    /**
  
     * @param {Array} filters - Active filters to check
     * @returns {boolean} true if all filters with inputs have all PIDs EOS
     */
    this.computeAllPacketsDone = function(filters) {
        if (filters.length === 0) return false;

        for (const f of filters) {
            // Check if filter has input PIDs
            if (f.nb_ipid === 0) continue;

            // Check all input PIDs for EOS
            for (let i = 0; i < f.nb_ipid; i++) {
                const eos = f.ipid_props(i, 'eos');
                if (!eos) {
                    return false; // Found non-EOS input
                }
            }
        }

        return true;
    };

    this.sendStats = function() {
        session.post_task(() => {
            if (session.last_task) {
                this.unsubscribe();
                return false;
            }

            const stats = [];
            const filters = [];
            const now = Date.now(); 

            session.lock_filters(true);
            for (let i = 0; i < session.nb_filters; i++) {
                const f = session.get_filter(i);
                if (f.is_destroyed()) continue;

                filters.push(f);
                const obj = {};

                // Collect standard fields
                for (const field of this.fields) {
                    obj[field] = f[field];
                }

                //alculate is_eos (all input PIDs are EOS)
                let allInputsEos = f.nb_ipid > 0;
                for (let j = 0; j < f.nb_ipid; j++) {
                    if (!f.ipid_props(j, 'eos')) {
                        allInputsEos = false;
                        break;
                    }
                }
                obj.is_eos = allInputsEos;

                obj.last_packet_sent = f.pck_sent || 0;
                obj.last_packet_sent_timestamp = now;

                stats.push(obj);
            }

            // Compute global all_packets_done
            const allFiltersEos = this.computeAllPacketsDone(filters);
            const all_packets_done = session.last_task && allFiltersEos;

            session.lock_filters(false);


            if (this.client.client) {
                this.client.client.send(JSON.stringify({
                    message: 'session_stats',
                    all_packets_done,
                    stats
                }));
            }

            return this.isSubscribed ? this.interval : false;
        });
    };
}

export { SessionManager };