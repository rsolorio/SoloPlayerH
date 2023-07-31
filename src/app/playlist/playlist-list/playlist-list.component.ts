import { ChangeDetectionStrategy, Component, OnInit } from '@angular/core';
import { CoreComponent } from 'src/app/core/models/core-component.class';
import { UtilityService } from 'src/app/core/services/utility/utility.service';
import { AppEvent } from 'src/app/shared/models/events.enum';
import { IPlaylistModel } from 'src/app/shared/models/playlist-model.interface';
import { FileService } from 'src/app/platform/file/file.service';
import { MusicImageType } from 'src/app/platform/audio-metadata/audio-metadata.enum';
import { AudioMetadataService } from 'src/app/platform/audio-metadata/audio-metadata.service';
import { PlaylistListBroadcastService } from './playlist-list-broadcast.service';
import { IListBaseModel } from 'src/app/shared/components/list-base/list-base-model.interface';
import { Criteria } from 'src/app/shared/services/criteria/criteria.class';
import { IImage } from 'src/app/core/models/core.interface';
import { RelatedImageSrc } from 'src/app/shared/services/database/database.seed';
import { ImageSrcType } from 'src/app/core/models/core.enum';
import { DatabaseEntitiesService } from 'src/app/shared/services/database/database-entities.service';
import { NavigationService } from 'src/app/shared/services/navigation/navigation.service';
import { AppRoute } from 'src/app/app-routes';
import { HtmlPlayerService } from 'src/app/shared/services/html-player/html-player.service';

@Component({
  selector: 'sp-playlist-list',
  templateUrl: './playlist-list.component.html',
  styleUrls: ['./playlist-list.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class PlaylistListComponent extends CoreComponent implements OnInit {

  // START - LIST MODEL
  public listModel: IListBaseModel = {
    listUpdatedEvent: AppEvent.PlaylistListUpdated,
    itemMenuList: [
      {
        caption: 'Play',
        icon: 'mdi-play mdi',
        action: param => {
          const playlist = param as IPlaylistModel;
          if (playlist) {
            this.loadPlaylistAndPlay(playlist);
          }
        }
      },
      {
        caption: 'Edit...',
        icon: 'mdi-playlist-edit mdi',
        action: param => {
          const playlist = param as IPlaylistModel;
          if (playlist) {
            this.navigation.forward(AppRoute.Playlists, { routeParams: [playlist.id] });
          }
        }
      }
    ],
    criteriaResult: {
      criteria: new Criteria('Search Results'),
      items: []
    },
    breadcrumbsEnabled: false,
    broadcastService: this.broadcastService,
    prepareItemRender: item => {
      const playlist = item as IPlaylistModel;
      if (!playlist.image.src && !playlist.image.getImage) {
        playlist.image.getImage = () => this.getPlaylistImage(playlist);
      }
    }
  };
  // END - LIST MODEL

  constructor(
    public broadcastService: PlaylistListBroadcastService,
    private fileService: FileService,
    private metadataService: AudioMetadataService,
    private entityService: DatabaseEntitiesService,
    private utilities: UtilityService,
    private navigation: NavigationService,
    private playerService: HtmlPlayerService)
  {
    super();
  }

  ngOnInit(): void {
  }

  public onItemContentClick(playlist: IPlaylistModel): void {
    this.onPlaylistClick(playlist);
  }

  private onPlaylistClick(playlist: IPlaylistModel): void {
    this.loadPlaylistAndPlay(playlist);
  }

  private async getPlaylistImage(playlist: IPlaylistModel): Promise<IImage> {
    const playlistWithSongs = await this.entityService.getPlaylistWithSongs(playlist.id);
    if (playlistWithSongs.playlistSongs && playlistWithSongs.playlistSongs.length) {
      // TODO: use entities service (getRelatedImages) instead
      playlistWithSongs.playlistSongs = this.utilities.sort(playlistWithSongs.playlistSongs, 'sequence');
      const track = playlistWithSongs.playlistSongs[0];
      const buffer = await this.fileService.getBuffer(track.song.filePath);
      const audioInfo = await this.metadataService.getMetadata(buffer);
      const pictures = this.metadataService.getPictures(audioInfo.metadata, [MusicImageType.Front]);
      return this.metadataService.getImage(pictures);
    }
    return {
      src: RelatedImageSrc.DefaultLarge,
      srcType: ImageSrcType.WebUrl
    };
  }

  private async loadPlaylistAndPlay(playlist: IPlaylistModel): Promise<void> {
    const tracks = await this.entityService.getTracks(playlist.id);
    const sortedTracks = this.utilities.sort(tracks, 'sequence');
    const success = this.playerService.stop();
    if (!success) {
      // Log a problem
      return;
    }
    const playerList = this.playerService.getState().playerList;
    playerList.load(playlist.id, playlist.name, sortedTracks);
    await this.playerService.playFirst();
  }
}