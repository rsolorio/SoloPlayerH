import { Component, OnInit } from '@angular/core';
import { CoreComponent } from 'src/app/core/models/core-component.class';
import { IMenuModel } from 'src/app/core/models/menu-model.interface';
import { PromiseQueueService } from 'src/app/core/services/promise-queue/promise-queue.service';
import { AppRoutes } from 'src/app/core/services/utility/utility.enum';
import { UtilityService } from 'src/app/core/services/utility/utility.service';
import { BreadcrumbsStateService } from 'src/app/shared/components/breadcrumbs/breadcrumbs-state.service';
import { AlbumViewEntity, SongViewEntity } from 'src/app/shared/entities';
import { IAlbumModel } from 'src/app/shared/models/album-model.interface';
import { BreadcrumbSource } from 'src/app/shared/models/breadcrumbs.enum';
import { CriteriaValueBase, hasCriteria } from 'src/app/shared/models/criteria-base.class';
import { AppEvent } from 'src/app/shared/models/events.enum';
import { IQueryModel } from 'src/app/shared/models/pagination-model.interface';
import { ISongModel } from 'src/app/shared/models/song-model.interface';
import { DatabaseService } from 'src/app/shared/services/database/database.service';
import { FileService } from 'src/app/shared/services/file/file.service';
import { MusicMetadataService } from 'src/app/shared/services/music-metadata/music-metadata.service';
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
    public broadcastService: AlbumListBroadcastService,
    private utility: UtilityService,
    private breadcrumbsService: BreadcrumbsStateService,
    private fileService: FileService,
    private metadataService: MusicMetadataService,
    private db: DatabaseService,
    private queueService: PromiseQueueService
  ) {
    super();
  }

  ngOnInit(): void {
    this.initializeItemMenu();
    this.removeUnsupportedBreadcrumbs();
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
        const album = param as IAlbumModel;
        album.selected = !album.selected;
      }
    });

    this.itemMenuList.push({
      caption: 'Search...',
      icon: 'mdi-web mdi',
      action: param => {
        const albumModel = param as IAlbumModel;
        this.utility.googleSearch(`${albumModel.artistName} ${albumModel.name}`);
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

    this.itemMenuList.push({
      isSeparator: true,
      caption: null
    });

    this.itemMenuList.push({
      caption: 'Songs',
      icon: 'mdi-music-note mdi',
      action: param => {
        const album = param as IAlbumModel;
          if (album) {
            this.showSongs(album);
          }
      }
    });
  }

  public onItemContentClick(album: IAlbumModel): void {
    this.onAlbumClick(album);
  }

  private onAlbumClick(album: IAlbumModel): void {
    this.showSongs(album);
  }

  private addBreadcrumb(album: IAlbumModel): void {
    // TODO: handle multiple selected albums
    // Automatically add the Album Artist breadcrumb if it does not exist
    let hasAlbumArtist = false;
    const breadcrumbs = this.breadcrumbsService.getState();
    for (const breadcrumb of breadcrumbs) {
      if (hasCriteria('primaryArtistId', breadcrumb.criteriaList)) {
        hasAlbumArtist = true;
      }
    }
    if (!hasAlbumArtist) {
      const albumView = album as AlbumViewEntity;
      if (albumView && albumView.primaryArtistId) {
        const criteriaItem = new CriteriaValueBase('primaryArtistId', albumView.primaryArtistId);
        criteriaItem.DisplayName = this.db.displayName(criteriaItem.ColumnName);
        criteriaItem.DisplayValue = album.artistName;
        // Suppress event so this component doesn't react to this change;
        // these breadcrumbs are for another list that hasn't been loaded yet
        this.breadcrumbsService.addOne({
          criteriaList: [ criteriaItem ],
          origin: BreadcrumbSource.AlbumArtist
        }, { suppressEvents: true });
      }
    }

    const criteriaItem = new CriteriaValueBase('primaryAlbumId', album.id);
    criteriaItem.DisplayName = this.db.displayName(criteriaItem.ColumnName);
    criteriaItem.DisplayValue = album.name;
    // Suppress event so this component doesn't react to this change;
    // these breadcrumbs are for another list that hasn't been loaded yet
    this.breadcrumbsService.addOne({
      criteriaList: [ criteriaItem ],
      origin: BreadcrumbSource.Album
    }, { suppressEvents: true });
  }

  private showSongs(album: IAlbumModel): void {
    this.addBreadcrumb(album);
    this.utility.navigate(AppRoutes.Songs);
  }

  public onListInitialized(): void {
  }

  private removeUnsupportedBreadcrumbs(): void {
    const breadcrumbs = this.breadcrumbsService.getState();
    const unsupportedBreadcrumbs = breadcrumbs.filter(breadcrumb =>
      breadcrumb.origin === BreadcrumbSource.Album ||
      breadcrumb.origin === BreadcrumbSource.Artist);
    for (const breadcrumb of unsupportedBreadcrumbs) {
      this.breadcrumbsService.remove(breadcrumb.sequence);
    }
  }

  public onItemRender(album: IAlbumModel): void {
    if (album.imageSrc) {
      return;
    }
    this.queueService.sink = () => this.setAlbumImage(album);
  }

  private async setAlbumImage(album: IAlbumModel): Promise<void> {
    const criteriaValue = new CriteriaValueBase('primaryAlbumId', album.id);
    const queryModel: IQueryModel<ISongModel> = {
      filterCriteria: [criteriaValue],
      items: []
    };
    const songList = await this.db.getList(SongViewEntity, queryModel);
    if (songList && songList.length) {
      // Get any of the songs associated with the album
      const song = songList[0];
      const buffer = await this.fileService.getBuffer(song.filePath);
      const audioInfo = await this.metadataService.getMetadata(buffer);
      album.imageSrc = this.metadataService.getPictureDataUrl(audioInfo.metadata, 'front');
    }
  }
}
