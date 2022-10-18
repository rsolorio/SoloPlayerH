import { Component, OnInit } from '@angular/core';
import { LoadingViewStateService } from 'src/app/core/components/loading-view/loading-view-state.service';
import { CoreComponent } from 'src/app/core/models/core-component.class';
import { IMenuModel } from 'src/app/core/models/menu-model.interface';
import { EventsService } from 'src/app/core/services/events/events.service';
import { AppRoutes } from 'src/app/core/services/utility/utility.enum';
import { UtilityService } from 'src/app/core/services/utility/utility.service';
import { IClassificationModel } from 'src/app/shared/models/classification-model.interface';
import { AppEvent } from 'src/app/shared/models/events.enum';
import { IPaginationModel } from 'src/app/shared/models/pagination-model.interface';
import { ClassificationListBroadcastService } from './classification-list-broadcast.service';
import { ClassificationListStateService } from './classification-list-state.service';

@Component({
  selector: 'sp-classification-list',
  templateUrl: './classification-list.component.html',
  styleUrls: ['./classification-list.component.scss']
})
export class ClassificationListComponent extends CoreComponent implements OnInit {

  public model: IPaginationModel<IClassificationModel> = {
    items: []
  };
  /** This is the menu of each artist item */
  public menuList: IMenuModel[] = [];

  public isGenreList = false;

  constructor(
    private stateService: ClassificationListStateService,
    private events: EventsService,
    private broadcastService: ClassificationListBroadcastService,
    private utility: UtilityService,
    private loadingService: LoadingViewStateService
  ) {
    super();
    this.isGenreList = this.utility.isRouteActive(AppRoutes.Genres);
  }

  ngOnInit(): void {
    this.loadingService.show();
    this.initializeMenu();

    this.subs.sink = this.events.onEvent<IPaginationModel<IClassificationModel>>(AppEvent.ClassificationListUpdated).subscribe(response => {
      this.model = response;
      this.loadingService.hide();
    });

    const pagination: IPaginationModel<IClassificationModel> = {
      items: [],
      criteria: null,
      name: null
    };
    // Use broadcast to search and populate
    if (this.isGenreList) {
      // TODO: filter by genre
      this.broadcastService.getAndBroadcastGenres(pagination).subscribe();
    }
    else {
      // TODO: filter by anything except filter
      this.broadcastService.getAndBroadcast(pagination).subscribe();
    }
  }

  private initializeMenu(): void {
    this.menuList.push({
      caption: 'Play',
      icon: 'mdi-play mdi',
      action: param => {}
    });

    this.menuList.push({
      caption: 'Search...',
      icon: 'mdi-web mdi',
      action: param => {
        const classificationModel = param as IClassificationModel;
        this.utility.googleSearch(classificationModel.name);
      }
    });

    this.menuList.push({
      caption: 'Properties...',
      icon: 'mdi-square-edit-outline mdi',
      action: param => {
        const classification = param as IClassificationModel;
        if (classification) {
          this.utility.navigateWithRouteParams(AppRoutes.Classifications, [classification.id]);
        }
      }
    });
  }

  public onIntersectionChange(isIntersecting: boolean, classification: IClassificationModel): void {
    // console.log(isIntersecting);
    // console.log(artist);

    classification.canBeRendered = isIntersecting;
    if (isIntersecting && !classification.imageSrc) {
      // TODO: logic for getting artist image
      classification.imageSrc = '../assets/img/default-image-small.jpg';
    }
  }

}
