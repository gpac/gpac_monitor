import { Sys as sys } from 'gpaccore';

/**
 * LogManager - Manages log subscription and batching for GPAC system logs
 * Captures GPAC logs, batches them for performance, and sends to WebSocket client
 */
function LogManager(client) {
    this.client = client;
    this.isSubscribed = false;
    this.logLevel = "all@warning";
    this.logs = []; // Historical logs storage (max 500)
    this.originalLogConfig = null; // Backup of original GPAC log config
    this.pendingLogs = []; // Batch buffer for outgoing logs
    this.batchTimer = null; // Batching timer state

    /**
     * Subscribe to GPAC logs at specified level
     * Sets up log capturing and configures GPAC log level
     */
    this.subscribe = function(logLevel) {
        if (this.isSubscribed) {
            this.updateLogLevel(logLevel);
            return;
        }

        this.logLevel = logLevel || "all@warning";
        this.isSubscribed = true;

        try {
            this.originalLogConfig = sys.get_logs(true);
            
            sys.on_log = (tool, level, message) => {
                this.handleLog(tool, level, message);
            };
            
            sys.set_logs(this.logLevel);
            
      
            
            console.log(`LogManager: Client ${this.client.id} subscribed to logs at level: ${this.logLevel}`);
        } catch (error) {
            console.error("LogManager: Failed to start log capturing:", error);
            this.isSubscribed = false;
        }
    };

    /**
     * Unsubscribe from GPAC logs
     * Restores original log config and cleans up resources
     */
    this.unsubscribe = function() {
        if (!this.isSubscribed) return;

        try {
            this.flushPendingLogs();
            
            sys.on_log = undefined;
            
            if (this.originalLogConfig) {
                sys.set_logs(this.originalLogConfig);
            }
            
            this.isSubscribed = false;
            this.logs = [];
            this.pendingLogs = [];
            this.batchTimer = null;
            
            console.log(`LogManager: Client ${this.client.id} unsubscribed from logs`);
        } catch (error) {
            console.error("LogManager: Failed to stop log capturing:", error);
        }
    };

    /**
     * Handle incoming GPAC log entry
     * Stores log, manages history limit, and batches for transmission
     */
    this.handleLog = function(tool, level, message) {
        const log = { 
            timestamp: Date.now(), 
            tool, 
            level, 
            message: message?.length > 500 ? message.substring(0, 500) + '...' : message
        };
        
        // Keep history limited
        if (this.logs.length >= 500) {
            this.logs.shift();
        }
        this.logs.push(log);
        
        // Add to pending batch with strict limit to prevent segfault
        this.pendingLogs.push(log);
 
        // Aggressive batching for high-volume log levels
       const isHighVolume = (level === 'debug' || level === 'info');
       const maxPending = level === 'debug' ? 10 : (level === 'info' ? 30 : 50);
       const delay      = level === 'debug' ? 100 : (level === 'info' ? 250 : 1000);
        
        // Flush immediately if batch is full
        if (this.pendingLogs.length >= maxPending) {
            this.flushPendingLogs();
            return;
        }
        
       if (!this.batchTimer) {
  this.batchTimer = true;
  session.post_task(() => {
    if (!this.isSubscribed) return false;
    this.flushPendingLogs();
    return false;
  }, delay);
}
    };

    /**
     * Update log level for existing subscription
     * Changes GPAC log level and clears current log buffers
     */
    this.updateLogLevel = function(logLevel) {
        if (!this.isSubscribed) return;

        try {
            this.logs = [];
            this.pendingLogs = [];
            
            this.logLevel = logLevel;
            sys.set_logs(logLevel);
            
            this.sendToClient({
                message: 'log_config_changed',
                logLevel: logLevel
            });
            
            console.log(`LogManager: Updated log level to: ${logLevel}`);
        } catch (error) {
            console.error("LogManager: Failed to update log level:", error);
        }
    };

    /**
     * Get current LogManager status
     * Returns subscription state, log level, and count information
     */
    this.getStatus = function() {
        return {
            isSubscribed: this.isSubscribed,
            logLevel: this.logLevel,
            logCount: this.logs.length,
            currentLogConfig: sys.get_logs()
        };
    };

    /**
     * Flush pending logs to client
     * Sends batched logs via WebSocket and clears pending buffer
     */
    this.flushPendingLogs = function() {
        if (this.pendingLogs.length === 0) {
            this.batchTimer = null;
            return;
        }
        
        this.sendToClient({
            message: 'log_batch',
            logs: this.pendingLogs
        });
        
        this.pendingLogs = [];
        this.batchTimer = null;
    };

    
    /**
     * Send data to WebSocket client
     * Handles JSON serialization and WebSocket transmission
     */
    this.sendToClient = function(data) {
        if (this.client.client && typeof this.client.client.send === 'function') {
            this.client.client.send(JSON.stringify(data));
        }
    };
}

export { LogManager };