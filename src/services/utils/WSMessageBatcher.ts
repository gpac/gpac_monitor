import { LogBatchResponse } from '@/services/ws/types';
import { GpacLogEntry } from '@/types/domain/gpac/log-types';

/**
 * Batches log messages with throttled dispatch (max 2x/second)
 */
export class WSMessageBatcher {
  private pendingLogs: LogBatchResponse[] = [];
  private flushScheduled = false;
  private timeoutId: ReturnType<typeof setTimeout> | null = null;
  private handler: ((logs: GpacLogEntry[]) => void) | null = null;
  private readonly FLUSH_INTERVAL = 500;

  /**
   * Add a log batch message to the queue
   * @param message Log batch response
   */
  addLogBatch(message: LogBatchResponse): void {
    this.pendingLogs.push(message);

    // Schedule flush with throttle
    if (!this.flushScheduled) {
      this.flushScheduled = true;
      this.timeoutId = setTimeout(() => this.flush(), this.FLUSH_INTERVAL);
    }
  }

  /**
   * Process all pending log messages in a single batch
   */
  private flush(): void {
    if (this.pendingLogs.length === 0 || !this.handler) {
      this.flushScheduled = false;
      return;
    }

    // Aggregate all logs efficiently (avoid flatMap)
    const allLogs: GpacLogEntry[] = [];
    for (const msg of this.pendingLogs) {
      if (msg.logs) {
        allLogs.push(...msg.logs);
      }
    }
    this.pendingLogs = [];
    this.flushScheduled = false;

    // Process aggregated logs once
    if (allLogs.length > 0) {
      this.handler(allLogs);
    }
  }

  /**
   * Register handler for batched log processing
   * @param handler Function to process aggregated logs
   */
  registerLogHandler(handler: (logs: GpacLogEntry[]) => void): void {
    this.handler = handler;
  }

  /**
   * Clear all pending messages and cancel timeout
   */
  clear(): void {
    if (this.timeoutId !== null) {
      clearTimeout(this.timeoutId);
      this.timeoutId = null;
    }
    this.pendingLogs = [];
    this.flushScheduled = false;
  }
}
