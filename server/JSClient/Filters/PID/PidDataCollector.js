function PidDataCollector() {
    
    this.collectInputPids = function(filter) {
        const ipids = {};

        for (let i = 0; i < filter.nb_ipid; i++) {
            const pid = {};
            const originalName = filter.ipid_props(i, "name");
            // Make name unique when multiple PIDs have the same name
            pid.name = filter.nb_ipid > 1 && originalName ? `${originalName}_${i}` : originalName;
            pid.buffer = filter.ipid_props(i, "buffer");
            pid.nb_pck_queued = filter.ipid_props(i, "nb_pck_queued");
            pid.would_block = filter.ipid_props(i, "would_block");
            pid.eos = filter.ipid_props(i, "eos");
            pid.playing = filter.ipid_props(i, "playing");

            pid.timescale = filter.ipid_props(i, "Timescale"); 
            pid.codec = filter.ipid_props(i, "CodecID");
            pid.type = filter.ipid_props(i, "StreamType"); 
            
            // For video
            pid.width = filter.ipid_props(i, "Width");
            pid.height = filter.ipid_props(i, "Height");
            pid.pixelformat = filter.ipid_props(i, "PixelFormat");
            pid.bitrate= filter.ipid_props(i, "Bitrate");

            // For audio
            pid.samplerate = filter.ipid_props(i, "SampleRate");
            pid.channels = filter.ipid_props(i, "Channels");
            
            // Source index for input PIDs
            const source = filter.ipid_source(i);
            if (source) {
                pid.source_idx = source.idx; 
            }

            const stats = filter.ipid_stats(i); 
            if (stats) {
                pid.stats = {};
                pid.stats.disconnected = stats.disconnected; 
                pid.stats.average_process_rate = stats.average_process_rate;
                pid.stats.max_process_rate = stats.max_process_rate;
                pid.stats.average_bitrate = stats.average_bitrate;
                pid.stats.max_bitrate = stats.max_bitrate;
                pid.stats.nb_processed = stats.nb_processed;
                pid.stats.max_process_time = stats.max_process_time;
                pid.stats.total_process_time = stats.total_process_time;
            }

            // Use pid.name as key (already made unique above)
            const key = pid.name || `ipid_${i}`;
            ipids[key] = pid;
        }
        
        return ipids;
    };

    this.collectOutputPids = function(filter) {
        const opids = {};

        for (let i = 0; i < filter.nb_opid; i++) {
            const pid = {};

            // Direct stream properties
            const originalName = filter.opid_props(i, "name");
            // Make name unique when multiple PIDs have the same name
            pid.name = filter.nb_opid > 1 && originalName ? `${originalName}_${i}` : originalName;
            pid.buffer = filter.opid_props(i, "buffer");
            pid.max_buffer = filter.opid_props(i, "max_buffer");
            pid.nb_pck_queued = filter.opid_props(i, "nb_pck_queued");
            pid.would_block = filter.opid_props(i, "would_block");
            const statsEos = filter.opid_stats(i);
            pid.eos_received = statsEos?.eos_received;
            pid.playing = filter.opid_props(i, "playing");

            // Media type specific properties
            pid.timescale = filter.opid_props(i, "Timescale");
            pid.codec = filter.opid_props(i, "CodecID");
            pid.type = filter.opid_props(i, "StreamType");
            
            // For video
            pid.width = filter.opid_props(i, "Width");
            pid.height = filter.opid_props(i, "Height");
            pid.pixelformat = filter.opid_props(i, "PixelFormat");

            // For audio
            pid.samplerate = filter.opid_props(i, "SampleRate");
            pid.channels = filter.opid_props(i, "Channels");

            // Identification & Metadata (for UX badges and tooltips)
            pid.id = filter.opid_props(i, "ID");
            pid.trackNumber = filter.opid_props(i, "TrackNumber");
            pid.serviceID = filter.opid_props(i, "ServiceID");
            pid.language = filter.opid_props(i, "Language");
            pid.role = filter.opid_props(i, "Role");

            // Detailed statistics
            const stats = filter.opid_stats(i);
            if (stats) {
                pid.stats = {};
                pid.stats.disconnected = stats.disconnected;
                pid.stats.average_process_rate = stats.average_process_rate;
                pid.stats.max_process_rate = stats.max_process_rate;
                pid.stats.average_bitrate = stats.average_bitrate;
                pid.stats.max_bitrate = stats.max_bitrate;
                pid.stats.nb_processed = stats.nb_processed;
                pid.stats.max_process_time = stats.max_process_time;
                pid.stats.total_process_time = stats.total_process_time;

                // Timing stats (for "time since last packet" and first packet time)
                pid.stats.last_ts_sent = stats.last_ts_sent;
                pid.stats.first_process_time = stats.first_process_time;

                // Debug: Log OPID stats
                console.log(`[PidDataCollector] OPID ${pid.name} stats:`, JSON.stringify({
                    nb_processed: stats.nb_processed,
                    avg_bitrate: stats.average_bitrate,
                    max_bitrate: stats.max_bitrate,
                    disconnected: stats.disconnected,
                    max_proc_time: stats.max_process_time
                }));
            }

            // Use pid.name as key (already made unique above)
            const key = pid.name || `opid_${i}`;
            opids[key] = pid;
        }

        return opids;
    };
}

export { PidDataCollector };