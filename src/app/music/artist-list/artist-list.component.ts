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
import { Criteria, CriteriaItem, CriteriaItems } from 'src/app/shared/services/criteria/criteria.class';
import { DatabaseService } from 'src/app/shared/services/database/database.service';
import { NavigationService } from 'src/app/shared/services/navigation/navigation.service';
import { ArtistListBroadcastService } from './artist-list-broadcast.service';
import { IListBaseModel } from 'src/app/shared/components/list-base/list-base-model.interface';
import { ArtistEntity, PartyRelationEntity } from 'src/app/shared/entities';
import { PartyRelationType } from 'src/app/shared/models/music.enum';
import { NavbarDisplayMode } from 'src/app/core/components/nav-bar/nav-bar-model.interface';
import { DatabaseEntitiesService } from 'src/app/shared/services/database/database-entities.service';
import { NavBarStateService } from 'src/app/core/components/nav-bar/nav-bar-state.service';
import { SideBarHostStateService } from 'src/app/core/components/side-bar-host/side-bar-host-state.service';
import { AppActionIcons, AppAttributeIcons, AppEntityIcons, AppPlayerIcons } from 'src/app/app-icons';
import { DatabaseOptionsService } from 'src/app/shared/services/database/database-options.service';
import { ModuleOptionId } from 'src/app/shared/services/database/database.seed';
import { AppEvent } from 'src/app/app-events';
import { ListBaseService } from 'src/app/shared/components/list-base/list-base.service';

@Component({
  selector: 'sp-artist-list',
  templateUrl: './artist-list.component.html',
  styleUrls: ['./artist-list.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class ArtistListComponent extends CoreComponent implements OnInit {
  public AppAttributeIcons = AppAttributeIcons;
  public AppEntityIcons = AppEntityIcons;
  @ViewChild('spListBaseComponent') private spListBaseComponent: ListBaseComponent;
  public isAlbumArtist = false;

  // START - LIST MODEL
  public listModel: IListBaseModel = {
    listUpdatedEvent: AppEvent.ArtistListUpdated,
    itemMenuList: [
      {
        caption: 'Play',
        icon: AppPlayerIcons.Play,
        action: () => {}
      },
      {
        caption: 'Toggle Selection',
        icon: AppActionIcons.Select,
        action: (menuItem, param) => {
          this.spListBaseComponent.toggleSelection(param);
        }
      },
      {
        caption: 'Search...',
        icon: AppActionIcons.WebSearch,
        action: (menuItem, param) => {
          const artistModel = param as IArtistModel;
          this.utility.googleSearch(artistModel.name);
        }
      },
      {
        caption: 'Properties...',
        icon: AppActionIcons.Edit,
        action: (menuItem, param) => {
          const artist = param as IArtistModel;
          if (artist) {
            this.navigation.forward(AppRoute.Artists, { routeParams: [artist.id] });
          }
        }
      },
      {
        isSeparator: true
      }
    ],
    criteriaResult: {
      criteria: new Criteria('Search Results'),
      items: []
    },
    rightIcons: [
      {
        icon: AppActionIcons.Sort,
        action: () => {
          this.openSortingPanel();
        }
      },
      {
        id: 'quickFilterIcon',
        icon: AppActionIcons.Filter + ' sp-color-primary',
        action: () => {
          this.openQuickFilterPanel();
        },
        off: true,
        offIcon: AppActionIcons.Filter,
        offAction: () => {
          this.openQuickFilterPanel();
        }
      },
      {
        id: 'showAllSongsIcon',
        icon: AppEntityIcons.Song,
        action: () => {
          // No specific criteria, breadcrumbs will be automatically taken by the new entity
          const criteria = new Criteria('Search Results');
          this.navigation.forward(AppRoute.Songs, { criteria: criteria });
        }
      },
      this.listBaseService.createSearchIcon('searchIcon')
    ],
    breadcrumbsEnabled: true,
    broadcastService: this.broadcastService,
    prepareItemRender: item => {
      const artist = item as IArtistModel;
      if (!artist.recentIcon) {
        const days = this.utility.daysFromNow(new Date(artist.songAddDateMax));
        artist.recentIcon = this.spListBaseComponent.getRecentIcon(days);
      }
    },
    onNavbarModeChanged: (model, navbar) => {
      this.listBaseService.handleIconsVisibility(model, navbar);
      switch(navbar.mode) {
        case NavbarDisplayMode.Component:
          if (this.isAlbumArtist) {
            navbar.rightIcons.show('showAllSongsIcon');
          }
          break;
        case NavbarDisplayMode.Title:
          if (this.isAlbumArtist) {
            navbar.rightIcons.hide('showAllSongsIcon');
          }
          else {
            navbar.rightIcons.hideAll();
            navbar.rightIcons.show('searchIcon');
          }
          break;
      }
    }
  };
  // END - LIST MODEL

  constructor(
    public broadcastService: ArtistListBroadcastService,
    private utility: UtilityService,
    private breadcrumbService: BreadcrumbsStateService,
    private db: DatabaseService,
    private navigation: NavigationService,
    private entities: DatabaseEntitiesService,
    private navbarService: NavBarStateService,
    private sidebarHostService: SideBarHostStateService,
    private options: DatabaseOptionsService,
    private listBaseService: ListBaseService
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
        action: (menuItem, param) => {
          const artist = param as IArtistModel;
          if (artist) {
            this.navigateTo(albumRoute, artist);
          }
        }
      });
    }

    this.listModel.itemMenuList.push({
      caption: 'Songs',
      icon: AppEntityIcons.Song,
      action: (menuItem, param) => {
        const artist = param as IArtistModel;
          if (artist) {
            this.navigateTo(appRoutes[AppRoute.Songs], artist);
          }
      }
    });
  }

  public onItemContentClick(artist: IArtistModel): void {
    this.onArtistClick(artist);
  }

  public onItemImageClick(artist: IArtistModel): void {
    if (this.isAlbumArtist) {
      this.navigation.forward(AppRoute.Artists, { routeParams: [artist.id] });
    }
  }

  private onArtistClick(artist: IArtistModel): void {
    if (this.isAlbumArtist) {
      this.navigateTo(appRoutes[AppRoute.Albums], artist);
    }
    else {
      const includeAssociatedArtists = this.options.getBoolean(ModuleOptionId.IncludeAssociatedArtistSongs);
      if (includeAssociatedArtists) {
        this.showAssociatedSongs(artist);
      }
      else {
        this.navigateTo(appRoutes[AppRoute.Songs], artist);
      }
    }
  }

  public onFavoriteClick(e: Event, artist: IArtistModel): void {
    // If we don't stop, the onItemContentClick will be fired
    e.stopImmediatePropagation();
    // Setting the favorite before updating the db since the promise
    // will break the change detection cycle and the change will not be reflected in the UI
    artist.favorite = !artist.favorite;
    this.entities.setFavoriteArtist(artist.id, artist.favorite);
  }

  /**
   * Navigates to the specified route using the artist as criteria.
   */
  private navigateTo(routeInfo: IAppRouteInfo, artist: IArtistModel): void {
    this.addBreadcrumb(artist);
    // No specific criteria, breadcrumbs will be automatically taken by the new entity
    this.navigation.forward(routeInfo.route, { criteria: new Criteria('Search Results') });
  }

  /**
   * Creates the default breadcrumb and then adds associated artists (contributors and singers)
   * to the criteria before navigating to the song list.
   */
  private async showAssociatedSongs(artist: IArtistModel): Promise<void> {
    const newBreadcrumb = this.addBreadcrumb(artist);
    // When you select a band, also show music from its associated singers
    const singers = await PartyRelationEntity.findBy({ artistId: artist.id, relationTypeId: PartyRelationType.Singer });
    let associatedArtistIds = singers.map(s => s.relatedId);

    // When you select an artist, also show music where the artist is contributors with other artists
    const contributors = await PartyRelationEntity.findBy({ relatedId: artist.id, relationTypeId: PartyRelationType.Contributor });
    associatedArtistIds = associatedArtistIds.concat(contributors.map(c => c.artistId));

    // Add artists to the breadcrumbs
    if (associatedArtistIds.length) {
      const relatedArtists = await ArtistEntity.findBy({ id: In(this.utility.removeDuplicates(associatedArtistIds)) });
      for (const relatedArtist of relatedArtists) {
        newBreadcrumb.criteriaItem.columnValues.push({
          value: relatedArtist.id,
          caption: relatedArtist.name
        });
      }
    }

    this.navigation.forward(appRoutes[AppRoute.Songs].route, { criteria: new Criteria('Search Results') });
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
      icon: this.isAlbumArtist ? AppEntityIcons.AlbumArtist : AppEntityIcons.Artist,
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

  private openQuickFilterPanel(): void {
    const chips = this.entities.getQuickFiltersForArtists(this.spListBaseComponent.model.criteriaResult.criteria);
    const model = this.entities.getQuickFilterPanelModel(chips, 'Album Artists', AppEntityIcons.AlbumArtist);
    model.onOk = okResult => {
      const criteria = new Criteria(model.title);
      for (const valuePair of okResult.items) {
        if (valuePair.selected) {
          const criteriaItem = valuePair.value as CriteriaItem;
          criteria.quickCriteria.push(criteriaItem);
        }
      }
      const iconOff = !criteria.quickCriteria.hasComparison();
      this.navbarService.getState().rightIcons.find(i => i.id === 'quickFilterIcon').off = iconOff;
      this.spListBaseComponent.send(criteria);
    };
    this.sidebarHostService.loadContent(model);    
  }

  private openSortingPanel(): void {
    const chips = this.entities.getSortingForAlbumArtists(this.spListBaseComponent.model.criteriaResult.criteria);
    const model = this.entities.getSortingPanelModel(chips, 'Artists', AppEntityIcons.AlbumArtist);
    model.onOk = okResult => {
      const criteria = new Criteria(model.title);
      // Keep quick criteria
      criteria.quickCriteria = this.spListBaseComponent.model.criteriaResult.criteria.quickCriteria;
      // Add sorting criteria, we only support one item
      const chipItem = okResult.items.find(i => i.selected);
      if (chipItem) {
        const criteriaItems = chipItem.value as CriteriaItems;
        criteria.sortingCriteria = criteriaItems;
      }
      else {
        criteria.sortingCriteria = new CriteriaItems();
      }
      this.spListBaseComponent.send(criteria);
    };
    this.sidebarHostService.loadContent(model);
  }
}
