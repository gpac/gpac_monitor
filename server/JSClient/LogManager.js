import { Sys as sys } from 'gpaccore';
function LogManager(client) {
    this.client = client;
    this.isSubscribed = false;
    this.logLevel = "all@warning";
    this.logs = [];
    this.originalLogConfig = null;
    this.pendingLogs = [];
    this.batchTimer = null;

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
            
            if (this.logs.length > 0) {
                this.sendToClient({
                    message: 'log_history',
                    logs: this.logs.slice(-50)
                });
            }
            
            console.log(`LogManager: Client ${this.client.id} subscribed to logs at level: ${this.logLevel}`);
        } catch (error) {
            console.error("LogManager: Failed to start log capturing:", error);
            this.isSubscribed = false;
        }
    };

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
 
        if (level === 'debug') {
            // For debug: only keep 2 logs max, flush every 50ms
            if (this.pendingLogs.length >= 2) {
                this.flushPendingLogs();
                return;
            }
            if (!this.batchTimer) {
                this.batchTimer = true;
                session.post_task(() => {
                    if (session.last_task) {
                        this.unsubscribe();
                        return false;
                    }
                    if (!this.isSubscribed) return false;
                    this.flushPendingLogs();
                    return false; 
                }, 50);
            }
            return;
        }
        
        // For info/other levels
        const maxPending = (level === 'info') ? 10 : 50;
        if (this.pendingLogs.length >= maxPending) {
            this.flushPendingLogs();
            return;
        }
        
        if (!this.batchTimer) {
            this.batchTimer = true;
            const delay = (level === 'info') ? 500 : 2000;
            session.post_task(() => {
                if (session.last_task) {
                    this.unsubscribe();
                    return false;
                }
                if (!this.isSubscribed) return false;
                this.flushPendingLogs();
                return false; 
            }, delay);
        }
    };

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

    this.getStatus = function() {
        return {
            isSubscribed: this.isSubscribed,
            logLevel: this.logLevel,
            logCount: this.logs.length,
            currentLogConfig: sys.get_logs()
        };
    };

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

    
    this.sendToClient = function(data) {
        if (this.client.client && typeof this.client.client.send === 'function') {
            this.client.client.send(JSON.stringify(data));
        }
    };
}

export { LogManager };