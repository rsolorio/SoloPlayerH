import { Component, OnInit } from '@angular/core';
import { LoadingViewStateService } from 'src/app/core/components/loading-view/loading-view-state.service';
import { CoreComponent } from 'src/app/core/models/core-component.class';
import { IMenuModel } from 'src/app/core/models/menu-model.interface';
import { AppRoutes } from 'src/app/core/services/utility/utility.enum';
import { UtilityService } from 'src/app/core/services/utility/utility.service';
import { IAlbumModel } from 'src/app/shared/models/album-model.interface';
import { CriteriaOperator } from 'src/app/shared/models/criteria-base-model.interface';
import { CriteriaValueBase } from 'src/app/shared/models/criteria-base.class';
import { AppEvent } from 'src/app/shared/models/events.enum';
import { BreadcrumbSource, IMusicBreadcrumbModel } from 'src/app/shared/models/music-breadcrumb-model.interface';
import { IPaginationModel } from 'src/app/shared/models/pagination-model.interface';
import { SearchWildcard } from 'src/app/shared/models/search.enum';
import { MusicBreadcrumbsStateService } from '../music-breadcrumbs/music-breadcrumbs-state.service';
import { AlbumListBroadcastService } from './album-list-broadcast.service';

@Component({
  selector: 'sp-album-list',
  templateUrl: './album-list.component.html',
  styleUrls: ['./album-list.component.scss']
})
export class AlbumListComponent extends CoreComponent implements OnInit {

  public appEvent = AppEvent;
  public itemMenuList: IMenuModel[] = [];

  constructor(
    private broadcastService: AlbumListBroadcastService,
    private utility: UtilityService,
    private loadingService: LoadingViewStateService,
    private breadcrumbsService: MusicBreadcrumbsStateService
  ) {
    super();
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
        const albumModel = param as IAlbumModel;
        this.utility.googleSearch(albumModel.name);
      }
    });

    this.itemMenuList.push({
      caption: 'Properties...',
      icon: 'mdi-square-edit-outline mdi',
      action: param => {
        const album = param as IAlbumModel;
        if (album) {
          this.utility.navigateWithRouteParams(AppRoutes.Albums, [album.id]);
        }
      }
    });
  }

  public onSearch(searchTerm: string): void {
    this.loadingService.show();
    this.broadcastService.search(searchTerm).subscribe();
  }

  public onFavoriteClick(): void {}

  public onItemContentClick(album: IAlbumModel): void {
    this.onAlbumClick(album);
  }

  private onAlbumClick(album: IAlbumModel): void {
    // Load songs
    // TODO: if there's no artist breadcrumb, add the name of the artist as part of the caption
    const criteriaItem = new CriteriaValueBase('primaryAlbumId', album.id, CriteriaOperator.Equals);
    this.breadcrumbsService.add({
      caption: album.name,
      criteriaList: [ criteriaItem ],
      source: BreadcrumbSource.Album
    });
    // Now move to the album list
    this.utility.navigate(AppRoutes.Songs);
  }

  public onListInitialized(): void {
    const breadcrumbs = this.breadcrumbsService.getState();
    if (breadcrumbs.length) {
      this.loadAlbums(breadcrumbs);
    }
    else {
      this.loadAllAlbums();
    }
  }

  private loadAllAlbums(): void {
    this.loadingService.show();
    this.broadcastService.search(SearchWildcard.All).subscribe();
  }

  private loadAlbums(breadcrumbs: IMusicBreadcrumbModel[]): void {
    this.loadingService.show();
    const listModel: IPaginationModel<IAlbumModel> = {
      items: [],
      criteria: []
    };
    // TODO: make sure the same criteria can be used for filtering artists, albums, songs
    for (const breadcrumb of breadcrumbs) {
      for (const criteriaItem of breadcrumb.criteriaList) {
        listModel.criteria.push(criteriaItem);
      }
    }
    this.broadcastService.getAndBroadcast(listModel).subscribe();
  }
}
