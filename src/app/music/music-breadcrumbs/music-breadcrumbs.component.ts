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
}
