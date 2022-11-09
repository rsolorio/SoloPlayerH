import { Component, OnInit } from '@angular/core';
import { LoadingViewStateService } from 'src/app/core/components/loading-view/loading-view-state.service';
import { CoreComponent } from 'src/app/core/models/core-component.class';
import { IMenuModel } from 'src/app/core/models/menu-model.interface';
import { AppRoutes } from 'src/app/core/services/utility/utility.enum';
import { UtilityService } from 'src/app/core/services/utility/utility.service';
import { IClassificationModel } from 'src/app/shared/models/classification-model.interface';
import { CriteriaOperator } from 'src/app/shared/models/criteria-base-model.interface';
import { CriteriaValueBase } from 'src/app/shared/models/criteria-base.class';
import { AppEvent } from 'src/app/shared/models/events.enum';
import { BreadcrumbSource } from 'src/app/shared/models/music-breadcrumb-model.interface';
import { SearchWildcard } from 'src/app/shared/models/search.enum';
import { MusicBreadcrumbsStateService } from '../music-breadcrumbs/music-breadcrumbs-state.service';
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
    private loadingService: LoadingViewStateService,
    private breadcrumbsService: MusicBreadcrumbsStateService
  ) {
    super();
    this.isGenreList = this.utility.isRouteActive(AppRoutes.Genres);
    this.broadcastService.isGenreList = this.isGenreList;
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
      isSeparator: true,
      caption: null
    });

    this.itemMenuList.push({
      caption: 'Album Artists',
      icon: 'mdi-account-music mdi',
      action: param => {
        const classification = param as IClassificationModel;
        if (classification) {
          this.showAlbumArtists(classification);
        }
      }
    });

    this.itemMenuList.push({
      caption: 'Albums',
      icon: 'mdi-album mdi',
      action: param => {
        const classification = param as IClassificationModel;
        if (classification) {
          this.showAlbums(classification);
        }
      }
    });

    this.itemMenuList.push({
      caption: 'Songs',
      icon: 'mdi-music-note mdi',
      action: param => {
        const classification = param as IClassificationModel;
        if (classification) {
          this.showSongs(classification);
        }
      }
    });
  }

  public onSearch(searchTerm: string): void {
    this.loadingService.show();
    this.broadcastService.search(searchTerm).subscribe();
  }

  public onFavoriteClick(): void {}

  public onItemContentClick(classification: IClassificationModel): void {
    this.onClassificationClick(classification);
  }

  private onClassificationClick(classification: IClassificationModel): void {
    this.showAlbumArtists(classification);
  }

  private addBreadcrumb(classification: IClassificationModel): void {
    const criteriaItem = new CriteriaValueBase('classificationId', classification.id, CriteriaOperator.Equals);
    this.breadcrumbsService.add({
      caption: classification.name,
      criteriaList: [ criteriaItem ],
      source: BreadcrumbSource.Classification
    });
  }

  private showAlbumArtists(classification: IClassificationModel): void {
    this.addBreadcrumb(classification);
    this.utility.navigate(AppRoutes.AlbumArtists);
  }

  private showAlbums(classification: IClassificationModel): void {
    this.addBreadcrumb(classification);
    this.utility.navigate(AppRoutes.Albums);
  }

  private showSongs(classification: IClassificationModel): void {
    this.addBreadcrumb(classification);
    this.utility.navigate(AppRoutes.Songs);
  }

  public onInitialized(): void {
    this.loadingService.show();
    this.broadcastService.search(SearchWildcard.All).subscribe();
  }

}
