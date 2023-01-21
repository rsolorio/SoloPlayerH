import { Component, OnInit } from '@angular/core';
import { LoadingViewStateService } from 'src/app/core/components/loading-view/loading-view-state.service';
import { NavBarStateService } from 'src/app/core/components/nav-bar/nav-bar-state.service';
import { CoreComponent } from 'src/app/core/models/core-component.class';
import { IMenuModel } from 'src/app/core/models/menu-model.interface';
import { UtilityService } from 'src/app/core/services/utility/utility.service';
import { CriteriaSortDirection } from 'src/app/shared/models/criteria-base-model.interface';
import { addSorting, CriteriaValueBase } from 'src/app/shared/models/criteria-base.class';
import { AppEvent } from 'src/app/shared/models/events.enum';
import { IPlaylistModel } from 'src/app/shared/models/playlist-model.interface';
import { DatabaseService } from 'src/app/shared/services/database/database.service';
import { FileService } from 'src/app/shared/services/file/file.service';
import { MusicMetadataService } from 'src/app/shared/services/music-metadata/music-metadata.service';
import { PlaylistListBroadcastService } from './playlist-list-broadcast.service';

@Component({
  selector: 'sp-playlist-list',
  templateUrl: './playlist-list.component.html',
  styleUrls: ['./playlist-list.component.scss']
})
export class PlaylistListComponent extends CoreComponent implements OnInit {

  public appEvent = AppEvent;
  public itemMenuList: IMenuModel[] = [];

  constructor(
    public broadcastService: PlaylistListBroadcastService,
    private loadingService: LoadingViewStateService,
    private fileService: FileService,
    private metadataService: MusicMetadataService,
    private db: DatabaseService,
    private utilities: UtilityService
  ){
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
      caption: 'Properties...',
      icon: 'mdi-square-edit-outline mdi',
      action: param => {
        const playlist = param as IPlaylistModel;
        if (playlist) {
        }
      }
    });
  }

  public onListInitialized(): void {
    this.loadData();
  }

  private loadData(): void {
    this.loadAllPlaylists();
  }

  private loadAllPlaylists(): void {
    this.loadingService.show();
    this.broadcastService.search().subscribe();
  }

  public onItemContentClick(playlist: IPlaylistModel): void {
    this.onPlaylistClick(playlist);
  }

  private onPlaylistClick(playlist: IPlaylistModel): void {}

  public onItemRender(playlist: IPlaylistModel): void {
    if (playlist.imageSrc) {
      return;
    }
    const criteriaValue = new CriteriaValueBase('playlistId', playlist.id);
    const criteria = [criteriaValue];
    addSorting('sequence', CriteriaSortDirection.Ascending, criteria);
    this.db.getPlaylistWithSongs(playlist.id).then(playlistWithSongs => {
      if (playlistWithSongs.playlistSongs && playlistWithSongs.playlistSongs.length) {
        playlistWithSongs.playlistSongs = this.utilities.sort(playlistWithSongs.playlistSongs, 'sequence');
        const track = playlistWithSongs.playlistSongs[0];
        this.fileService.getBuffer(track.song.filePath).then(buffer => {
          this.metadataService.getMetadata(buffer).then(audioInfo => {
            playlist.imageSrc = this.metadataService.getPictureDataUrl(audioInfo.metadata, 'front');
          });
        });
      }

    });
  }

}
