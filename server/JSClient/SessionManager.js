import { DEFAULT_FILTER_FIELDS } from '../config.js';

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

    this.sendStats = function() {
        session.post_task(() => {
            if (session.last_task) {
                this.unsubscribe();
                return false;
            }
            
            const stats = [];

            session.lock_filters(true);
            for (let i = 0; i < session.nb_filters; i++) {
                const f = session.get_filter(i);
                if (f.is_destroyed()) continue;
                const obj = {};
                for (const field of this.fields) {
                    obj[field] = f[field];
                }
                stats.push(obj);
            }
            session.lock_filters(false);
            
            if (this.client.client) {
                this.client.client.send(JSON.stringify({
                    message: 'session_stats',
                    stats
                }));
            }
            
            return this.isSubscribed ? this.interval : false;
        });
    };
}

export { SessionManager };