import { GpacLogEntry } from '@/types/domain/gpac/log-types';
import { LogWorkerMessage, LogWorkerResponse } from '@/workers/logWorker';
import LogWorker from '../../workers/logWorker?worker&inline';

export class LogWorkerService {
  private worker: Worker | null = null;
  private subscribers: Set<(logs: GpacLogEntry[]) => void> = new Set();

  constructor() {
    this.initWorker();
  }

  private initWorker() {
    try {
      // Créer le Worker

      this.worker = new LogWorker({ name: 'logWorker' });
      // Écouter les messages du Worker
      this.worker.onmessage = (event: MessageEvent<LogWorkerResponse>) => {
        const { type, logs } = event.data;

        if (type === 'PROCESSED_LOGS') {
          // Notifier tous les subscribers
          this.subscribers.forEach((callback) => {
            try {
              callback(logs);
            } catch (error) {
              console.error('[LogWorkerService] Callback error:', error);
            }
          });
        }
      };

      this.worker.onerror = (error) => {
        console.error('[LogWorkerService] Worker error:', error);
      };
    } catch (error) {
      console.error('[LogWorkerService] Failed to create worker:', error);
    }
  }

  // Envoyer des logs au Worker pour traitement
  processLogs(logs: GpacLogEntry[]) {
    if (!this.worker || logs.length === 0) return;

    const message: LogWorkerMessage = {
      type: 'PROCESS_LOGS',
      logs,
    };

    this.worker.postMessage(message);
  }

  // S'abonner aux logs traités
  subscribe(callback: (logs: GpacLogEntry[]) => void): () => void {
    this.subscribers.add(callback);

    return () => {
      this.subscribers.delete(callback);
    };
  }

  // Nettoyer le Worker
  destroy() {
    if (this.worker) {
      this.worker.terminate();
      this.worker = null;
    }
    this.subscribers.clear();
  }
}

// Instance singleton
export const logWorkerService = new LogWorkerService();
