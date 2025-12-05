import { LOG_RETENTION } from '../../config.js';

/**
 * Keeps errors > warnings > infos > debugs based on configured ratios
 * @param {Array} logs - Array of log objects with {level, timestamp, ...}
 * @param {number} maxSize - Maximum history size
 * @returns {Array} - Cleaned logs array
 */
export function cleanupLogs(logs, maxSize) {
    if (logs.length <= maxSize) return logs;

    // Group logs by level
    const byLevel = {
        error: logs.filter(log => log.level === 'error'),
        warning: logs.filter(log => log.level === 'warning'),
        info: logs.filter(log => log.level === 'info'),
        debug: logs.filter(log => log.level === 'debug')
    };

    // Calculate how many to keep per level (keep most recent)
    const toKeep = {
        error: Math.ceil(byLevel.error.length * LOG_RETENTION.keepRatio.error),
        warning: Math.ceil(byLevel.warning.length * LOG_RETENTION.keepRatio.warning),
        info: Math.ceil(byLevel.info.length * LOG_RETENTION.keepRatio.info),
        debug: Math.ceil(byLevel.debug.length * LOG_RETENTION.keepRatio.debug)
    };

    // Keep most recent of each level
    const kept = [
        ...byLevel.error.slice(-toKeep.error),
        ...byLevel.warning.slice(-toKeep.warning),
        ...byLevel.info.slice(-toKeep.info),
        ...byLevel.debug.slice(-toKeep.debug)
    ];

    // Sort by timestamp to maintain chronological order
    kept.sort((a, b) => a.timestamp - b.timestamp);

    // If still too many, keep only most recent
    if (kept.length > maxSize) {
        return kept.slice(-maxSize);
    }

    return kept;
}
