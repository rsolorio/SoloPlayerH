import { Component, OnInit } from '@angular/core';
import { UtilityService } from 'src/app/core/services/utility/utility.service';
import { ActivatedRoute } from '@angular/router';
import { DatabaseEntitiesService } from 'src/app/shared/services/database/database-entities.service';
import { PlaylistEntity, PlaylistSongEntity } from 'src/app/shared/entities';
import { NavBarStateService } from 'src/app/core/components/nav-bar/nav-bar-state.service';
import { NavbarDisplayMode } from 'src/app/core/components/nav-bar/nav-bar-model.interface';
import { AppRoute, appRoutes } from 'src/app/app-routes';
import { IPlaylistSongModel } from 'src/app/shared/models/playlist-song-model.interface';
import { HtmlPlayerService } from 'src/app/shared/services/html-player/html-player.service';
import { AppActionIcons } from 'src/app/app-icons';
import { NavigationService } from 'src/app/shared/services/navigation/navigation.service';

/**
 * Component that represents the playlist song list view.
 */
@Component({
  selector: 'sp-playlist-song-list',
  templateUrl: './playlist-song-list.component.html',
  styleUrls: ['./playlist-song-list.component.scss']
})
export class PlaylistSongListComponent implements OnInit {
  public tracks: PlaylistSongEntity[];
  private currentPlaylist: PlaylistEntity;
  constructor(
    private route: ActivatedRoute,
    private utility: UtilityService,
    private entities: DatabaseEntitiesService,
    private navbarService: NavBarStateService,
    private navigation: NavigationService,
    private playerService: HtmlPlayerService,
    private entityService: DatabaseEntitiesService) { }

  ngOnInit(): void {
    this.initialize();
  }

  private async initialize(): Promise<void> {
    const playlistId = this.utility.getRouteParam('id', this.route);
    await this.initializeNavbar(playlistId);
    await this.initializeTrackList(playlistId);
  }

  private async initializeTrackList(playlistId: string): Promise<void> {
    this.tracks = await this.entities.getTracks(playlistId);
  }

  private async initializeNavbar(playlistId: string): Promise<void> {
    this.currentPlaylist = await PlaylistEntity.findOneBy({ id: playlistId});
    const routeInfo = appRoutes[AppRoute.Playlists];
    this.navbarService.set({
      mode: NavbarDisplayMode.Title,
      show: true,
      menuList: [
        {
          caption: 'Show All'
        }
      ],
      title: this.currentPlaylist.name,
      leftIcon: {
        icon: AppActionIcons.Back,
        action: () => {
          this.navigation.back();
        }
      }
    });
  }

  public onTrackClick(track: IPlaylistSongModel): void {
    this.loadPlaylistAndPlay(track);
  }

  private async loadPlaylistAndPlay(track: IPlaylistSongModel): Promise<void> {
    const playerList = this.playerService.getState().playerList;
    if (playerList.id === track.playlistId) {
      // Same playlist, just load the track
      await this.playerService.playByTrack(track);
    }
    else {
      const tracks = await this.entityService.getTracks(track.playlistId);
      const sortedTracks = this.utility.sort(tracks, 'sequence');
      playerList.load(this.currentPlaylist.id, this.currentPlaylist.name, sortedTracks);
      await this.playerService.playByTrack(track);
    }
  }
}
