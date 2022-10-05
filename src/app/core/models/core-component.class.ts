import { Directive, OnDestroy } from '@angular/core';
import { Subscriptions } from './org-subscriptions.class';

@Directive()
// tslint:disable:directive-class-suffix
export class CoreComponent implements OnDestroy {
  /**
   * List of observable subscriptions.
   * Use the 'add' or 'sink' method to register subscriptions.
   * The component will automatically unsubscribe from all at once at destroy.
   */
  public subs = new Subscriptions();

  public ngOnDestroy() {
    this.subs.unSubscribe();
  }
}