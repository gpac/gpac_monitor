export const WS_CONFIG = {
  address: 'ws://localhost:6363',
  maxReconnectAttempts: 3,
  reconnectDelay: 1000,
  maxDelay: 10000,
};

export const GPAC_CONSTANTS = {
  MAX_RECONNECT_ATTEMPTS: 2,
  SUBSCRIPTION_INTERVAL: 1000,
  THROTTLE_DELAY: 1000,
  SESSION_FIELDS: [
    'status',
    'bytes_done',
    'pck_sent',
    'pck_done',
    'time',
    'idx',
    'bytes_sent',
  ],
} as const;
