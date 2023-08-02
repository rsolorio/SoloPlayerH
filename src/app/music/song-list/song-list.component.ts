import { ChangeDetectionStrategy, ChangeDetectorRef, Component, OnInit, ViewChild } from '@angular/core';
import { CoreComponent } from 'src/app/core/models/core-component.class';
import { MenuService } from 'src/app/core/services/menu/menu.service';
import { UtilityService } from 'src/app/core/services/utility/utility.service';
import { PlayerOverlayStateService } from 'src/app/player/player-overlay/player-overlay-state.service';
import { IListBaseModel } from 'src/app/shared/components/list-base/list-base-model.interface';
import { ListBaseComponent } from 'src/app/shared/components/list-base/list-base.component';
import { AppEvent } from 'src/app/shared/models/events.enum';
import { PlayerSongStatus } from 'src/app/shared/models/player.enum';
import { ISongModel } from 'src/app/shared/models/song-model.interface';
import { HtmlPlayerService } from 'src/app/shared/services/html-player/html-player.service';
import { SongListBroadcastService } from './song-list-broadcast.service';
import { DatabaseService } from 'src/app/shared/services/database/database.service';
import { SongArtistViewEntity } from 'src/app/shared/entities';
import { BreadcrumbsStateService } from 'src/app/shared/components/breadcrumbs/breadcrumbs-state.service';
import { IBreadcrumbModel } from 'src/app/shared/components/breadcrumbs/breadcrumbs-model.interface';
import { BreadcrumbSource } from 'src/app/shared/models/breadcrumbs.enum';
import { NavigationService } from 'src/app/shared/services/navigation/navigation.service';
import { AppRoute } from 'src/app/app-routes';
import { Criteria, CriteriaItem } from 'src/app/shared/services/criteria/criteria.class';
import { CriteriaComparison } from 'src/app/shared/services/criteria/criteria.enum';
import { SongBadge } from 'src/app/shared/models/music.enum';
import { NavBarStateService } from 'src/app/core/components/nav-bar/nav-bar-state.service';
import { ModuleOptionName } from 'src/app/shared/models/module-option.enum';
import { ImageService } from 'src/app/platform/image/image.service';
import { IImage } from 'src/app/core/models/core.interface';
import { EventsService } from 'src/app/core/services/events/events.service';
import { IPlayerStatusChangedEventArgs } from 'src/app/shared/models/player.interface';
import { ImageSrcType } from 'src/app/core/models/core.enum';
import { RelatedImageSrc } from 'src/app/shared/services/database/database.seed';
import { PlayerListModel } from 'src/app/shared/models/player-list-model.class';
import { DatabaseOptionsService } from 'src/app/shared/services/database/database-options.service';
import { DatabaseEntitiesService } from 'src/app/shared/services/database/database-entities.service';
import { SideBarHostStateService } from 'src/app/core/components/side-bar-host/side-bar-host-state.service';
import { IImagePreviewModel } from 'src/app/related-image/image-preview/image-preview-model.interface';
import { ImagePreviewComponent } from 'src/app/related-image/image-preview/image-preview.component';

@Component({
  selector: 'sp-song-list',
  templateUrl: './song-list.component.html',
  styleUrls: ['./song-list.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class SongListComponent extends CoreComponent implements OnInit {
  @ViewChild('spListBaseComponent') private spListBaseComponent: ListBaseComponent;
  public PlayerSongStatus = PlayerSongStatus;
  public SongBadge = SongBadge;
  public songAttributesVisible = true;
  private expandPlayerOnPlay = false;

  // START - LIST MODEL
  public listModel: IListBaseModel = {
    listUpdatedEvent: AppEvent.SongListUpdated,
    itemMenuList: [
      {
        caption: 'Search...',
        icon: 'mdi-web mdi',
        action: param => {
          const song = param as ISongModel;
          this.utility.googleSearch(`${song.artistName} ${song.name}`);
        }
      },
      {
        caption: 'Properties...',
        icon: 'mdi-square-edit-outline mdi',
        action: param => {
          const song = param as ISongModel;
          if (song) {
            this.navigation.forward(AppRoute.Songs, { routeParams: [song.id] });
          }
        }
      },
      {
        caption: 'Album Artist Songs',
        icon: 'mdi-account-badge mdi',
        action: param => {
          const song = param as ISongModel;
          this.setBreadcrumbsForAlbumArtistSongs(song);
          // Since we are staying in the same route, use the same query info, just update the breadcrumbs
          const criteriaClone = this.spListBaseComponent.model.criteriaResult.criteria.clone();
          criteriaClone.breadcrumbCriteria = this.breadcrumbService.getCriteria().clone();
          this.navigation.forward(AppRoute.Songs, { criteria: criteriaClone });
        }
      },
      {
        caption: 'Feat. Artists Songs',
        icon: 'mdi-account-music mdi',
        action: param => {
          const song = param as ISongModel;
          this.setBreadcrumbsForFeatArtistSongs(song).then(hasFeatArtists => {
            if (hasFeatArtists) {
              const criteriaClone = this.spListBaseComponent.model.criteriaResult.criteria.clone();
              criteriaClone.breadcrumbCriteria = this.breadcrumbService.getCriteria().clone();
              this.navigation.forward(AppRoute.Songs, { criteria: criteriaClone });
            }
          });
        }
      },
      {
        caption: 'Album Songs',
        icon: 'mdi-album mdi',
        action: param => {
          const song = param as ISongModel;
          this.setBreadcrumbsForAlbumSongs(song);
          const criteriaClone = this.spListBaseComponent.model.criteriaResult.criteria.clone();
          criteriaClone.breadcrumbCriteria = this.breadcrumbService.getCriteria().clone();
          this.navigation.forward(AppRoute.Songs, { criteria: criteriaClone });
        }
      }
    ],
    criteriaResult: {
      criteria: new Criteria('Search Results'),
      items: []
    },
    breadcrumbsEnabled: true,
    broadcastService: this.broadcastService,
    prepareItemRender: item => {
      const song = item as ISongModel;
      if (!song.recentIcon) {
        const days = this.utility.daysFromNow(new Date(song.addDate));
        song.recentIcon = this.spListBaseComponent.getRecentIcon(days);
      }

      // This has to run every time since this calculation is based on the current day      
      if (song.playDate) {
        const days = this.utility.daysFromNow(new Date(song.playDate));
        song.recentPlayIcon = this.playerOverlayService.getRecentPlayIcon(days);
      }
      else {
        song.recentPlayIcon = {
          styleClass: 'sp-no-display'
        };
      }

      // The song list has the responsibility of setting the proper image for each item
      // in the list
      if (!song.image.src && !song.image.getImage) {
        song.image.getImage = () => this.getSongImage(song);
      }
    }
  };
  // END - LIST MODEL

  constructor(
    public broadcastService: SongListBroadcastService,
    private utility: UtilityService,
    private breadcrumbService: BreadcrumbsStateService,
    private menuService: MenuService,
    private playerService: HtmlPlayerService,
    private playerOverlayService: PlayerOverlayStateService,
    private events: EventsService,
    private db: DatabaseService,
    private options: DatabaseOptionsService,
    private navigation: NavigationService,
    private navbarService: NavBarStateService,
    private imageService: ImageService,
    private entities: DatabaseEntitiesService,
    private sidebarHostService: SideBarHostStateService,
    private cd: ChangeDetectorRef
  ) {
    super();
  }

  ngOnInit(): void {
    this.expandPlayerOnPlay = this.options.getBoolean(ModuleOptionName.ExpandPlayerOnSongPlay);
    this.subs.sink = this.events.onEvent<IPlayerStatusChangedEventArgs>(AppEvent.PlayerStatusChanged)
    .subscribe(() => {
      this.cd.detectChanges();
    });
  }

  private setBreadcrumbsForAlbumArtistSongs(song: ISongModel): void {
    const primaryArtistId = song.primaryArtistId ? song.primaryArtistId : song.primaryAlbum.primaryArtist.id;
    const criteriaItem = new CriteriaItem('primaryArtistId', primaryArtistId);
    criteriaItem.displayName = this.db.displayName(criteriaItem.columnName);
    criteriaItem.columnValues[0].caption = song.primaryArtistName ? song.primaryArtistName : song.primaryAlbum.primaryArtist.name;
    // No need to react to breadcrumb events
    this.breadcrumbService.set([{
      criteriaItem: criteriaItem,
      origin: BreadcrumbSource.AlbumArtist
    }], { suppressEvents: true });
  }

  private async setBreadcrumbsForFeatArtistSongs(song: ISongModel): Promise<boolean> {
    const criteria = new Criteria('Search Results');
    criteria.searchCriteria.push(new CriteriaItem('id', song.id))
    // Get the list of feat. artists
    const songArtistRows = await this.db.getList(SongArtistViewEntity, criteria);
    const criteriaItem = new CriteriaItem('artistId');
    criteriaItem.comparison = CriteriaComparison.Equals;
    for (var songArtist of songArtistRows) {
      // Ignore the primary artist
      const primaryArtistId = song.primaryArtistId ? song.primaryArtistId : song.primaryAlbum.primaryArtist.id;
      if (songArtist.artistId !== primaryArtistId) {
        criteriaItem.columnValues.push({
          value: songArtist.artistId,
          caption: songArtist.artistStylized
        });
      }
    }
    if (criteriaItem.columnValues.length) {
      this.breadcrumbService.set([{
        criteriaItem: criteriaItem,
        origin: BreadcrumbSource.Artist
      }], { suppressEvents: true });
      return true;
    }
    return false;
  }

  private setBreadcrumbsForAlbumSongs(song: ISongModel): void {
    // Primary Artist
    const primaryArtistId = song.primaryArtistId ? song.primaryArtistId : song.primaryAlbum.primaryArtist.id;
    const artistCriteria = new CriteriaItem('primaryArtistId', primaryArtistId);
    artistCriteria.displayName = this.db.displayName(artistCriteria.columnName);
    artistCriteria.columnValues[0].caption = song.primaryArtistStylized ? song.primaryArtistStylized : song.primaryAlbum.primaryArtist.artistStylized;
    const artistBreadcrumb: IBreadcrumbModel = {
      criteriaItem: artistCriteria,
      origin: BreadcrumbSource.AlbumArtist
    };
    // Album
    const primaryAlbumId = song.primaryAlbumId ? song.primaryAlbumId : song.primaryAlbum.id;
    const albumCriteria = new CriteriaItem('primaryAlbumId', primaryAlbumId);
    albumCriteria.displayName = this.db.displayName(albumCriteria.columnName);
    albumCriteria.columnValues[0].caption = song.primaryAlbumName ? song.primaryAlbumName : song.primaryAlbum.name;
    const albumBreadcrumb: IBreadcrumbModel = {
      criteriaItem: albumCriteria,
      origin: BreadcrumbSource.Album
    };
    // Breadcrumbs
    this.breadcrumbService.set([ artistBreadcrumb, albumBreadcrumb ], { suppressEvents: true });
  }

  public onItemContentClick(song: ISongModel): void {
    this.playSong(song);
  }

  public onItemImageClick(song: ISongModel): void {
    this.menuService.hideSlideMenu();
    this.loadSongInPlayer(song, false, true);
  }

  private playSong(song: ISongModel): void {
    this.menuService.hideSlideMenu();
    this.loadSongInPlayer(song, true, this.expandPlayerOnPlay);
  }

  private isListInPlayer(playerList?: PlayerListModel): boolean {
    const list = playerList ? playerList : this.playerService.getState().playerList;
    return list.id === this.spListBaseComponent.model.criteriaResult.criteria.id;
  }

  private loadSongInPlayer(song: ISongModel, play?: boolean, expand?: boolean): void {
    const playerList = this.playerService.getState().playerList;
    if (this.isListInPlayer(playerList)) {
      const track = playerList.getTrack(song);
      this.playerService.setCurrentTrack(track, play).then(() => {
        if (expand) {
          this.playerOverlayService.expand();
        }
      });
    }
    else {
      // Since we are about to play a new track:
      // 1. Stop the player
      // 2. Load this new track list
      // 3. Load this track
      this.playerService.stop().then(success => {
        if (success) {
          const songList = this.spListBaseComponent.model.criteriaResult.items as ISongModel[];
          // For now, we are using this component only for search results,
          // but we should have an input property to specify the title of the play list
          playerList.loadSongs(
            this.spListBaseComponent.model.criteriaResult.criteria.id,
            this.spListBaseComponent.model.criteriaResult.criteria.name,
            songList);
          const track = playerList.getTrack(song);
          this.playerService.setCurrentTrack(track, play).then(() => {
            if (expand) {
              this.playerOverlayService.expand();
            }
          });
        }
      });
    }
  }

  public onListInitialized(listBaseModel: IListBaseModel): void {
    // TODO: Add new menu: Save As Playlist, Save As Filter
    const navbarModel = this.navbarService.getState();
    navbarModel.menuList.push({
      caption: 'Screenshot',
      icon: 'mdi-image-outline mdi',
      action: () => {
        this.imageService.getScreenshot().then(result => {
          const imagePreviewModel: IImagePreviewModel = {
            title: 'Screenshot',
            subTitle: 'Song List',
            src: result,
            componentType: ImagePreviewComponent
          };
          this.sidebarHostService.loadContent(imagePreviewModel);
        });
      },
      actionTimeout: 300
    });

    navbarModel.menuList.push({
      caption: 'Scroll To Song',
      icon: 'mdi-arrow-up-down mdi',
      action: () => {
        const playerList = this.playerService.getState().playerList;
        if (this.isListInPlayer(playerList)) {
          if (playerList.current) {
            const index = playerList.current.sequence - 1;
            this.spListBaseComponent.scrollTo(index);
          }
        }
      }
    });
  }

  private async getSongImage(song: ISongModel): Promise<IImage> {
    const relatedImage = await this.entities.getRelatedImage([song.id, song.primaryAlbumId]);
    if (relatedImage) {
      return this.imageService.getImageFromSource(relatedImage);
    }
    return {
      src: RelatedImageSrc.DefaultLarge,
      srcType: ImageSrcType.WebUrl
    };
  }
}
