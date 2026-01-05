import { Sys as sys } from 'gpaccore';
import { LOG_RETENTION } from '../config.js';
import { cleanupLogs } from './Utils/logs.js';

/**
 * LogManager - Manages log subscription and batching for GPAC system logs
 * Captures GPAC logs, batches them for performance, and sends to WebSocket client
 */
function LogManager(client) {
    this.client = client;
    this.isSubscribed = false;
    this.logLevel = "all@quiet";
    this.logs = []; // Historical logs storage (adaptive limit)
    this.maxHistorySize = LOG_RETENTION.maxHistorySize;
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

            // Enable extended log API
            sys.use_logx = true;

            sys.on_log = (tool, level, message, thread_id, caller) => {
                this.handleLog(tool, level, message, thread_id, caller);
            };

            sys.set_logs(this.logLevel);

            // Start SessionManager loop if not running
            this.client.sessionManager.startMonitoringLoop();

            // === TEMPORARY TEST LOGS ===
            // Inject fake errors/warnings to test alert system
            // Matching your command: gpac -js=server.js -i input.mp4 vout aout -rmt
            session.post_task(() => {
                print('[LogManager TEST] Injecting test logs for alert system...');

                // Error on "fin" filter (file input)
                this.handleLog('filter', 1, 'TEST ERROR: Failed to read frame from input.mp4', 100, { type: 'fin', name: 'fin', idx: 0 });

                // Warning on "vout" filter (video output)
                this.handleLog('filter', 2, 'TEST WARNING: Video output buffer full', 200, { type: 'vout', name: 'vout', idx: 3 });

                // Error on "aout" filter (audio output)
                this.handleLog('filter', 1, 'TEST ERROR: Audio underrun detected', 300, { type: 'aout', name: 'aout', idx: 4 });

                // Another warning on "vout"
                this.handleLog('filter', 2, 'TEST WARNING: Dropped frame due to sync', 200, { type: 'vout', name: 'vout', idx: 3 });

                // Warning on system (no caller, fallback to thread_id)
                this.handleLog('core', 2, 'TEST WARNING: High CPU usage detected', 999, null);

                print('[LogManager TEST] Test logs injected! Check dashboard for badges.');
                print('[LogManager TEST] Expected: fin (1 ERR), vout (2 WARN), aout (1 ERR)');
                return false; // Don't repeat
            }, 2000); // 2 seconds after subscription
            // === END TEST LOGS ===

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
     * Captures extended log info (thread_id, caller) when available
     */
    this.handleLog = function(tool, level, message, thread_id, caller) {
        // Only create log object
        const log = {
            timestamp: sys.clock_us(),
            tool,
            level,
            message: message?.length > 500 ? message.substring(0, 500) + '...' : message,
            thread_id: thread_id,
            caller: this.serializeCaller(caller)
        };


        this.incomingBuffer.push(log);
    };

    /**
     * Serialize caller object to unique filter identifier
     * Use idx as primary key (unique per filter instance)
     */
    this.serializeCaller = function(caller) {
        if (!caller || typeof caller !== 'object') {
            return null;
        }

        // idx is the unique identifier for GPAC filters
        // Fallback to name for non-filter system objects
        return caller.idx !== undefined ? caller.idx : (caller.name || null);
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
            // Smart cleanup when buffer is full
            if (this.logs.length >= this.maxHistorySize) {
                this.logs = cleanupLogs(this.logs, this.maxHistorySize);
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

        // Adaptive buffer sizing based on log verbosity
        const isVerbose = logLevel.includes('debug') || logLevel.includes('info');
        this.maxHistorySize = isVerbose ? LOG_RETENTION.maxHistorySizeVerbose : LOG_RETENTION.maxHistorySize;

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