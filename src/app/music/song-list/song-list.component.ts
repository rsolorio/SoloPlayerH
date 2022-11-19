import { Component, OnInit } from '@angular/core';
import { LoadingViewStateService } from 'src/app/core/components/loading-view/loading-view-state.service';
import { NavBarStateService } from 'src/app/core/components/nav-bar/nav-bar-state.service';
import { CoreComponent } from 'src/app/core/models/core-component.class';
import { IMenuModel } from 'src/app/core/models/menu-model.interface';
import { EventsService } from 'src/app/core/services/events/events.service';
import { AppRoutes } from 'src/app/core/services/utility/utility.enum';
import { UtilityService } from 'src/app/core/services/utility/utility.service';
import { AppEvent } from 'src/app/shared/models/events.enum';
import { BreadcrumbEventType, IMusicBreadcrumbModel } from 'src/app/shared/models/music-breadcrumb-model.interface';
import { IPaginationModel } from 'src/app/shared/models/pagination-model.interface';
import { SearchWildcard } from 'src/app/shared/models/search.enum';
import { ISongModel } from 'src/app/shared/models/song-model.interface';
import { MusicMetadataService } from 'src/app/shared/services/music-metadata/music-metadata.service';
import { MusicBreadcrumbsStateService } from '../music-breadcrumbs/music-breadcrumbs-state.service';
import { MusicBreadcrumbsComponent } from '../music-breadcrumbs/music-breadcrumbs.component';
import { SongListBroadcastService } from './song-list-broadcast.service';

@Component({
  selector: 'sp-song-list',
  templateUrl: './song-list.component.html',
  styleUrls: ['./song-list.component.scss']
})
export class SongListComponent extends CoreComponent implements OnInit {

  public appEvent = AppEvent;
  public itemMenuList: IMenuModel[] = [];

  constructor(
    private broadcastService: SongListBroadcastService,
    private utility: UtilityService,
    private metadataService: MusicMetadataService,
    private loadingService: LoadingViewStateService,
    private breadcrumbsService: MusicBreadcrumbsStateService,
    private navbarService: NavBarStateService,
    private events: EventsService
  ) {
    super();
  }

  ngOnInit(): void {
    this.initializeNavbar();
    this.initializeItemMenu();

    this.subs.sink = this.events.onEvent<BreadcrumbEventType>(AppEvent.MusicBreadcrumbUpdated).subscribe(eventType => {
      if (eventType === BreadcrumbEventType.RemoveMultiple) {
        this.loadData();
      }
    });
  }

  private initializeNavbar(): void {
    const navbar = this.navbarService.getState();
    navbar.title = 'Songs';
    navbar.onSearch = searchTerm => {
      this.loadingService.show();
      this.broadcastService.search(searchTerm, this.breadcrumbsService.getCriteria()).subscribe();
    };
    navbar.show = true;
    navbar.leftIcon = {
      icon: 'mdi-music-note mdi'
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
      caption: 'Search...',
      icon: 'mdi-web mdi',
      action: param => {
        const song = param as ISongModel;
        this.utility.googleSearch(song.name);
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
  }

  public onItemContentClick(song: ISongModel): void {
    // Play
  }

  public onListInitialized(): void {
    this.loadData();
  }

  private loadData(): void {
    if (this.breadcrumbsService.hasBreadcrumbs()) {
      this.loadSongs();
    }
    else {
      this.loadAllSongs();
    }
  }

  private loadAllSongs(): void {
    this.loadingService.show();
    this.broadcastService.search(SearchWildcard.All).subscribe();
  }

  private loadSongs(): void {
    this.loadingService.show();
    const listModel: IPaginationModel<ISongModel> = {
      items: [],
      criteria: this.breadcrumbsService.getCriteria()
    };
    this.broadcastService.getAndBroadcast(listModel).subscribe();
  }

  public onItemImageSet(song: ISongModel): void {
    this.metadataService.getMetadataAsync({ path: song.filePath, size: 0, parts: []}).then(audioInfo => {
      song.imageSrc = this.metadataService.getPictureDataUrl(audioInfo.metadata);
    });
  }
}
