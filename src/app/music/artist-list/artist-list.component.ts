import { Component, OnInit, ViewChild } from '@angular/core';
import { AppRoute, appRoutes, IAppRouteInfo } from 'src/app/app-routes';
import { CoreComponent } from 'src/app/core/models/core-component.class';
import { IMenuModel } from 'src/app/core/models/menu-model.interface';
import { UtilityService } from 'src/app/core/services/utility/utility.service';
import { IBreadcrumbModel } from 'src/app/shared/components/breadcrumbs/breadcrumbs-model.interface';
import { BreadcrumbsStateService } from 'src/app/shared/components/breadcrumbs/breadcrumbs-state.service';
import { ListBaseComponent } from 'src/app/shared/components/list-base/list-base.component';
import { IArtistModel } from 'src/app/shared/models/artist-model.interface';
import { BreadcrumbSource } from 'src/app/shared/models/breadcrumbs.enum';
import { ICriteriaValueBaseModel } from 'src/app/shared/models/criteria-base-model.interface';
import { CriteriaValueBase } from 'src/app/shared/models/criteria-base.class';
import { AppEvent } from 'src/app/shared/models/events.enum';
import { QueryModel } from 'src/app/shared/models/query-model.class';
import { DatabaseService } from 'src/app/shared/services/database/database.service';
import { NavigationService } from 'src/app/shared/services/navigation/navigation.service';
import { ArtistListBroadcastService } from './artist-list-broadcast.service';

@Component({
  selector: 'sp-artist-list',
  templateUrl: './artist-list.component.html',
  styleUrls: ['./artist-list.component.scss']
})
export class ArtistListComponent extends CoreComponent implements OnInit {
  @ViewChild('spListBaseComponent') private spListBaseComponent: ListBaseComponent;
  public appEvent = AppEvent;
  public itemMenuList: IMenuModel[] = [];
  public isAlbumArtist = false;

  constructor(
    public broadcastService: ArtistListBroadcastService,
    private utility: UtilityService,
    private breadcrumbService: BreadcrumbsStateService,
    private db: DatabaseService,
    private navigation: NavigationService
  ) {
    super();
    this.isAlbumArtist = this.utility.isRouteActive(AppRoute.AlbumArtists);
    this.broadcastService.isAlbumArtist = this.isAlbumArtist;
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
      caption: 'Select/Unselect',
      icon: 'mdi-select mdi',
      action: param => {
        const artist = param as IArtistModel;
        artist.selected = !artist.selected;
      }
    });

    this.itemMenuList.push({
      caption: 'Search...',
      icon: 'mdi-web mdi',
      action: param => {
        const artistModel = param as IArtistModel;
        this.utility.googleSearch(artistModel.name);
      }
    });

    this.itemMenuList.push({
      caption: 'Properties...',
      icon: 'mdi-square-edit-outline mdi',
      action: param => {
        const artist = param as IArtistModel;
        if (artist) {
          this.navigation.forward(AppRoute.Artists, { queryParams: [artist.id] });
        }
      }
    });

    this.itemMenuList.push({
      isSeparator: true,
      caption: null
    });

    const albumRoute = appRoutes[AppRoute.Albums];
    if (this.isAlbumArtist) {
      this.itemMenuList.push({
        caption: albumRoute.name,
        icon: albumRoute.icon,
        action: param => {
          const artist = param as IArtistModel;
          if (artist) {
            this.showEntity(albumRoute, artist);
          }
        }
      });
    }

    const songRoute = appRoutes[AppRoute.Songs];
    this.itemMenuList.push({
      caption: songRoute.name,
      icon: songRoute.icon,
      action: param => {
        const artist = param as IArtistModel;
          if (artist) {
            this.showEntity(songRoute, artist);
          }
      }
    });
  }

  public onItemContentClick(artist: IArtistModel): void {
    this.onArtistClick(artist);
  }

  private onArtistClick(artist: IArtistModel): void {
    if (this.isAlbumArtist) {
      this.showEntity(appRoutes[AppRoute.Albums], artist);
    }
    else {
      this.showEntity(appRoutes[AppRoute.Songs], artist);
    }
  }

  private showEntity(routeInfo: IAppRouteInfo, artist: IArtistModel): void {
    this.addBreadcrumb(artist);
    // The only query information that will pass from one entity to another is breadcrumbs
    const query = new QueryModel<any>();
    query.breadcrumbCriteria = this.breadcrumbService.getCriteriaClone();
    this.navigation.forward(routeInfo.route, { query: query });
  }

  private createBreadcrumb(artist: IArtistModel): IBreadcrumbModel {
    const criteria: ICriteriaValueBaseModel[] = [];
    const columnName = this.isAlbumArtist ? 'primaryArtistId' : 'artistId';
    const criteriaValue = new CriteriaValueBase(columnName, artist.id);
    criteriaValue.DisplayName = this.db.displayName(criteriaValue.ColumnName);
    criteriaValue.DisplayValue = artist.artistStylized;
    if (columnName === 'artistId') {
      // This column needs to be ignored in order to prevent duplicate search results
      criteriaValue.IgnoreInSelect = true;
    }
    criteria.push(criteriaValue);

    const selectedItems = this.spListBaseComponent.getSelectedItems();
    if (selectedItems.length) {
      for (const item of selectedItems) {
        const artistItem = item as IArtistModel;
        const criteriaItem = new CriteriaValueBase(columnName, artistItem.id);
        criteriaItem.DisplayName = criteriaValue.DisplayName;
        criteriaItem.DisplayValue = artistItem.name;
        if (columnName === 'artistId') {
          criteriaItem.IgnoreInSelect = true;
        }
        criteria.push(criteriaItem);
      }
    }
    return {
      criteriaList: criteria,
      origin: this.isAlbumArtist ? BreadcrumbSource.AlbumArtist : BreadcrumbSource.Artist
    };
  }

  /**
   * Adds the specified artist as a new breadcrumb.
   */
  private addBreadcrumb(artist: IArtistModel): void {
    // Suppress event so this component doesn't react to this change;
    // these breadcrumbs are for another list that hasn't been loaded yet
    this.breadcrumbService.addOne(this.createBreadcrumb(artist), { suppressEvents: true });
  }

  public onListInitialized(): void {
  }

  public onBeforeBroadcast(query: QueryModel<IArtistModel>): void {
    this.removeUnsupportedBreadcrumbs(query);
  }

  private removeUnsupportedBreadcrumbs(query: QueryModel<IArtistModel>): void {
    if (!this.breadcrumbService.hasBreadcrumbs()) {
      return;
    }
    const breadcrumbs = this.breadcrumbService.getState();
    if (this.isAlbumArtist) {
      // Album Artists support Genre and Classification breadcrumbs
      let unsupportedBreadcrumbs = breadcrumbs.filter(breadcrumb =>
        breadcrumb.origin !== BreadcrumbSource.Genre &&
        breadcrumb.origin !== BreadcrumbSource.Classification);
      
      for (const breadcrumb of unsupportedBreadcrumbs) {
        this.breadcrumbService.remove(breadcrumb.sequence);
      }
    }
    else {
      // Artists do not support any kind of breadcrumbs
      this.breadcrumbService.clear();
    }
    // Now that breadcrumbs are updated, reflect the change in the query
    // which will be used to broadcast
    query.breadcrumbCriteria = this.breadcrumbService.getCriteriaClone();
  }
}
