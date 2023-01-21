import { Injectable } from '@angular/core';
import { EventsService } from 'src/app/core/services/events/events.service';
import { BreadcrumbEventType } from '../../models/breadcrumbs.enum';
import { ICriteriaValueBaseModel } from '../../models/criteria-base-model.interface';
import { AppEvent } from '../../models/events.enum';
import { IBreadcrumbModel } from './breadcrumbs-model.interface';

@Injectable({
  providedIn: 'root'
})
export class BreadcrumbsStateService {

  private state: IBreadcrumbModel[] = [];
  private eventsEnabled = true;

  constructor(private events: EventsService) { }

  public getState(): IBreadcrumbModel[] {
    return this.state;
  }

  public clear(): void {
    this.state = [];
  }

  public add(newBreadcrumb: IBreadcrumbModel): void {
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
    // Fire event
    if (this.eventsEnabled) {
      this.events.broadcast(AppEvent.BreadcrumbUpdated, BreadcrumbEventType.Add);
    }
  }

  public remove(sequence: number): void {
    let lastBreadcrumb = this.getLast();
    let removeCount = 0;
    while (lastBreadcrumb && lastBreadcrumb.sequence >= sequence) {
      removeCount++;
      this.removeLast();
      lastBreadcrumb = this.getLast();
    }
    if (removeCount && this.eventsEnabled) {
      this.events.broadcast(AppEvent.BreadcrumbUpdated, BreadcrumbEventType.RemoveMultiple);
    }
  }

  public removeLast(): IBreadcrumbModel {
    const result = this.state.pop();
    // Now turn on the last flag on the last item
    const lastItem = this.getLast();
    if (lastItem) {
      lastItem.last = true;
    }
    if (this.eventsEnabled) {
      this.events.broadcast(AppEvent.BreadcrumbUpdated, BreadcrumbEventType.Remove);
    }
    return result;
  }

  public replace(breadcrumbs: IBreadcrumbModel[], forceReload?: boolean): void {
    this.clear();
    this.eventsEnabled = false;
    for (var breadcrumb of breadcrumbs) {
      this.add(breadcrumb);
    }
    this.eventsEnabled = true;
    this.events.broadcast(AppEvent.BreadcrumbUpdated, BreadcrumbEventType.Replace);
    if (forceReload) {
      this.reload();
    }
  }

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

  public reload() {
    this.events.broadcast(AppEvent.BreadcrumbUpdated, BreadcrumbEventType.Updated);
  }
}
