import { DEFAULT_FILTER_FIELDS, UPDATE_INTERVALS } from '../config.js';
import { cacheManager } from '../Cache/CacheManager.js';

function MessageHandler(client) {
    this.client = client;

    this.handleMessage = function(msg, all_clients) {
        let text = msg;
        if (text.startsWith("json:")) {
            try {
                let jtext = JSON.parse(text.substr(5));
                if (!('message' in jtext)) return;

                const handlers = {
                    'get_all_filters': () => {
                        this.client.filterManager.sendAllFilters();
                    },

                    'filter_args_details': () => {
                        let idx = jtext['idx'];
                        this.client.filterManager.requestDetails(idx);
                    },

                    'stop_filter_args': () => {
                        let idx = jtext['idx'];
                        this.client.filterManager.stopDetails(idx);
                    },

                    'subscribe_session': () => {
                        const interval = jtext['interval'] || UPDATE_INTERVALS.SESSION_STATS;
                        const fields = jtext['fields'] || DEFAULT_FILTER_FIELDS;
                        this.client.sessionStatsManager.subscribe(interval, fields);
                        this.client.sessionManager.startMonitoringLoop();
                    },

                    'unsubscribe_session': () => {
                        this.client.sessionStatsManager.unsubscribe();
                    },

                    'subscribe_filter': () => {
                        const idx = jtext.idx;
                        let interval = jtext.interval || UPDATE_INTERVALS.FILTER_STATS;
                        let pidScope = jtext.pidScope || 'both';
                        if(!pidScope) {
                            pidScope = 'both';
                        }
                        this.client.filterManager.subscribeToFilter(idx, interval, pidScope);
                        this.client.sessionManager.startMonitoringLoop();
                    },
                    
                    'unsubscribe_filter': () => {
                        const idx = jtext.idx;
                        this.client.filterManager.unsubscribeFromFilter(idx);
                    },

                    'update_arg': () => {
                        this.client.filterManager.updateArgument(jtext['idx'], jtext['name'], jtext['argName'], jtext['newValue']);
                    },
             
                    
                    

                    'get_png': () => {
                        this.client.filterManager.addPngProbe(jtext['idx'], jtext['name']);
                    },

                    'subscribe_cpu_stats': () => {
                        const interval = jtext['interval'] || UPDATE_INTERVALS.CPU_STATS;
                        const fields = jtext['fields'] || [];
                        this.client.cpuStatsManager.subscribe(interval, fields);
                        this.client.sessionManager.startMonitoringLoop();
                    },

                    'unsubscribe_cpu_stats': () => {
                        this.client.cpuStatsManager.unsubscribe();
                    },

                    'subscribe_logs': () => {
                        const logLevel = jtext['logLevel'] || "all@warning";
                        this.client.logManager.subscribe(logLevel);
                        this.client.sessionManager.startMonitoringLoop();
                    },

                    'unsubscribe_logs': () => {
                        this.client.logManager.unsubscribe();
                    },

                    'update_log_level': () => {
                        const logLevel = jtext['logLevel'] || "all@warning";
                        this.client.logManager.updateLogLevel(logLevel);
                    },

                    'get_log_status': () => {
                        const status = this.client.logManager.getStatus();
                        this.client.client.send(JSON.stringify({
                            message: 'log_status',
                            status: status
                        }));
                    },

                    'get_ipid_props': () => {
                        const props = this.client.pidPropsCollector.collectIpidProps(
                            jtext['filterIdx'],
                            jtext['ipidIdx']
                        );
                        this.client.client.send(JSON.stringify({
                            message: 'ipid_props_response',
                            filterIdx: jtext['filterIdx'],
                            ipidIdx: jtext['ipidIdx'],
                            properties: props
                        }));
                    },

                    'get_command_line': () => {
                        this.client.commandLineManager.sendCommandLine();
                    },

                    'get_cache_stats': () => {
                        const stats = cacheManager.stats();
                        this.client.client.send(JSON.stringify({
                            message: 'cache_stats',
                            stats: stats
                        }));
                    }
                };

                const handler = handlers[jtext['message']];
                if (handler) {
                    handler();
                }

            } catch (e) {
                console.error("MessageHandler: Error handling message:", e);
            }
        }
    };
}

export { MessageHandler };