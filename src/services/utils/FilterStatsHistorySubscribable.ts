import { UpdatableSubscribable } from './UpdatableSubcribable';

export interface HistorySnapshot<D> {
  data: D;
  timestamp: number;
}

interface PersistedHistory<D> {
  history: HistorySnapshot<D>[];
  lastUpdate: number;
}

/**
 * Extended UpdatableSubscribable that maintains a history of data snapshots.
 * Useful for monitoring and debugging by preserving historical data.
 *
 * Features:
 * - In-memory circular buffer with configurable size
 * - localStorage persistence for post-mortem debugging
 * - Automatic cleanup of expired data
 */
export class FilterStatsHistorySubscribable<
  D,
> extends UpdatableSubscribable<D> {
  private history: HistorySnapshot<D>[] = [];
  private maxSnapshots: number;
  private storageKey: string | null = null;
  private autoSave: boolean;
  private retentionDuration: number; // milliseconds

  constructor(
    initialData: D,
    maxSnapshots = 60,
    options?: {
      storageKey?: string;
      autoSave?: boolean;
      retentionDuration?: number; // default: 5 minutes
    },
  ) {
    super(initialData);
    this.maxSnapshots = maxSnapshots;
    this.storageKey = options?.storageKey || null;
    this.autoSave = options?.autoSave ?? true;
    this.retentionDuration = options?.retentionDuration ?? 5 * 60 * 1000; // 5 min

    // Try to restore from localStorage first
    if (this.storageKey) {
      this.restoreFromStorage();
    }

    // Add initial snapshot if no history was restored
    if (this.history.length === 0) {
      this.history.push({
        data: structuredClone(initialData),
        timestamp: Date.now(),
      });
    }
  }

  /**
   * Override to capture history on every update
   */
  public updateDataAndNotify(newData: D, type?: any, extraData?: any): void {
    // Add to history with timestamp
    this.history.push({
      data: structuredClone(newData),
      timestamp: Date.now(),
    });

    // Circular buffer: keep only last N snapshots
    if (this.history.length > this.maxSnapshots) {
      this.history.shift();
    }

    // Auto-save to localStorage if enabled
    if (this.autoSave && this.storageKey) {
      this.saveToStorage();
    }

    // Call parent implementation
    super.updateDataAndNotify(newData, type, extraData);
  }

  /**
   * Save history to localStorage
   */
  private saveToStorage(): void {
    if (!this.storageKey) {
      console.warn('[FilterStatsHistorySubscribable] No storageKey configured');
      return;
    }

    try {
      const persisted: PersistedHistory<D> = {
        history: this.history,
        lastUpdate: Date.now(),
      };
      const serialized = JSON.stringify(persisted);
      localStorage.setItem(this.storageKey, serialized);
      console.log(
        `[FilterStatsHistorySubscribable] Saved ${this.history.length} snapshots to ${this.storageKey} (${Math.round(serialized.length / 1024)}KB)`,
      );
    } catch (error) {
      console.error(
        `[FilterStatsHistorySubscribable] Failed to save to localStorage:`,
        error,
      );
    }
  }

  /**
   * Restore history from localStorage
   */
  private restoreFromStorage(): void {
    if (!this.storageKey) return;

    try {
      const stored = localStorage.getItem(this.storageKey);
      if (!stored) return;

      const persisted: PersistedHistory<D> = JSON.parse(stored);

      // Check if data is expired
      const age = Date.now() - persisted.lastUpdate;
      if (age > this.retentionDuration) {
        console.log(
          `[FilterStatsHistorySubscribable] Stored data expired (age: ${Math.round(age / 1000)}s), clearing`,
        );
        localStorage.removeItem(this.storageKey);
        return;
      }

      // Restore history
      this.history = persisted.history;
      console.log(
        `[FilterStatsHistorySubscribable] Restored ${this.history.length} snapshots from storage`,
      );
    } catch (error) {
      console.error(
        `[FilterStatsHistorySubscribable] Failed to restore from localStorage:`,
        error,
      );
      // Clear corrupted data
      if (this.storageKey) {
        localStorage.removeItem(this.storageKey);
      }
    }
  }

  /**
   * Get full history
   */
  public getHistory(): HistorySnapshot<D>[] {
    return this.history;
  }

  /**
   * Get history within time range
   */
  public getHistoryInRange(
    startTime: number,
    endTime: number,
  ): HistorySnapshot<D>[] {
    return this.history.filter(
      (snapshot) =>
        snapshot.timestamp >= startTime && snapshot.timestamp <= endTime,
    );
  }

  /**
   * Get last N snapshots
   */
  public getLastSnapshots(count: number): HistorySnapshot<D>[] {
    return this.history.slice(-count);
  }

  /**
   * Clear history (keep current data)
   */
  public clearHistory(): void {
    const current = this.getSnapshot();
    this.history = [
      {
        data: current,
        timestamp: Date.now(),
      },
    ];

    // Clear from localStorage
    if (this.storageKey) {
      localStorage.removeItem(this.storageKey);
    }
  }

  /**
   * Get the number of snapshots in history
   */
  public getHistorySize(): number {
    return this.history.length;
  }

  /**
   * Manually trigger save to localStorage
   */
  public persistToStorage(): void {
    this.saveToStorage();
  }

  /**
   * Check if data in storage is expired and clean up if needed
   */
  public static cleanupExpiredStorage(
    storageKey: string,
    retentionDuration: number,
  ): void {
    try {
      const stored = localStorage.getItem(storageKey);
      if (!stored) return;

      const persisted: PersistedHistory<any> = JSON.parse(stored);
      const age = Date.now() - persisted.lastUpdate;

      if (age > retentionDuration) {
        localStorage.removeItem(storageKey);
        console.log(
          `[FilterStatsHistorySubscribable] Cleaned up expired storage: ${storageKey}`,
        );
      }
    } catch (error) {
      // Corrupted data, remove it
      localStorage.removeItem(storageKey);
    }
  }
}
