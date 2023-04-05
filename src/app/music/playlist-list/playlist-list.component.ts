import { Component, OnInit } from '@angular/core';
import { CoreComponent } from 'src/app/core/models/core-component.class';
import { IMenuModel } from 'src/app/core/models/menu-model.interface';
import { UtilityService } from 'src/app/core/services/utility/utility.service';
import { AppEvent } from 'src/app/shared/models/events.enum';
import { IPlaylistModel } from 'src/app/shared/models/playlist-model.interface';
import { DatabaseService } from 'src/app/shared/services/database/database.service';
import { FileService } from 'src/app/file-system/file/file.service';
import { MusicImageType } from 'src/app/file-system/audio-metadata/audio-metadata.enum';
import { AudioMetadataService } from 'src/app/file-system/audio-metadata/audio-metadata.service';
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
    private fileService: FileService,
    private metadataService: AudioMetadataService,
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
  }

  public onItemContentClick(playlist: IPlaylistModel): void {
    this.onPlaylistClick(playlist);
  }

  private onPlaylistClick(playlist: IPlaylistModel): void {}

  public onItemRender(playlist: IPlaylistModel): void {
    if (playlist.image.src) {
      return;
    }
    this.db.getPlaylistWithSongs(playlist.id).then(playlistWithSongs => {
      if (playlistWithSongs.playlistSongs && playlistWithSongs.playlistSongs.length) {
        playlistWithSongs.playlistSongs = this.utilities.sort(playlistWithSongs.playlistSongs, 'sequence');
        const track = playlistWithSongs.playlistSongs[0];
        this.fileService.getBuffer(track.song.filePath).then(buffer => {
          this.metadataService.getMetadata(buffer).then(audioInfo => {
            const pictures = this.metadataService.getPictures(audioInfo.metadata, [MusicImageType.Front]);
            playlist.image = this.metadataService.getImage(pictures);
          });
        });
      }
    });
  }

}
