import { Component, OnInit } from '@angular/core';
import { UtilityService } from 'src/app/core/services/utility/utility.service';
import { ActivatedRoute } from '@angular/router';
import { DatabaseEntitiesService } from 'src/app/shared/services/database/database-entities.service';
import { PlaylistEntity } from 'src/app/shared/entities';
import { NavBarStateService } from 'src/app/core/components/nav-bar/nav-bar-state.service';
import { NavbarDisplayMode } from 'src/app/core/components/nav-bar/nav-bar-model.interface';
import { IPlaylistSongModel } from 'src/app/shared/models/playlist-song-model.interface';
import { HtmlPlayerService } from 'src/app/shared/services/html-player/html-player.service';
import { AppActionIcons, AppPlayerIcons } from 'src/app/app-icons';
import { NavigationService } from 'src/app/shared/services/navigation/navigation.service';
import { fisherYatesShuffle } from 'src/app/app-exports';

/**
 * Component that represents the playlist song list view.
 */
@Component({
  selector: 'sp-playlist-song-list',
  templateUrl: './playlist-song-list.component.html',
  styleUrls: ['./playlist-song-list.component.scss']
})
export class PlaylistSongListComponent implements OnInit {
  public tracks: IPlaylistSongModel[];
  private currentPlaylist: PlaylistEntity;
  constructor(
    private route: ActivatedRoute,
    private utility: UtilityService,
    private entities: DatabaseEntitiesService,
    private navbarService: NavBarStateService,
    private navigation: NavigationService,
    private playerService: HtmlPlayerService) { }

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
      },
      rightIcons: [{
        icon: AppPlayerIcons.ShuffleOn,
        // Shuffle the tracks and add the playlist as a brand new playlist and not this one
        action: () => {
          // Create a copy of the playlist
          const playlistCopy = this.tracks.slice();
          // Shuffle it
          fisherYatesShuffle(playlistCopy);
          // Load it
          const playerList = this.playerService.getState().playerList;
          playerList.load(this.utility.newGuid(), this.currentPlaylist.name + ' (shuffle)', playlistCopy);
          // Play it
          this.playerService.playFirst();
        }
      }]
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
      playerList.load(this.currentPlaylist.id, this.currentPlaylist.name, this.tracks);
      await this.playerService.playByTrack(track);
    }
  }
}
