/**
 * SessionManager - Per-client monitoring orchestrator
 * Ticked by the shared monitoring loop in server.js (single post_task)
 */
function SessionManager(client) {
    this.client = client;

    this.hasActiveSubscriptions = function() {
        return this.client.sessionStatsManager.isSubscribed ||
               this.client.cpuStatsManager.isSubscribed ||
               this.client.logManager.isSubscribed ||
               Object.keys(this.client.filterManager.filterSubscriptions).length > 0;
    };

    this.getMinInterval = function() {
        let interval = 1000;
        if (this.client.sessionStatsManager.isSubscribed) {
            interval = Math.min(interval, this.client.sessionStatsManager.interval);
        }
        if (this.client.cpuStatsManager.isSubscribed) {
            interval = Math.min(interval, this.client.cpuStatsManager.interval);
        }
        return interval;
    };

    this.tick = function(now) {
        this.client.cpuStatsManager.tick(now);
        this.client.logManager.tick(now);
        this.client.filterManager.tick(now);
        this.client.sessionStatsManager.tick(now);
    };

    this.handleSessionEnd = function(now) {
        this.tick(now);

        this.client.cpuStatsManager.handleSessionEnd();
        this.client.logManager.handleSessionEnd();
        this.client.filterManager.handleSessionEnd();
        this.client.sessionStatsManager.handleSessionEnd();

        try {
            this.client.client.send(JSON.stringify({
                message: 'session_end',
                reason: 'completed',
                timestamp: now
            }));
        } catch (e) {
            print('[SessionManager] Error sending session_end:', e);
        }
    };
}

export { SessionManager };
