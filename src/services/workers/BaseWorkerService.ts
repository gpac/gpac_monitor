/**
 * Generic base class for worker services
 * Eliminates code duplication across worker services
 */
export abstract class BaseWorkerService<TInput, TOutput> {
  protected worker: Worker | null = null;
  protected subscribers: Set<(data: TOutput) => void> = new Set();

  constructor(
    protected readonly serviceName: string,
    protected readonly responseType: string,
  ) {
    this.initWorker();
  }

  protected abstract createWorker(): Worker;
  protected abstract extractData(eventData: unknown): TOutput;
  protected abstract createMessage(data: TInput): unknown;

  protected validateInput(_data: TInput): boolean {
    return true;
  }

  private initWorker(): void {
    try {
      this.worker = this.createWorker();

      this.worker.onmessage = (event: MessageEvent) => {
        const { type } = event.data;

        if (type === this.responseType) {
          const data = this.extractData(event.data);
          this.notifySubscribers(data);
        }
      };

      this.worker.onerror = (error) => {
        console.error(`[${this.serviceName}] Worker error:`, error);
      };
    } catch (error) {
      console.error(`[${this.serviceName}] Failed to create worker:`, error);
    }
  }

  private notifySubscribers(data: TOutput): void {
    this.subscribers.forEach((callback) => {
      try {
        callback(data);
      } catch (error) {
        console.error(`[${this.serviceName}] Callback error:`, error);
      }
    });
  }

  process(data: TInput): void {
    if (!this.worker || !this.validateInput(data)) return;
    this.worker.postMessage(this.createMessage(data));
  }

  subscribe(callback: (data: TOutput) => void): () => void {
    this.subscribers.add(callback);
    return () => {
      this.subscribers.delete(callback);
    };
  }

  cleanup(): void {
    if (this.worker) {
      try {
        this.worker.postMessage({ type: 'CLEANUP' });
      } catch (error) {
        console.warn(
          `[${this.serviceName}] Failed to send cleanup message:`,
          error,
        );
      }
    }
  }
}
