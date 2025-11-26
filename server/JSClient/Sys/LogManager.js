import { Sys as sys } from 'gpaccore';

/**
 * LogManager - Manages log subscription and batching for GPAC system logs
 * Captures GPAC logs, batches them for performance, and sends to WebSocket client
 */
function LogManager(client) {
    this.client = client;
    this.isSubscribed = false;
    this.logLevel = "all@quiet";
    this.logs = []; // Historical logs storage (max 500)
    this.originalLogConfig = null; // Backup of original GPAC log config
    this.pendingLogs = []; // Batch buffer for outgoing logs
    this.incomingBuffer = []; // Non-blocking buffer for incoming logs
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

        this.logLevel = logLevel

        this.isSubscribed = true;



        try {
            this.originalLogConfig = sys.get_logs(true);



            sys.on_log = (tool, level, message) => {
                this.handleLog(tool, level, message);
            };

            sys.set_logs(this.logLevel);

            // Start SessionManager loop if not running
            this.client.sessionManager.sendStats();

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
     *
     */
    this.handleLog = function(tool, level, message) {
        // Only create log object - NO OTHER PROCESSING
        const log = {
            timestamp: Date.now(),
            tool,
            level,
            message: message?.length > 500 ? message.substring(0, 500) + '...' : message
        };

        // Just add to buffer - will be processed by tick()
        this.incomingBuffer.push(log);
    };

    /**
     * Tick function called by SessionManager - processes incoming logs
     */
    this.tick = function(now) {
        if (!this.isSubscribed) return;
        if (this.incomingBuffer.length > 0) {
            this.processIncomingLogs();
        }
    };

    /**
     * Process logs from buffer (runs in post_task, safe for WebSocket)
     */
    this.processIncomingLogs = function() {
        if (!this.isSubscribed || this.incomingBuffer.length === 0) {
            return;
        }


        // Move all logs from incoming buffer
        const logsToProcess = this.incomingBuffer.splice(0);

        // Process each log
        for (const log of logsToProcess) {
            // Keep history limited
            if (this.logs.length >= 10000) {
                this.logs.shift();
            }
            this.logs.push(log);

            // Add to pending batch
            this.pendingLogs.push(log);
        }

        // Determine batching strategy based on processed logs
        const hasDebugLogs = logsToProcess.some(log => log.level === 'debug' || log.level === 'info');
        const maxPending = hasDebugLogs ? 20 : 50; // Slightly larger batches
        const delay = hasDebugLogs ? 100 : 250; // More conservative delays
        
        // Flush if batch is full
        if (this.pendingLogs.length >= maxPending) {
            this.flushPendingLogs();
            return;
        }
        
        // Schedule delayed flush
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
        } else {
           /*  console.log(`[LogManager] sendToClient: Client not ready, cannot send ${data.message}`); */
        }
    };

    /**
     * Force cleanup - called on client disconnect
     * Ensures sys.on_log is properly cleaned even if subscriptions exist
     */
    this.forceUnsubscribe = function() {
        console.log(`LogManager: Force cleanup for client ${this.client.id}`);

        try {
            // Flush any pending logs before cleanup
            this.flushPendingLogs();

            // Force reset of sys.on_log regardless of subscription status
            sys.on_log = undefined;

            // Restore original GPAC config if we had one
            if (this.originalLogConfig) {
                sys.set_logs(this.originalLogConfig);
            }

            // Reset all internal state
            this.isSubscribed = false;
            this.logs = [];
            this.pendingLogs = [];
            this.incomingBuffer = [];

            // Clear timers
            this.batchTimer = null;

            console.log(`LogManager: Client ${this.client.id} force cleanup completed`);
        } catch (error) {
            console.error("LogManager: Error during force cleanup:", error);
        }
    };

    /**
     * Handle session end - cleanup resources
     */
    this.handleSessionEnd = function() {
        this.forceUnsubscribe();
    };
}

export { LogManager };