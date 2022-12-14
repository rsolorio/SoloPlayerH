import { Component, OnInit } from '@angular/core';
import { LoadingViewStateService } from 'src/app/core/components/loading-view/loading-view-state.service';
import { NavbarDisplayMode } from 'src/app/core/components/nav-bar/nav-bar-model.interface';
import { NavBarStateService } from 'src/app/core/components/nav-bar/nav-bar-state.service';
import { CoreComponent } from 'src/app/core/models/core-component.class';
import { IMenuModel } from 'src/app/core/models/menu-model.interface';
import { EventsService } from 'src/app/core/services/events/events.service';
import { PromiseQueueService } from 'src/app/core/services/promise-queue/promise-queue.service';
import { AppRoutes } from 'src/app/core/services/utility/utility.enum';
import { UtilityService } from 'src/app/core/services/utility/utility.service';
import { AlbumViewEntity, SongViewEntity } from 'src/app/shared/entities';
import { IAlbumModel } from 'src/app/shared/models/album-model.interface';
import { CriteriaValueBase, hasCriteria } from 'src/app/shared/models/criteria-base.class';
import { AppEvent } from 'src/app/shared/models/events.enum';
import { BreadcrumbEventType, BreadcrumbSource } from 'src/app/shared/models/music-breadcrumb-model.interface';
import { IPaginationModel } from 'src/app/shared/models/pagination-model.interface';
import { DatabaseService } from 'src/app/shared/services/database/database.service';
import { FileService } from 'src/app/shared/services/file/file.service';
import { MusicMetadataService } from 'src/app/shared/services/music-metadata/music-metadata.service';
import { MusicBreadcrumbsStateService } from '../music-breadcrumbs/music-breadcrumbs-state.service';
import { MusicBreadcrumbsComponent } from '../music-breadcrumbs/music-breadcrumbs.component';
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
    private breadcrumbsService: MusicBreadcrumbsStateService,
    private navbarService: NavBarStateService,
    private events: EventsService,
    private fileService: FileService,
    private metadataService: MusicMetadataService,
    private db: DatabaseService,
    private queueService: PromiseQueueService
  ) {
    super();
  }

  ngOnInit(): void {
    this.initializeNavbar();
    this.initializeItemMenu();
    this.removeUnsupportedBreadcrumbs();
    this.subs.sink = this.events.onEvent<BreadcrumbEventType>(AppEvent.MusicBreadcrumbUpdated).subscribe(eventType => {
      if (eventType === BreadcrumbEventType.RemoveMultiple) {
        this.loadData();
      }
    });
  }

  private initializeNavbar(): void {
    const navbar = this.navbarService.getState();
    navbar.title = 'Albums';
    navbar.onSearch = searchTerm => {
      this.loadingService.show();
      this.broadcastService.search(searchTerm, this.breadcrumbsService.getCriteria()).subscribe();
    };
    navbar.show = true;
    navbar.leftIcon = {
      icon: 'mdi-album mdi'
    };
    navbar.componentType = this.breadcrumbsService.hasBreadcrumbs() ? MusicBreadcrumbsComponent : null;
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
        this.breadcrumbsService.add({
          criteriaList: [ criteriaItem ],
          source: BreadcrumbSource.AlbumArtist
        });
      }
    }

    const criteriaItem = new CriteriaValueBase('primaryAlbumId', album.id);
    criteriaItem.DisplayName = this.db.displayName(criteriaItem.ColumnName);
    criteriaItem.DisplayValue = album.name;
    this.breadcrumbsService.add({
      criteriaList: [ criteriaItem ],
      source: BreadcrumbSource.Album
    });
  }

  private showSongs(album: IAlbumModel): void {
    this.addBreadcrumb(album);
    this.utility.navigate(AppRoutes.Songs);
  }

  public onListInitialized(): void {
    this.loadData();
  }

  private loadData(): void {
    if (this.breadcrumbsService.hasBreadcrumbs()) {
      this.loadAlbums();
    }
    else {
      this.loadAllAlbums();
      this.navbarService.getState().mode = NavbarDisplayMode.Title;
    }
  }

  private loadAllAlbums(): void {
    this.loadingService.show();
    this.broadcastService.search().subscribe();
  }

  private loadAlbums(): void {
    this.loadingService.show();
    const listModel: IPaginationModel<IAlbumModel> = {
      items: [],
      criteria: this.breadcrumbsService.getCriteria()
    };
    this.broadcastService.getAndBroadcast(listModel).subscribe();
  }

  private removeUnsupportedBreadcrumbs(): void {
    const breadcrumbs = this.breadcrumbsService.getState();
    const unsupportedBreadcrumbs = breadcrumbs.filter(breadcrumb =>
      breadcrumb.source === BreadcrumbSource.Album ||
      breadcrumb.source === BreadcrumbSource.Artist);
    for (const breadcrumb of unsupportedBreadcrumbs) {
      this.breadcrumbsService.remove(breadcrumb.sequence);
    }
  }

  public onItemRender(album: IAlbumModel): void {
    if (album.imageSrc) {
      return;
    }
    this.queueService.sink = this.setAlbumImage(album);
  }

  private async setAlbumImage(album: IAlbumModel): Promise<void> {
    const criteriaValue = new CriteriaValueBase('primaryAlbumId', album.id);
    const songList = await this.db.getList(SongViewEntity, [criteriaValue]);
    if (songList && songList.length) {
      // Get any of the songs associated with the album
      const song = songList[0];
      const buffer = await this.fileService.getBuffer(song.filePath);
      const audioInfo = await this.metadataService.getMetadata(buffer);
      album.imageSrc = this.metadataService.getPictureDataUrl(audioInfo.metadata, 'front');
    }
  }
}
