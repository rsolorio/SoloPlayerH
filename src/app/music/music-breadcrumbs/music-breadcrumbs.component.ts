import { Component, OnInit } from '@angular/core';
import { CoreComponent } from 'src/app/core/models/core-component.class';
import { EventsService } from 'src/app/core/services/events/events.service';
import { AppEvent } from 'src/app/shared/models/events.enum';
import { BreadcrumbEventType, IMusicBreadcrumbModel } from 'src/app/shared/models/music-breadcrumb-model.interface';
import { MusicBreadcrumbsStateService } from './music-breadcrumbs-state.service';

@Component({
  selector: 'sp-music-breadcrumbs',
  templateUrl: './music-breadcrumbs.component.html',
  styleUrls: ['./music-breadcrumbs.component.scss']
})
export class MusicBreadcrumbsComponent extends CoreComponent implements OnInit {

  public model: IMusicBreadcrumbModel[];

  constructor(private breadcrumbsService: MusicBreadcrumbsStateService, private events: EventsService) {
    super();
  }

  ngOnInit(): void {
    this.reload();
    this.subs.sink = this.events.onEvent<BreadcrumbEventType>(AppEvent.MusicBreadcrumbUpdated).subscribe(response => {
      if (response === BreadcrumbEventType.Updated) {
        this.reload();
      }
    });
  }

  public onContainerScroll(): void {}

  public onClick(breadcrumb: IMusicBreadcrumbModel): void {
    if (breadcrumb.last) {
      // If it's the last remove it
      this.breadcrumbsService.remove(breadcrumb.sequence);
    }
    else {
      // If it's not the last, leave it and remove trailing ones
      this.breadcrumbsService.remove(breadcrumb.sequence + 1);
    }
  }

  public reload(): void {
    this.model = this.breadcrumbsService.getState();
  }
}
