import { LogBatchResponse } from '@/services/ws/types';
import { GpacLogEntry } from '@/types/domain/gpac/log-types';

/**
 * Batches log messages with throttled dispatch (max 2x/second)
 */
export class WSMessageBatcher {
  private pendingLogs: GpacLogEntry[] = [];
  private flushScheduled = false;
  private timeoutId: ReturnType<typeof setTimeout> | null = null;
  private handler: ((logs: GpacLogEntry[]) => void) | null = null;
  private readonly FLUSH_INTERVAL = 500;

  /**
   * Add a log batch message to the queue
   * @param message Log batch response
   */
  addLogBatch(message: LogBatchResponse): void {
    const logs = message.logs;
    if (logs && logs.length) this.pendingLogs.push(...logs);

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
    this.timeoutId = null;
    if (this.pendingLogs.length === 0 || !this.handler) {
      this.flushScheduled = false;
      return;
    }

    const logsToSend = this.pendingLogs;
    this.pendingLogs = [];
    this.flushScheduled = false;

    this.handler(logsToSend);
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
