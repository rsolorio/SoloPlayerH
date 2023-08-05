import { ChangeDetectionStrategy, Component, OnInit, ViewChild } from '@angular/core';
import { AppRoute, appRoutes, IAppRouteInfo } from 'src/app/app-routes';
import { In } from 'typeorm';
import { CoreComponent } from 'src/app/core/models/core-component.class';
import { UtilityService } from 'src/app/core/services/utility/utility.service';
import { IBreadcrumbModel } from 'src/app/shared/components/breadcrumbs/breadcrumbs-model.interface';
import { BreadcrumbsStateService } from 'src/app/shared/components/breadcrumbs/breadcrumbs-state.service';
import { ListBaseComponent } from 'src/app/shared/components/list-base/list-base.component';
import { IArtistModel } from 'src/app/shared/models/artist-model.interface';
import { BreadcrumbSource } from 'src/app/shared/models/breadcrumbs.enum';
import { AppEvent } from 'src/app/shared/models/events.enum';
import { Criteria, CriteriaItem } from 'src/app/shared/services/criteria/criteria.class';
import { DatabaseService } from 'src/app/shared/services/database/database.service';
import { NavigationService } from 'src/app/shared/services/navigation/navigation.service';
import { ArtistListBroadcastService } from './artist-list-broadcast.service';
import { IListBaseModel } from 'src/app/shared/components/list-base/list-base-model.interface';
import { ArtistEntity, PartyRelationEntity } from 'src/app/shared/entities';
import { PartyRelationType } from 'src/app/shared/models/music.enum';

@Component({
  selector: 'sp-artist-list',
  templateUrl: './artist-list.component.html',
  styleUrls: ['./artist-list.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class ArtistListComponent extends CoreComponent implements OnInit {
  @ViewChild('spListBaseComponent') private spListBaseComponent: ListBaseComponent;
  public isAlbumArtist = false;

  // START - LIST MODEL

  public listModel: IListBaseModel = {
    listUpdatedEvent: AppEvent.ArtistListUpdated,
    itemMenuList: [
      {
        caption: 'Play',
        icon: 'mdi-play mdi',
        action: param => {}
      },
      {
        caption: 'Toggle Selection',
        icon: 'mdi-select mdi',
        action: param => {
          this.spListBaseComponent.toggleSelection(param);
        }
      },
      {
        caption: 'Search...',
        icon: 'mdi-web mdi',
        action: param => {
          const artistModel = param as IArtistModel;
          this.utility.googleSearch(artistModel.name);
        }
      },
      {
        caption: 'Properties...',
        icon: 'mdi-square-edit-outline mdi',
        action: param => {
          const artist = param as IArtistModel;
          if (artist) {
            this.navigation.forward(AppRoute.Artists, { routeParams: [artist.id] });
          }
        }
      },
      {
        isSeparator: true,
        caption: null
      }
    ],
    criteriaResult: {
      criteria: new Criteria('Search Results'),
      items: []
    },
    breadcrumbsEnabled: true,
    broadcastService: this.broadcastService,
    prepareItemRender: item => {
      const artist = item as IArtistModel;
      if (!artist.recentIcon) {
        const days = this.utility.daysFromNow(new Date(artist.songAddDateMax));
        artist.recentIcon = this.spListBaseComponent.getRecentIcon(days);
      }
    }
  };

  // END - LIST MODEL

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
    const albumRoute = appRoutes[AppRoute.Albums];
    if (this.isAlbumArtist) {
      this.listModel.itemMenuList.push({
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
    this.listModel.itemMenuList.push({
      caption: 'Artist Songs',
      icon: 'mdi-music-box-outline mdi',
      action: param => {
        const artist = param as IArtistModel;
          if (artist) {
            this.showEntity(songRoute, artist);
          }
      }
    });

    this.listModel.itemMenuList.push({
      caption: 'Associated Songs',
      icon: 'mdi-music-box-multiple-outline mdi',
      action: param => {
        const artist = param as IArtistModel;
          if (artist) {
            this.showAssociatedSongs(songRoute, artist);
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

  public onShowSongsClick(e: Event, artist: IArtistModel): void {
    // If we don't stop, the onItemContentClick will be fired
    e.stopImmediatePropagation();    
    const songRoute = appRoutes[AppRoute.Songs];
    this.showEntity(songRoute, artist);
  }

  private showEntity(routeInfo: IAppRouteInfo, artist: IArtistModel): void {
    this.addBreadcrumb(artist);
    // No specific criteria, breadcrumbs will be automatically taken by the new entity
    const criteria = new Criteria('Search Results');
    this.navigation.forward(routeInfo.route, { criteria: criteria });
  }

  private async showAssociatedSongs(routeInfo: IAppRouteInfo, artist: IArtistModel): Promise<void> {
    const newBreadcrumb = this.addBreadcrumb(artist);
    const relations = await PartyRelationEntity.findBy({ relatedId: artist.id, relationTypeId: In([PartyRelationType.Contributor, PartyRelationType.Singer])});
    if (relations && relations.length) {
      const relatedArtists = await ArtistEntity.findBy({ id: In(relations.map(r => r.artistId)) });
      for (const relatedArtist of relatedArtists) {
        newBreadcrumb.criteriaItem.columnValues.push({
          value: relatedArtist.id,
          caption: relatedArtist.name
        });
      }
    }
    this.navigation.forward(routeInfo.route, { criteria: new Criteria('Search Results') });
  }

  private createBreadcrumb(artist: IArtistModel): IBreadcrumbModel {
    // Add clicked artist
    const columnName = this.isAlbumArtist ? 'primaryArtistId' : 'artistId';
    const criteriaItem = new CriteriaItem(columnName, artist.id);
    criteriaItem.displayName = this.db.displayName(criteriaItem.columnName);
    criteriaItem.columnValues[0].caption = artist.artistStylized;
    if (columnName === 'artistId') {
      // This column needs to be ignored in order to prevent duplicate search results
      criteriaItem.ignoreInSelect = true;
    }
    // Add other selected artists
    const selectedItems = this.spListBaseComponent.getSelectedItems();
    if (selectedItems.length) {
      for (const item of selectedItems) {
        const artistItem = item as IArtistModel;
        criteriaItem.columnValues.push({
          value: artistItem.id,
          caption: artistItem.name
        });
      }
    }
    return {
      criteriaItem: criteriaItem,
      origin: this.isAlbumArtist ? BreadcrumbSource.AlbumArtist : BreadcrumbSource.Artist
    };
  }

  /**
   * Adds the specified artist as a new breadcrumb.
   */
  private addBreadcrumb(artist: IArtistModel): IBreadcrumbModel {
    const breadcrumb = this.createBreadcrumb(artist);
    // Suppress event so this component doesn't react to this change;
    // these breadcrumbs are for another list that hasn't been loaded yet
    this.breadcrumbService.addOne(breadcrumb, { suppressEvents: true });
    return breadcrumb;
  }
}
