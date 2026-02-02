import { Sys as sys } from 'gpaccore';
/**
 * SessionManager - Orchestrates monitoring loop for all managers
 *
 * Responsibilities:
 * - Start/stop monitoring loop (session.post_task)
 * - Tick all managers (sessionStatsManager, cpuStatsManager, logManager, filterManager)
 * - Check active subscriptions across all managers
 * - Handle session end cleanup
 */
function SessionManager(client) {
    this.client = client;
    this.isMonitoringLoopRunning = false;

    this.hasActiveSubscriptions = function() {
        return this.client.sessionStatsManager.isSubscribed ||
               this.client.cpuStatsManager.isSubscribed ||
               this.client.logManager.isSubscribed ||
               Object.keys(this.client.filterManager.filterSubscriptions).length > 0;
    };

    this.startMonitoringLoop = function() {
        if (this.isMonitoringLoopRunning) return;
        this.isMonitoringLoopRunning = true;
        const processError = session.last_process_error;
        if (processError) {
            sys.print("Process error detected on session");
        }

        session.post_task(() => {
            const now = sys.clock_us();

            if (session.last_task) {
                this.client.cpuStatsManager.tick(now);
                this.client.logManager.tick(now);
                this.client.filterManager.tick(now);
                this.client.sessionStatsManager.tick(now);

                try {
                    this.client.client.send(JSON.stringify({
                        message: 'session_end',
                        reason: 'completed',
                        timestamp: now
                    }));
                    print('[SessionManager] Session end message sent');
                } catch (e) {
                    print('[SessionManager] Failed to send session_end message:', e);
                }

                this.client.cpuStatsManager.handleSessionEnd();
                this.client.logManager.handleSessionEnd();
                this.client.filterManager.handleSessionEnd();
                this.client.sessionStatsManager.handleSessionEnd();
                this.isMonitoringLoopRunning = false;
                return false;
            }

            this.client.cpuStatsManager.tick(now);
            this.client.logManager.tick(now);
            this.client.filterManager.tick(now);
            this.client.sessionStatsManager.tick(now);

            const shouldContinue = this.hasActiveSubscriptions();
            if (!shouldContinue) this.isMonitoringLoopRunning = false;

            // Use minimum interval from active managers (fastest wins)
            let interval = 1000;
            if (this.client.sessionStatsManager.isSubscribed) {
                interval = Math.min(interval, this.client.sessionStatsManager.interval);
            }
            if (this.client.cpuStatsManager.isSubscribed) {
                interval = Math.min(interval, this.client.cpuStatsManager.interval);
            }

            return shouldContinue ? interval : false;
        });
    };
}

export { SessionManager };