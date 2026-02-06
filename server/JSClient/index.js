import { MessageHandler } from './Messaging/MessageHandler.js';
import { SessionStatsManager } from './Session/SessionStatsManager.js';
import { SessionManager } from './Session/SessionManager.js';
import { FilterManager } from './Filters/FilterManager.js';
import { CpuStatsManager } from './Sys/CpuStatsManager.js';
import { LogManager } from './Sys/LogManager.js';
import { PidPropsCollector } from './Filters/PID/PidPropsCollector.js';
import { CommandLineManager } from './CommandLineManager.js';

function JSClient(id, client, all_clients, draned_once_ref) {
    this.id = id;
    this.client = client;
    
    this.messageHandler = new MessageHandler(this);
    this.sessionStatsManager = new SessionStatsManager(this);
    this.sessionManager = new SessionManager(this);
    this.filterManager = new FilterManager(this, draned_once_ref);
    this.cpuStatsManager = new CpuStatsManager(this);
    this.logManager = new LogManager(this);
    this.pidPropsCollector = new PidPropsCollector(this);
    this.commandLineManager = new CommandLineManager(this);

    this.on_client_data = function(msg) {
        this.messageHandler.handleMessage(msg, all_clients);
    };

    this.cleanup = function() {
        try {
            // (releases sys.on_log)
            if (this.logManager) {
                this.logManager.forceUnsubscribe();
            }

            if (this.sessionManager && typeof this.sessionManager.cleanup === 'function') {
                this.sessionManager.cleanup();
            }
            if (this.cpuStatsManager && typeof this.cpuStatsManager.cleanup === 'function') {
                this.cpuStatsManager.cleanup();
            }
        } catch (error) {
            console.error(`JSClient ${this.id}: Error during cleanup:`, error);
        }
    };
}

export { JSClient };