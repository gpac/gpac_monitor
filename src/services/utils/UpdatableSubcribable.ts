import type { ErrorWithBreadcrumbs } from './subscribable';
import { Subscribable } from './subscribable';

interface UpdatableExtraData {
  error: ErrorWithBreadcrumbs;
}

export class UpdatableSubscribable<
  D,
  N = undefined,
  E extends object = UpdatableExtraData,
> extends Subscribable<D, N, E> {
  /**
   * Updates the internal data and notifies subscribers immediately.
   * @param newData The new data to store.
   * @param type The type of notification (optional).
   * @param extraData Additional data for the notification (optional).
   */
  public updateDataAndNotify(
    newData: D,
    type?: N,
    extraData?: Partial<E>,
  ): void {
    this.data = newData;
    this.notify(type, extraData);
  }
}
