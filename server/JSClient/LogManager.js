import { Sys as sys } from 'gpaccore';
function LogManager(client) {
    this.client = client;
    this.isSubscribed = false;
    this.logLevel = "all@warning";
    this.logs = [];
    this.originalLogConfig = null;
    
    // Simple configuration
    this.batchSize = 50;
    
    // Circular buffer to avoid costly shift() operations
    this.bufferSize = 10000;
    this.logRingBuffer = new Array(this.bufferSize);
    this.bufferStartIndex = 0;  // Index of the oldest log
    this.bufferLogCount = 0;    // Number of logs in the buffer
    
    // Rate counters to avoid overload
    this.maxBytesPerSecond = 50 * 1024;  //
    this.maxMessagesPerSecond = 30;       // Maximum 30 messages per second
    this.bytesThisSecond = 0;
    this.messagesThisSecond = 0;
    this.currentSecond = Math.floor(Date.now() / 1000);

    this.subscribe = function(logLevel) {
        if (this.isSubscribed) {
            console.log("LogManager:  Updating level from", this.logLevel, "to", logLevel);
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

            session.post_task(() => {
                if (session.last_task || !this.isSubscribed) {
                    return false; // Stop the task
                }
                
                // Flush any pending logs 
                if (this.bufferLogCount > 0) {
                    this.flushBatch();
                }
                
                return 500; 
            });
        
    };


    // Function to add a log to the circular buffer
    this.addLogToBuffer = function(timestamp, tool, level, message) {
        // Calculate the position to insert the new log
        const insertPosition = (this.bufferStartIndex + this.bufferLogCount) % this.bufferSize;
        
        // Store as simple tuple [timestamp, tool, level, message]
        this.logRingBuffer[insertPosition] = [timestamp, tool, level, message];
        
        if (this.bufferLogCount < this.bufferSize) {
            // Buffer not yet full, just increase the counter
            this.bufferLogCount++;
        } else {
            // Buffer full, overwrite the oldest (advance the start)
            this.bufferStartIndex = (this.bufferStartIndex + 1) % this.bufferSize;
        }
    };
    
    // Function to take N logs from the beginning of the buffer
    this.takeLogsFromBuffer = function(numberOfLogs) {
        const logsToTake = Math.min(numberOfLogs, this.bufferLogCount);
        const result = new Array(logsToTake);
        
        // Copy logs from the beginning of the buffer
        for (let i = 0; i < logsToTake; i++) {
            const position = (this.bufferStartIndex + i) % this.bufferSize;
            result[i] = this.logRingBuffer[position];
        }
        
        // Advance the start and reduce the counter
        this.bufferStartIndex = (this.bufferStartIndex + logsToTake) % this.bufferSize;
        this.bufferLogCount -= logsToTake;
        
        return result;
    };
    
    this.handleLog = function(tool, level, message) {
        const now = Date.now();
        
        // Add to circular buffer (no costly shift)
        this.addLogToBuffer(now, tool, level, message);
        
        // Maintain a small history for new clients (avoid shift)
        if (this.logs.length >= 500) {
            this.logs.pop(); // Remove the last instead of shifting the first
        }
        this.logs.push({ timestamp: now, tool, level, message });
        
        // Flush if enough logs accumulated
        if (this.bufferLogCount >= 50) {
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
            this.bufferStartIndex = 0;
            this.bufferLogCount = 0;
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

    // Function to check and reset the rate counters
    this.resetCountersIfNewSecond = function() {
        const newSecond = Math.floor(Date.now() / 1000);
        if (newSecond !== this.currentSecond) {
            this.currentSecond = newSecond;
            this.bytesThisSecond = 0;
            this.messagesThisSecond = 0;
        }
    };
    
    // Function to check if we can send more messages
    this.canSendMoreMessages = function() {
        return this.messagesThisSecond < this.maxMessagesPerSecond;
    };
    
    
    this.flushBatch = function() {
        if (this.bufferLogCount === 0) return;
        
        // Check rate limits
        this.resetCountersIfNewSecond();
        
        let batchesSent = 0;
        const maxBatchesPerFlush = 2;
        
        // Send multiple small batches if necessary
        while (this.bufferLogCount > 0 && batchesSent < maxBatchesPerFlush) {
            const logsInThisBatch = Math.min(this.batchSize, this.bufferLogCount);
            
            // Check limits before processing
            const estimatedSize = 100 + (logsInThisBatch * 150); // Simple estimation
            if (!this.canSendMoreMessages()) break;
            if (this.bytesThisSecond + estimatedSize > this.maxBytesPerSecond) break;
            
            // Take logs from buffer (no costly splice)
            const rawLogs = this.takeLogsFromBuffer(logsInThisBatch);
            
            // Truncate long messages here, not in handleLog
            for (let i = 0; i < rawLogs.length; i++) {
                const messageText = rawLogs[i][3];
                if (messageText && messageText.length > 500) {
                    rawLogs[i][3] = messageText.substring(0, 500) + '...';
                }
            }
            
            // Convert tuples to objects for sending
            const logObjects = rawLogs.map(function(logTuple) {
                return {
                    timestamp: logTuple[0],
                    tool: logTuple[1],
                    level: logTuple[2],
                    message: logTuple[3]
                };
            });
            
            const messageToSend = {
                message: 'log_batch',
                logs: logObjects
            };
            
            // Serialize once
            const jsonString = JSON.stringify(messageToSend);
            
            // Update counters
            this.bytesThisSecond += jsonString.length;
            this.messagesThisSecond += 1;
            
            // Send
            if (this.client?.client?.send) {
                this.client.client.send(jsonString);
            }
            
            batchesSent++;
        }
    };

    
    this.sendToClient = function(data) {
        if (this.client.client && typeof this.client.client.send === 'function') {
            this.client.client.send(JSON.stringify(data));
        }
    };
}

export { LogManager };