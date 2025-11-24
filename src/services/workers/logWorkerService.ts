import { GpacLogEntry } from '@/types/domain/gpac/log-types';
import { LogWorkerMessage, LogWorkerResponse } from '@/workers/logWorker';
import LogWorker from '../../workers/logWorker?worker&inline';
import { BaseWorkerService } from './BaseWorkerService';

class LogWorkerService extends BaseWorkerService<
  GpacLogEntry[],
  GpacLogEntry[]
> {
  constructor() {
    super('LogWorkerService', 'PROCESSED_LOGS');
  }

  protected createWorker(): Worker {
    return new LogWorker({ name: 'logWorker' });
  }

  protected extractData(eventData: LogWorkerResponse): GpacLogEntry[] {
    return eventData.logs;
  }

  protected createMessage(logs: GpacLogEntry[]): LogWorkerMessage {
    return { type: 'PROCESS_LOGS', logs };
  }

  protected validateInput(logs: GpacLogEntry[]): boolean {
    return logs.length > 0;
  }

  // Alias for backward compatibility
  processLogs(logs: GpacLogEntry[]): void {
    this.process(logs);
  }
}

export const logWorkerService = new LogWorkerService();
