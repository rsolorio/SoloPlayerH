import { Component, OnInit, ViewChild } from '@angular/core';
import { CoreComponent } from 'src/app/core/models/core-component.class';
import { IMenuModel } from 'src/app/core/models/menu-model.interface';
import { MenuService } from 'src/app/core/services/menu/menu.service';
import { PromiseQueueService } from 'src/app/core/services/promise-queue/promise-queue.service';
import { UtilityService } from 'src/app/core/services/utility/utility.service';
import { PlayerOverlayStateService } from 'src/app/player/player-overlay/player-overlay-state.service';
import { IListBaseModel } from 'src/app/shared/components/list-base/list-base-model.interface';
import { ListBaseComponent } from 'src/app/shared/components/list-base/list-base.component';
import { AppEvent } from 'src/app/shared/models/events.enum';
import { PlayerSongStatus } from 'src/app/shared/models/player.enum';
import { ISongModel } from 'src/app/shared/models/song-model.interface';
import { HtmlPlayerService } from 'src/app/shared/services/html-player/html-player.service';
import { MusicMetadataService } from 'src/app/shared/services/music-metadata/music-metadata.service';
import { SongListBroadcastService } from './song-list-broadcast.service';
import { DatabaseService } from 'src/app/shared/services/database/database.service';
import { SongArtistViewEntity } from 'src/app/shared/entities';
import { FileService } from 'src/app/shared/services/file/file.service';
import { BreadcrumbsStateService } from 'src/app/shared/components/breadcrumbs/breadcrumbs-state.service';
import { IBreadcrumbModel } from 'src/app/shared/components/breadcrumbs/breadcrumbs-model.interface';
import { BreadcrumbSource } from 'src/app/shared/models/breadcrumbs.enum';
import { SongListStateService } from './song-list-state.service';
import { NavigationService } from 'src/app/shared/services/navigation/navigation.service';
import { AppRoute } from 'src/app/app-routes';
import { Criteria, CriteriaItem } from 'src/app/shared/services/criteria/criteria.class';
import { CriteriaComparison } from 'src/app/shared/services/criteria/criteria.enum';
import { SongBadge } from 'src/app/shared/models/music.enum';
import { MusicImageType } from 'src/app/shared/services/music-metadata/music-metadata.enum';
import { NavBarStateService } from 'src/app/core/components/nav-bar/nav-bar-state.service';
import { ModuleOptionName } from 'src/app/shared/models/module-option.enum';
import { DialogService } from 'src/app/shared/services/dialog/dialog.service';
import { ImagePreviewService } from 'src/app/shared/components/image-preview/image-preview.service';

@Component({
  selector: 'sp-song-list',
  templateUrl: './song-list.component.html',
  styleUrls: ['./song-list.component.scss']
})
export class SongListComponent extends CoreComponent implements OnInit {
  @ViewChild('spListBaseComponent') private spListBaseComponent: ListBaseComponent;
  public appEvent = AppEvent;
  public PlayerSongStatus = PlayerSongStatus;
  public SongBadge = SongBadge;
  public itemMenuList: IMenuModel[] = [];
  public songAttributesVisible = true;
  private expandPlayerOnPlay = false;

  constructor(
    public broadcastService: SongListBroadcastService,
    private utility: UtilityService,
    private fileService: FileService,
    private metadataService: MusicMetadataService,
    private breadcrumbService: BreadcrumbsStateService,
    private menuService: MenuService,
    private playerService: HtmlPlayerService,
    private playerOverlayService: PlayerOverlayStateService,
    private queueService: PromiseQueueService,
    private db: DatabaseService,
    private stateService: SongListStateService,
    private navigation: NavigationService,
    private navbarService: NavBarStateService,
    private dialogService: DialogService,
    private imagePreviewService: ImagePreviewService
  ) {
    super();
  }

  ngOnInit(): void {
    this.initializeItemMenu();
    this.db.getModuleOptions([ModuleOptionName.ExpandPlayerOnSongPlay]).then(options => {
      this.expandPlayerOnPlay = this.db.getOptionBooleanValue(options[0]);
    });
  }

  private initializeItemMenu(): void {
    this.itemMenuList.push({
      caption: 'Search...',
      icon: 'mdi-web mdi',
      action: param => {
        const song = param as ISongModel;
        this.utility.googleSearch(`${song.artistName} ${song.name}`);
      }
    });

    this.itemMenuList.push({
      caption: 'Properties...',
      icon: 'mdi-square-edit-outline mdi',
      action: param => {
        const song = param as ISongModel;
        if (song) {
          this.navigation.forward(AppRoute.Songs, { queryParams: [song.id] });
        }
      }
    });

    this.itemMenuList.push({
      caption: 'Album Artist Songs',
      icon: 'mdi-account-badge mdi',
      action: param => {
        const song = param as ISongModel;
        this.setBreadcrumbsForAlbumArtistSongs(song);
        // Since we are staying in the same route, use the same query info, just update the breadcrumbs
        const criteriaClone = this.stateService.getState().criteria.clone();
        criteriaClone.breadcrumbCriteria = this.breadcrumbService.getCriteria().clone();
        this.navigation.forward(AppRoute.Songs, { criteria: criteriaClone });
      }
    });

    this.itemMenuList.push({
      caption: 'Feat. Artists Songs',
      icon: 'mdi-account-music mdi',
      action: param => {
        const song = param as ISongModel;
        this.setBreadcrumbsForFeatArtistSongs(song).then(hasFeatArtists => {
          if (hasFeatArtists) {
            const criteriaClone = this.stateService.getState().criteria.clone();
            criteriaClone.breadcrumbCriteria = this.breadcrumbService.getCriteria().clone();
            this.navigation.forward(AppRoute.Songs, { criteria: criteriaClone });
          }
        });
      }
    });

    this.itemMenuList.push({
      caption: 'Album Songs',
      icon: 'mdi-album mdi',
      action: param => {
        const song = param as ISongModel;
        this.setBreadcrumbsForAlbumSongs(song);
        const criteriaClone = this.stateService.getState().criteria.clone();
        criteriaClone.breadcrumbCriteria = this.breadcrumbService.getCriteria().clone();
        this.navigation.forward(AppRoute.Songs, { criteria: criteriaClone });
      }
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

  private loadSongInPlayer(song: ISongModel, play?: boolean, expand?: boolean): void {
    const playerList = this.playerService.getState().playerList;
    let track = playerList.getTrack(song);
    if (track) {
      this.playerService.setCurrentTrack(track, play);
      if (expand) {
        this.playerOverlayService.expand();
      }
    }
    else {
      // Since we are about to play a new track:
      // 1. Stop the player
      // 2. Load this new track list
      // 3. Load this track
      this.playerService.stop().then(success => {
        if (success) {
          const trackList = this.spListBaseComponent.model.criteriaResult.items as ISongModel[];
          // For now, we are using this component only for search results,
          // but we should have an input property to specify the title of the play list
          playerList.loadList(trackList);
          playerList.name = this.spListBaseComponent.model.criteriaResult.criteria.name;
          track = playerList.getTrack(song);
          this.playerService.setCurrentTrack(track, play);
          if (expand) {
            this.playerOverlayService.expand();
          }
        }
      });
    }
  }

  public onListInitialized(listBaseModel: IListBaseModel): void {
    listBaseModel.getBackdropIcon = item => {
      const song = item as ISongModel;
      // TODO: song should have a player status property
      if (song.playerStatus === PlayerSongStatus.Playing) {
        return 'mdi-play mdi';
      }
      return null;
    };
    // TODO: Add new menu: Save As Playlist, Save As Filter
    const navbarModel = this.navbarService.getState();
    navbarModel.menuList.push({
      caption: 'Screenshot',
      icon: 'mdi-image-outline mdi',
      action: () => {
        this.dialogService.getScreenshot().then(result => {
          this.imagePreviewService.show({
            title: 'Screenshot',
            subTitle: 'Song List',
            src: result
          });
        });
      }
    });
  }

  public onItemRender(song: ISongModel): void {
    if (!song.recentIcon) {
      const days = this.utility.differenceInDays(new Date(), new Date(song.addDate));
      song.recentIcon = this.spListBaseComponent.getRecentIcon(days);
    }

    if (!song.image.src) {
      this.queueService.sink = () => this.setSongImage(song);
    }
  }

  private async setSongImage(song: ISongModel): Promise<void> {
    const buffer = await this.fileService.getBuffer(song.filePath);
    const audioInfo = await this.metadataService.getMetadata(buffer);
    const pictures = this.metadataService.getPictures(audioInfo.metadata, [MusicImageType.Single, MusicImageType.Front]);
    song.image = this.metadataService.getImage(pictures);
  }
}
