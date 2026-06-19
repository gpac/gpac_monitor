function _collectMediaProps(getProp) {
    return {
        timescale: getProp("Timescale"),
        codec: getProp("CodecID"),
        type: getProp("StreamType"),
        width: getProp("Width"),
        height: getProp("Height"),
        pixelformat: getProp("PixelFormat"),
        bitrate: getProp("Bitrate"),
        samplerate: getProp("SampleRate"),
        channels: getProp("Channels"),
    };
}

function _collectStats(stats, filter) {
    if (!stats) return null;
    const result = {
        disconnected: stats.disconnected,
        average_process_rate: stats.average_process_rate,
        max_process_rate: stats.max_process_rate,
        average_bitrate: stats.average_bitrate,
        max_bitrate: stats.max_bitrate,
        nb_processed: stats.nb_processed,
        max_process_time: stats.max_process_time,
        total_process_time: stats.total_process_time,
    };
    const lastTs = stats.last_ts_sent ?? filter.last_ts_sent;
    if (lastTs) result.last_ts_sent = lastTs;
    if (stats.last_process_time) result.last_process_time = stats.last_process_time;
    if (stats.buffer_time) result.buffer_time = stats.buffer_time;
    if (stats.nb_buffer_units) result.nb_buffer_units = stats.nb_buffer_units;
    if (stats.max_buffer_time) result.max_buffer_time = stats.max_buffer_time;
    if (stats.max_playout_time) result.max_playout_time = stats.max_playout_time;
    if (stats.min_playout_time) result.min_playout_time = stats.min_playout_time;
    if (stats.total_process_time > 0) result.average_process_time = stats.total_process_time / stats.nb_processed;
    return result;
}

function PidDataCollector() {

    this.collectInputPids = function(filter, withPidProperties) {
        const ipids = {};

        for (let i = 0; i < filter.nb_ipid; i++) {
            const originalName = filter.ipid_props(i, "name");
            const getProp = (name) => filter.ipid_props(i, name);

            const pid = {
                name: filter.nb_ipid > 1 && originalName ? `${originalName}_${i}` : originalName,
                buffer: getProp("buffer"),
                nb_pck_queued: getProp("nb_pck_queued"),
                would_block: getProp("would_block"),
                eos: getProp("eos"),
                playing: getProp("playing"),
                ..._collectMediaProps(getProp),
            };

            const source = filter.ipid_source(i);
            if (source) pid.source_idx = source.idx;

            const stats = _collectStats(filter.ipid_stats(i), filter);
            if (stats) pid.stats = stats;

            if (withPidProperties) {
                const allProps = {};
                filter.ipid_props(i, function(pname, ptype, pval) {
                    allProps[pname] = { name: pname, type: ptype, value: pval };
                });
                pid.properties = allProps;
            }

            const key = pid.name || `ipid_${i}`;
            ipids[key] = pid;
        }

        return ipids;
    };

    this.collectOutputPids = function(filter) {
        const opids = {};

        for (let i = 0; i < filter.nb_opid; i++) {
            const originalName = filter.opid_props(i, "name");
            const getProp = (name) => filter.opid_props(i, name);
            const rawStats = filter.opid_stats(i);

            const pid = {
                name: filter.nb_opid > 1 && originalName ? `${originalName}_${i}` : originalName,
                buffer: getProp("buffer"),
                max_buffer: getProp("max_buffer"),
                nb_pck_queued: getProp("nb_pck_queued"),
                would_block: getProp("would_block"),
                eos_received: rawStats?.eos_received,
                playing: getProp("playing"),
                ..._collectMediaProps(getProp),
                id: getProp("ID"),
                trackNumber: getProp("TrackNumber"),
                serviceID: getProp("ServiceID"),
                language: getProp("Language"),
                role: getProp("Role"),
            };

            const stats = _collectStats(rawStats, filter);
            if (stats) {
                if (rawStats.first_process_time) stats.first_process_time = rawStats.first_process_time;
                pid.stats = stats;
            }

            const key = pid.name || `opid_${i}`;
            opids[key] = pid;
        }

        return opids;
    };
}

export { PidDataCollector };
