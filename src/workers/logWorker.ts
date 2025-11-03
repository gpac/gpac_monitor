import { GpacLogEntry } from '@/types/domain/gpac/log-types';

// Types for communication with the Worker
export interface LogWorkerMessage {
  type: 'PROCESS_LOGS';
  logs: GpacLogEntry[];
}

export interface LogWorkerResponse {
  type: 'PROCESSED_LOGS';
  logs: GpacLogEntry[];
  count: number;
}

// Worker configuration
const BATCH_SIZE = 500; // Max logs per batch sent to the UI (reduced for debug)
const FLUSH_INTERVAL = 200; // Flush interval in ms (increased for debug)
const MAX_BUFFER_SIZE = 100; // Circuit breaker - drop logs if buffer too big

class LogProcessor {
  private buffer: GpacLogEntry[] = [];
  private flushTimeout: NodeJS.Timeout | null = null;
  private totalProcessed = 0;
  private totalSent = 0;

  constructor() {
    this.startFlushTimer();
  }

  addLogs(logs: GpacLogEntry[]) {
    this.totalProcessed += logs.length;

    // Circuit breaker - drop logs if buffer is too full (keep for safety)
    if (this.buffer.length > MAX_BUFFER_SIZE) {
      // Keep only the most recent logs
      this.buffer = this.buffer.slice(-MAX_BUFFER_SIZE / 2);
      return;
    }

    this.buffer.push(...logs);

    // If the buffer exceeds the max size, flush immediately
    if (this.buffer.length >= BATCH_SIZE) {
      this.flush();
    }
  }

  private flush() {
    if (this.buffer.length === 0) return;

    // Take up to BATCH_SIZE logs
    const logsToSend = this.buffer.splice(0, BATCH_SIZE);
    this.totalSent += logsToSend.length;

    // Send to the main thread
    self.postMessage({
      type: 'PROCESSED_LOGS',
      logs: logsToSend,
      count: logsToSend.length,
    } as LogWorkerResponse);

    // If there are remaining logs, schedule another flush
    if (this.buffer.length > 0) {
      this.scheduleFlush();
    }
  }

  private scheduleFlush() {
    if (this.flushTimeout) return;

    this.flushTimeout = setTimeout(() => {
      this.flush();
      this.flushTimeout = null;
    }, FLUSH_INTERVAL);
  }

  private startFlushTimer() {
    // Periodic flush to avoid logs getting stuck
    setInterval(() => {
      if (this.buffer.length > 0 && !this.flushTimeout) {
        this.flush();
      }
    }, FLUSH_INTERVAL);
  }
}

// Processor instance
const processor = new LogProcessor();

// Listen for messages from the main thread
self.addEventListener('message', (event: MessageEvent<LogWorkerMessage>) => {
  const { type, logs } = event.data;

  switch (type) {
    case 'PROCESS_LOGS':
      processor.addLogs(logs);
      break;
    default:
      console.warn('[LogWorker] Unknown message type:', type);
  }
});

// Export type for TypeScript
export default null;
