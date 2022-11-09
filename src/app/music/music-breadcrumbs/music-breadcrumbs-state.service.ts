import { Injectable } from '@angular/core';
import { EventsService } from 'src/app/core/services/events/events.service';
import { AppEvent } from 'src/app/shared/models/events.enum';
import { IMusicBreadcrumbModel } from 'src/app/shared/models/music-breadcrumb-model.interface';

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
    this.events.broadcast(AppEvent.MusicBreadcrumbAdded, newBreadcrumb);
  }

  public remove(sequence: number): void {
    let lastBreadcrumb = this.getLast();
    while (lastBreadcrumb && lastBreadcrumb.sequence >= sequence) {
      this.removeLast();
      lastBreadcrumb = this.getLast();
    }
  }

  public removeLast(): IMusicBreadcrumbModel {
    const result = this.state.pop();
    // Now turn on the last flag on the last item
    const lastItem = this.getLast();
    if (lastItem) {
      lastItem.last = true;
    }
    return result;
  }

  public getLast(): IMusicBreadcrumbModel {
    if (this.state.length) {
      return this.state[this.state.length - 1];
    }
    return null;
  }
}
