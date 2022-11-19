import { Injectable } from '@angular/core';
import { EventsService } from 'src/app/core/services/events/events.service';
import { ICriteriaValueBaseModel } from 'src/app/shared/models/criteria-base-model.interface';
import { AppEvent } from 'src/app/shared/models/events.enum';
import { BreadcrumbEventType, IMusicBreadcrumbModel } from 'src/app/shared/models/music-breadcrumb-model.interface';

@Injectable({
  providedIn: 'root'
})
export class MusicBreadcrumbsStateService {

  private state: IMusicBreadcrumbModel[] = [];

  constructor(private events: EventsService) { }

  public getState(): IMusicBreadcrumbModel[] {
    return this.state;
  }

  public clear(): void {
    this.state = [];
  }

  public add(newBreadcrumb: IMusicBreadcrumbModel): void {
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
    this.events.broadcast(AppEvent.MusicBreadcrumbUpdated, BreadcrumbEventType.Add);
  }

  public remove(sequence: number): void {
    let lastBreadcrumb = this.getLast();
    let removeCount = 0;
    while (lastBreadcrumb && lastBreadcrumb.sequence >= sequence) {
      removeCount++;
      this.removeLast();
      lastBreadcrumb = this.getLast();
    }
    if (removeCount) {
      this.events.broadcast(AppEvent.MusicBreadcrumbUpdated, BreadcrumbEventType.RemoveMultiple);
    }
  }

  public removeLast(): IMusicBreadcrumbModel {
    const result = this.state.pop();
    // Now turn on the last flag on the last item
    const lastItem = this.getLast();
    if (lastItem) {
      lastItem.last = true;
    }
    this.events.broadcast(AppEvent.MusicBreadcrumbUpdated, BreadcrumbEventType.Remove);
    return result;
  }

  public getLast(): IMusicBreadcrumbModel {
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
}
