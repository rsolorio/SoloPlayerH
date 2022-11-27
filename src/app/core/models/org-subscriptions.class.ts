import { Subscription } from 'rxjs';

/**
 * Class that handles subscriptions and a method to unsubscribe from all at once.
 */
export class Subscriptions {
  private _counter = 0; // tslint:disable-line:variable-name
  private _subscriptions: { [key: string]: Subscription } = {}; // tslint:disable-line:variable-name

  /**
   * Adds a new subscription to the internal registry.
   * If the key already exists, the existing subscription will be replaced by the new one.
   * @param subscription The subscription to register.
   * @param key A key used to uniquely identify the subscription.
   */
  public add(subscription: Subscription, key?: string): void {
    const actualKey = key || 'key-' + this._counter++;

    // If existing, unsubscribe
    this.unSubscribeByKey(actualKey);
    // Then add/replace
    this._subscriptions[actualKey] = subscription;
  }

  public set sink(subscription: Subscription) {
    this.add(subscription);
  }

  public get(key: string): Subscription {
    if (this._subscriptions.hasOwnProperty(key)) {
      return this._subscriptions[key];
    }
    return null;
  }

  public unSubscribe(key?: string): void {
    if (key) {
      this.unSubscribeByKey(key);
    }
    else {
      Object.keys(this._subscriptions).forEach(subKey => {
        this.unSubscribeByKey(subKey);
      });
      this._subscriptions = {};
    }
  }

  /**
   * Removes the subscription associated with the specified key, if exists.
   * @param key The unique identifier of the subscription.
   */
  private unSubscribeByKey(key: string): void {
    const existingSub = this.get(key);
    if (existingSub) {
      existingSub.unsubscribe();
    }
  }
}
