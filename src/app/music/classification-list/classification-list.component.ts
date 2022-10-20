import { Component, OnInit } from '@angular/core';
import { LoadingViewStateService } from 'src/app/core/components/loading-view/loading-view-state.service';
import { CoreComponent } from 'src/app/core/models/core-component.class';
import { IMenuModel } from 'src/app/core/models/menu-model.interface';
import { AppRoutes } from 'src/app/core/services/utility/utility.enum';
import { UtilityService } from 'src/app/core/services/utility/utility.service';
import { IClassificationModel } from 'src/app/shared/models/classification-model.interface';
import { AppEvent } from 'src/app/shared/models/events.enum';
import { IPaginationModel } from 'src/app/shared/models/pagination-model.interface';
import { ClassificationListBroadcastService } from './classification-list-broadcast.service';

@Component({
  selector: 'sp-classification-list',
  templateUrl: './classification-list.component.html',
  styleUrls: ['./classification-list.component.scss']
})
export class ClassificationListComponent extends CoreComponent implements OnInit {

  public appEvent = AppEvent;
  public itemMenuList: IMenuModel[] = [];
  public isGenreList = false;

  constructor(
    private broadcastService: ClassificationListBroadcastService,
    private utility: UtilityService,
    private loadingService: LoadingViewStateService
  ) {
    super();
    this.isGenreList = this.utility.isRouteActive(AppRoutes.Genres);
  }

  ngOnInit(): void {
    this.initializeItemMenu();
  }

  private initializeItemMenu(): void {
    this.itemMenuList.push({
      caption: 'Play',
      icon: 'mdi-play mdi',
      action: param => {}
    });

    this.itemMenuList.push({
      caption: 'Search...',
      icon: 'mdi-web mdi',
      action: param => {
        const classificationModel = param as IClassificationModel;
        this.utility.googleSearch(classificationModel.name);
      }
    });

    this.itemMenuList.push({
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

  public onSearch(searchTerm: string): void {
    console.log(searchTerm);
  }

  public onFavoriteClick(): void {}

  public onItemContentClick(): void {}

  public onInitialized(): void {
    this.loadingService.show();
    const pagination: IPaginationModel<IClassificationModel> = {
      items: [],
      criteria: null,
      name: null
    };
    if (this.isGenreList) {
      // TODO: filter by genre
      this.broadcastService.getAndBroadcastGenres(pagination).subscribe();
    }
    else {
      // TODO: filter by anything except filter
      this.broadcastService.getAndBroadcast(pagination).subscribe();
    }
  }

}
