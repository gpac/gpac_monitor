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
    this.batchDelay = 150; 

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

    this.handleLog = function(tool, level, message) {
        const logEntry = {
            timestamp: Date.now(),
            tool: tool,
            level: level,
            message: message
        };

        // Store log entry (keep last 1000 entries)
        this.logs.push(logEntry);
        if (this.logs.length > 1000) {
            this.logs.shift();
        }

        // Add to batch buffer
        this.logBuffer.push(logEntry);

        // Send batch if buffer is full
        if (this.logBuffer.length >= this.batchSize) {
            this.flushBatch();
        } else if (!this.batchInterval) {
            // Start timer if not already running
            this.batchInterval = setTimeout(() => this.flushBatch(), this.batchDelay);
        }
    };

    this.updateLogLevel = function(logLevel) {
        if (!this.isSubscribed) {
            console.log("LogManager: Cannot update log level, client not subscribed");
            return;
        }

        try {
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
            currentLogConfig: this.getCurrentLogConfig()
        };
    };

    this.flushBatch = function() {
        if (this.logBuffer.length > 0) {
            this.sendToClient({
                message: 'log_batch',
                logs: [...this.logBuffer]
            });
            this.logBuffer = [];
        }
        
        // Clear timer reference
        if (this.batchInterval) {
            clearTimeout(this.batchInterval);
            this.batchInterval = null;
        }
    };

    this.sendToClient = function(data) {
        if (this.client.client && typeof this.client.client.send === 'function') {
            this.client.client.send(JSON.stringify(data));
        }
    };
}

export { LogManager };