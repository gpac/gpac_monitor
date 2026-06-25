export const BADGE_DURATION_US = 3_000_000;

type BadgeType = 'pid' | 'arg';

interface PendingExpiration {
  filterIdx: number;
  type: BadgeType;
  expiresAtUs: number;
}

export interface ExpiredBadge {
  filterIdx: number;
  type: BadgeType;
}

export class BadgeExpirationController {
  private pending: PendingExpiration[] = [];

  schedule(filterIdx: number, type: BadgeType, eventTsUs: number): void {
    const expiresAtUs = eventTsUs + BADGE_DURATION_US;
    const existing = this.pending.find(
      (entry) => entry.filterIdx === filterIdx && entry.type === type,
    );
    if (existing) {
      existing.expiresAtUs = Math.max(existing.expiresAtUs, expiresAtUs);
    } else {
      this.pending.push({ filterIdx, type, expiresAtUs });
    }
  }

  tick(currentTimeUs: number): ExpiredBadge[] {
    if (this.pending.length === 0) return [];

    const expired: ExpiredBadge[] = [];
    let writeIndex = 0;
    for (let readIndex = 0; readIndex < this.pending.length; readIndex++) {
      const entry = this.pending[readIndex];
      if (currentTimeUs >= entry.expiresAtUs) {
        expired.push({ filterIdx: entry.filterIdx, type: entry.type });
      } else {
        this.pending[writeIndex] = entry;
        writeIndex++;
      }
    }
    this.pending.length = writeIndex;
    return expired;
  }

  reset(): void {
    this.pending = [];
  }
}
