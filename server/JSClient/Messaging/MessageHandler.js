import { DEFAULT_FILTER_FIELDS, UPDATE_INTERVALS } from '../config.js';
import { cacheManager } from '../Cache/CacheManager.js';

function MessageHandler(client) {
    this.client = client;

    this.handleMessage = function(msg, all_clients) {
        console.log("All clients:");
        for (let jc of all_clients) {
            console.log("Client ", jc.id, jc.client.peer_address);
        }

        console.log("on_client_data on client id ", this.client.id, " len ", msg.length, msg);
        console.log("this has peer:", this.client.client.peer_address);

        let text = msg;
        if (text.startsWith("json:")) {
            try {
                let jtext = JSON.parse(text.substr(5));
                if (!('message' in jtext)) return;

                const handlers = {
                    'get_all_filters': () => {
                        print("Sending all filters when ready");
                        this.client.filterManager.sendAllFilters();
                    },
                    
                    'filter_args_details': () => {
                        let idx = jtext['idx'];
                        print("Details requested for idx " + idx);
                        this.client.filterManager.requestDetails(idx);
                    },
                    
                    'stop_filter_args': () => {
                        let idx = jtext['idx'];
                        console.log("STOP MESSAGE****", jtext['message']);
                        print("Details stopped for idx " + idx);
                        this.client.filterManager.stopDetails(idx);
                    },
                    
                    'subscribe_session': () => {
                        const interval = jtext['interval'] || UPDATE_INTERVALS.SESSION_STATS;
                        const fields = jtext['fields'] || DEFAULT_FILTER_FIELDS;
                        print(`[MessageHandler] Subscribing to session (interval: ${interval}ms)`);
                        this.client.sessionStatsManager.subscribe(interval, fields);
                        this.client.sessionManager.startMonitoringLoop();
                    },

                    'unsubscribe_session': () => {
                        print("Unsubscribing to session");
                        this.client.sessionStatsManager.unsubscribe();
                    },
                    
                    'subscribe_filter': () => {
                        const idx = jtext.idx;
                        let interval = jtext.interval || UPDATE_INTERVALS.FILTER_STATS;
                        let pidScope = jtext.pidScope || 'both';
                        if(!pidScope) {
                            pidScope = 'both';
                        }
                        print(`[MessageHandler] Subscribing to filter ${idx} (interval: ${interval}ms), pidScope: ${pidScope}`);
                        this.client.filterManager.subscribeToFilter(idx, interval, pidScope);
                        this.client.sessionManager.startMonitoringLoop();
                    },
                    
                    'unsubscribe_filter': () => {
                        const idx = jtext.idx;
                        this.client.filterManager.unsubscribeFromFilter(idx);
                    },
                    
                    'update_arg': () => {
                        print("Update arguments of ")
                        print(JSON.stringify(jtext));
                        this.client.filterManager.updateArgument(jtext['idx'], jtext['name'], jtext['argName'], jtext['newValue']);
                    },
                    
                    'get_png': () => {
                        print("request png of ")
                        print(JSON.stringify(jtext));
                        this.client.filterManager.addPngProbe(jtext['idx'], jtext['name']);
                    },
                    
                    'subscribe_cpu_stats': () => {
                        const interval = jtext['interval'] || UPDATE_INTERVALS.CPU_STATS;
                        const fields = jtext['fields'] || [];
                        print(`[MessageHandler] Subscribing to CPU stats (interval: ${interval}ms)`);
                        this.client.cpuStatsManager.subscribe(interval, fields);
                        this.client.sessionManager.startMonitoringLoop();
                    },
                    
                    'unsubscribe_cpu_stats': () => {
                        print("Unsubscribing to CPU stats");
                        this.client.cpuStatsManager.unsubscribe();
                    },
                    
                    'subscribe_logs': () => {
                        print("Subscribing to GPAC logs");
                        const logLevel = jtext['logLevel'] || "all@warning";
                        this.client.logManager.subscribe(logLevel);
                        this.client.sessionManager.startMonitoringLoop();
                    },
                    
                    'unsubscribe_logs': () => {
                        print("Unsubscribing from GPAC logs");
                        this.client.logManager.unsubscribe();
                    },
                    
                    'update_log_level': () => {
                        print("Updating log level");
                        const logLevel = jtext['logLevel'] || "all@warning";
                        this.client.logManager.updateLogLevel(logLevel);
                    },
                    
                    'get_log_status': () => {
                        print("Getting log status");
                        const status = this.client.logManager.getStatus();
                        this.client.client.send(JSON.stringify({
                            message: 'log_status',
                            status: status
                        }));
                    },

                    'get_ipid_props': () => {
                        print("Getting IPID properties for filter " + jtext['filterIdx'] + " PID " + jtext['ipidIdx']);
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
                        print("Getting GPAC command line");
                        this.client.commandLineManager.sendCommandLine();
                    },

                    'get_cache_stats': () => {
                        print("Getting cache statistics");
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
                console.log(e);
            }
        }
    };
}

export { MessageHandler };