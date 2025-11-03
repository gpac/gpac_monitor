/**
 * Batches WebSocket messages and processes them once per frame (RAF cadence)
 *
 *
 * Performance impact:
 * - Before: N messages → N Redux dispatches → N React commits
 * - After: N messages → 1 batch → 1 React commit
 *
 *
 */
export class WSMessageBatcher {
  private pendingMessages: Map<string, any[]> = new Map();
  private rafScheduled = false;
  private rafId: number | null = null;

  /**
   * Add a message to the batch queue
   * @param messageType Message category (e.g., 'log_batch', 'cpu_stats')
   * @param message The message data
   */
  add(messageType: string, message: any): void {
    if (!this.pendingMessages.has(messageType)) {
      this.pendingMessages.set(messageType, []);
    }
    this.pendingMessages.get(messageType)!.push(message);

    // Schedule flush if not already scheduled
    if (!this.rafScheduled) {
      this.rafScheduled = true;
      this.rafId = requestAnimationFrame(() => this.flush());
    }
  }

  /**
   * Process all pending messages in a single batch
   * @param handlers Map of message type → handler function
   */
  private flush(): void {
    if (this.pendingMessages.size === 0) {
      this.rafScheduled = false;
      return;
    }

    // Collect all messages by type
    const messagesByType = new Map(this.pendingMessages);
    this.pendingMessages.clear();
    this.rafScheduled = false;

    // Process all messages (React 18 automatically batches state updates)
    for (const [messageType, messages] of messagesByType) {
      // Get the handler for this message type
      const handler = this.handlers.get(messageType);
      if (handler) {
        handler(messages);
      }
    }
  }

  /**
   * Handlers registry: message type → processing function
   */
  private handlers = new Map<string, (messages: any[]) => void>();

  /**
   * Register a handler for a specific message type
   * @param messageType Message category (e.g., 'log_batch')
   * @param handler Function to process batched messages
   */
  registerHandler(
    messageType: string,
    handler: (messages: any[]) => void,
  ): void {
    this.handlers.set(messageType, handler);
  }

  /**
   * Unregister a handler
   * @param messageType Message category
   */
  unregisterHandler(messageType: string): void {
    this.handlers.delete(messageType);
  }

  /**
   * Clear all pending messages and cancel RAF
   */
  clear(): void {
    if (this.rafId !== null) {
      cancelAnimationFrame(this.rafId);
      this.rafId = null;
    }
    this.pendingMessages.clear();
    this.rafScheduled = false;
  }
}
