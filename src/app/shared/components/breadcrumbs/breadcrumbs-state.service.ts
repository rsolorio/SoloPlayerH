import { Injectable } from '@angular/core';
import { EventsService } from 'src/app/core/services/events/events.service';
import { BreadcrumbEventType } from '../../models/breadcrumbs.enum';
import { ICriteriaValueBaseModel } from '../../models/criteria-base-model.interface';
import { AppEvent } from '../../models/events.enum';
import { IBreadcrumbModel, IBreadcrumbOptions } from './breadcrumbs-model.interface';

@Injectable({
  providedIn: 'root'
})
export class BreadcrumbsStateService {

  private state: IBreadcrumbModel[] = [];

  constructor(private events: EventsService) { }

  public getState(): IBreadcrumbModel[] {
    return this.state;
  }

  public clear(): void {
    this.state = [];
  }

  // ADD //////////////////////////////////////////////////////////////////////////////////////////

  public add(newBreadcrumbs: IBreadcrumbModel[], options?: IBreadcrumbOptions): void {
    let addCount = 0;
    for (const breadcrumb of newBreadcrumbs) {
      this.innerAdd(breadcrumb);
      addCount++;
    }

    if (addCount) {
      if (!options || !options.suppressEvents) {
        this.events.broadcast(AppEvent.BreadcrumbUpdated, BreadcrumbEventType.Add);
      }
    }
    if (options && options.forceReload) {
      this.reload();
    }
  }

  public addOne(newBreadcrumb: IBreadcrumbModel, options?: IBreadcrumbOptions): void {
    this.add([newBreadcrumb], options);
  }

  /**
   * Performs the addition of the breadcrumb to the state without firing any events.
   */
  private innerAdd(newBreadcrumb: IBreadcrumbModel): void {
    this.setupTooltip(newBreadcrumb);
    // First make sure all current breadcrumbs will not be marked as last
    for (const breadcrumb of this.state) {
      breadcrumb.last = false;
    }

    // Mark current breadcrumb as last and add it
    newBreadcrumb.last = true;
    this.state.push(newBreadcrumb);
    // Auto increment the id
    newBreadcrumb.sequence = this.state.length;
  }

  // REMOVE ///////////////////////////////////////////////////////////////////////////////////////

  /**
   * Removes all breadcrumbs that are greater than or equals to the specified sequence.
   * @param sequence The sequence of the breadcrumb.
   */
  public remove(sequence: number, options?: IBreadcrumbOptions): void {
    let lastBreadcrumb = this.getLast();
    let removeCount = 0;
    while (lastBreadcrumb && lastBreadcrumb.sequence >= sequence) {
      removeCount++;
      this.innerRemoveLast();
      lastBreadcrumb = this.getLast();
    }
    if (removeCount) {
      if (!options || !options.suppressEvents) {
        this.events.broadcast(AppEvent.BreadcrumbUpdated, BreadcrumbEventType.Remove);
      }
    }
    if (options && options.forceReload) {
      this.reload();
    }
  }

  public removeLast(options?: IBreadcrumbOptions): void {
    const lastItem = this.getLast();
    if (lastItem) {
      this.remove(lastItem.sequence, options);
    }
  }

  private innerRemoveLast(): IBreadcrumbModel {
    const result = this.state.pop();
    // Now turn on the last flag on the last item
    const lastItem = this.getLast();
    if (lastItem) {
      lastItem.last = true;
    }
    return result;
  }

  // SET //////////////////////////////////////////////////////////////////////////////////////////

  /**
   * Clears the current data and sets the new breadcrumbs.
   * @param breadcrumbs 
   * @param forceReload 
   */
  public set(breadcrumbs: IBreadcrumbModel[], options?: IBreadcrumbOptions): void {
    this.clear();
    for (var breadcrumb of breadcrumbs) {
      this.innerAdd(breadcrumb);
    }

    if (!options || !options.suppressEvents) {
      this.events.broadcast(AppEvent.BreadcrumbUpdated, BreadcrumbEventType.Set);
    }
    if (options && options.forceReload) {
      this.reload();
    }
  }

  // MISC /////////////////////////////////////////////////////////////////////////////////////////

  public getLast(): IBreadcrumbModel {
    if (this.state.length) {
      return this.state[this.state.length - 1];
    }
    return null;
  }

  public hasBreadcrumbs(): boolean {
    return this.state.length > 0;
  }

  public getCriteria(): ICriteriaValueBaseModel[] {
    const result: ICriteriaValueBaseModel[] = [];
    for (const breadcrumb of this.state) {
      for (const criteriaItem of breadcrumb.criteriaList) {
        result.push(criteriaItem);
      }
    }
    return result;
  }

  public setupTooltip(breadcrumb: IBreadcrumbModel): void {
    if (breadcrumb.tooltip) {
      return;
    }

    if (breadcrumb.criteriaList.length) {
      breadcrumb.tooltip = '';
      for (const criteriaItem of breadcrumb.criteriaList) {
        if (breadcrumb.tooltip) {
          breadcrumb.tooltip += ', ';
        }
        breadcrumb.tooltip += criteriaItem.DisplayValue;
      }
    }
  }

  /** Broadcasts the ReloadRequest event which is consumed by the breadcrumb component. */
  private reload() {
    this.events.broadcast(AppEvent.BreadcrumbUpdated, BreadcrumbEventType.ReloadRequested);
  }
}
