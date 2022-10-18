import { Component, OnInit } from '@angular/core';
import { LoadingViewStateService } from 'src/app/core/components/loading-view/loading-view-state.service';
import { CoreComponent } from 'src/app/core/models/core-component.class';
import { IMenuModel } from 'src/app/core/models/menu-model.interface';
import { EventsService } from 'src/app/core/services/events/events.service';
import { AppRoutes } from 'src/app/core/services/utility/utility.enum';
import { UtilityService } from 'src/app/core/services/utility/utility.service';
import { AppEvent } from 'src/app/shared/models/events.enum';
import { IPaginationModel } from 'src/app/shared/models/pagination-model.interface';
import { ISongModel } from 'src/app/shared/models/song-model.interface';
import { MusicMetadataService } from 'src/app/shared/services/music-metadata/music-metadata.service';
import { SongListBroadcastService } from './song-list-broadcast.service';
import { SongListStateService } from './song-list-state.service';

@Component({
  selector: 'sp-song-list',
  templateUrl: './song-list.component.html',
  styleUrls: ['./song-list.component.scss']
})
export class SongListComponent extends CoreComponent implements OnInit {

  public model: IPaginationModel<ISongModel> = {
    items: []
  };
  /** This is the menu of each artist item */
  public menuList: IMenuModel[] = [];

  constructor(
    private stateService: SongListStateService,
    private events: EventsService,
    private broadcastService: SongListBroadcastService,
    private utility: UtilityService,
    private metadataService: MusicMetadataService,
    private loadingService: LoadingViewStateService
  ) {
    super();
  }

  ngOnInit(): void {
    this.loadingService.show();
    this.initializeMenu();

    this.subs.sink = this.events.onEvent<IPaginationModel<ISongModel>>(AppEvent.SongListUpdated).subscribe(response => {
      this.model = response;
      this.loadingService.hide();
    });

    const pagination: IPaginationModel<ISongModel> = {
      items: [],
      criteria: null,
      name: null
    };
    this.broadcastService.getAndBroadcast(pagination).subscribe();
  }

  private initializeMenu(): void {
    this.menuList.push({
      caption: 'Play',
      icon: 'mdi-play mdi',
      action: param => {}
    });

    this.menuList.push({
      caption: 'Search...',
      icon: 'mdi-web mdi',
      action: param => {
        const song = param as ISongModel;
        this.utility.googleSearch(song.name);
      }
    });

    this.menuList.push({
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

  public onSongClick(): void {}

  public onIntersectionChange(isIntersecting: boolean, song: ISongModel): void {
    song.canBeRendered = isIntersecting;
    if (isIntersecting && !song.imageSrc) {
      song.imageSrc = '../assets/img/default-image-small.jpg';
      this.metadataService.getMetadataAsync({ path: song.filePath, size: 0, parts: []}).then(audioInfo => {
        if (audioInfo.metadata.common.picture && audioInfo.metadata.common.picture.length) {
          const picture = audioInfo.metadata.common.picture[0];
          song.imageSrc = 'data:image/jpg;base64,' + picture.data.toString('base64');
        }
      });
    }
  }

}
