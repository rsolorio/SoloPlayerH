import { Component, OnInit } from '@angular/core';
import { LoadingViewStateService } from 'src/app/core/components/loading-view/loading-view-state.service';
import { CoreComponent } from 'src/app/core/models/core-component.class';
import { IMenuModel } from 'src/app/core/models/menu-model.interface';
import { AppRoutes } from 'src/app/core/services/utility/utility.enum';
import { UtilityService } from 'src/app/core/services/utility/utility.service';
import { AppEvent } from 'src/app/shared/models/events.enum';
import { IPaginationModel } from 'src/app/shared/models/pagination-model.interface';
import { ISongModel } from 'src/app/shared/models/song-model.interface';
import { MusicMetadataService } from 'src/app/shared/services/music-metadata/music-metadata.service';
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
    private loadingService: LoadingViewStateService
  ) {
    super();
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

  public onSearch(searchTerm: string): void {
    console.log(searchTerm);
  }

  public onFavoriteClick(): void {}

  public onItemContentClick(): void {}

  public onInitialized(): void {
    this.loadingService.show();
    const pagination: IPaginationModel<ISongModel> = {
      items: [],
      criteria: null,
      name: null
    };
    this.broadcastService.getAndBroadcast(pagination).subscribe();
  }

  public onItemImageSet(song: ISongModel): void {
    this.metadataService.getMetadataAsync({ path: song.filePath, size: 0, parts: []}).then(audioInfo => {
      if (audioInfo.metadata.common.picture && audioInfo.metadata.common.picture.length) {
        const picture = audioInfo.metadata.common.picture[0];
        song.imageSrc = 'data:image/jpg;base64,' + picture.data.toString('base64');
      }
    });
  }
}
