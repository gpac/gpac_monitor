function PidDataCollector() {
    
    this.collectInputPids = function(filter) {
        const ipids = {};
        
        for (let i = 0; i < filter.nb_ipid; i++) {
            const pid = {};
            pid.name = filter.ipid_props(i, "name"); 
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

            const name = pid.name || `ipid_${i}`;
            ipids[name] = pid;
        }
        
        return ipids;
    };

    this.collectOutputPids = function(filter) {
        const opids = {};

        for (let i = 0; i < filter.nb_opid; i++) {
            const pid = {};

            // Direct stream properties
            pid.name = filter.opid_props(i, "name");
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
            }

            const name = pid.name || `opid_${i}`;
            opids[name] = pid;
        }

        return opids;
    };
}

export { PidDataCollector };