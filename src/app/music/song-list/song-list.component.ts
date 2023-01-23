import { Component, OnInit, ViewChild } from '@angular/core';
import { CoreComponent } from 'src/app/core/models/core-component.class';
import { IMenuModel } from 'src/app/core/models/menu-model.interface';
import { MenuService } from 'src/app/core/services/menu/menu.service';
import { PromiseQueueService } from 'src/app/core/services/promise-queue/promise-queue.service';
import { AppRoutes } from 'src/app/core/services/utility/utility.enum';
import { UtilityService } from 'src/app/core/services/utility/utility.service';
import { PlayerOverlayStateService } from 'src/app/player/player-overlay/player-overlay-state.service';
import { IListBaseModel } from 'src/app/shared/components/list-base/list-base-model.interface';
import { ListBaseComponent } from 'src/app/shared/components/list-base/list-base.component';
import { CriteriaValueBase } from 'src/app/shared/models/criteria-base.class';
import { AppEvent } from 'src/app/shared/models/events.enum';
import { PlayerSongStatus } from 'src/app/shared/models/player.enum';
import { ISongModel } from 'src/app/shared/models/song-model.interface';
import { HtmlPlayerService } from 'src/app/shared/services/html-player/html-player.service';
import { MusicMetadataService } from 'src/app/shared/services/music-metadata/music-metadata.service';
import { SongListBroadcastService } from './song-list-broadcast.service';
import { DatabaseService } from 'src/app/shared/services/database/database.service';
import { SongArtistViewEntity } from 'src/app/shared/entities';
import { ICriteriaValueBaseModel } from 'src/app/shared/models/criteria-base-model.interface';
import { FileService } from 'src/app/shared/services/file/file.service';
import { BreadcrumbsStateService } from 'src/app/shared/components/breadcrumbs/breadcrumbs-state.service';
import { IBreadcrumbModel } from 'src/app/shared/components/breadcrumbs/breadcrumbs-model.interface';
import { BreadcrumbSource } from 'src/app/shared/models/breadcrumbs.enum';
import { QueryModel } from 'src/app/shared/models/query-model.class';

@Component({
  selector: 'sp-song-list',
  templateUrl: './song-list.component.html',
  styleUrls: ['./song-list.component.scss']
})
export class SongListComponent extends CoreComponent implements OnInit {
  @ViewChild('spListBaseComponent') private spListBaseComponent: ListBaseComponent;
  public appEvent = AppEvent;
  public playerSongStatus = PlayerSongStatus;
  public itemMenuList: IMenuModel[] = [];

  constructor(
    public broadcastService: SongListBroadcastService,
    private utility: UtilityService,
    private fileService: FileService,
    private metadataService: MusicMetadataService,
    private breadcrumbsService: BreadcrumbsStateService,
    private menuService: MenuService,
    private playerService: HtmlPlayerService,
    private playerOverlayService: PlayerOverlayStateService,
    private queueService: PromiseQueueService,
    private db: DatabaseService
  ) {
    super();
  }

  ngOnInit(): void {
    this.initializeNavbar();
    this.initializeItemMenu();
  }

  private initializeNavbar(): void {
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
          this.utility.navigateWithRouteParams(AppRoutes.Songs, [song.id]);
        }
      }
    });

    this.itemMenuList.push({
      caption: 'Album Artist Songs',
      icon: 'mdi-account-badge mdi',
      action: param => {
        const song = param as ISongModel;
        const primaryArtistId = song.primaryArtistId ? song.primaryArtistId : song.primaryAlbum.primaryArtist.id;
        const criteriaItem = new CriteriaValueBase('primaryArtistId', primaryArtistId);
        criteriaItem.DisplayName = this.db.displayName(criteriaItem.ColumnName);
        criteriaItem.DisplayValue = song.primaryArtistName ? song.primaryArtistName : song.primaryAlbum.primaryArtist.name;
        // We need to force reload the breadcrumb since we are not moving to another page
        this.breadcrumbsService.set([{
          criteriaList: [ criteriaItem ],
          origin: BreadcrumbSource.AlbumArtist
        }], { forceReload: true });
      }
    });

    this.itemMenuList.push({
      caption: 'Feat. Artists Songs',
      icon: 'mdi-account-music mdi',
      action: param => {
        const song = param as ISongModel;
        const criteriaValue = new CriteriaValueBase('id', song.id);
        const queryModel = new QueryModel<SongArtistViewEntity>();
        queryModel.searchCriteria = [criteriaValue];
        // Get the list of feat. artists
        this.db.getList(SongArtistViewEntity, queryModel).then(songArtistRows => {
          const criteria: ICriteriaValueBaseModel[] = [];
          for (var songArtist of songArtistRows) {
            // Ignore the primary artist
            const primaryArtistId = song.primaryArtistId ? song.primaryArtistId : song.primaryAlbum.primaryArtist.id;
            if (songArtist.artistId !== primaryArtistId) {
              const criteriaItem = new CriteriaValueBase('artistId', songArtist.artistId);
              criteriaItem.IgnoreInSelect = true;
              criteriaItem.DisplayName = this.db.displayName(criteriaItem.ColumnName);
              criteriaItem.DisplayValue = songArtist.artistStylized;
              criteria.push(criteriaItem);
            }
          }
          if (criteria.length) {
            // We need to force reload the breadcrumb since we are not moving to another page
            this.breadcrumbsService.set([{
              criteriaList: criteria,
              origin: BreadcrumbSource.Artist
            }], { forceReload: true });
          }
        });
      }
    });

    this.itemMenuList.push({
      caption: 'Album Songs',
      icon: 'mdi-album mdi',
      action: param => {
        const song = param as ISongModel;
        // Primary Artist
        const primaryArtistId = song.primaryArtistId ? song.primaryArtistId : song.primaryAlbum.primaryArtist.id;
        const artistCriteria = new CriteriaValueBase('primaryArtistId', primaryArtistId);
        artistCriteria.DisplayName = this.db.displayName(artistCriteria.ColumnName);
        artistCriteria.DisplayValue = song.primaryArtistStylized ? song.primaryArtistStylized : song.primaryAlbum.primaryArtist.artistStylized;
        const artistBreadcrumb: IBreadcrumbModel = {
          criteriaList: [ artistCriteria ],
          origin: BreadcrumbSource.AlbumArtist
        };
        // Album
        const primaryAlbumId = song.primaryAlbumId ? song.primaryAlbumId : song.primaryAlbum.id;
        const albumCriteria = new CriteriaValueBase('primaryAlbumId', primaryAlbumId);
        albumCriteria.DisplayName = this.db.displayName(albumCriteria.ColumnName);
        albumCriteria.DisplayValue = song.primaryAlbumName ? song.primaryAlbumName : song.primaryAlbum.name;
        const albumBreadcrumb: IBreadcrumbModel = {
          criteriaList: [ albumCriteria ],
          origin: BreadcrumbSource.Album
        };
        // Breadcrumbs, we need to force reload the breadcrumb since we are not moving to another page
        this.breadcrumbsService.set([ artistBreadcrumb, albumBreadcrumb ], { forceReload: true });
      }
    });
  }

  public onItemContentClick(song: ISongModel): void {
    this.playSong(song);
  }

  private playSong(song: ISongModel): void {
    this.menuService.hideSlideMenu();
    this.loadSongInPlayer(song, true, false);
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
          const trackList = this.spListBaseComponent.model.queryModel.items as ISongModel[];
          // For now, we are using this component only for search results,
          // but we should have an input property to specify the title of the play list
          playerList.loadList(trackList);
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
  }

  public onItemRender(song: ISongModel): void {
    if (song.imageSrc) {
      return;
    }
    this.queueService.sink = () => this.setSongImage(song);
  }

  private async setSongImage(song: ISongModel): Promise<void> {
    const buffer = await this.fileService.getBuffer(song.filePath);
    const audioInfo = await this.metadataService.getMetadata(buffer);
    song.imageSrc = this.metadataService.getPictureDataUrl(audioInfo.metadata);
  }
}
