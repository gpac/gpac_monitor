import { DEFAULT_FILTER_FIELDS } from '../config.js';

/**
 * Collect session statistics payload from GPAC session.
 * Pure data function — no WS, no client, no history coupling.
 *
 * @param {object} session - GPAC session global
 * @param {string[]} [fields] - Filter fields to collect (defaults to DEFAULT_FILTER_FIELDS)
 * @returns {{ all_packets_done: boolean, stats: object[] }}
 */
function buildSessionStatsPayload(session, fields) {
    const resolvedFields = fields || DEFAULT_FILTER_FIELDS;
    const stats = [];
    const filters = [];

    session.lock_filters(true);
    for (let i = 0; i < session.nb_filters; i++) {
        const f = session.get_filter(i);
        if (f.is_destroyed()) continue;
        filters.push(f);

        const obj = {};
        for (const field of resolvedFields) obj[field] = f[field];

        let allInputsEos = f.nb_ipid > 0;
        for (let j = 0; j < f.nb_ipid; j++) {
            if (!f.ipid_props(j, 'eos')) { allInputsEos = false; break; }
        }
        obj.is_eos = allInputsEos;
        obj.last_ts_sent = f.last_ts_sent || null;

        stats.push(obj);
    }

    let allFiltersEos = filters.length > 0;
    for (const f of filters) {
        if (f.nb_ipid === 0) continue;
        for (let i = 0; i < f.nb_ipid; i++) {
            if (!f.ipid_props(i, 'eos')) { allFiltersEos = false; break; }
        }
    }
    const all_packets_done = session.last_task && allFiltersEos;
    session.lock_filters(false);

    return { all_packets_done, stats };
}

export { buildSessionStatsPayload };
