import { MessageHandler } from './MessageHandler.js';
import { SessionManager } from './SessionManager.js';
import { FilterManager } from './FilterManager.js';
import { CpuStatsManager } from './CpuStatsManager.js';
import { LogManager } from './LogManager.js';
import { PidPropsCollector } from './PidPropsCollector.js';

function JSClient(id, client, all_clients, draned_once_ref) {
    this.id = id;
    this.client = client;

    // Initialize modular components
    this.messageHandler = new MessageHandler(this);
    this.sessionManager = new SessionManager(this);
    this.filterManager = new FilterManager(this, draned_once_ref);
    this.cpuStatsManager = new CpuStatsManager(this);
    this.logManager = new LogManager(this);
    this.pidPropsCollector = new PidPropsCollector(this);

    this.on_client_data = function(msg) {
        this.messageHandler.handleMessage(msg, all_clients);
    };

    this.cleanup = function() {
        console.log(`JSClient ${this.id}: Starting cleanup`);

        try {
            // Nettoyer le LogManager en priorité (libère sys.on_log)
            if (this.logManager) {
                this.logManager.forceUnsubscribe();
            }

            // Nettoyer les autres managers
            if (this.sessionManager && typeof this.sessionManager.cleanup === 'function') {
                this.sessionManager.cleanup();
            }
            if (this.cpuStatsManager && typeof this.cpuStatsManager.cleanup === 'function') {
                this.cpuStatsManager.cleanup();
            }

            console.log(`JSClient ${this.id}: Cleanup completed`);
        } catch (error) {
            console.error(`JSClient ${this.id}: Error during cleanup:`, error);
        }
    };
}

export { JSClient };