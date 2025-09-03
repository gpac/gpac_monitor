import { MessageHandler } from './MessageHandler.js';
import { SessionManager } from './SessionManager.js';
import { FilterManager } from './FilterManager.js';
import { CpuStatsManager } from './CpuStatsManager.js';

function JSClient(id, client, all_clients, draned_once_ref) {
    this.id = id;
    this.client = client;
    
    // Initialize modular components
    this.messageHandler = new MessageHandler(this);
    this.sessionManager = new SessionManager(this);
    this.filterManager = new FilterManager(this, draned_once_ref);
    this.cpuStatsManager = new CpuStatsManager(this);

    this.on_client_data = function(msg) {
        this.messageHandler.handleMessage(msg, all_clients);
    };
}

export { JSClient };