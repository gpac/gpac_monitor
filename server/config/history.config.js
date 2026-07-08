const RATE_LIMIT_US = 1000 * 1000; // throttle recording: 1 event/s max
const CHUNK_DURATION_US = 10 * 1000 * 1000; // chunk duration: 10s
const MAX_LOG_PER_CHUNK = 5000;
const MAX_LOG_MESSAGE_LENGTH = 500; // raw log message truncation

export {
    RATE_LIMIT_US,
    CHUNK_DURATION_US,
    MAX_LOG_PER_CHUNK,
    MAX_LOG_MESSAGE_LENGTH,
};
