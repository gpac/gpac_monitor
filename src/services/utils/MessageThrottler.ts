/**
 * Utility to throttle high-frequency updates 
 */
export class MessageThrottler {
    private lastUpdateTimes = new Map<string, number>();
    private pendingCallbacks = new Map<string, NodeJS.Timeout>();

    /**
     * Throttles a callback for a given message type
     * @param messageType Message type (e.g., 'cpu_stats', 'filter_stats')
     * @param callback Function to call
     * @param minInterval Minimum interval between calls (ms)
     * @param data Data to pass to the callback
     */
    public throttle<T>(
        messageType: string,
        callback: (data: T) => void,
        minInterval: number,
        data: T
    ): void {
        const now = Date.now();
        const lastUpdate = this.lastUpdateTimes.get(messageType) || 0;
        const timeSinceLastUpdate = now - lastUpdate;

        // If enough time has passed, execute immediately
        if (timeSinceLastUpdate >= minInterval) {
            this.lastUpdateTimes.set(messageType, now);
            callback(data);
            return;
        }

        // Otherwise, schedule execution after the remaining delay
        const existingTimeout = this.pendingCallbacks.get(messageType);
        if (existingTimeout) {
            clearTimeout(existingTimeout);
        }

        const remainingTime = minInterval - timeSinceLastUpdate;
        const timeoutId = setTimeout(() => {
            this.lastUpdateTimes.set(messageType, Date.now());
            this.pendingCallbacks.delete(messageType);
            callback(data);
        }, remainingTime);

        this.pendingCallbacks.set(messageType, timeoutId);
    }

    /**
     * Clears all pending timeouts
     */
    public clear(): void {
        this.pendingCallbacks.forEach((timeout) => clearTimeout(timeout));
        this.pendingCallbacks.clear();
        this.lastUpdateTimes.clear();
    }

    /**
     * Clears timeouts for a specific message type
     */
    public clearMessageType(messageType: string): void {
        const timeout = this.pendingCallbacks.get(messageType);
        if (timeout) {
            clearTimeout(timeout);
            this.pendingCallbacks.delete(messageType);
        }
        this.lastUpdateTimes.delete(messageType);
    }
}
