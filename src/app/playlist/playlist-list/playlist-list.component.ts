import { ChangeDetectionStrategy, Component, OnInit, ViewChild } from '@angular/core';
import { CoreComponent } from 'src/app/core/models/core-component.class';
import { UtilityService } from 'src/app/core/services/utility/utility.service';
import { AppEvent } from 'src/app/shared/models/events.enum';
import { IPlaylistModel } from 'src/app/shared/models/playlist-model.interface';
import { FileService } from 'src/app/platform/file/file.service';
import { MusicImageType } from 'src/app/platform/audio-metadata/audio-metadata.enum';
import { AudioMetadataService } from 'src/app/platform/audio-metadata/audio-metadata.service';
import { PlaylistListBroadcastService } from './playlist-list-broadcast.service';
import { IListBaseModel } from 'src/app/shared/components/list-base/list-base-model.interface';
import { Criteria, CriteriaItems } from 'src/app/shared/services/criteria/criteria.class';
import { IImage } from 'src/app/core/models/core.interface';
import { RelatedImageSrc } from 'src/app/shared/services/database/database.seed';
import { ImageSrcType } from 'src/app/core/models/core.enum';
import { DatabaseEntitiesService } from 'src/app/shared/services/database/database-entities.service';
import { NavigationService } from 'src/app/shared/services/navigation/navigation.service';
import { AppRoute } from 'src/app/app-routes';
import { HtmlPlayerService } from 'src/app/shared/services/html-player/html-player.service';
import { AppActionIcons, AppEntityIcons } from 'src/app/app-icons';
import { SideBarHostStateService } from 'src/app/core/components/side-bar-host/side-bar-host-state.service';
import { ListBaseComponent } from 'src/app/shared/components/list-base/list-base.component';

@Component({
  selector: 'sp-playlist-list',
  templateUrl: './playlist-list.component.html',
  styleUrls: ['./playlist-list.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class PlaylistListComponent extends CoreComponent implements OnInit {
  @ViewChild('spListBaseComponent') private spListBaseComponent: ListBaseComponent;
  // START - LIST MODEL
  public listModel: IListBaseModel = {
    listUpdatedEvent: AppEvent.PlaylistListUpdated,
    itemMenuList: [
      {
        caption: 'Play',
        icon: 'mdi-play mdi',
        action: (menuItem, param) => {
          const playlist = param as IPlaylistModel;
          if (playlist) {
            this.loadPlaylistAndPlay(playlist);
          }
        }
      },
      {
        caption: 'Edit...',
        icon: 'mdi-playlist-edit mdi',
        action: (menuItem, param) => {
          const playlist = param as IPlaylistModel;
          if (playlist) {
            this.editPlaylist(playlist.id);
          }
        }
      }
    ],
    criteriaResult: {
      criteria: new Criteria('Search Results'),
      items: []
    },
    rightIcons: [
      {
        icon: AppActionIcons.AddPlaylist
      },
      {
        icon: AppActionIcons.Sort,
        action: () => {
          this.openSortingPanel();
        }
      }
    ],
    searchIconEnabled: true,
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
    private entities: DatabaseEntitiesService,
    private sidebarHostService: SideBarHostStateService,
    private playerService: HtmlPlayerService)
  {
    super();
  }

  ngOnInit(): void {
  }

  public onItemContentClick(playlist: IPlaylistModel): void {
    this.editPlaylist(playlist.id);
  }

  public onPlayClick(e: Event, playlist: IPlaylistModel): void {
    // If we don't stop, the onItemContentClick will be fired
    e.stopImmediatePropagation();
    this.loadPlaylistAndPlay(playlist);
  }

  private async getPlaylistImage(playlist: IPlaylistModel): Promise<IImage> {
    const playlistWithSongs = await this.entityService.getPlaylistWithSongs(playlist.id);
    if (playlistWithSongs?.playlistSongs?.length) {
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

  private editPlaylist(playlistId: string): void {
    this.navigation.forward(AppRoute.Playlists, { routeParams: [playlistId] });
  }

  private openSortingPanel(): void {
    const chips = this.entities.getSortingForPlaylists(this.spListBaseComponent.model.criteriaResult.criteria);
    const model = this.entities.getSortingPanelModel(chips, 'Playlists', AppEntityIcons.Playlist);
    model.onOk = okResult => {
      const criteria = new Criteria(model.title);
      // Keep quick criteria
      criteria.quickCriteria = this.spListBaseComponent.model.criteriaResult.criteria.quickCriteria;
      // Add sorting criteria, we only support one item
      const chipItem = okResult.items.find(i => i.selected);
      if (chipItem) {
        const criteriaItems = chipItem.value as CriteriaItems;
        criteria.sortingCriteria = criteriaItems;
      }
      else {
        criteria.sortingCriteria = new CriteriaItems();
      }
      this.spListBaseComponent.send(criteria);
    };
    this.sidebarHostService.loadContent(model);
  }
}
