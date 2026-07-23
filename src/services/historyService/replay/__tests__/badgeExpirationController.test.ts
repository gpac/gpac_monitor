import { describe, it, expect, beforeEach } from 'vitest';
import { BadgeExpirationController } from '../badgeExpirationController';

const EVENT_TS = 30_000_000;
const BADGE_DURATION = 3_000_000;
const EXPIRES_AT = EVENT_TS + BADGE_DURATION;

describe('BadgeExpirationController', () => {
  let controller: BadgeExpirationController;

  beforeEach(() => {
    controller = new BadgeExpirationController();
  });

  it('returns nothing when no badges are scheduled', () => {
    expect(controller.tick(50_000_000)).toEqual([]);
  });

  it('does not expire badge before duration elapses', () => {
    controller.schedule(9, 'pid', EVENT_TS);

    expect(controller.tick(EVENT_TS)).toEqual([]);
    expect(controller.tick(31_000_000)).toEqual([]);
    expect(controller.tick(32_999_999)).toEqual([]);
  });

  it('expires badge exactly at event_ts + 3s', () => {
    controller.schedule(9, 'pid', EVENT_TS);

    const expired = controller.tick(EXPIRES_AT);
    expect(expired).toEqual([{ filterIdx: 9, type: 'pid' }]);
  });

  it('expires badge after event_ts + 3s', () => {
    controller.schedule(9, 'pid', EVENT_TS);

    const expired = controller.tick(EXPIRES_AT + 500_000);
    expect(expired).toEqual([{ filterIdx: 9, type: 'pid' }]);
  });

  it('seek to 32s shows badge for 1 more second', () => {
    controller.schedule(9, 'pid', EVENT_TS);

    expect(controller.tick(32_000_000)).toEqual([]);
    expect(controller.tick(EXPIRES_AT)).toEqual([
      { filterIdx: 9, type: 'pid' },
    ]);
  });

  it('seek to 31s shows badge for 2 more seconds', () => {
    controller.schedule(9, 'pid', EVENT_TS);

    expect(controller.tick(31_000_000)).toEqual([]);
    expect(controller.tick(32_000_000)).toEqual([]);
    expect(controller.tick(EXPIRES_AT)).toEqual([
      { filterIdx: 9, type: 'pid' },
    ]);
  });

  it('handles multiple badges with different expiration times', () => {
    controller.schedule(9, 'pid', 30_000_000);
    controller.schedule(5, 'arg', 31_000_000);

    const at32 = controller.tick(32_000_000);
    expect(at32).toEqual([]);

    const at33 = controller.tick(EXPIRES_AT);
    expect(at33).toEqual([{ filterIdx: 9, type: 'pid' }]);

    const at34 = controller.tick(34_000_000);
    expect(at34).toEqual([{ filterIdx: 5, type: 'arg' }]);
  });

  it('removes expired badges from pending list', () => {
    controller.schedule(9, 'pid', EVENT_TS);

    controller.tick(EXPIRES_AT);
    expect(controller.tick(EXPIRES_AT + 1_000_000)).toEqual([]);
  });

  it('reset clears all pending badges', () => {
    controller.schedule(9, 'pid', EVENT_TS);
    controller.schedule(5, 'arg', EVENT_TS);

    controller.reset();
    expect(controller.tick(EXPIRES_AT + 10_000_000)).toEqual([]);
  });

  it('does not expire badge early when same (filterIdx, type) scheduled twice', () => {
    controller.schedule(5, 'pid', 30_000_000);
    controller.schedule(5, 'pid', 30_500_000);

    expect(controller.tick(33_000_000)).toEqual([]);
  });

  it('expires badge once at max expiry when same (filterIdx, type) scheduled twice', () => {
    controller.schedule(5, 'pid', 30_000_000);
    controller.schedule(5, 'pid', 30_500_000);

    const expired = controller.tick(33_500_000);
    expect(expired).toEqual([{ filterIdx: 5, type: 'pid' }]);
    expect(controller.tick(34_000_000)).toEqual([]);
  });

  it('handles same filter with both pid and arg badges', () => {
    controller.schedule(9, 'pid', 30_000_000);
    controller.schedule(9, 'arg', 30_500_000);

    const at33 = controller.tick(EXPIRES_AT);
    expect(at33).toEqual([{ filterIdx: 9, type: 'pid' }]);

    const at33_5 = controller.tick(33_500_000);
    expect(at33_5).toEqual([{ filterIdx: 9, type: 'arg' }]);
  });
});
