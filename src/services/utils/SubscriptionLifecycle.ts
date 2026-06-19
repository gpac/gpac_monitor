// Deduplicates in-flight WS subscribe/unsubscribe requests and manages the 100ms
// auto-unsubscribe delay that guards against premature cleanup during React re-renders.
// Key = undefined for single-key handlers (CPU, session, logs); Key = number for per-filter handlers.
export class SubscriptionLifecycle<Key = undefined> {
  private pendingSubscribes = new Map<Key, Promise<void>>();
  private pendingUnsubscribes = new Map<Key, Promise<void>>();
  private autoUnsubscribeTimeouts = new Map<
    Key,
    ReturnType<typeof setTimeout>
  >();

  subscribe(key: Key, send: () => Promise<void>): Promise<void> {
    const existing = this.pendingSubscribes.get(key);
    if (existing) return existing;
    const promise = (async () => {
      try {
        await send();
      } finally {
        this.pendingSubscribes.delete(key);
      }
    })();
    this.pendingSubscribes.set(key, promise);
    return promise;
  }

  unsubscribe(key: Key, send: () => Promise<void>): Promise<void> {
    const existing = this.pendingUnsubscribes.get(key);
    if (existing) return existing;
    const promise = (async () => {
      try {
        await send();
      } finally {
        this.pendingUnsubscribes.delete(key);
      }
    })();
    this.pendingUnsubscribes.set(key, promise);
    return promise;
  }

  scheduleAutoUnsubscribe(key: Key, fn: () => void, delayMs = 100): void {
    const existingTimeout = this.autoUnsubscribeTimeouts.get(key);
    if (existingTimeout !== undefined) clearTimeout(existingTimeout);
    const timeoutId = setTimeout(() => {
      this.autoUnsubscribeTimeouts.delete(key);
      fn();
    }, delayMs);
    this.autoUnsubscribeTimeouts.set(key, timeoutId);
  }

  cancelAutoUnsubscribe(key: Key): void {
    const existingTimeout = this.autoUnsubscribeTimeouts.get(key);
    if (existingTimeout !== undefined) {
      clearTimeout(existingTimeout);
      this.autoUnsubscribeTimeouts.delete(key);
    }
  }

  cleanup(): void {
    this.autoUnsubscribeTimeouts.forEach((timeout) => clearTimeout(timeout));
    this.autoUnsubscribeTimeouts.clear();
  }
}
