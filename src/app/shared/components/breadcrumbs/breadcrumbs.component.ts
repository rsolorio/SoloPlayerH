import { Component, OnInit } from '@angular/core';
import { CoreComponent } from 'src/app/core/models/core-component.class';
import { EventsService } from 'src/app/core/services/events/events.service';
import { BreadcrumbEventType } from '../../models/breadcrumbs.enum';
import { AppEvent } from '../../models/events.enum';
import { IBreadcrumbModel } from './breadcrumbs-model.interface';
import { BreadcrumbsStateService } from './breadcrumbs-state.service';

@Component({
  selector: 'sp-breadcrumbs',
  templateUrl: './breadcrumbs.component.html',
  styleUrls: ['./breadcrumbs.component.scss']
})
export class BreadcrumbsComponent extends CoreComponent implements OnInit {

  public model: IBreadcrumbModel[];

  constructor(private breadcrumbsService: BreadcrumbsStateService, private events: EventsService) {
    super();
  }

  ngOnInit(): void {
    this.reload();
    this.subs.sink = this.events.onEvent<BreadcrumbEventType>(AppEvent.BreadcrumbUpdated).subscribe(response => {
      if (response === BreadcrumbEventType.ReloadRequested) {
        this.reload();
      }
    });
  }

  public onContainerScroll(): void {}

  public onClick(breadcrumb: IBreadcrumbModel): void {
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
