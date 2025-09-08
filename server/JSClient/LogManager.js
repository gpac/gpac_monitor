import { Sys as sys } from 'gpaccore';

function LogManager(client) {
    this.client = client;
    this.isSubscribed = false;
    this.logLevel = "all@warning";
    this.logs = [];
    this.originalLogConfig = null;
    
    // Batching configuration
    this.logBuffer = [];
    this.batchInterval = null;
    this.batchSize = 150;
    this.batchDelay = 160;
    


    this.subscribe = function(logLevel) {
        if (this.isSubscribed) {
            console.log("LogManager: Client already subscribed to logs, updating level from", this.logLevel, "to", logLevel);
            this.updateLogLevel(logLevel);
            return;
        }

        this.logLevel = logLevel || "all@warning";
        this.isSubscribed = true;

        try {
            // Store original log configuration
            this.originalLogConfig = sys.get_logs(true);
            
            // Set up log interception with bound callback 
            sys.on_log = (tool, level, message) => {
                this.handleLog(tool, level, message);
            };
            
            // Start periodic flush task (inspired by GPAC creator's approach)
            this.startPeriodicFlush();
            
            // Configure log level
            sys.set_logs(this.logLevel);
            
            // Send recent logs to new subscriber
            if (this.logs.length > 0) {
                const recentLogs = this.logs.slice(-50);
                this.sendToClient({
                    message: 'log_history',
                    logs: recentLogs
                });
            }
            
            console.log(`LogManager: Client ${this.client.id} subscribed to logs at level: ${this.logLevel}`);
        } catch (error) {
            console.error("LogManager: Failed to start log capturing:", error);
            this.isSubscribed = false;
        }
    };

    this.unsubscribe = function() {
        if (!this.isSubscribed) {
            return;
        }

        try {
            // Stop periodic flush task
            this.stopPeriodicFlush();
            
            // Flush any pending batch before unsubscribing
            this.flushBatch();
            
            // Remove log callback
            sys.on_log = undefined;
            
            // Restore original log configuration
            if (this.originalLogConfig) {
                sys.set_logs(this.originalLogConfig);
            }
            
            this.isSubscribed = false;
            this.logs = [];
            
            console.log(`LogManager: Client ${this.client.id} unsubscribed from logs`);
        } catch (error) {
            console.error("LogManager: Failed to stop log capturing:", error);
        }
    };


    // Periodic flush 
    this.startPeriodicFlush = function() {

            session.post_task((f) => {
                if (session.last_task || !this.isSubscribed) {
                    return false; // Stop the task
                }
                
                // Flush any pending logs 
                if (this.logBuffer.length > 0) {
                    this.flushBatch();
                }
                
                return 1000; 
            });
        
    };

    this.stopPeriodicFlush = function() {
        // The task will stop automatically when session.last_task is true or isSubscribed is false
    };

    this.handleLog = function(tool, level, message) {
        const logEntry = {
            timestamp: Date.now(),
            tool: tool,
            level: level,
            message: message
        };

        // Store log entry (simplified, no complex protection needed with periodic flush)
        this.logs.push(logEntry);
        if (this.logs.length > 500) { // Reduced from 1000 for better memory management
            this.logs.shift();
        }

        // Add to batch buffer (periodic task will flush it)
        this.logBuffer.push(logEntry);
        
        // More frequent flushing to prevent large accumulations
        if (this.logBuffer.length >= 100) {
            this.flushBatch();
        }
    };

    this.updateLogLevel = function(logLevel) {
        if (!this.isSubscribed) {
            console.log("LogManager: Cannot update log level, client not subscribed");
            return;
        }

        try {
            // Clear all logs when changing level to prevent massive history dumps
            this.logs = [];
            this.logBuffer = [];
            console.log("LogManager: Cleared logs for level change");
            
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

    this.getRecentLogs = function(limit) {
        const count = limit || 100;
        return this.logs.slice(-count);
    };

    this.clearLogs = function() {
        this.logs = [];
        console.log("LogManager: Cleared stored logs");
    };

    this.getCurrentLogConfig = function() {
        try {
            return sys.get_logs();
        } catch (error) {
            console.error("LogManager: Failed to get log config:", error);
            return "unknown";
        }
    };

    this.getStatus = function() {
        return {
            isSubscribed: this.isSubscribed,
            logLevel: this.logLevel,
            logCount: this.logs.length,
            emergencyMode: this.emergencyMode,
            currentLogRate: this.logRateCounter,
            droppedLogsCount: this.droppedLogsCount,
            samplingRate: this.samplingRate,
            currentLogConfig: this.getCurrentLogConfig()
        };
    };

    this.flushBatch = function() {
        if (this.logBuffer.length > 0) {

            
            // Split large batches to avoid frontend overload
            const maxBatchSize = 50; // Max 50 logs per message
            let batchCount = 0;
            
            while (this.logBuffer.length > 0) {
                const batch = this.logBuffer.splice(0, maxBatchSize);
                batchCount++;
                
       
                
                this.sendToClient({
                    message: 'log_batch',
                    logs: batch
                });
            }
            
   
        }
    };

    this.sendToClient = function(data) {
        if (this.client.client && typeof this.client.client.send === 'function') {
            this.client.client.send(JSON.stringify(data));
        }
    };
}

export { LogManager };