import { LogBatchResponse } from '@/services/ws/types';
import { GpacLogEntry } from '@/types/domain/gpac/log-types';

/**
 * Batches log messages and processes them once per frame (RAF cadence)
 *
 * Why only logs?
 * - Logs: High frequency (10-200+ msgs/sec with 4 filters) → batch critical
 * - Stats: Low frequency (~1 msg/sec per filter) → batch adds latency
 *
 * Performance impact:
 * - Before: N log messages → N Redux dispatches → N React commits
 * - After: N log messages → 1 batch → 1 React commit (~60fps)
 */
export class WSMessageBatcher {
  private pendingLogs: LogBatchResponse[] = [];
  private rafScheduled = false;
  private rafId: number | null = null;
  private handler: ((logs: GpacLogEntry[]) => void) | null = null;

  /**
   * Add a log batch message to the queue
   * @param message Log batch response
   */
  addLogBatch(message: LogBatchResponse): void {
    this.pendingLogs.push(message);

    // Schedule flush if not already scheduled
    if (!this.rafScheduled) {
      this.rafScheduled = true;
      this.rafId = requestAnimationFrame(() => this.flush());
    }
  }

  /**
   * Process all pending log messages in a single batch
   */
  private flush(): void {
    if (this.pendingLogs.length === 0 || !this.handler) {
      this.rafScheduled = false;
      return;
    }

    // Aggregate all logs from all messages in this frame
    const allLogs = this.pendingLogs.flatMap((msg) => msg.logs || []);
    this.pendingLogs = [];
    this.rafScheduled = false;

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
   * Clear all pending messages and cancel RAF
   */
  clear(): void {
    if (this.rafId !== null) {
      cancelAnimationFrame(this.rafId);
      this.rafId = null;
    }
    this.pendingLogs = [];
    this.rafScheduled = false;
  }
}
