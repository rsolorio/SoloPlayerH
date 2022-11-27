import { Component, OnInit } from '@angular/core';
import { LoadingViewStateService } from 'src/app/core/components/loading-view/loading-view-state.service';
import { NavBarStateService } from 'src/app/core/components/nav-bar/nav-bar-state.service';
import { CoreComponent } from 'src/app/core/models/core-component.class';
import { IMenuModel } from 'src/app/core/models/menu-model.interface';
import { EventsService } from 'src/app/core/services/events/events.service';
import { PlaylistSongViewEntity } from 'src/app/shared/entities';
import { CriteriaSortDirection } from 'src/app/shared/models/criteria-base-model.interface';
import { addSorting, CriteriaValueBase } from 'src/app/shared/models/criteria-base.class';
import { AppEvent } from 'src/app/shared/models/events.enum';
import { IPlaylistModel } from 'src/app/shared/models/playlist-model.interface';
import { SearchWildcard } from 'src/app/shared/models/search.enum';
import { DatabaseService } from 'src/app/shared/services/database/database.service';
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
    private broadcastService: PlaylistListBroadcastService,
    private navbarService: NavBarStateService,
    private events: EventsService,
    private loadingService: LoadingViewStateService,
    private metadataService: MusicMetadataService,
    private db: DatabaseService
  ){
    super();
  }

  ngOnInit(): void {
    this.initializeNavbar();
    this.initializeItemMenu();
  }

  private initializeNavbar(): void {
    const navbar = this.navbarService.getState();
    navbar.title = 'Playlists';
    navbar.onSearch = searchTerm => {
      this.loadingService.show();
      this.broadcastService.search(searchTerm).subscribe();
    };
    navbar.show = true;
    navbar.leftIcon = {
      icon: 'mdi-playlist-play mdi mdi'
    };
    navbar.componentType = null;
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
    this.broadcastService.search(SearchWildcard.All).subscribe();
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
    this.db.getList(PlaylistSongViewEntity, criteria).then(trackList => {
      if (trackList && trackList.length) {
        // Get any of the songs associated with the album
        const track = trackList[0];
        this.metadataService.getMetadataAsync({ path: track.filePath, size: 0, parts: [] }).then(audioInfo => {
          playlist.imageSrc = this.metadataService.getPictureDataUrl(audioInfo.metadata, 'front');
        });
      }
    });
  }

}