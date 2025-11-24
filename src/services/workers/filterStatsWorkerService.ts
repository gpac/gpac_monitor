import { MonitoredFilterStats } from '@/types/domain/gpac';
import {
  FilterStatsWorkerMessage,
  FilterStatsWorkerResponse,
} from '@/workers/filterStatsWorker';
import FilterStatsWorker from '../../workers/filterStatsWorker?worker&inline';
import { BaseWorkerService } from './BaseWorkerService';

class FilterStatsWorkerService extends BaseWorkerService<
  MonitoredFilterStats,
  MonitoredFilterStats[]
> {
  constructor() {
    super('FilterStatsWorkerService', 'PROCESSED_FILTER_STATS');
  }

  protected createWorker(): Worker {
    return new FilterStatsWorker({ name: 'filterStatsWorker' });
  }

  protected extractData(
    eventData: FilterStatsWorkerResponse,
  ): MonitoredFilterStats[] {
    return eventData.statsBatch;
  }

  protected createMessage(
    stats: MonitoredFilterStats,
  ): FilterStatsWorkerMessage {
    return { type: 'PROCESS_FILTER_STATS', stats };
  }

  // Alias for backward compatibility
  processStats(stats: MonitoredFilterStats): void {
    this.process(stats);
  }
}

export const filterStatsWorkerService = new FilterStatsWorkerService();
