import { Sys as sys } from 'gpaccore';
import { CPU_STATS_FIELDS } from '../config.js';

function CpuStatsManager(client) {
    this.client = client;
    this.isSubscribed = false;
    this.interval = 250;
    this.fields = CPU_STATS_FIELDS;
    this.lastSent = 0;

    this.subscribe = function(interval, fields) {
        this.isSubscribed = true;
        this.interval = interval || 250;
        this.fields = fields || CPU_STATS_FIELDS;
        this.lastSent = 0; // Force first send on next tick

        // Start SessionManager loop if not running
        this.client.sessionManager.sendStats();
    };

    this.unsubscribe = function() {
        this.isSubscribed = false;
    };

    this.tick = function(now) {
        if (!this.isSubscribed) return;
        if (now - this.lastSent < this.interval) return;

        const cpuStats = {
            timestamp: now,
            total_cpu_usage: sys.total_cpu_usage,
            process_cpu_usage: sys.process_cpu_usage,
            process_memory: sys.process_memory,
            physical_memory: sys.physical_memory,
            physical_memory_avail: sys.physical_memory_avail,
            gpac_memory: sys.gpac_memory,
            nb_cores: sys.nb_cores,
            thread_count: sys.thread_count,

            memory_usage_percent: 0,
            process_memory_percent: 0,
            gpac_memory_percent: 0,
            cpu_efficiency: 0
        };

        if (sys.physical_memory > 0) {
            cpuStats.memory_usage_percent =
                ((sys.physical_memory - sys.physical_memory_avail) / sys.physical_memory) * 100;
            cpuStats.process_memory_percent =
                (sys.process_memory / sys.physical_memory) * 100;
            cpuStats.gpac_memory_percent =
                (sys.gpac_memory / sys.physical_memory) * 100;
        }

        if (sys.total_cpu_usage > 0) {
            cpuStats.cpu_efficiency =
                (sys.process_cpu_usage / sys.total_cpu_usage) * 100;
        }

        if (this.client.client) {
            this.client.client.send(JSON.stringify({
                message: 'cpu_stats',
                stats: cpuStats
            }));
        }

        this.lastSent = now;
    };

    this.handleSessionEnd = function() {
        this.unsubscribe();
    };
}

export { CpuStatsManager };