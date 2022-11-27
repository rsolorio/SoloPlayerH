import { Component, OnInit } from '@angular/core';
import { IMusicBreadcrumbModel } from 'src/app/shared/models/music-breadcrumb-model.interface';
import { MusicBreadcrumbsStateService } from './music-breadcrumbs-state.service';

@Component({
  selector: 'sp-music-breadcrumbs',
  templateUrl: './music-breadcrumbs.component.html',
  styleUrls: ['./music-breadcrumbs.component.scss']
})
export class MusicBreadcrumbsComponent implements OnInit {

  public model: IMusicBreadcrumbModel[];

  constructor(private breadcrumbsService: MusicBreadcrumbsStateService) { }

  ngOnInit(): void {
    this.model = this.breadcrumbsService.getState();
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
}
